import { Router } from "express";
import health from "./health";
import usersRouter from "./users/users.router";
import authRouter from "../auth/auth.router";
import projectRouter from "../routes/projects/projects.router";
import stagesRouter from "./projects/stages/stages.router";

const router = Router();

router.use("/health", health);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.use("/projects", projectRouter);
router.use("/projects/:projectId/stages", stagesRouter); //Nested stages under a project (mergeParams in router preserves :projectId)

export default router;
