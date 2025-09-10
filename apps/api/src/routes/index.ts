import { Router } from "express";
import health from "../routes/health";
import usersRouter from "./users/users.router";
import authRouter from "../auth/auth.router";

const router = Router();
router.use("/", health);
router.use("/users", usersRouter);
router.use("/auth", authRouter);

export default router;
