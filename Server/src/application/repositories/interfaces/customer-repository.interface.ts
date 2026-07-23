import { Customer } from "../../../modules/customer/customer.model";

export interface ICustomerRepository {
  generateId(): string;
  findCustomer(shopId: string, query: { phone?: string; email?: string; userId?: string }): Promise<Customer | null>;
  findCustomerByPhone(shopId: string, phone: string): Promise<Customer | null>;
  createCustomer(customer: Customer): Promise<Customer>;
  getCustomersByShop(shopId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  updateCustomer(id: string, payload: any): Promise<void>;
  deleteCustomer(id: string): Promise<void>;
}
