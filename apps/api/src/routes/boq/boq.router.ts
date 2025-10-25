import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireAccess } from "../../middlewares/requireAccess";
import * as ctrl from "./boq.controller";
import { validate } from "../../middlewares/validate";
import { BoqBatchQuerySchema } from "./boq.schema";

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

router.post(
  "/projects/:projectId/boq/batch",
  requireAuth,
  writeGuard,
  validate({ query: BoqBatchQuerySchema }),
  ctrl.batch
);

export default router;
