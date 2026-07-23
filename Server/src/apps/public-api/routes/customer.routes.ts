import { Router } from "express";
import {
  findCustomer,
  createCustomer,
  updateCustomer,
} from "../../../modules/customer/customer.controller";
import { deleteCustomerAccount } from "../../../modules/customer/public-customer.controller";

const router = Router();

router.get("/find", findCustomer);
router.post("/", createCustomer);
router.patch("/:id", updateCustomer);
router.delete("/:id/account", deleteCustomerAccount);

export default router;
