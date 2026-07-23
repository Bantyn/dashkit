import { Router } from "express";
import { getLeads, updateLead, deleteLead } from "../../../modules/lead/lead.controller";

const router = Router();

router.get("/", getLeads);
router.patch("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;
