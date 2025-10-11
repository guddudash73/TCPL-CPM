import { Router } from "express";
import { CompositeQueriesController } from "./queries.controller";
import { requireAuth } from "../../../middlewares/requireAuth";
import { requireRole } from "../../../middlewares/requireRole";
import { requireAccess } from "../../../middlewares/requireAccess";

const router = Router();

router.get(
  "/:projectId/with-stages",
  requireAuth,
  requireRole("ADMIN", "PROJECT_MANAGER", "VIEWER"),
  requireAccess,
  CompositeQueriesController.getProjectWithStage
);

router.get(
  "/portfolio",
  requireAuth,
  requireRole("ADMIN", "PROJECT_MANAGER", "VIEWER"),
  CompositeQueriesController.getPortfolio
);

router.get("/search", requireAuth, CompositeQueriesController.search);

export default router;
