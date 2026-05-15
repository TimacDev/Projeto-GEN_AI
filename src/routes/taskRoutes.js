import { Router } from "express";
import {
  createTask,
  listTasks,
  getLastTask,
  getTask,
  removeTask,
  refine,
  summarize,
  suggest,
  patchTask,
} from "../controllers/taskController.js";
import { validateTaskInput } from "../middleware/validateTaskInput.js";

const router = Router();

router.get("/", listTasks);
router.get("/last", getLastTask);
router.post("/create", validateTaskInput, createTask);
router.put("/refine/:id", refine);
router.patch("/:id", patchTask);
router.post("/:id/summarize", summarize);
router.post("/:id/suggest-tags", suggest);
router.get("/:id", getTask);
router.delete("/:id", removeTask);

export default router;
