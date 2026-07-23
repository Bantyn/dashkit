import { Router } from "express";
import {
  createShop,
  listShops,
  getShop,
  getShopFullDetails,
  updateShop,
  deleteShop,
  checkSubdomainAvailability,
  createDeactivationRequest,
  createReactivationRequest,
  getShopRequests,
  processShopRequest,
  generatePublicApiKey
} from "../../../modules/shop/shop.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.post("/", checkPermission("settings.edit"), createShop);
router.get("/", checkPermission("shops.view"), listShops);
router.get("/requests", checkPermission("admin.access"), getShopRequests);
router.post("/requests/:requestId/action", checkPermission("admin.access"), processShopRequest);
router.get("/:id", checkPermission("settings.view"), getShop);
router.get("/:id/details", checkPermission("settings.view"), getShopFullDetails);
router.post("/:id/deactivate-request", checkPermission("settings.edit"), createDeactivationRequest);
router.post("/:id/reactivate-request", createReactivationRequest);
router.post("/:id/generate-api-key", checkPermission("settings.edit"), generatePublicApiKey);
router.put("/:id", checkPermission("settings.edit"), updateShop);
router.delete("/:id", checkPermission("settings.edit"), deleteShop);
router.post("/check-subdomain", checkPermission("settings.view"), checkSubdomainAvailability);

export default router;
