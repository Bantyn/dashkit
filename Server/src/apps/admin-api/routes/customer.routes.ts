import { Router } from "express";
import {
  findCustomer,
  createCustomer,
  getCustomersByShop,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../../modules/customer/customer.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/find", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CUST_LIST), findCustomer);
router.post("/", checkPermission("customers.create"), checkFeature(FEATURE_KEYS.CUST_LIST), createCustomer);
router.get("/shop/:shopId", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CUST_LIST), getCustomersByShop);
router.get("/:id", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CUST_LIST), getCustomer);
router.patch("/:id", checkPermission("customers.edit"), checkFeature(FEATURE_KEYS.CUST_LIST), updateCustomer);
router.delete("/:id", checkPermission("customers.delete"), checkFeature(FEATURE_KEYS.CUST_LIST), deleteCustomer);

export default router;
