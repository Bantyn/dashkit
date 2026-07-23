import { Request, Response } from "express";
import { asyncHandler, sendError, sendSuccess } from "../../shared/utils/response";
import { roleService } from "../role/role.service";
import { userRoleService } from "../user-role/user-role.service";
import { userService } from "../user/user.service";

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await roleService.listRoles();
  return sendSuccess(res, roles, "Roles fetched");
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.getRole(String(req.params.id));
  if (!role) {
    return sendError(res, "Role not found", 404);
  }
  return sendSuccess(res, role, "Role fetched");
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.createRole(req.body);
  return sendSuccess(res, role, "Role created");
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.updateRole(String(req.params.id), req.body);
  if (!role) {
    return sendError(res, "Role not found", 404);
  }
  return sendSuccess(res, role, "Role updated");
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await roleService.deleteRole(String(req.params.id));
  return sendSuccess(res, null, "Role deleted");
});

export const assignRoleToUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const roleId = String(req.body.roleId);
  const user = await userService.getByUid(userId);

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  const role = await roleService.getRole(roleId);
  if (!role) {
    return sendError(res, "Role not found", 404);
  }

  const shopId = String(req.body.shopId || user.shopId || "");
  if (!shopId) {
    return sendError(res, "shopId is required to map a role", 400);
  }

  await userRoleService.assignRole({
    userId,
    roleId,
    shopId,
  });

  await userService.updateUser(userId, {
    roleId,
    shopId,
  });

  return sendSuccess(
    res,
    {
      userId,
      roleId,
      shopId,
    },
    "Role assigned to user",
  );
});
