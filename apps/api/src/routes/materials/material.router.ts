import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import * as ctrl from "./material.controller";
import { requireAccess } from "../../middlewares/requireAccess";

const router = Router();

router.get("/", requireAuth, ctrl.list);

const orgWrite = requireAccess({
  roles: ["OWNER", "ADMIN", "PROJECT_MANAGER"],
});

router.post("/", requireAuth, orgWrite, ctrl.create);

export default router;
