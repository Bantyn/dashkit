import { CacheService } from "../../infrastructure/cache/cache.service";
import { Order } from "./order.model";
import { inventoryService } from "../inventory/inventory.service";
import { productService } from "../product/product.service";
import { createNotification } from "../notification/notification.controller";
import { customerCreditService } from "../customer-credit/customer-credit.service";
import axios from "axios";
import * as crypto from "crypto";
import { sendShopCustomerEmail } from "../../shared/utils/email.util";
import { notificationSenderService } from "../../shared/utils/notification-sender.service";
import { shopCountersService } from "../../infrastructure/cache/shop-counters.service";
import { costAnalyticsService } from "../cost-analytics/cost-analytics.service";
import { IOrderRepository } from "../../application/repositories/interfaces/order-repository.interface";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

export class OrderService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 30 * 1000;

  private get orderRepository(): IOrderRepository {
    return RepositoryFactory.getOrderRepository();
  }

  private getMyOrdersKey(shopId: string, customerId: string) {
    return `orders:my:${shopId}:${customerId}`;
  }

  private getOrderKey(id: string) {
    return `order:${id}`;
  }

  private invalidateOrderCache(shopId?: string, orderId?: string, customerId?: string) {
    if (shopId) {
      this.cache.deleteByPrefix(`orders:shop:${shopId}`);
      this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);
      this.cache.deleteByPrefix(`analytics:collections:orders:${shopId}`);
      this.cache.deleteByPrefix(`analytics:collections:inventory:${shopId}`);
      this.cache.deleteByPrefix(`analytics:report:${shopId}`);
      this.cache.deleteByPrefix(`analytics:page:${shopId}`);
    }
    if (shopId && customerId) {
      this.cache.delete(this.getMyOrdersKey(shopId, customerId));
    }
    if (orderId) {
      this.cache.delete(this.getOrderKey(orderId));
    }
  }

  async createOrder(payload: any) {
    const generatedId = this.orderRepository.generateId();
    const order: Order = {
      ...payload,
      id: generatedId,
      createdAt: new Date(),
      updatedAt: new Date(),
      orderStatus: "pending",
      paymentStatus: "pending",
    };

    // Apply Customer Credit deduction automatically if available
    let creditApplied = 0;
    if (order.customerId && order.shopId) {
      const cc = await customerCreditService.getCustomerCredit(order.shopId, order.customerId);
      if (cc && cc.balance > 0) {
        creditApplied = Math.min(order.totalAmount, cc.balance);
        order.totalAmount -= creditApplied;
        (order as any).creditApplied = creditApplied;

        await customerCreditService.adjustCredit(
          order.shopId,
          order.customerId,
          cc.customerName,
          cc.customerPhone || "",
          cc.customerEmail || "",
          creditApplied,
          'debit',
          `Redeemed on Order #${order.id.slice(-8).toUpperCase()}`,
          order.id
        );

        if (order.totalAmount <= 0) {
          order.totalAmount = 0;
          order.paymentStatus = "paid";
          order.paymentMethod = "credit";
        }
      }
    }

    // Handle Online Payment (Razorpay Order Creation)
    if (order.paymentMethod === "online" && order.totalAmount > 0) {
      const shop = await this.orderRepository.getShop(order.shopId);

      if (!shop || !shop.razorpay || !shop.razorpay.keyId || !shop.razorpay.keySecret || !shop.razorpay.connected) {
        throw new Error("Online payment is not configured for this shop");
      }

      try {
        const rzpResponse = await axios.post(
          "https://api.razorpay.com/v1/orders",
          {
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
            receipt: order.id,
          },
          {
            auth: {
              username: shop.razorpay.keyId,
              password: shop.razorpay.keySecret,
            },
          }
        );
        (order as any).razorpayOrderId = rzpResponse.data.id;
      } catch (error: any) {
        console.error("Razorpay order creation failed:", error.response?.data || error.message);
        throw new Error("Failed to initialize payment gateway. Please try again.");
      }
    }

    // Store customerEmail at top-level for easy querying
    if (payload.shippingAddress?.email && !(order as any).customerEmail) {
      (order as any).customerEmail = payload.shippingAddress.email.toLowerCase();
    }

    // Remove any undefined values to prevent database crashes
    Object.keys(order).forEach(key => (order as any)[key] === undefined && delete (order as any)[key]);
    
    await this.orderRepository.createOrder(order);

    if (order.items && order.items.length > 0) {
      await this.orderRepository.commitOrderStockUpdates(order.shopId, order.id, order.items);
    }

    this.invalidateOrderCache(order.shopId, order.id, order.customerId);
    inventoryService.invalidateShopCache(order.shopId);
    productService.invalidateShopCache(order.shopId);

    // FUTURE ASYNC
    await createNotification({
      shopId: order.shopId,
      title: "New Website Order",
      message: `Website Order #WEB-${order.id.slice(-8).toUpperCase()} received`,
      type: "new_order",
      link: `/${order.shopId}/invoices/website?invoiceId=${order.id}`,
    });

    // Send customer notifications asynchronously
    (async () => {
      try {
        const orderRefNum = order.id.slice(-8).toUpperCase();
        const customerName = order.shippingAddress?.fullName || "Valued Customer";
        const email = order.customerEmail || order.shippingAddress?.email;
        const phone = order.shippingAddress?.phone;

        const variables = {
          customerName,
          orderNumber: orderRefNum,
          totalAmount: String(order.totalAmount),
          paymentMethod: order.paymentMethod.toUpperCase(),
        };

        const defaultSubject = `Order Confirmation - #${orderRefNum}`;
        const defaultEmailBody = `<h3>Hello ${customerName},</h3><p>Thank you for your order! We have received your order <strong>#${orderRefNum}</strong>.</p><p><strong>Total Amount:</strong> INR ${order.totalAmount}<br><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p><p>We will notify you once it's shipped.</p><p>Best regards,<br>Clothify Store</p>`;
        const defaultSmsBody = `Hello ${customerName}, your order #${orderRefNum} of INR ${order.totalAmount} has been received! Thank you.`;
        const defaultWhatsAppBody = `Hello ${customerName}, your order #${orderRefNum} has been received successfully! Total: INR ${order.totalAmount}. Thank you for shopping with us!`;

        if (email) {
          await notificationSenderService.sendTemplatedNotification(
            order.shopId,
            "email",
            "order_confirmation",
            email,
            variables,
            defaultSubject,
            defaultEmailBody
          );
        }

        if (phone) {
          await notificationSenderService.sendTemplatedNotification(
            order.shopId,
            "sms",
            "order_confirmation",
            phone,
            variables,
            defaultSubject,
            defaultSmsBody
          );
          await notificationSenderService.sendTemplatedNotification(
            order.shopId,
            "whatsapp",
            "order_confirmation",
            phone,
            variables,
            defaultSubject,
            defaultWhatsAppBody
          );
        }
      } catch (err: any) {
        console.error("Failed to send customer order creation notifications:", err.message);
      }
    })();

    // Increment shop orders counter and invalidate cost report snapshot
    if (order.shopId) {
      void shopCountersService.incrementCounter(order.shopId, "orders", 1);
      void costAnalyticsService.invalidateSnapshot("new_order");
    }

    return order;
  }

  async getOrders() {
    return this.orderRepository.getOrders();
  }

  async getOrder(id: string) {
    const cached = this.cache.get<any>(this.getOrderKey(id));
    if (cached) {
      return cached;
    }

    const order = await this.orderRepository.getOrder(id);
    if (!order) {
      return null;
    }

    this.cache.set(this.getOrderKey(id), order, this.cacheTtlMs);
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const existing = await this.getOrder(id);
    await this.orderRepository.updateOrder(id, {
      orderStatus: status,
    });
    this.invalidateOrderCache((existing as any)?.shopId, id, (existing as any)?.customerId);

    // Send status update notification asynchronously
    if (existing) {
      (async () => {
        try {
          const orderRefNum = id.slice(-8).toUpperCase();
          const customerName = existing.shippingAddress?.fullName || "Valued Customer";
          const email = existing.customerEmail || existing.shippingAddress?.email;
          const phone = existing.shippingAddress?.phone;

          const variables = {
            customerName,
            orderNumber: orderRefNum,
            status: status.toUpperCase(),
          };

          let defaultMsg = `Hello ${customerName}, your order #${orderRefNum} status has been updated to: ${status.toUpperCase()}.`;
          if (status === "shipped") {
            defaultMsg = `Hello ${customerName}, your order #${orderRefNum} has been shipped! It will reach you soon.`;
          } else if (status === "delivered") {
            defaultMsg = `Hello ${customerName}, your order #${orderRefNum} has been delivered successfully! Thank you for shopping with us.`;
          }

          const defaultSubject = `Order #${orderRefNum} Update - ${status.toUpperCase()}`;
          const defaultEmailBody = `<h3>Hello ${customerName},</h3><p>Your order <strong>#${orderRefNum}</strong> status has been updated to: <strong>${status.toUpperCase()}</strong>.</p><p>${defaultMsg}</p><p>Best regards,<br>Clothify Store</p>`;

          if (email) {
            await notificationSenderService.sendTemplatedNotification(
              existing.shopId,
              "email",
              "order_status_update",
              email,
              variables,
              defaultSubject,
              defaultEmailBody
            );
          }

          if (phone) {
            await notificationSenderService.sendTemplatedNotification(
              existing.shopId,
              "sms",
              "order_status_update",
              phone,
              variables,
              defaultSubject,
              defaultMsg
            );
            await notificationSenderService.sendTemplatedNotification(
              existing.shopId,
              "whatsapp",
              "order_status_update",
              phone,
              variables,
              defaultSubject,
              defaultMsg
            );
          }
        } catch (err: any) {
          console.error("Failed to send customer order status notifications:", err.message);
        }
      })();
    }
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    const existing = await this.getOrder(id);
    await this.orderRepository.updateOrder(id, {
      paymentStatus,
    });
    this.invalidateOrderCache((existing as any)?.shopId, id, (existing as any)?.customerId);
  }

  async deleteOrder(id: string) {
    const existing = await this.getOrder(id);
    await this.orderRepository.deleteOrder(id);
    this.invalidateOrderCache((existing as any)?.shopId, id, (existing as any)?.customerId);

    if (existing?.shopId) {
      void shopCountersService.incrementCounter(existing.shopId, "orders", -1);
      void costAnalyticsService.invalidateSnapshot("delete_order");
    }
  }

  private getShopOrdersKey(shopId: string, branchId?: string) {
    return `orders:shop:${shopId}:${branchId || "all"}`;
  }

  async getOrdersByShop(shopId: string, branchId?: string) {
    const cacheKey = this.getShopOrdersKey(shopId, branchId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.orderRepository.getOrdersByShop(shopId, branchId);
    return this.cache.set(cacheKey, data, this.cacheTtlMs);
  }

  async getMyOrders(customerId: string, shopId: string) {
    const cacheKey = this.getMyOrdersKey(shopId, customerId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.orderRepository.getMyOrders(customerId, shopId);
    return this.cache.set(cacheKey, data, this.cacheTtlMs);
  }

  async getMyOrdersByEmail(email: string, shopId: string) {
    const cacheKey = `orders:email:${shopId}:${email}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rawOrders = await this.orderRepository.getMyOrdersByEmail(email, shopId);
    const orders = rawOrders.sort((a: any, b: any) => {
      const aTime = a.createdAt?._seconds ?? a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?._seconds ?? b.createdAt?.seconds ?? 0;
      return bTime - aTime;
    });

    return this.cache.set(cacheKey, orders, this.cacheTtlMs);
  }

  async trackOrder(id: string) {
    return this.orderRepository.getOrder(id);
  }

  async verifyPayment(orderId: string, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string) {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const shop = await this.orderRepository.getShop(order.shopId);
    if (!shop || !shop.razorpay || !shop.razorpay.keySecret) {
      throw new Error("Razorpay config not found for this shop");
    }

    const keySecret = shop.razorpay.keySecret;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      throw new Error("Invalid payment signature");
    }

    await this.orderRepository.updateOrder(orderId, {
      paymentStatus: "paid",
      paymentDetails: {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        paidAt: new Date(),
      },
    });

    this.invalidateOrderCache(order.shopId, orderId, order.customerId);
    return { success: true };
  }
}

export const orderService = new OrderService();
