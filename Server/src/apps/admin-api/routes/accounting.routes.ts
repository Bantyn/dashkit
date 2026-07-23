import { Router } from "express";
import {
  getCashBook,
  getBankBook,
  getLedger,
  getReceivables,
  getPayables,
  getGSTReport,
} from "../../../modules/accounting/accounting.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/:shopId/cashbook", checkPermission("accounting.view"), checkFeature(FEATURE_KEYS.ACC_CASH_BOOK), getCashBook);
router.get("/:shopId/bankbook", checkPermission("accounting.view"), checkFeature(FEATURE_KEYS.ACC_BANK_BOOK), getBankBook);
router.get("/:shopId/ledger", checkPermission("accounting.view"), checkFeature(FEATURE_KEYS.ACC_LEDGER), getLedger);
router.get("/:shopId/receivables", checkPermission("accounting.view"), checkFeature(FEATURE_KEYS.ACC_RECEIVABLES), getReceivables);
router.get("/:shopId/payables", checkPermission("accounting.view"), checkFeature(FEATURE_KEYS.ACC_PAYABLES), getPayables);
router.get("/:shopId/gst-report", checkPermission("accounting.view"), checkFeature(FEATURE_KEYS.FIN_TAX_REPORT), getGSTReport);

export default router;
