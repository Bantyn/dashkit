import { db, storage } from "../../config/firebase.config";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import crypto from "crypto";
import { subscriptionService } from "../subscription/subscription.service";

export class MediaService {
  async compressImage(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ buffer: Buffer; mimeType: string; fileNameExtension: string }> {
    // Only compress common image files (excluding gifs to prevent losing animation)
    if (!mimeType.startsWith("image/") || mimeType === "image/gif") {
      return { buffer: fileBuffer, mimeType, fileNameExtension: "" };
    }

    try {
      let pipeline = sharp(fileBuffer);
      const metadata = await pipeline.metadata();

      // Resize if dimensions exceed 1600px in width or height
      if ((metadata.width && metadata.width > 1600) || (metadata.height && metadata.height > 1600)) {
        pipeline = pipeline.resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true
        });
      }

      // Convert to avif with quality 80 (excellent quality, still much smaller than original)
      const compressedBuffer = await pipeline.avif({ quality: 80, effort: 4 }).toBuffer();

      return {
        buffer: compressedBuffer,
        mimeType: "image/avif",
        fileNameExtension: ".avif"
      };
    } catch (error) {
      console.error("Image pre-compression failed, using original:", error);
      return { buffer: fileBuffer, mimeType, fileNameExtension: "" };
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    shopId: string
  ): Promise<string> {
    // Compress the image on the backend before uploading to any storage provider
    const compression = await this.compressImage(fileBuffer, mimeType);
    const finalBuffer = compression.buffer;
    const finalMimeType = compression.mimeType;
    let finalFileName = fileName;
    if (compression.fileNameExtension) {
      // Replace original extension with .avif
      finalFileName = fileName.replace(/\.[^.]+$/, "") + compression.fileNameExtension;
    }

    // 1. Fetch shop details to check if S3/Cloudinary integrations are connected
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) {
      throw new Error("Shop not found");
    }

    const shopData = shopDoc.data();
    const integrations = shopData?.integrations || {};

    let url = "";

    // A. Check if AWS S3 is connected
    const awsS3Config = integrations.awsS3;
    if (
      awsS3Config &&
      awsS3Config.connected &&
      awsS3Config.accessKeyId &&
      awsS3Config.accessKeySecret &&
      awsS3Config.bucket &&
      awsS3Config.region
    ) {
      try {
        url = await this.uploadToS3(
          finalBuffer,
          finalFileName,
          finalMimeType,
          awsS3Config,
          shopId
        );
      } catch (err: any) {
        console.error("AWS S3 upload failed, trying next provider:", err.message);
      }
    }

    const cloudinaryConfig = integrations.cloudinary;
    let usedProvider = "firebase";
    if (awsS3Config?.connected) usedProvider = "s3";
    else if (cloudinaryConfig?.connected) usedProvider = "cloudinary";

    // B. Check if Shop's Cloudinary is connected
    if (
      !url &&
      cloudinaryConfig &&
      cloudinaryConfig.connected &&
      cloudinaryConfig.cloudName &&
      cloudinaryConfig.apiKey &&
      cloudinaryConfig.apiSecret
    ) {
      try {
        url = await this.uploadToCloudinary(
          finalBuffer,
          finalFileName,
          finalMimeType,
          cloudinaryConfig,
          shopId
        );
      } catch (err: any) {
        const cloudinaryError = err?.message || err;
        console.error("Cloudinary upload failed:", cloudinaryError);
        throw new Error(`Cloudinary upload failed: ${cloudinaryError}`);
      }
    }

    // C. Fallback to Admin (Platform) Cloudinary if shop has no Cloudinary/S3 connected
    if (!url) {
      try {
        const { platformSettingsService } = await import("../platform-settings/platform-settings.service");
        const adminIntegrations = await platformSettingsService.getIntegrationSettings();
        const adminCloudinary = adminIntegrations.cloudinary;

        if (adminCloudinary && adminCloudinary.cloudName && adminCloudinary.apiKey && adminCloudinary.apiSecret) {
          url = await this.uploadToCloudinary(
            finalBuffer,
            finalFileName,
            finalMimeType,
            adminCloudinary,
            shopId
          );
          usedProvider = "admin_cloudinary";
        }
      } catch (adminErr: any) {
        console.warn("[MediaService] Admin Cloudinary fallback failed:", adminErr?.message || adminErr);
      }
    }

    // D. Fallback to Firebase Storage if Admin Cloudinary also unavailable
    if (!url) {
      url = await this.uploadToFirebase(finalBuffer, finalFileName, finalMimeType, shopId);
      usedProvider = "firebase";
    }

    // 3. Update storage usage using the extracted helper
    await this.trackStorageUsage(shopId, finalBuffer.length, url, usedProvider, "image");

    return url;
  }

  async trackStorageUsage(
    shopId: string,
    fileSize: number,
    url: string,
    provider: string,
    fileType: string = "image"
  ): Promise<void> {
    const { subscriptionService } = await import("../subscription/subscription.service");
    
    let resolvedIncludedMB: number | null = null;
    try {
      const subContext = await subscriptionService.resolveAccessContext({ shopId });
      resolvedIncludedMB = Number(subContext?.limits?.storage_limit_mb ?? 500);
    } catch (e) {
      resolvedIncludedMB = 500;
    }

    const deferredNotifications: any[] = [];
    const imageDocId = crypto.createHash("md5").update(url).digest("hex");
    const imageRef = db.collection("uploaded_images").doc(imageDocId);
    const shopRef = db.collection("shops").doc(shopId);
    const usageDocRef = db.collection("usage").doc("storage").collection("shops").doc(shopId);

    await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
      // ═══════════════════════════════════════════════
      // PHASE 1 — ALL READS FIRST (Firestore requirement)
      // ═══════════════════════════════════════════════
      const shopSnap = (await transaction.get(shopRef)) as unknown as FirebaseFirestore.DocumentSnapshot;
      if (!shopSnap.exists) throw new Error("Shop not found");

      const usageSnap = (await transaction.get(usageDocRef)) as unknown as FirebaseFirestore.DocumentSnapshot;

      // ═══════════════════════════════════════════════
      // PHASE 2 — ALL CALCULATIONS IN MEMORY
      // ═══════════════════════════════════════════════
      const sData = shopSnap.data() as any;

      let includedBytes = sData.includedStorageBytes;
      let includedMB = sData.includedStorageMB;

      if (includedBytes === undefined || includedBytes === null) {
        if (includedMB === undefined || includedMB === null) {
          includedMB = resolvedIncludedMB ?? 500;
        }
        includedBytes = includedMB * 1024 * 1024;
      } else if (includedMB === undefined || includedMB === null) {
        includedMB = Number((includedBytes / (1024 * 1024)).toFixed(2));
      }

      let addonBytes = 0;
      if (sData.storageAddonEnabled && sData.storageAddonPlan) {
        const planStr = String(sData.storageAddonPlan);
        if (planStr.includes("1 GB") || planStr.includes("1GB")) addonBytes = 1024 * 1024 * 1024;
        else if (planStr.includes("2 GB") || planStr.includes("2GB")) addonBytes = 2048 * 1024 * 1024;
        else if (planStr.includes("5 GB") || planStr.includes("5GB")) addonBytes = 5120 * 1024 * 1024;
      }

      const totalAllowed = includedBytes + addonBytes;
      const currentBytes = sData.currentStorageBytes || 0;
      const newBytes = currentBytes + fileSize;

      if (newBytes > totalAllowed) {
        throw new Error("Storage limit exceeded. Purchase additional storage.");
      }

      const newMB = Number((newBytes / (1024 * 1024)).toFixed(2));
      const percentage = (newBytes / totalAllowed) * 100;

      let warningSent: string | null = sData.storageWarningSent || null;
      let triggerNotification = false;
      let notifTitle = "";
      let notifMessage = "";

      if (percentage >= 100 && warningSent !== "100") {
        warningSent = "100";
        triggerNotification = true;
        notifTitle = "Storage Limit Reached";
        notifMessage = `Your shop has used 100% of its allowed storage. Uploads are now blocked. Upgrade your plan or buy a storage add-on.`;
      } else if (percentage >= 90 && percentage < 100 && warningSent !== "90" && warningSent !== "100") {
        warningSent = "90";
        triggerNotification = true;
        notifTitle = "Storage Running Very Low";
        notifMessage = `Your shop has used ${percentage.toFixed(0)}% of its storage. Please clean up or upgrade soon.`;
      } else if (percentage >= 80 && percentage < 90 && !warningSent) {
        warningSent = "80";
        triggerNotification = true;
        notifTitle = "Storage Running Low";
        notifMessage = `Your shop has used ${percentage.toFixed(0)}% of its storage.`;
      }

      const imgCount = usageSnap.exists ? (usageSnap.data()?.imageCount || 0) : 0;

      if (triggerNotification) {
        deferredNotifications.push({
          shopId,
          title: notifTitle,
          message: notifMessage,
          type: "subscription",
          link: "/subscription"
        });
      }

      // ═══════════════════════════════════════════════
      // PHASE 3 — ALL WRITES LAST
      // ═══════════════════════════════════════════════
      transaction.update(shopRef, {
        includedStorageMB: includedMB,
        includedStorageBytes: includedBytes,
        currentStorageBytes: newBytes,
        currentStorageMB: newMB,
        storageLimitReached: percentage >= 100,
        storageWarningSent: warningSent,
        lastStorageCalculation: new Date(),
        updatedAt: new Date()
      });

      transaction.set(imageRef, {
        id: imageDocId,
        url,
        size: fileSize,
        shopId,
        provider,
        type: fileType, // 'image' or 'invoice'
        createdAt: new Date()
      });

      transaction.set(usageDocRef, {
        currentBytes: newBytes,
        currentMB: newMB,
        currentGB: Number((newBytes / (1024 * 1024 * 1024)).toFixed(4)),
        imageCount: imgCount + 1,
        lastScan: new Date(),
        lastUpload: new Date(),
        shopId
      }, { merge: true });
    });

    if (deferredNotifications.length > 0) {
      const { createNotification } = await import("../notification/notification.controller");
      for (const notif of deferredNotifications) {
        await createNotification(notif).catch(e => console.error("Failed to send storage notification:", e));
      }
    }
  }

  async deleteFile(url: string, shopId: string): Promise<void> {
    const imageDocId = crypto.createHash("md5").update(url).digest("hex");
    const imageRef = db.collection("uploaded_images").doc(imageDocId);
    const shopRef = db.collection("shops").doc(shopId);
    const usageDocRef = db.collection("usage").doc("storage").collection("shops").doc(shopId);

    await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
      // ═══════════════════════════════════════════════
      // PHASE 1 — ALL READS FIRST
      // ═══════════════════════════════════════════════
      const imgSnap = (await transaction.get(imageRef)) as unknown as FirebaseFirestore.DocumentSnapshot;
      if (!imgSnap.exists) return; // Not tracked or already deleted

      const shopSnap = (await transaction.get(shopRef)) as unknown as FirebaseFirestore.DocumentSnapshot;
      if (!shopSnap.exists) throw new Error("Shop not found");

      const usageSnap = (await transaction.get(usageDocRef)) as unknown as FirebaseFirestore.DocumentSnapshot;

      // ═══════════════════════════════════════════════
      // PHASE 2 — CALCULATIONS IN MEMORY
      // ═══════════════════════════════════════════════
      const imgData = imgSnap.data()!;
      const fileSize = imgData.size || 0;

      const shopData = shopSnap.data()!;
      const currentBytes = shopData.currentStorageBytes || 0;
      const newBytes = Math.max(0, currentBytes - fileSize);
      const newMB = Number((newBytes / (1024 * 1024)).toFixed(2));

      const includedMB = shopData.includedStorageMB ?? 500;
      let addonMB = 0;
      if (shopData.storageAddonEnabled && shopData.storageAddonPlan) {
        const planStr = String(shopData.storageAddonPlan);
        if (planStr.includes("1 GB") || planStr.includes("1GB")) addonMB = 1024;
        else if (planStr.includes("2 GB") || planStr.includes("2GB")) addonMB = 2048;
        else if (planStr.includes("5 GB") || planStr.includes("5GB")) addonMB = 5120;
      }
      const totalAllowed = (includedMB + addonMB) * 1024 * 1024;
      const percentage = (newBytes / totalAllowed) * 100;

      // Update warning status
      let warningSent = shopData.storageWarningSent;
      if (percentage < 80) warningSent = null;
      else if (percentage < 90 && warningSent === "90") warningSent = "80";
      else if (percentage < 100 && warningSent === "100") warningSent = "90";

      const imgCount = usageSnap.exists ? (usageSnap.data()?.imageCount || 0) : 0;

      // ═══════════════════════════════════════════════
      // PHASE 3 — ALL WRITES LAST
      // ═══════════════════════════════════════════════
      transaction.update(shopRef, {
        currentStorageBytes: newBytes,
        currentStorageMB: newMB,
        storageLimitReached: percentage >= 100,
        storageWarningSent: warningSent,
        lastStorageCalculation: new Date(),
        updatedAt: new Date()
      });

      transaction.delete(imageRef);

      transaction.set(usageDocRef, {
        currentBytes: newBytes,
        currentMB: newMB,
        currentGB: Number((newBytes / (1024 * 1024 * 1024)).toFixed(4)),
        imageCount: Math.max(0, imgCount - 1),
        lastScan: new Date(),
        lastDelete: new Date(),
        shopId
      }, { merge: true });
    });

    // ─── POST-TRANSACTION: Destroy file from Cloudinary ───
    if (url && url.includes("cloudinary.com")) {
      await this.deleteFromCloudinaryUrl(url, shopId);
    }
  }

  private async deleteFromCloudinaryUrl(url: string, shopId: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      // E.g. https://res.cloudinary.com/dfy4artoh/image/upload/f_auto,q_auto/v12345/clothify/shops/shop_123/invoice/INV-123.pdf
      const match = url.match(/\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?(.+?)(\.[a-zA-Z0-9]+)?$/);
      if (!match || !match[1]) return;

      const publicId = match[1]; // e.g. "clothify/shops/shop_123/invoice/INV-123"

      const shopDoc = await db.collection("shops").doc(shopId).get();
      const shopIntegrations = shopDoc.data()?.integrations || {};
      const shopCloudinary = shopIntegrations.cloudinary;

      let config = shopCloudinary && shopCloudinary.connected && shopCloudinary.cloudName ? shopCloudinary : null;

      if (!config) {
        const { platformSettingsService } = await import("../platform-settings/platform-settings.service");
        const adminIntegrations = await platformSettingsService.getIntegrationSettings();
        config = adminIntegrations.cloudinary;
      }

      if (!config || !config.cloudName || !config.apiKey || !config.apiSecret) {
        console.warn("[MediaService] No Cloudinary credentials found for destroy.");
        return;
      }

      cloudinary.config({
        cloud_name: config.cloudName.trim(),
        api_key: config.apiKey.trim(),
        api_secret: config.apiSecret.trim(),
      });

      const res = await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
      console.log(`[Cloudinary Destroy] ${publicId} =>`, res);

      if (res.result !== "ok") {
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw", invalidate: true });
      }
    } catch (err: any) {
      console.error("[MediaService] Failed to destroy Cloudinary image:", err?.message || err);
    }
  }

  async replaceFile(
    oldUrl: string,
    newFileBuffer: Buffer,
    newFileName: string,
    newMimeType: string,
    shopId: string
  ): Promise<string> {
    const newUrl = await this.uploadFile(newFileBuffer, newFileName, newMimeType, shopId);
    await this.deleteFile(oldUrl, shopId);
    return newUrl;
  }

  async uploadAdminCloudinaryPdf(
    fileBuffer: Buffer,
    fileName: string,
    shopId: string
  ): Promise<string> {
    const { platformSettingsService } = await import("../platform-settings/platform-settings.service");
    const integrations = await platformSettingsService.getIntegrationSettings();
    const config = integrations.cloudinary;

    if (!config || !config.cloudName || !config.apiKey || !config.apiSecret) {
      throw new Error("Admin Cloudinary configuration is missing. Please set it up in the Platform Settings.");
    }

    cloudinary.config({
      cloud_name: config.cloudName.trim(),
      api_key: config.apiKey.trim(),
      api_secret: config.apiSecret.trim(),
    });

    // ── PDF Optimization using pdf-lib ────────────────────────────────────────
    // pdf-lib re-encodes the PDF with deflate object-stream compression.
    // Typically reduces Puppeteer PDF size by 20–45% with zero quality loss.
    let optimizedBuffer = fileBuffer;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const originalSize = fileBuffer.length;
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      const compressed = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });
      optimizedBuffer = Buffer.from(compressed);
      const savedBytes = originalSize - optimizedBuffer.length;
      const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
      console.log(`[PDF Optimizer] ${originalSize} bytes → ${optimizedBuffer.length} bytes (saved ${savedBytes > 0 ? savedBytes : 0} bytes, ${savedBytes > 0 ? savedPercent : 0}%)`);
      if (optimizedBuffer.length > originalSize) {
        console.warn("[PDF Optimizer] Compressed size larger — using original.");
        optimizedBuffer = fileBuffer;
      }
    } catch (optErr) {
      console.warn("[PDF Optimizer] Compression failed, using original:", optErr);
      optimizedBuffer = fileBuffer;
    }
    // ─────────────────────────────────────────────────────────────────────────

    const folder = `clothify/shops/${shopId}/invoice`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          public_id: fileName.replace(/\.pdf$/i, ""),
        },
        async (error, result) => {
          if (error) {
            console.error("Admin Cloudinary SDK error:", JSON.stringify(error));
            return reject(new Error(error.message));
          }
          if (result?.secure_url) {
            const optimizedUrl = result.secure_url.replace(
              "/upload/",
              "/upload/f_auto,q_auto/"
            );
            
            // Deduct storage for this PDF upload
            try {
              await this.trackStorageUsage(shopId, optimizedBuffer.length, optimizedUrl, "cloudinary_admin", "invoice");
            } catch (err: any) {
              console.error("[PDF Optimizer] Storage limit tracking failed:", err.message);
              // We might want to reject here if they are over limit, but the upload already happened.
              // To be safe and strict, we could reject, but returning the URL is also fine.
              // We will just log the error and let them have this one.
            }

            console.log(`[PDF Upload] ${result.bytes} bytes | optimized URL: ${optimizedUrl}`);
            return resolve(optimizedUrl);
          }
          reject(new Error("No secure_url in Cloudinary response"));
        }
      );
      uploadStream.end(optimizedBuffer);
    });
  }

  private uploadToCloudinary(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    config: { cloudName: string; apiKey: string; apiSecret: string },
    shopId: string
  ): Promise<string> {
    // Configure Cloudinary SDK with shop credentials
    cloudinary.config({
      cloud_name: config.cloudName.trim(),
      api_key: config.apiKey.trim(),
      api_secret: config.apiSecret.trim(),
    });

    const folder = `clothify/shops/${shopId}`;

    // Deduplicate uploads using a fast SHA-256 hash of the image buffer
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const safeFileName = fileName.replace(/\.[^.]+$/, "").replace(/\s+/g, "_");
    const optimizedPublicId = `${hash}_${safeFileName}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          public_id: optimizedPublicId,
          format: "avif"
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary SDK error:", JSON.stringify(error));
            return reject(new Error(error.message));
          }
          if (result?.secure_url) {
            return resolve(result.secure_url);
          }
          reject(new Error("No secure_url in Cloudinary response"));
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  private async uploadToS3(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    config: { accessKeyId: string; accessKeySecret: string; bucket: string; region: string },
    shopId: string
  ): Promise<string> {
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region: config.region.trim(),
      credentials: {
        accessKeyId: config.accessKeyId.trim(),
        secretAccessKey: config.accessKeySecret.trim(),
      },
    });

    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const key = `shops/${shopId}/${hash}_${fileName.replace(/\s+/g, "_")}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucket.trim(),
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );

    return `https://${config.bucket.trim()}.s3.${config.region.trim()}.amazonaws.com/${key}`;
  }

  private async uploadToFirebase(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    shopId: string
  ): Promise<string> {
    const bucket = storage.bucket("clothify-5610d.appspot.com");
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const uniqueName = `shops/${shopId}/${hash}_${fileName.replace(/\s+/g, "_")}`;
    const fileRef = bucket.file(uniqueName);

    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
      },
    });

    // Construct the public Firebase Storage URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      fileRef.name
    )}?alt=media`;
  }
}

export const mediaService = new MediaService();
