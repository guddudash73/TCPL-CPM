import { Router } from "express";
import { ProjectsController } from "./projects.controller";

const router = Router();

router.get("/", ProjectsController.list);
router.get("/:id", ProjectsController.get);

export default router;
