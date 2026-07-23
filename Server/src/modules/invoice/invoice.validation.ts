import { z } from 'zod';

export const CreateInvoiceSchema = z.object({
  shopId: z.string().min(1, "Shop ID is required"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  invoiceType: z.enum(["retail", "wholesale"]).optional().default("retail"),
  discount: z.number().min(0, "Discount cannot be negative").optional().default(0),
  appliedCredit: z.number().min(0, "Credit cannot be negative").optional().default(0),
  items: z.array(z.object({
    productId: z.string().min(1, "Product ID is required"),
    productName: z.string().optional(),
    variantSku: z.string().optional(),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price cannot be negative"),
    manualPriceOverride: z.boolean().optional(),
  })).min(1, "Invoice must contain at least one item"),
  paymentMethod: z.string().min(1, "Payment method is required"),
}).passthrough(); // Allow other fields like customerAddress, invoiceNumber for now
