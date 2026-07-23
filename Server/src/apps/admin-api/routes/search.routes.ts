import { Router } from "express";
import { masterSearch } from "../../../modules/search/search.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/:shopId", checkPermission("search.view"), masterSearch);

export default router;
