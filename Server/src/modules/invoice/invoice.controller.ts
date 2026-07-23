import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { ValidationError } from "../../shared/utils/errors";
import { CreateInvoiceSchema } from "./invoice.validation";
import { invoiceService } from "./invoice.service";

export const createInvoice = asyncHandler(async (req: any, res: Response) => {
  try {
    const validatedData = CreateInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.createInvoice({ ...validatedData, branchId: req.branchId });
    return sendSuccess(res, invoice, "Invoice created successfully");
  } catch (err: any) {
    if (err.errors) {
      throw new ValidationError("Invalid payload: " + err.errors.map((e: any) => e.message).join(", "));
    }
    throw err;
  }
});

export const getInvoices = asyncHandler(async (_req: Request, res: Response) => {
  const invoices = await invoiceService.getInvoices();
  return sendSuccess(res, invoices, "Invoices fetched successfully");
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = await invoiceService.getInvoice(String(id));

  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  return sendSuccess(res, invoice, "Invoice fetched successfully");
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await invoiceService.updateInvoice(String(id), req.body);
  return sendSuccess(res, null, "Invoice updated successfully");
});

export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await invoiceService.deleteInvoice(String(id));
  return sendSuccess(res, null, "Invoice deleted successfully");
});

export const getInvoicesByShop = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const employeeId = req.query.employeeId ? String(req.query.employeeId) : undefined;
  const invoices = await invoiceService.getInvoicesByShop(String(shopId), employeeId, (req as any).branchId);
  return sendSuccess(res, invoices, "Shop invoices fetched successfully");
});

export const getInvoicesByCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const invoices = await invoiceService.getInvoicesByCustomer(String(customerId));
  return sendSuccess(res, invoices, "Customer invoices fetched successfully");
});

export const sendInvoiceWhatsApp = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const invoice = await invoiceService.getInvoice(String(id));
  
  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  const phone = invoice.customerPhone?.replace(/\D/g, "");
  if (!phone) {
    return sendError(res, "No valid phone number for customer", 400);
  }

  const invDate = invoice.invoiceDate || invoice.date;
  const dateStr = invDate
    ? new Date(invDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const defaultMessage = `Hello {{customerName}},\n\nYour invoice *{{invoiceNumber}}* has been generated.\nAmount: *₹{{totalAmount}}*\nDate: ${dateStr}\nStatus: {{status}}\n\nHere is your invoice link: {{invoiceLink}}\n\nThank you for shopping with us! 🛍️`;

  try {
    const { notificationSenderService } = await import("../../shared/utils/notification-sender.service");

    await notificationSenderService.sendTemplatedNotification(
      invoice.shopId,
      "whatsapp",
      "invoice_generated",
      phone,
      {
        customerName: invoice.customerName || "Customer",
        invoiceNumber: invoice.invoiceNumber || "",
        totalAmount: invoice.total?.toLocaleString() || "0",
        status: invoice.paymentStatus || "Pending",
        invoiceLink: invoice.pdfUrl || "",
      },
      "",
      defaultMessage
    );
    return sendSuccess(res, null, "WhatsApp sent successfully");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to send WhatsApp", 400);
  }
});
