import { Router } from "express";
import {
  getProfile,
  updateProfile,
} from "../../../modules/auth/auth.controller";

const router = Router();

router.get("/profile", getProfile);
router.put("/update-profile", updateProfile);

export default router;
