import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { clearCart, getCart, saveCart } from "../controllers/cart.controller.js";

const router = Router();

router.get("/cart", authMiddleware, getCart);
router.put("/cart", authMiddleware, saveCart);
router.delete("/cart", authMiddleware, clearCart);

export default router;
