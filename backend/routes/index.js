import { Router } from "express";
import { isUsingMemoryDb } from "../config/db.js";
import authRoutes from "./auth.routes.js";
import productsRoutes from "./products.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import ordersRoutes from "./orders.routes.js";
import adminRoutes from "./admin.routes.js";
import moodleRoutes from "./moodle.routes.js";
import mercadopagoRoutes from "./mercadopago.routes.js";
import { getProductReviews, addProductReview } from "../controllers/reviews.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Endpoint de salud del servidor
router.get("/health", (_req, res) => {
  res.json({ ok: true, memoryDb: isUsingMemoryDb });
});

// Compatibilidad de alias para rutas de reseñas con parámetro :id
router.get("/products/:id/reviews", getProductReviews);
router.post("/products/:id/reviews", authMiddleware, addProductReview);

// Montaje de sub-enrutadores modulares
router.use(authRoutes);
router.use(productsRoutes);
router.use(reviewsRoutes);
router.use(ordersRoutes);
router.use(mercadopagoRoutes);
router.use("/admin", authMiddleware, requireRole(["admin"]), adminRoutes);
router.use(moodleRoutes);

export default router;
