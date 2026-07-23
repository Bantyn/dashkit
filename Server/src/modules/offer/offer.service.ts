import { db } from "../../config/firebase.config";
import { Offer } from "./offer.model";

const COLLECTION = "offers";

const convertDoc = (doc: any) => {
  const data = doc.data();
  const convertDate = (date: any) => {
    if (!date) return null;
    if (date.toDate) return date.toDate();
    return new Date(date);
  };

  return {
    id: doc.id,
    ...data,
    startDate: convertDate(data.startDate),
    endDate: convertDate(data.endDate),
    createdAt: convertDate(data.createdAt),
    updatedAt: convertDate(data.updatedAt),
  };
};

export class OfferService {
  async createOffer(payload: any) {
    const { shopId, code } = payload;

    if (code) {
      const snapshot = await db
        .collection(COLLECTION)
        .where("shopId", "==", shopId)
        .where("code", "==", code)
        .where("isActive", "==", true)
        .get();

      if (!snapshot.empty) {
        return { conflict: true as const };
      }
    }

    const newOffer: Offer = {
      ...payload,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(payload.startDate),
      endDate: (() => {
        const d = new Date(payload.endDate);
        d.setHours(23, 59, 59, 999);
        return d;
      })(),
    };

    const docRef = await db.collection(COLLECTION).add(newOffer);
    return {
      conflict: false as const,
      offer: { id: docRef.id, ...newOffer },
    };
  }

  async getOffers(shopId: string, type?: string, status?: string) {
    let query = db.collection(COLLECTION).where("shopId", "==", shopId);

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();
    let offers = snapshot.docs.map(convertDoc) as Offer[];

    if (status) {
      const now = new Date();
      if (status === "active") {
        offers = offers.filter(
          (offer) =>
            offer.isActive &&
            new Date(offer.startDate) <= now &&
            new Date(offer.endDate) >= now,
        );
      } else if (status === "expired") {
        offers = offers.filter((offer) => new Date(offer.endDate) < now);
      } else if (status === "scheduled") {
        offers = offers.filter((offer) => new Date(offer.startDate) > now);
      } else if (status === "inactive") {
        offers = offers.filter((offer) => !offer.isActive);
      }
    }

    offers.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return offers;
  }

  async updateOffer(id: string, payload: any) {
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const updates = {
      ...payload,
      updatedAt: new Date(),
    };

    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) {
      const d = new Date(updates.endDate);
      d.setHours(23, 59, 59, 999);
      updates.endDate = d;
    }

    await docRef.update(updates);

    return { id, ...updates };
  }

  async deleteOffer(id: string) {
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  }

  async validateCoupon(code: string, shopId: string, cartAmount: number, customerId?: string) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .where("code", "==", code)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { status: "invalid" as const };
    }

    const offer = convertDoc(snapshot.docs[0]) as Offer;
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (now < start || now > end) {
      return { status: "inactive" as const };
    }

    if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      return { status: "limit_exceeded" as const };
    }

    if (offer.minCalculatedAmount && cartAmount < offer.minCalculatedAmount) {
      return { status: "min_amount" as const, offer };
    }

    // Birthday Offer Validation
    if (offer.isBirthdayOffer) {
      if (!customerId) {
        return { status: "invalid_birthday" as const, reason: "Customer ID required for birthday offer" };
      }
      
      const customerDoc = await db.collection("customers").doc(customerId).get();
      if (!customerDoc.exists) {
        return { status: "invalid_birthday" as const, reason: "Customer not found" };
      }
      
      const customer = customerDoc.data();
      if (!customer || !customer.dateOfBirth) {
        return { status: "invalid_birthday" as const, reason: "Customer birthday not set" };
      }

      // Check if today matches customer's birthday (month and day)
      const today = new Date();
      const dob = new Date(customer.dateOfBirth);
      
      if (today.getMonth() !== dob.getMonth() || today.getDate() !== dob.getDate()) {
        return { status: "invalid_birthday" as const, reason: "It's not the customer's birthday" };
      }
    }

    return { status: "valid" as const, offer };
  }
}

export const offerService = new OfferService();
