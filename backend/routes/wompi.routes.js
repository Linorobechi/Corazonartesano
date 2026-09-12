import { Router } from "express";
import {
  initiateWompiTransaction,
  verifyWompiTransaction,
  wompiWebhookHandler,
} from "../controllers/wompi.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas protegidas para clientes
router.post("/wompi/initiate", authMiddleware, initiateWompiTransaction);
router.get("/wompi/verify/:id", authMiddleware, verifyWompiTransaction);

// Webhook público para recibir notificaciones asíncronas de Wompi
router.post("/wompi/events", wompiWebhookHandler);

export default router;
