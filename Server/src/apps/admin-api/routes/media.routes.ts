import { Router } from "express";
import multer from "multer";
import { uploadMedia, deleteMedia } from "../../../modules/media/media.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = Router({ mergeParams: true });

router.post("/upload", upload.single("file"), uploadMedia);
router.post("/delete", deleteMedia);

export default router;
