import { Router } from "express";
import { checkout, getUserOrders } from "../controllers/orders.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/checkout", authMiddleware, checkout);
router.get("/orders", authMiddleware, getUserOrders);

export default router;
