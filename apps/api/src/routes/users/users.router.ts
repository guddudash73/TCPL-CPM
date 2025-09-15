import { Router } from "express";
import { createUserController } from "./users.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN"), createUserController);

export default router;
