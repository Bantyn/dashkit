import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccess,
  sendError,
} from "../../shared/utils/response";
import { getQuickActionsForStaff } from "../../shared/utils/permissions";
import { staffService } from "./staff.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const staffLogin = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, "Firebase authentication token is required", 401);
    }

    const result = await staffService.staffLogin(uid, req.user?.email);
    if (result.status === "not_found") {
      return sendError(
        res,
        "Staff account not found for this authenticated user.",
        404,
      );
    }
    if (result.status === "inactive") {
      return sendError(
        res,
        "Your account is currently inactive. Contact admin.",
        403,
      );
    }

    const permissions = req.user?.permissions || [];

    return sendSuccess(
      res,
      {
        ...result.data,
        roles: req.user?.roleNames || [],
        permissions: permissions,
        quickActions: getQuickActionsForStaff(permissions),
        shopId: req.user?.shopId || result.data.profile.shopId,
      },
      "Login successful",
    );
  },
);

export const getStaffByShop = asyncHandler(
  async (req: Request, res: Response) => {
    const staffList = await staffService.getStaffByShop(
      String(req.params.shopId),
    );
    return sendSuccess(res, staffList, "Staff fetched successfully");
  },
);

export const getStaffById = asyncHandler(
  async (req: Request, res: Response) => {
    const staff = await staffService.getStaffById(String(req.params.id));
    if (!staff) return sendError(res, "Staff member not found", 404);
    return sendSuccess(res, staff, "Staff fetched successfully");
  },
);

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const result = await staffService.createStaff(req.body);
  if (result.status === "missing_shop") {
    return sendError(res, "Shop ID is required to create a staff member.", 400);
  }
  if (result.status === "email_exists") {
    return sendError(res, "This email is already registered.", 400);
  }
  if (result.status === "phone_exists") {
    return sendError(res, "This mobile number is already registered.", 400);
  }
  return sendSuccess(res, result.data, "Staff member created successfully");
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  await staffService.updateStaff(
    String(req.params.id),
    req.body,
    req.headers["x-staff-id"],
  );
  return sendSuccess(res, null, "Staff member updated successfully");
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  const result = await staffService.deleteStaff(String(req.params.id), shopId);
  if (result.status === "not_found") {
    return sendError(res, "Staff not found", 404);
  }
  return sendSuccess(res, null, "Staff member deleted successfully");
});

export const getStaffLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const logs = await staffService.getStaffLogs(
      String(req.params.shopId),
      req.query.staffId ? String(req.query.staffId) : undefined,
    );
    return sendSuccess(res, logs, "Staff logs fetched successfully");
  },
);
