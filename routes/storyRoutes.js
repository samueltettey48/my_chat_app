import { Router } from "express";
import { createStory } from "../controllers/storyController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(isAuthenticated);

router.post("/", createStory);

export default router;