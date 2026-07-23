import { Router } from "express";
import { getJobs, getJob, createJob, updateJob, deleteJob } from "../../../modules/tailoring/tailoring.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router({ mergeParams: true });

router.get("/", checkPermission("tailoring.view"), checkFeature(FEATURE_KEYS.TAILOR_JOB_CARDS), getJobs);
router.post("/", checkPermission("tailoring.create"), checkFeature(FEATURE_KEYS.TAILOR_JOB_CARDS), createJob);

router.get("/:id", checkPermission("tailoring.view"), checkFeature(FEATURE_KEYS.TAILOR_JOB_CARDS), getJob);
router.put("/:id", checkPermission("tailoring.edit"), checkFeature(FEATURE_KEYS.TAILOR_JOB_CARDS), updateJob);
router.delete("/:id", checkPermission("tailoring.delete"), checkFeature(FEATURE_KEYS.TAILOR_JOB_CARDS), deleteJob);

export default router;
