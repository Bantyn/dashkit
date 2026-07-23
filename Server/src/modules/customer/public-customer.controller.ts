import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { customerService } from "./customer.service";
import { db } from "../../config/firebase.config";

export const deleteCustomerAccount = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = id as string;
  
  // Anonymize the customer to keep transaction references intact
  const payload = {
    status: 'deleted',
    name: 'Deleted Account',
    email: '',
    phoneNumber: '',
    userId: '',
    dateOfBirth: '',
    addresses: [],
    wishlist: [],
    updatedAt: new Date()
  };

  await customerService.updateCustomer(customerId, payload);
  return sendSuccess(res, null, "Account deleted successfully");
});
