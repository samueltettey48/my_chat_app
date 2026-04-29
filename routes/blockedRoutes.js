import { Router } from "express";
import { blockUser } from "../controllers/blockController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(isAuthenticated);

router.post("/", blockUser);

export default router;