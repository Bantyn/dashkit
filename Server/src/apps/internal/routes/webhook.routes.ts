import { Router } from "express";
import { shiprocketWebhook } from "../../../modules/integrations/shiprocket.controller";

const router = Router();

router.post("/shiprocket", shiprocketWebhook);

export default router;
