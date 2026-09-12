import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

process.env.DOTENV_CONFIG_QUIET = "true";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ quiet: true });

export const MERCADOPAGO_PUBLIC_KEY =
  process.env.MERCADOPAGO_PUBLIC_KEY || "TEST-0d7b8cc8-39e1-4039-bbb0-0fe431aa861c";

export const MERCADOPAGO_ACCESS_TOKEN =
  process.env.MERCADOPAGO_ACCESS_TOKEN || "TEST-1854463994404337-091211-0d4fba83e2420079cfa409d20c885635-690425755";

const MP_API_BASE = "https://api.mercadopago.com";

/**
 * Crear una preferencia de pago en Mercado Pago (Checkout Pro / Colombia MCO - COP)
 */
export const createMercadoPagoPreference = async ({
  items,
  payer,
  externalReference,
  backUrls,
  notificationUrl,
}) => {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado en el servidor");
  }

  const preferencePayload = {
    items: items.map((item) => ({
      id: String(item.id || item.product_id || Math.floor(Math.random() * 10000)),
      title: item.nombre || item.title || "Artesanía Sincelejo - Corazón Artesano",
      description: item.descripcion || "Artesanía típica elaborada a mano por artesanos de Sucre",
      quantity: Number(item.cantidad || item.quantity || 1),
      unit_price: Number(item.precio || item.price || item.unit_price),
      currency_id: "COP",
      picture_url: item.imagen_url || item.imagen || "https://nuhsooerkqwuwcucwxcf.supabase.co/storage/v1/object/public/productos/logo.jpeg",
    })),
    payer: payer
      ? {
          name: payer.name || payer.nombre || "Comprador Corazón Artesano",
          email: payer.email,
        }
      : undefined,
    back_urls: backUrls,
    external_reference: String(externalReference),
    statement_descriptor: "CORAZON ARTESANO",
    payment_methods: {
      installments: 12, // Permitir hasta 12 cuotas
    },
  };

  // auto_return solo es válido en Mercado Pago si back_urls.success es HTTPS pública (en localhost no se debe enviar)
  if (backUrls?.success && backUrls.success.startsWith("https://")) {
    preferencePayload.auto_return = "approved";
  }

  // Webhook solo si es HTTPS (en localhost Mercado Pago no acepta webhooks directos)
  if (notificationUrl && notificationUrl.startsWith("https://")) {
    preferencePayload.notification_url = notificationUrl;
  }

  const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencePayload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ [MERCADO PAGO ERROR]:", data);
    throw new Error(data.message || "Error al crear la preferencia de pago en Mercado Pago");
  }

  return data;
};

/**
 * Consultar los detalles y estado de un pago directamente en Mercado Pago
 */
export const getMercadoPagoPayment = async (paymentId) => {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
  }

  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ [MERCADO PAGO PAYMENT FETCH ERROR]:", data);
    throw new Error(data.message || "Error al consultar el pago en Mercado Pago");
  }

  return data;
};

export default {
  MERCADOPAGO_PUBLIC_KEY,
  MERCADOPAGO_ACCESS_TOKEN,
  createMercadoPagoPreference,
  getMercadoPagoPayment,
};
