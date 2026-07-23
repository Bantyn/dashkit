import { Router } from "express";
import {
  assignRoleToUser,
  createRole,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
} from "../../../modules/roles/role.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/", checkPermission("roles.view"), listRoles);
router.put("/assign/:userId", checkPermission("subscriptions.assign"), assignRoleToUser);
router.get("/:id", checkPermission("roles.view"), getRole);
router.post("/", checkPermission("roles.edit"), createRole);
router.put("/:id", checkPermission("roles.edit"), updateRole);
router.delete("/:id", checkPermission("roles.edit"), deleteRole);

export default router;
