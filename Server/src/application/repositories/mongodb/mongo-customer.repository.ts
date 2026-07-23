import { Customer } from "../../../modules/customer/customer.model";
import { ICustomerRepository } from "../interfaces/customer-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class MongoCustomerRepository implements ICustomerRepository {
  generateId(): string {
    throw new NotImplementedError("MongoCustomerRepository.generateId is not implemented.");
  }
  async findCustomer(_shopId: string, _query: { phone?: string; email?: string; userId?: string }): Promise<Customer | null> {
    throw new NotImplementedError("MongoCustomerRepository.findCustomer is not implemented.");
  }
  async findCustomerByPhone(_shopId: string, _phone: string): Promise<Customer | null> {
    throw new NotImplementedError("MongoCustomerRepository.findCustomerByPhone is not implemented.");
  }
  async createCustomer(_customer: Customer): Promise<Customer> {
    throw new NotImplementedError("MongoCustomerRepository.createCustomer is not implemented.");
  }
  async getCustomersByShop(_shopId: string): Promise<Customer[]> {
    throw new NotImplementedError("MongoCustomerRepository.getCustomersByShop is not implemented.");
  }
  async getCustomer(_id: string): Promise<Customer | null> {
    throw new NotImplementedError("MongoCustomerRepository.getCustomer is not implemented.");
  }
  async updateCustomer(_id: string, _payload: any): Promise<void> {
    throw new NotImplementedError("MongoCustomerRepository.updateCustomer is not implemented.");
  }
  async deleteCustomer(_id: string): Promise<void> {
    throw new NotImplementedError("MongoCustomerRepository.deleteCustomer is not implemented.");
  }
}
