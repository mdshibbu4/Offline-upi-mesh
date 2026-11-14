import { Router } from "express";
import { sync } from "../controllers/bridgeController.js";
import requireAuth from "../middleware/auth.js";

const router = Router();
// Any logged-in phone with internet can act as a bridge. Trust comes from the
// sender's signature on each packet, not from who relays it.
router.post("/sync", requireAuth, sync);
export default router;
