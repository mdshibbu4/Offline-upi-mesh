import { Router } from "express";
import { sendMoney, getTransactions } from "../controllers/paymentController.js";
import requireAuth from "../middleware/auth.js";

const router = Router();
router.post("/send", requireAuth, sendMoney);
router.get("/transactions", requireAuth, getTransactions);
export default router;
