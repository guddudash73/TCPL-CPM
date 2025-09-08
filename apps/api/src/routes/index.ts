import { Router } from "express";
import health from "../routes/health";
import usersRouter from "./users/users.router";
const router = Router();
router.use("/", health);
router.use("/users", usersRouter);

export default router;
