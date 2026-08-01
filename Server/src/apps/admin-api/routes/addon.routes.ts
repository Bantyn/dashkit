import { Router } from "express";
import {
  listShopAddons,
  getAddonCatalog,
  createShopAddon,
  cancelShopAddon,
  activateShopAddon,
  getUpcomingInvoice,
  getBillingTransactions,
} from "../../../modules/subscription/addon.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router({ mergeParams: true }); // inherit :shopId from parent route

router.get("/catalog",           checkPermission("plans.view"), getAddonCatalog);
router.get("/",                  checkPermission("plans.view"), listShopAddons);
router.post("/",                 checkPermission("plans.edit"), createShopAddon);
router.post("/:itemId/cancel",   checkPermission("plans.edit"), cancelShopAddon);
router.post("/:itemId/activate", checkPermission("plans.edit"), activateShopAddon);
router.get("/upcoming-invoice",  checkPermission("plans.view"), getUpcomingInvoice);
router.get("/billing-transactions", checkPermission("plans.view"), getBillingTransactions);

export default router;
