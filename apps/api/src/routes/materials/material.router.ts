import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import * as ctrl from "./material.controller";

const router = Router();
router.get("/", requireAuth, ctrl.list);
router.post("/", requireAuth, ctrl.create);

export default router;
