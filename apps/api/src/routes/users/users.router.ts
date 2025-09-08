import { Router } from "express";
import { createUserController } from "./users.controller";

const router = Router();

// W2D4: router.post("/", requireAuth, requireRole("ADMIN"), createUserController);

router.post("/", createUserController);

export default router;
