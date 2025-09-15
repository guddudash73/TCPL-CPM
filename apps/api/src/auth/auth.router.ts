import { Router } from "express";
import { loginController, refreshController } from "./auth.controller";
import { loginLimiter } from "../middlewares/rateLimit";
import { audit } from "../middlewares/audit";

const router = Router();

router.post(
  "/login",
  loginLimiter,
  audit(
    (req) => `auth.login email=${String(req.body?.email ?? "").toLowerCase()}`
  ),
  loginController
);

router.post(
  "/refresh",
  audit(() => "auth.refresh"),
  refreshController
);

export default router;
