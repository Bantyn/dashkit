import { Customer } from "../../../modules/customer/customer.model";
import { ICustomerRepository } from "../interfaces/customer-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class SqlServerCustomerRepository implements ICustomerRepository {
  generateId(): string {
    throw new NotImplementedError("SqlServerCustomerRepository.generateId is not implemented.");
  }
  async findCustomer(_shopId: string, _query: { phone?: string; email?: string; userId?: string }): Promise<Customer | null> {
    throw new NotImplementedError("SqlServerCustomerRepository.findCustomer is not implemented.");
  }
  async findCustomerByPhone(_shopId: string, _phone: string): Promise<Customer | null> {
    throw new NotImplementedError("SqlServerCustomerRepository.findCustomerByPhone is not implemented.");
  }
  async createCustomer(_customer: Customer): Promise<Customer> {
    throw new NotImplementedError("SqlServerCustomerRepository.createCustomer is not implemented.");
  }
  async getCustomersByShop(_shopId: string): Promise<Customer[]> {
    throw new NotImplementedError("SqlServerCustomerRepository.getCustomersByShop is not implemented.");
  }
  async getCustomer(_id: string): Promise<Customer | null> {
    throw new NotImplementedError("SqlServerCustomerRepository.getCustomer is not implemented.");
  }
  async updateCustomer(_id: string, _payload: any): Promise<void> {
    throw new NotImplementedError("SqlServerCustomerRepository.updateCustomer is not implemented.");
  }
  async deleteCustomer(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerCustomerRepository.deleteCustomer is not implemented.");
  }
}
