import { Router } from "express";
import {
  createPreference,
  handleWebhook,
  getPaymentStatus,
} from "../controllers/mercadopago.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Crear preferencia de Checkout Pro
router.post("/mercadopago/create-preference", optionalAuthMiddleware, createPreference);

// Webhook IPN de notificaciones de Mercado Pago (público)
router.post("/mercadopago/webhook", handleWebhook);
router.get("/mercadopago/webhook", handleWebhook);

// Consultar estado de un pago
router.get("/mercadopago/status/:paymentId", authMiddleware, getPaymentStatus);

export default router;
