import { Router } from "express";
import { verifyGSTController } from "../../../modules/tax/gst.controller";

const router = Router();

router.post("/verify-gstin", verifyGSTController);

export default router;
