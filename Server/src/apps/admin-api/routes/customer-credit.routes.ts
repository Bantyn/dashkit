import { Router } from "express";
import {
  getCustomerCredit,
  getCreditsByShop,
  adjustCredit,
} from "../../../modules/customer-credit/customer-credit.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/", checkPermission("orders.view"), getCustomerCredit);
router.get("/shop/:shopId", checkPermission("orders.view"), getCreditsByShop);
router.post("/adjust", checkPermission("orders.edit"), adjustCredit);

export default router;
