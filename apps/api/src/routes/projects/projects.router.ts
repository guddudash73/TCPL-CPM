import { Router } from "express";
import { ProjectsController } from "./projects.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

router.get("/", ProjectsController.list);
router.get("/:id", ProjectsController.getByIdOrCode);

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  ProjectsController.create
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  ProjectsController.update
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER", "ADMIN", "PROJECT_MANAGER"),
  ProjectsController.remove
);

export default router;
