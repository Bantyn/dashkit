import { Router } from "express";
import {
  getShopCategories,
  getShopConfig,
  getShopProducts,
  getShopOffers,
  getShopProductById,
  getShopSubcategories,
  getShopSeasonalCollections,
} from "../../../modules/shop/website.controller";
import { resolveShopMiddleware } from "../../../modules/shop/website.middleware";

const router = Router();

router.use(resolveShopMiddleware);
router.get("/config", getShopConfig);
router.get("/categories", getShopCategories);
router.get("/subcategories", getShopSubcategories);
router.get("/products", getShopProducts);
router.get("/products/:id", getShopProductById);
router.get("/offers", getShopOffers);
router.get("/seasonal-collections", getShopSeasonalCollections);
router.get("/invoices/:id", async (req, res) => {
  try {
    const { invoiceService } = await import("../../../modules/invoice/invoice.service");
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    return res.status(200).json({ success: true, data: invoice });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PDF proxy — fetches the Cloudinary PDF and serves it with correct headers
// so it opens inline in Chrome / WhatsApp browser
router.get("/invoices/:id/pdf", async (req, res) => {
  try {
    const { invoiceService } = await import("../../../modules/invoice/invoice.service");
    const invoice = await invoiceService.getInvoice(req.params.id) as any;
    if (!invoice) {
      return res.status(404).send("Invoice not found");
    }
    if (!invoice.pdfUrl) {
      return res.status(404).send("PDF not yet generated. Please try again in a moment.");
    }

    const axios = require("axios");
    const pdfResponse = await axios.get(invoice.pdfUrl, { responseType: "arraybuffer" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(Buffer.from(pdfResponse.data));
  } catch (err: any) {
    return res.status(500).send("Failed to load PDF: " + err.message);
  }
});

router.get("/shops/:id", async (req, res) => {
  try {
    const { db } = await import("../../../config/firebase.config");
    const shopDoc = await db.collection("shops").doc(req.params.id).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
    const data = shopDoc.data();
    // Exclude sensitive integrations/keys if necessary
    if (data?.integrations) delete data.integrations;
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
