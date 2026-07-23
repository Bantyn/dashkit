import { Announcement } from "../../../modules/announcement/announcement.model";
import { IAnnouncementRepository } from "../interfaces/announcement-repository.interface";

export class SqlServerAnnouncementRepository implements IAnnouncementRepository {
  async getAnnouncements(filters?: any): Promise<Announcement[]> {
    throw new Error("Method not implemented.");
  }
  async getAnnouncementById(id: string): Promise<Announcement | null> {
    throw new Error("Method not implemented.");
  }
  async createAnnouncement(announcement: Announcement): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async updateAnnouncement(id: string, announcement: Partial<Announcement>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async deleteAnnouncement(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
