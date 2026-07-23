import { Announcement } from '../../../modules/announcement/announcement.model';

export interface IAnnouncementRepository {
  getAnnouncements(filters?: any): Promise<Announcement[]>;
  getAnnouncementById(id: string): Promise<Announcement | null>;
  createAnnouncement(announcement: Announcement): Promise<string>;
  updateAnnouncement(id: string, announcement: Partial<Announcement>): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;
}
