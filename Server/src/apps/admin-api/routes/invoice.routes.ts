import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesByShop,
  getInvoicesByCustomer,
  sendInvoiceWhatsApp,
} from "../../../modules/invoice/invoice.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature, checkLimit } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS, LIMIT_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.post(
  "/",
  checkPermission("invoices.create"),
  checkFeature(FEATURE_KEYS.SELL_INVOICES),
  checkLimit(LIMIT_KEYS.INVOICES_PER_MONTH, { scope: "shop", period: "monthly" }),
  createInvoice,
);
router.get("/", checkPermission("invoices.view"), getInvoices);
router.get("/shop/:shopId", checkPermission("invoices.view"), getInvoicesByShop);
router.get("/customer/:customerId", checkPermission("invoices.view"), getInvoicesByCustomer);

router.get("/:id", checkPermission("invoices.view"), getInvoice);
router.put("/:id", checkPermission("invoices.edit"), updateInvoice);
router.delete("/:id", checkPermission("invoices.delete"), deleteInvoice);

router.post("/:id/send-whatsapp", checkPermission("invoices.view"), sendInvoiceWhatsApp);

export default router;
