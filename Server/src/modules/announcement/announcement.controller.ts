import { Request, Response } from "express";
import { AnnouncementService } from "./announcement.service";

const announcementService = new AnnouncementService();

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const announcements = await announcementService.getAnnouncements(filters);
    res.json({ data: announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const announcement = await announcementService.getAnnouncementById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.json({ data: announcement });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid || "system"; // Assumes auth middleware
    const id = await announcementService.createAnnouncement(req.body, userId);
    res.status(201).json({ id, message: "Announcement created successfully" });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await announcementService.updateAnnouncement(id, req.body);
    res.json({ message: "Announcement updated successfully" });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await announcementService.deleteAnnouncement(id);
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
