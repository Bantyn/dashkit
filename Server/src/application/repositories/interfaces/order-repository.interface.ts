import { Order } from "../../../modules/order/order.model";

export interface IOrderRepository {
  generateId(): string;
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(order: Order): Promise<void>;
  updateOrder(id: string, payload: any): Promise<void>;
  deleteOrder(id: string): Promise<void>;
  getOrdersByShop(shopId: string, branchId?: string): Promise<Order[]>;
  getMyOrders(customerId: string, shopId: string): Promise<Order[]>;
  getMyOrdersByEmail(email: string, shopId: string): Promise<Order[]>;
  getShop(shopId: string): Promise<any | null>;
  commitOrderStockUpdates(shopId: string, orderId: string, items: any[]): Promise<void>;
}
