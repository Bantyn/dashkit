import { Router } from "express";
import { getAnnouncements } from "../../../modules/announcement/announcement.controller";

const router = Router();

router.get("/", (req, res, next) => {
  req.query.status = 'published'; // Public API only sees published announcements
  getAnnouncements(req, res);
});

export default router;
