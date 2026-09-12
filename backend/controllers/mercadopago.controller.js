import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";
import {
  createMercadoPagoPreference,
  getMercadoPagoPayment,
  MERCADOPAGO_PUBLIC_KEY,
} from "../config/mercadopago.js";

/**
 * Crear una preferencia de pago en Mercado Pago Checkout Pro
 */
export const createPreference = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "El carrito de compras está vacío" });
    }

    let subtotal = 0;
    const validatedItems = items.map((item) => {
      const price = Number(item.precio || item.price || item.precioRaw || 50000);
      const qty = Number(item.cantidad || item.quantity || 1);
      subtotal += price * qty;
      return {
        product_id: item.id || item.product_id,
        nombre: item.nombre || item.title || "Producto Artesanal",
        cantidad: qty,
        precio: price,
        imagen_url: item.imagen_url || item.imagen,
      };
    });

    const tax = Math.round(subtotal * 0.19); // 19% IVA Colombia
    const shipping = subtotal > 150000 ? 0 : 12000;
    const total = subtotal + tax + shipping;

    // Determinar URL del frontend para retorno del usuario
    const clientOrigin =
      req.headers.origin ||
      (req.headers.referer ? new URL(req.headers.referer).origin : null) ||
      process.env.FRONTEND_URL ||
      "https://corazonartesano.vercel.app";

    const cleanFrontendOrigin = clientOrigin.replace(/\/$/, "");

    // URL base del backend para recibir webhooks de Mercado Pago
    const backendOrigin =
      process.env.BACKEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      "https://corazonartesano.onrender.com";

    // 1. Crear la orden preliminar en la base de datos (Estado: PENDING)
    let orderId;
    const initialTxId = `MP-PRE-${Date.now()}`;

    if (isUsingMemoryDb) {
      orderId = memoryDb.nextOrderId++;
      const order = {
        id: orderId,
        user_id: req.user ? req.user.id : 1,
        subtotal,
        tax,
        shipping,
        total,
        payment_method: "Mercado Pago",
        status: "PENDING",
        transaction_id: initialTxId,
        created_at: new Date(),
        items: validatedItems,
      };
      memoryDb.orders.unshift(order);
    } else {
      const resOrder = await pool.query(
        `INSERT INTO orders (user_id, subtotal, tax, shipping, total, payment_method, status, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          req.user ? req.user.id : 1,
          subtotal,
          tax,
          shipping,
          total,
          "Mercado Pago",
          "PENDING",
          initialTxId,
        ]
      );
      orderId = resOrder.rows[0].id;

      for (const item of validatedItems) {
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, nombre, cantidad, precio)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.product_id, item.nombre, item.cantidad, item.precio]
        );
      }
    }

    // 2. Preparar ítems para la preferencia de Mercado Pago (incluyendo costo de envío si aplica)
    const mpItems = validatedItems.map((item) => ({
      id: String(item.product_id || orderId),
      title: item.nombre,
      description: `Artesanía Sucreña - Orden #${orderId}`,
      quantity: item.cantidad,
      unit_price: item.precio,
      currency_id: "COP",
      picture_url: item.imagen_url,
    }));

    if (shipping > 0) {
      mpItems.push({
        id: `shipping-${orderId}`,
        title: "Costo de Envío Nacional",
        description: "Envío seguro a domicilio Sincelejo / Colombia",
        quantity: 1,
        unit_price: shipping,
        currency_id: "COP",
      });
    }

    // 3. Crear la preferencia de pago en Mercado Pago
    // Si el usuario es el desarrollador/vendedor o invitado, no enviar payer predeterminado
    // para que Mercado Pago no bloquee el pago por "Payer email forbidden" o autopago
    const isSeller = req.user?.email && (
      req.user.email.toLowerCase().includes("linorobechi") ||
      req.user.email.toLowerCase().includes("edgar")
    );

    const preference = await createMercadoPagoPreference({
      items: mpItems,
      payer: (req.user && !isSeller)
        ? {
            name: req.user.nombre,
            email: req.user.email,
          }
        : undefined,
      externalReference: String(orderId),
      backUrls: {
        success: `${cleanFrontendOrigin}/checkout?status=approved&order_id=${orderId}`,
        failure: `${cleanFrontendOrigin}/checkout?status=failure&order_id=${orderId}`,
        pending: `${cleanFrontendOrigin}/checkout?status=pending&order_id=${orderId}`,
      },
      notificationUrl: `${backendOrigin}/api/mercadopago/webhook`,
    });

    // 4. Actualizar la orden con el ID de la preferencia de Mercado Pago
    if (isUsingMemoryDb) {
      const existing = memoryDb.orders.find((o) => o.id === orderId);
      if (existing) existing.transaction_id = preference.id;
    } else {
      await pool.query("UPDATE orders SET transaction_id = $1 WHERE id = $2", [
        preference.id,
        orderId,
      ]);
    }

    console.log(`[MERCADO PAGO] Preferencia creada para Orden #${orderId}: ${preference.id}`);

    return res.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      orderId,
      publicKey: MERCADOPAGO_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Error al crear preferencia de Mercado Pago:", error);
    return res.status(500).json({
      message: error.message || "Error al procesar la pasarela de Mercado Pago",
    });
  }
};

/**
 * Webhook IPN de Mercado Pago para recibir cambios de estado en pagos
 */
export const handleWebhook = async (req, res) => {
  try {
    const { query, body } = req;
    const topic = query.topic || query.type || body.type;
    const paymentId = query.id || query["data.id"] || body?.data?.id;

    console.log(`[MERCADO PAGO WEBHOOK] Evento recibido: topic=${topic} id=${paymentId}`);

    if ((topic === "payment" || topic === "payment.updated") && paymentId) {
      try {
        const paymentInfo = await getMercadoPagoPayment(paymentId);
        const orderId = paymentInfo.external_reference;
        const mpStatus = paymentInfo.status; // approved, rejected, pending, in_process, etc.

        console.log(
          `[MERCADO PAGO WEBHOOK] Pago ${paymentId} para Orden #${orderId}: Estado=${mpStatus}`
        );

        let finalStatus = "PENDING";
        if (mpStatus === "approved") {
          finalStatus = "APPROVED";
        } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
          finalStatus = "REJECTED";
        }

        if (orderId) {
          if (isUsingMemoryDb) {
            const ord = memoryDb.orders.find((o) => String(o.id) === String(orderId));
            if (ord) {
              ord.status = finalStatus;
              ord.payment_id = paymentId;
            }
          } else {
            await pool.query(
              `UPDATE orders 
               SET status = $1, transaction_id = $2 
               WHERE id = $3`,
              [finalStatus, `MP-PAY-${paymentId}`, Number(orderId)]
            );
          }
        }
      } catch (paymentErr) {
        console.warn(
          `[MERCADO PAGO WEBHOOK] No se pudo verificar el pago ${paymentId}:`,
          paymentErr.message
        );
      }
    }

    // Responder siempre 200 OK a Mercado Pago para confirmar recepción del webhook
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Error en webhook de Mercado Pago:", err);
    return res.status(200).send("OK");
  }
};

/**
 * Consultar el estado de un pago o verificar orden retornada
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) {
      return res.status(400).json({ message: "ID de pago requerido" });
    }

    const paymentInfo = await getMercadoPagoPayment(paymentId);
    const orderId = paymentInfo.external_reference;

    return res.json({
      paymentId,
      status: paymentInfo.status,
      statusDetail: paymentInfo.status_detail,
      orderId,
      amount: paymentInfo.transaction_amount,
      paymentMethodId: paymentInfo.payment_method_id,
      paymentTypeId: paymentInfo.payment_type_id,
    });
  } catch (error) {
    console.error("Error al consultar pago en Mercado Pago:", error);
    return res.status(500).json({ message: "Error al consultar estado del pago" });
  }
};

export default {
  createPreference,
  handleWebhook,
  getPaymentStatus,
};
