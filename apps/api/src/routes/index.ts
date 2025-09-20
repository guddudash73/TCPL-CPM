import { Router } from "express";
import health from "./health";
import usersRouter from "./users/users.router";
import authRouter from "../auth/auth.router";
import projectRouter from "../routes/projects/projects.router";

const router = Router();

router.use("/health", health);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.use("/projects", projectRouter);

export default router;
