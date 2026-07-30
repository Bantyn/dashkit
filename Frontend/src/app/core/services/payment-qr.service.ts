import { Injectable } from '@angular/core';
import { Shop } from '../models/shop.model';

export interface PaymentQrResult {
  available: boolean;
  sourceType: 'razorpay' | 'upi' | 'none';
  qrDataUrl?: string;
  upiUrl?: string;
  paymentDestination?: string;
  accountName?: string;
  warningMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentQrService {
  /**
   * Validates UPI ID format (must contain @ and valid characters e.g. merchant@oksbi)
   */
  public isValidUpiId(upiId: string | undefined | null): boolean {
    if (!upiId) return false;
    const clean = upiId.trim();
    if (clean.length < 5 || !clean.includes('@')) return false;
    const parts = clean.split('@');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }

  /**
   * Validates Razorpay connection & credentials for a shop
   */
  public isRazorpayAvailable(shop: Shop | null | undefined): boolean {
    if (!shop || !shop.razorpay) return false;
    const rzp = shop.razorpay;
    return Boolean(rzp.connected && rzp.keyId && rzp.keyId.trim().length > 3);
  }

  /**
   * Resolves the dynamic payment QR for a shop based on priority rules:
   * Priority 1: Active Razorpay Account for current shop (uses Merchant VPA or Razorpay Checkout URL)
   * Priority 2: Configured UPI ID for current shop
   * Priority 3: None available (returns warning message & available = false)
   */
  public getPaymentQrDetails(
    shop: Shop | null | undefined,
    sampleAmount: number = 5306.46
  ): PaymentQrResult {
    if (!shop) {
      return {
        available: false,
        sourceType: 'none',
        warningMessage: 'Payment QR cannot be generated. Please configure either Razorpay Account or UPI ID in Payment Settings.',
      };
    }

    const shopName = shop.displayName || shop.shopName || 'Merchant';

    // Priority 1: Active Razorpay Account for this Shop
    if (this.isRazorpayAvailable(shop)) {
      const rzp = shop.razorpay!;
      const keyId = rzp.keyId.trim();

      // If Razorpay Merchant VPA (Official Razorpay UPI ID) is configured
      if (rzp.merchantVpa && this.isValidUpiId(rzp.merchantVpa)) {
        const cleanVpa = rzp.merchantVpa.trim();
        const upiUrl = `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(shopName)}&am=${sampleAmount.toFixed(2)}&cu=INR&tn=Razorpay%20Invoice%20Payment`;
        const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(upiUrl)}`;

        return {
          available: true,
          sourceType: 'razorpay',
          qrDataUrl,
          upiUrl,
          paymentDestination: cleanVpa,
          accountName: shopName,
        };
      }

      // Default Official Razorpay Payment URL QR (Razorpay Checkout Gateway)
      const rzpPaymentUrl = `https://razorpay.com/pay/${keyId}`;
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(rzpPaymentUrl)}`;

      return {
        available: true,
        sourceType: 'razorpay',
        qrDataUrl,
        paymentDestination: `Razorpay (${keyId})`,
        accountName: shopName,
      };
    }

    // Priority 2: Configured UPI ID for this Shop
    const upiId = shop.upiDetails?.upiId;
    if (this.isValidUpiId(upiId)) {
      const cleanUpiId = upiId!.trim();
      const accountName = shop.upiDetails?.accountName || shopName;
      const upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(accountName)}&am=${sampleAmount.toFixed(2)}&cu=INR&tn=Invoice%20Payment`;
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(upiUrl)}`;

      return {
        available: true,
        sourceType: 'upi',
        qrDataUrl,
        upiUrl,
        paymentDestination: cleanUpiId,
        accountName,
      };
    }

    // Priority 3: Neither Razorpay nor UPI Available
    return {
      available: false,
      sourceType: 'none',
      warningMessage: 'Payment QR cannot be generated. Please configure either Razorpay Account or UPI ID in Payment Settings.',
    };
  }
}
