import { Order } from "../../../modules/order/order.model";
import { IOrderRepository } from "../interfaces/order-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class MongoOrderRepository implements IOrderRepository {
  generateId(): string {
    throw new NotImplementedError("MongoOrderRepository.generateId is not implemented.");
  }
  async getOrders(): Promise<Order[]> {
    throw new NotImplementedError("MongoOrderRepository.getOrders is not implemented.");
  }
  async getOrder(_id: string): Promise<Order | null> {
    throw new NotImplementedError("MongoOrderRepository.getOrder is not implemented.");
  }
  async createOrder(_order: Order): Promise<void> {
    throw new NotImplementedError("MongoOrderRepository.createOrder is not implemented.");
  }
  async updateOrder(_id: string, _payload: any): Promise<void> {
    throw new NotImplementedError("MongoOrderRepository.updateOrder is not implemented.");
  }
  async deleteOrder(_id: string): Promise<void> {
    throw new NotImplementedError("MongoOrderRepository.deleteOrder is not implemented.");
  }
  async getOrdersByShop(_shopId: string): Promise<Order[]> {
    throw new NotImplementedError("MongoOrderRepository.getOrdersByShop is not implemented.");
  }
  async getMyOrders(_customerId: string, _shopId: string): Promise<Order[]> {
    throw new NotImplementedError("MongoOrderRepository.getMyOrders is not implemented.");
  }
  async getMyOrdersByEmail(_email: string, _shopId: string): Promise<Order[]> {
    throw new NotImplementedError("MongoOrderRepository.getMyOrdersByEmail is not implemented.");
  }
  async getShop(_shopId: string): Promise<any | null> {
    throw new NotImplementedError("MongoOrderRepository.getShop is not implemented.");
  }
  async commitOrderStockUpdates(_shopId: string, _orderId: string, _items: any[]): Promise<void> {
    throw new NotImplementedError("MongoOrderRepository.commitOrderStockUpdates is not implemented.");
  }
}
