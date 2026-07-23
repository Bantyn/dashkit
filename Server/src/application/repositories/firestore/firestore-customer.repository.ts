import { db } from "../../../config/firebase.config";
import { Customer } from "../../../modules/customer/customer.model";
import { ICustomerRepository } from "../interfaces/customer-repository.interface";

const COLLECTION = "customers";

export class FirestoreCustomerRepository implements ICustomerRepository {
  generateId(): string {
    return db.collection(COLLECTION).doc().id;
  }

  async findCustomer(shopId: string, query: { phone?: string; email?: string; userId?: string }): Promise<Customer | null> {
    let baseQuery = db.collection(COLLECTION).where("shopId", "==", shopId);

    if (query.userId) {
      const snapshot = await baseQuery.where("userId", "==", query.userId).get();
      if (!snapshot.empty) return snapshot.docs[0].data() as Customer;
    }
    if (query.email) {
      const snapshot = await baseQuery.where("email", "==", query.email).get();
      if (!snapshot.empty) return snapshot.docs[0].data() as Customer;
    }
    if (query.phone) {
      const snapshot = await baseQuery.where("phoneNumber", "==", query.phone).get();
      if (!snapshot.empty) return snapshot.docs[0].data() as Customer;
    }

    return null;
  }

  async findCustomerByPhone(shopId: string, phone: string): Promise<Customer | null> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .where("phoneNumber", "==", phone)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Customer;
  }

  async createCustomer(customer: Customer): Promise<Customer> {
    const ref = db.collection(COLLECTION).doc(customer.id || undefined);
    customer.id = ref.id;
    await ref.set(customer);
    return customer;
  }

  async getCustomersByShop(shopId: string): Promise<Customer[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .get();

    return snapshot.docs.map((doc: any) => doc.data() as Customer);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const docSnap = await db.collection(COLLECTION).doc(id).get();
    if (!docSnap.exists) return null;
    return docSnap.data() as Customer;
  }

  async updateCustomer(id: string, payload: any): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      ...payload,
      updatedAt: new Date(),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  }
}
