import { Router } from "express";
import { getDevices, setInternet } from "../controllers/meshController.js";
import requireAuth from "../middleware/auth.js";

const router = Router();
router.get("/devices", requireAuth, getDevices);
router.patch("/devices/:key", requireAuth, setInternet);
export default router;
