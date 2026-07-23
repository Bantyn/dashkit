import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { customerService } from "./customer.service";

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { customer, alreadyExists } = await customerService.createCustomer(req.body);

  if (alreadyExists) {
    return sendSuccess(res, customer, "Customer already exists");
  }

  return sendSuccess(res, customer, "Customer created successfully");
});

export const findCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, phone, email, userId } = req.query;

  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }
  if (!phone && !email && !userId) {
    return sendError(res, "Phone, email, or userId is required", 400);
  }

  const customer = await customerService.findCustomer(
    String(shopId), 
    phone ? String(phone) : undefined,
    email ? String(email) : undefined,
    userId ? String(userId) : undefined
  );

  if (!customer) {
    return sendSuccess(res, null, "Customer not found");
  }

  return sendSuccess(res, customer, "Customer found successfully");
});

export const getCustomersByShop = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const customers = await customerService.getCustomersByShop(String(shopId));
  return sendSuccess(res, customers, "Customers fetched successfully");
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = await customerService.getCustomer(String(id));

  if (!customer) {
    return sendError(res, "Customer not found", 404);
  }

  return sendSuccess(res, customer, "Customer fetched successfully");
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await customerService.updateCustomer(String(id), req.body);
  return sendSuccess(res, null, "Customer updated successfully");
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await customerService.deleteCustomer(String(id));
  return sendSuccess(res, null, "Customer deleted successfully");
});
