import { Router } from "express";
import { lookupUser } from "../controllers/walletController.js";
import { setPublicKey } from "../controllers/userController.js";
import requireAuth from "../middleware/auth.js";

const router = Router();
router.get("/lookup/:upiId", requireAuth, lookupUser);
router.post("/public-key", requireAuth, setPublicKey);
export default router;
