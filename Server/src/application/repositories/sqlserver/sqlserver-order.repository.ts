import { Order } from "../../../modules/order/order.model";
import { IOrderRepository } from "../interfaces/order-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class SqlServerOrderRepository implements IOrderRepository {
  generateId(): string {
    throw new NotImplementedError("SqlServerOrderRepository.generateId is not implemented.");
  }
  async getOrders(): Promise<Order[]> {
    throw new NotImplementedError("SqlServerOrderRepository.getOrders is not implemented.");
  }
  async getOrder(_id: string): Promise<Order | null> {
    throw new NotImplementedError("SqlServerOrderRepository.getOrder is not implemented.");
  }
  async createOrder(_order: Order): Promise<void> {
    throw new NotImplementedError("SqlServerOrderRepository.createOrder is not implemented.");
  }
  async updateOrder(_id: string, _payload: any): Promise<void> {
    throw new NotImplementedError("SqlServerOrderRepository.updateOrder is not implemented.");
  }
  async deleteOrder(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerOrderRepository.deleteOrder is not implemented.");
  }
  async getOrdersByShop(_shopId: string): Promise<Order[]> {
    throw new NotImplementedError("SqlServerOrderRepository.getOrdersByShop is not implemented.");
  }
  async getMyOrders(_customerId: string, _shopId: string): Promise<Order[]> {
    throw new NotImplementedError("SqlServerOrderRepository.getMyOrders is not implemented.");
  }
  async getMyOrdersByEmail(_email: string, _shopId: string): Promise<Order[]> {
    throw new NotImplementedError("SqlServerOrderRepository.getMyOrdersByEmail is not implemented.");
  }
  async getShop(_shopId: string): Promise<any | null> {
    throw new NotImplementedError("SqlServerOrderRepository.getShop is not implemented.");
  }
  async commitOrderStockUpdates(_shopId: string, _orderId: string, _items: any[]): Promise<void> {
    throw new NotImplementedError("SqlServerOrderRepository.commitOrderStockUpdates is not implemented.");
  }
}
