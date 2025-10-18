import { Router } from "express";
import { ProjectsController } from "./projects.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireAccess } from "../../middlewares/requireAccess";

const router = Router();

router.get("/", requireAuth, requireAccess(), ProjectsController.list);

router.get(
  "/:id",
  requireAuth,
  requireAccess(),
  ProjectsController.getByIdOrCode
);

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  ProjectsController.create
);
router.patch(
  "/:id",
  requireAuth,
  requireAccess({ roles: ["OWNER", "ADMIN", "PROJECT_MANAGER"] }),
  ProjectsController.update
);
router.delete(
  "/:id",
  requireAuth,
  requireAccess({ roles: ["OWNER", "ADMIN"] }),
  ProjectsController.remove
);

router.get(
  "/:id/secure-probe",
  requireAuth,
  requireAccess({ roles: ["OWNER", "ADMIN", "PROJECT_MANAGER"] }),
  (_req, res) => res.status(200).json({ ok: true })
);

export default router;
