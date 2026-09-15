import { Router } from "express";
import {
  checkout,
  getUserOrders,
  getArtisanSalesStats,
  getArtisanOrders,
  updateArtisanOrderStatus,
} from "../controllers/orders.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/checkout", authMiddleware, checkout);
router.get("/orders", authMiddleware, getUserOrders);
router.get("/orders/artesano/estadisticas", authMiddleware, requireRole(["artesano"]), getArtisanSalesStats);
router.get("/orders/artesano/pedidos", authMiddleware, requireRole(["artesano"]), getArtisanOrders);
router.patch("/orders/artesano/pedidos/:id/estado", authMiddleware, requireRole(["artesano"]), updateArtisanOrderStatus);

export default router;
