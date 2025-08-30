import { Router } from "express";
import health from "../routes/health";

const router = Router();
router.use("/", health);

export default router;
