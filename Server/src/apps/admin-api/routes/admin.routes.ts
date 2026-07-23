import { Router } from "express";
import {
  getAdminOverview,
  getAdminTransactions,
  getAdminUsers,
  getAdminAdmins,
  getAdminStaff,
  getAdminCustomers,
  getAdminActivityLogs,
  getRevenueReport,
  getUsageReport,
} from "../../../modules/admin/admin.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/overview", checkPermission("overview.view"), getAdminOverview);
router.get("/users", checkPermission("users.view"), getAdminUsers);
router.get("/users/admins", checkPermission("users.view"), getAdminAdmins);
router.get("/users/staffs", checkPermission("users.view"), getAdminStaff);
router.get("/users/customers", checkPermission("users.view"), getAdminCustomers);
router.get("/activity-logs", checkPermission("users.view"), getAdminActivityLogs);
router.get("/transactions", checkPermission("transactions.view"), getAdminTransactions);
router.get("/reports/revenue", checkPermission("overview.view"), getRevenueReport);
router.get("/reports/usage", checkPermission("overview.view"), getUsageReport);

export default router;
