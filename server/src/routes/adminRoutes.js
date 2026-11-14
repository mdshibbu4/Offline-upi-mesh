import { Router } from "express";
import { stats } from "../controllers/adminController.js";
import requireAuth, { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.get("/stats", requireAuth, requireAdmin, stats);
export default router;
