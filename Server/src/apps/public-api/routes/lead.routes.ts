import { Router } from "express";
import { createLead } from "../../../modules/lead/lead.controller";

const router = Router();

router.post("/", createLead);

export default router;
