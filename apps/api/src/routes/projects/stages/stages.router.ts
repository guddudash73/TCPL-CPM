import { Router } from "express";
import { requireAuth } from "../../../middlewares/requireAuth";
// import { requireRole } from "../../../middlewares/requireRole";
import { StagesController } from "./stages.controller";
import { requireAccess } from "../../../middlewares/requireAccess";

const router = Router({ mergeParams: true });

router.get(
  "/",
  requireAuth,
  requireAccess({ allowViewer: true }),
  StagesController.list
);
router.get(
  "/:stageId",
  requireAuth,
  requireAccess({ allowViewer: true }),
  StagesController.get
);

const writeGuard = requireAccess({
  roles: ["OWNER", "ADMIN", "PROJECT_MANAGER"],
});

router.post(
  "/",
  requireAuth,
  writeGuard,
  // requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  StagesController.create
);
router.patch(
  "/:stageId",
  requireAuth,
  writeGuard,
  // requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  StagesController.update
);
router.delete(
  "/:stageId",
  requireAuth,
  writeGuard,
  // requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  StagesController.remove
);

export default router;
