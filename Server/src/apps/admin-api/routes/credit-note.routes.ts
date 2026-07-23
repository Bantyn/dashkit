import { Router } from "express";
import {
  createCreditNote,
  getCreditNotesByShop,
  updateCreditNoteStatus,
  convertToCredit,
} from "../../../modules/credit-note/credit-note.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.post("/", checkPermission("orders.edit"), checkFeature(FEATURE_KEYS.SELL_CREDIT_NOTES), createCreditNote);
router.get("/shop/:shopId", checkPermission("orders.view"), checkFeature(FEATURE_KEYS.SELL_CREDIT_NOTES), getCreditNotesByShop);
router.put("/:id/status", checkPermission("orders.edit"), checkFeature(FEATURE_KEYS.SELL_CREDIT_NOTES), updateCreditNoteStatus);
router.post("/:id/convert", checkPermission("orders.edit"), checkFeature(FEATURE_KEYS.SELL_CREDIT_NOTES), convertToCredit);

export default router;
