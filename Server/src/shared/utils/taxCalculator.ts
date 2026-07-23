import { TaxConfig, Address } from "../../modules/shop/shop.model";

export interface TaxBreakdown {
  taxableValue: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  isInterstate: boolean;
}

export const calculateTax = (
  amount: number,
  taxConfig: TaxConfig,
  shopAddress: Address | undefined,
  customerAddress: Address | undefined,
): TaxBreakdown => {
  const { gstRate, gstType, gstEnabled } = taxConfig;

  if (!gstEnabled) {
    return {
      taxableValue: amount,
      totalTax: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: amount,
      isInterstate: false,
    };
  }

  const shopState = (shopAddress?.state || "").toLowerCase().trim();
  const customerState = (customerAddress?.state || "").toLowerCase().trim();
  const isInterstate = customerState !== "" && shopState !== "" && customerState !== shopState;

  let taxableValue = 0;
  let totalTax = 0;

  if (gstType === "inclusive") {
    taxableValue = amount / (1 + gstRate / 100);
    totalTax = amount - taxableValue;
  } else {
    taxableValue = amount;
    totalTax = amount * (gstRate / 100);
  }

  taxableValue = Math.round(taxableValue * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;
  const totalAmount = Math.round((taxableValue + totalTax) * 100) / 100;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterstate) {
    igst = totalTax;
  } else {
    cgst = Math.round((totalTax / 2) * 100) / 100;
    sgst = Math.round((totalTax - cgst) * 100) / 100;
  }

  return {
    taxableValue,
    totalTax,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    totalAmount,
    isInterstate,
  };
};
