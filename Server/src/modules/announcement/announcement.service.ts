import { Announcement } from "./announcement.model";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";
import { IAnnouncementRepository } from "../../application/repositories/interfaces/announcement-repository.interface";

export class AnnouncementService {
  private announcementRepository: IAnnouncementRepository;

  constructor() {
    this.announcementRepository = RepositoryFactory.getAnnouncementRepository();
  }

  async getAnnouncements(filters?: any): Promise<Announcement[]> {
    return this.announcementRepository.getAnnouncements(filters);
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    return this.announcementRepository.getAnnouncementById(id);
  }

  async createAnnouncement(data: Partial<Announcement>, userId: string): Promise<string> {
    const announcement: Announcement = {
      title: data.title || "",
      message: data.message || "",
      type: data.type || "information",
      target: data.target || { type: "platform" },
      deliveryMethods: data.deliveryMethods || ["in-app"],
      status: data.status || "draft",
      timezone: data.timezone || "UTC",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        targetCount: 0,
        deliveryStatus: { inApp: false, email: false, push: false },
        openRate: 0,
      }
    };
    
    if (announcement.status === "scheduled") {
      announcement.scheduledAt = data.scheduledAt;
    } else if (announcement.status === "published") {
      announcement.publishedAt = new Date().toISOString();
    }
    
    if (data.expiresAt) {
      announcement.expiresAt = data.expiresAt;
    }

    return this.announcementRepository.createAnnouncement(announcement);
  }

  async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
    if (data.status === "published" && !data.publishedAt) {
      data.publishedAt = new Date().toISOString();
    }
    await this.announcementRepository.updateAnnouncement(id, data);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await this.announcementRepository.deleteAnnouncement(id);
  }
}
