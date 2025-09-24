import { Router } from "express";
import { requireAuth } from "../../../middlewares/requireAuth";
import { requireRole } from "../../../middlewares/requireRole";
import { StagesController } from "./stages.controller";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, StagesController.list);
router.get("/:stageId", requireAuth, StagesController.get);

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  StagesController.create
);
router.patch(
  "/:stageId",
  requireAuth,
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  StagesController.update
);
router.delete(
  "/:stageId",
  requireAuth,
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  StagesController.remove
);

export default router;
