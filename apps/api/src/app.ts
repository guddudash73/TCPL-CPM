import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middlewares/error";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    morgan("dev", {
      skip: (req) =>
        req.path === "/livez" ||
        req.path === "/readyz" ||
        req.path === "/healthz",
    })
  );

  app.use("/", routes);

  app.use((_req, res) =>
    res.status(404).json({ ok: false, message: "Not Found" })
  );

  app.use(errorHandler);

  return app;
}
