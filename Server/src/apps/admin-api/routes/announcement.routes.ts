import { Router } from "express";
import { 
  getAnnouncements, 
  getAnnouncementById, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from "../../../modules/announcement/announcement.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/", checkPermission("announcements.read"), getAnnouncements);
router.get("/:id", checkPermission("announcements.read"), getAnnouncementById);
router.post("/", checkPermission("announcements.create"), createAnnouncement);
router.put("/:id", checkPermission("announcements.update"), updateAnnouncement);
router.delete("/:id", checkPermission("announcements.delete"), deleteAnnouncement);

export default router;
