import { Router } from "express";
import {
  listJobCards,
  getJobCard,
  createJobCard,
  updateJobCard,
  deleteJobCard,
} from "./tailor-job-card.controller";
import { checkPermission } from "../../middlewares/role.middleware";

const router = Router();

router.get("/", checkPermission("tailor_job_cards"), listJobCards);
router.post("/", checkPermission("tailor_job_cards"), createJobCard);
router.get("/:id", checkPermission("tailor_job_cards"), getJobCard);
router.put("/:id", checkPermission("tailor_job_cards"), updateJobCard);
router.delete("/:id", checkPermission("tailor_job_cards"), deleteJobCard);

export default router;
