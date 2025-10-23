import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireAccess } from "../../middlewares/requireAccess";
import * as ctrl from "./boq.controller";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

router.get("/projects/:projectId/boq", requireAuth, ctrl.list);

const writeGuard = requireAccess({
  roles: ["OWNER", "ADMIN", "PROJECT_MANAGER"],
});

router.post("/projects/:projectId/boq", requireAuth, writeGuard, ctrl.create);
router.patch(
  "/projects/:projectId/boq/:id",
  requireAuth,
  writeGuard,
  ctrl.update
);
router.delete(
  "/projects/:projectId/boq/:id",
  requireAuth,
  writeGuard,
  ctrl.remove
);

export default router;
