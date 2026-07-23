import { db } from "../../../config/firebase.config";
import { Announcement } from "../../../modules/announcement/announcement.model";
import { IAnnouncementRepository } from "../interfaces/announcement-repository.interface";

const COLLECTION = "announcements";

export class FirestoreAnnouncementRepository implements IAnnouncementRepository {
  async getAnnouncements(filters?: any): Promise<Announcement[]> {
    let baseQuery: any = db.collection(COLLECTION);
    
    if (filters?.status) {
      baseQuery = baseQuery.where("status", "==", filters.status);
    }
    
    // Additional filters can be added here
    
    const snapshot = await baseQuery.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Announcement));
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const docSnap = await db.collection(COLLECTION).doc(id).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Announcement;
  }

  async createAnnouncement(announcement: Announcement): Promise<string> {
    const ref = db.collection(COLLECTION).doc(announcement.id || undefined);
    announcement.id = ref.id;
    await ref.set(announcement);
    return ref.id;
  }

  async updateAnnouncement(id: string, payload: Partial<Announcement>): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      ...payload,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  }
}
