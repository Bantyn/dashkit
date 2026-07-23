import { db } from "../../config/firebase.config";
import { StockTransfer, StockTransferItem } from "./stock-transfer.model";
import { inventoryService } from "../inventory/inventory.service";
import { productService } from "../product/product.service";
import { logActivity } from "../staff/staff.service";

const COLLECTION = "stock_transfers";

export class StockTransferService {
  async getTransfers(shopId: string): Promise<StockTransfer[]> {
    const snapshot = await db.collection(COLLECTION).where("shopId", "==", shopId).get();
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as StockTransfer;
    }).sort((a: StockTransfer, b: StockTransfer) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createTransfer(payload: any): Promise<StockTransfer> {
    const {
      shopId,
      sourceBranchId,
      sourceBranchName,
      destinationBranchId,
      destinationBranchName,
      items,
      createdBy,
    } = payload;

    if (!sourceBranchId || !destinationBranchId) {
      throw new Error("Source and destination branches are required.");
    }
    if (sourceBranchId === destinationBranchId) {
      throw new Error("Source and destination branches must be different.");
    }
    if (!items || items.length === 0) {
      throw new Error("At least one item is required for transfer.");
    }

    const docRef = db.collection(COLLECTION).doc();
    const transferId = docRef.id;

    // Process each item to adjust stock
    for (const item of items) {
      const { productId, variantSku, quantity } = item;

      if (quantity <= 0) {
        throw new Error(`Quantity for SKU ${variantSku} must be greater than zero.`);
      }

      // 1. Validate and reduce stock from Source Branch
      const sourceProductDoc = await db.collection("products").doc(productId).get();
      if (!sourceProductDoc.exists) {
        throw new Error(`Source product with ID ${productId} not found.`);
      }
      const sourceProduct = sourceProductDoc.data();
      
      const sourceVariant = sourceProduct?.variants?.find((v: any) => v.sku === variantSku);
      if (!sourceVariant) {
        throw new Error(`SKU ${variantSku} not found on source product.`);
      }

      if (sourceVariant.stock < quantity) {
        throw new Error(`Insufficient stock for SKU ${variantSku} on source branch. Available: ${sourceVariant.stock}, Requested: ${quantity}`);
      }

      // Reduce stock at source
      const newSourceStock = sourceVariant.stock - quantity;
      await inventoryService.updateStock({
        productId,
        shopId,
        newStock: newSourceStock,
        reason: `Transfer to ${destinationBranchName || 'Branch'}`,
        changeType: "subtract",
        movementType: "stock_transfer_out",
        amount: quantity,
        variantSku,
        updatedBy: createdBy,
        referenceId: transferId,
        referenceType: "stock_transfer",
        branchId: sourceBranchId,
      });

      // 2. Find or Clone product to Destination Branch
      const destProductQuery = db
        .collection("products")
        .where("shopId", "==", shopId)
        .where("branchId", "==", destinationBranchId);

      const destProductsSnap = await destProductQuery.get();
      let destProduct = destProductsSnap.docs
        .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() as any }))
        .find((p: any) => p.variants?.some((v: any) => v.sku === variantSku));

      if (destProduct) {
        // Destination product exists, update its stock
        const destVariant = destProduct.variants.find((v: any) => v.sku === variantSku);
        const newDestStock = (destVariant?.stock || 0) + quantity;
        
        await inventoryService.updateStock({
          productId: destProduct.id,
          shopId,
          newStock: newDestStock,
          reason: `Transfer from ${sourceBranchName || 'Branch'}`,
          changeType: "add",
          movementType: "stock_transfer_in",
          amount: quantity,
          variantSku,
          updatedBy: createdBy,
          referenceId: transferId,
          referenceType: "stock_transfer",
          branchId: destinationBranchId,
        });
      } else {
        // Destination product doesn't exist, clone the source product
        const clonedProductPayload = {
          ...sourceProduct,
          branchId: destinationBranchId,
          createdBy,
          variants: sourceProduct?.variants?.map((v: any) => ({
            ...v,
            stock: v.sku === variantSku ? quantity : 0, // only set stock for the transferred variant
          })),
        };
        // Remove original id if it exists in the root payload
        delete (clonedProductPayload as any).id;
        delete (clonedProductPayload as any).createdAt;
        delete (clonedProductPayload as any).updatedAt;

        const newProd = await productService.createProduct(clonedProductPayload);

        // Record history for the cloned product's variant transfer-in
        const historyRef = db.collection("inventory_history").doc();
        await historyRef.set({
          id: historyRef.id,
          shopId,
          branchId: destinationBranchId,
          productId: newProd.id,
          variantSku,
          movementType: "stock_transfer_in",
          changeType: "add",
          amount: quantity,
          previousStock: 0,
          newStock: quantity,
          quantityChanged: quantity,
          reason: `Transfer from ${sourceBranchName || 'Branch'} (Product Cloned)`,
          referenceId: transferId,
          referenceType: "stock_transfer",
          updatedBy: createdBy,
          createdAt: new Date(),
        });
      }
    }

    const transferRecord: StockTransfer = {
      id: transferId,
      shopId,
      sourceBranchId,
      sourceBranchName,
      destinationBranchId,
      destinationBranchName,
      items,
      status: "completed", // Instant complete
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(transferRecord);

    void logActivity({
      shopId,
      staffId: createdBy || "admin",
      action: "Stock Transferred",
      details: `Transferred ${items.length} items from ${sourceBranchName} to ${destinationBranchName}`,
      type: "inventory",
    });

    return transferRecord;
  }
}

export const stockTransferService = new StockTransferService();
