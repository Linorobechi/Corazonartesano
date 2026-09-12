import crypto from "crypto";
import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";
import { formatCurrency } from "../utils/formatters.js";
import { sendEmailNotification } from "../config/mailer.js";

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || "pub_test_IJJQqhI6kPJX5Ur4SmNqWSzFNGFuGHgL";
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || "test_events_fjrySglKsf7JV26Zt3j8admfHDCqljRt";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "test_integrity_3ao8BfKuIgf1pVEm7JSpobwkkX09jas3";
const WOMPI_API_URL = process.env.WOMPI_API_URL || "https://sandbox.wompi.co/v1";

/**
 * 1. Iniciar transacción Wompi: Calcula montos, genera referencia única y firma SHA-256 de integridad.
 */
export const initiateWompiTransaction = async (req, res) => {
  try {
    const { items, customerData, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "El carrito de compras está vacío" });
    }

    let subtotal = 0;
    const validatedItems = items.map((item) => {
      const price = Number(item.price || item.precioRaw || item.precio || 50000);
      const qty = Number(item.quantity || item.cantidad || 1);
      subtotal += price * qty;
      return {
        product_id: item.id || item.product_id,
        nombre: item.nombre,
        cantidad: qty,
        precio: price,
      };
    });

    const tax = Math.round(subtotal * 0.19); // 19% IVA
    const shipping = subtotal > 150000 ? 0 : 12000;
    const total = subtotal + tax + shipping;

    // Monto en centavos para Wompi (Ej: COP 50.000 -> 5000000)
    const amountInCents = Math.round(total * 100);
    const currency = "COP";

    // Generar referencia única de pago
    const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Paso 3 Documentación Wompi: Firma de Integridad SHA-256
    // Cadena: "<Referencia><MontoEnCentavos><Moneda><SecretoIntegridad>"
    const rawConcat = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
    const signature = crypto.createHash("sha256").update(rawConcat).digest("hex");

    let orderId;

    if (isUsingMemoryDb) {
      orderId = memoryDb.nextOrderId++;
      const order = {
        id: orderId,
        user_id: req.user.id,
        subtotal,
        tax,
        shipping,
        total,
        payment_method: "Wompi Widget / Web Checkout",
        status: "PENDING",
        transaction_id: reference,
        reference,
        amount_in_cents: amountInCents,
        created_at: new Date(),
        items: validatedItems,
        customer_data: customerData || {},
        shipping_address: shippingAddress || {},
      };
      memoryDb.orders.unshift(order);
    } else {
      const resOrder = await pool.query(
        `INSERT INTO orders (user_id, subtotal, tax, shipping, total, payment_method, status, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [req.user.id, subtotal, tax, shipping, total, "Wompi Widget / Web Checkout", "PENDING", reference]
      );
      orderId = resOrder.rows[0].id;

      for (const item of validatedItems) {
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, nombre, cantidad, precio) VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.product_id, item.nombre, item.cantidad, item.precio]
        );
      }
    }

    return res.json({
      ok: true,
      orderId,
      reference,
      amountInCents,
      currency,
      signature,
      publicKey: WOMPI_PUBLIC_KEY,
      subtotal,
      tax,
      shipping,
      total,
      formattedTotal: formatCurrency(total),
    });
  } catch (error) {
    console.error("Error al iniciar transacción Wompi:", error);
    return res.status(500).json({ message: "Error al preparar la transacción Wompi" });
  }
};

/**
 * 2. Verificar estado de transacción Wompi tras la redirección del cliente
 */
export const verifyWompiTransaction = async (req, res) => {
  try {
    const { id } = req.params; // ID de la transacción en Wompi o Referencia

    if (!id) {
      return res.status(400).json({ message: "ID de transacción no proporcionado" });
    }

    let wompiTxData = null;

    // Consultar a la API pública de Wompi para verificar estado en tiempo real
    try {
      const fetchRes = await fetch(`${WOMPI_API_URL}/transactions/${id}`);
      if (fetchRes.ok) {
        const jsonRes = await fetchRes.json();
        wompiTxData = jsonRes.data;
      }
    } catch (err) {
      console.warn("⚠️ No se pudo consultar API Wompi directamente:", err.message);
    }

    let order = null;
    const ref = wompiTxData?.reference || id;

    if (isUsingMemoryDb) {
      order = memoryDb.orders.find(
        (o) => o.transaction_id === id || o.reference === ref || o.id === Number(id)
      );
    } else {
      const resOrder = await pool.query(
        `SELECT * FROM orders WHERE transaction_id = $1 OR transaction_id = $2 OR id = $3 LIMIT 1`,
        [id, ref, isNaN(Number(id)) ? 0 : Number(id)]
      );
      order = resOrder.rows[0];
    }

    if (!order && !wompiTxData) {
      return res.status(404).json({ message: "Orden o transacción no encontrada" });
    }

    // Estado obtenido de Wompi o guardado
    const status = wompiTxData?.status || order?.status || "APPROVED";
    const transactionId = wompiTxData?.id || order?.transaction_id || id;
    const orderId = order?.id || 1;

    // Actualizar estado en DB si cambió
    if (order && order.status !== status) {
      order.status = status;
      order.transaction_id = transactionId;

      if (!isUsingMemoryDb) {
        await pool.query(`UPDATE orders SET status = $1, transaction_id = $2 WHERE id = $3`, [
          status,
          transactionId,
          order.id,
        ]);
      }

      // Si fue aprobado, enviar notificación por correo
      if (status === "APPROVED" && req.user?.email) {
        const emailSubject = `¡Pago Aprobado con Wompi! Orden #${order.id} - Corazón Artesano`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2e7d32;">¡Pago Aprobado Exitosamente con Wompi!</h2>
            <p>Hola <strong>${req.user.nombre}</strong>,</p>
            <p>Tu pago ha sido procesado mediante la pasarela de pagos Wompi con éxito.</p>
            <div style="background-color: #f9f6f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top:0; color: #8b5e3c;">Resumen de la Transacción</h3>
              <p><strong>N° de Orden:</strong> #${order.id}</p>
              <p><strong>ID Transacción Wompi:</strong> ${transactionId}</p>
              <p><strong>Referencia:</strong> ${order.reference || ref}</p>
              <p><strong>Estado:</strong> APROBADO</p>
              <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
            </div>
            <p style="font-size: 12px; color: #777;">Corazón Artesano - Apoyando la tradición artesanal colombiana.</p>
          </div>
        `;
        await sendEmailNotification({
          to: req.user.email,
          subject: emailSubject,
          html: emailHtml,
          text: `Orden #${order.id} aprobada con Wompi. Total: ${formatCurrency(order.total)}`,
        });
      }
    }

    const finalSubtotal = Number(order?.subtotal || wompiTxData?.amount_in_cents / 119 || 0);
    const finalTax = Number(order?.tax || 0);
    const finalShipping = Number(order?.shipping || 0);
    const finalTotal = Number(order?.total || (wompiTxData?.amount_in_cents ? wompiTxData.amount_in_cents / 100 : 0));

    return res.json({
      ok: true,
      orderId,
      status,
      transaction_id: transactionId,
      reference: ref,
      subtotal: finalSubtotal,
      tax: finalTax,
      shipping: finalShipping,
      total: finalTotal,
      formattedTotal: formatCurrency(finalTotal),
      paymentMethod: wompiTxData?.payment_method_type || "Wompi Widget",
    });
  } catch (error) {
    console.error("Error al verificar transacción Wompi:", error);
    return res.status(500).json({ message: "Error al verificar el estado de la transacción" });
  }
};

/**
 * 3. Webhook / Listener de eventos Wompi (Paso 7 Documentación)
 */
export const wompiWebhookHandler = async (req, res) => {
  try {
    const eventBody = req.body;

    if (!eventBody || !eventBody.event || !eventBody.data) {
      return res.status(400).json({ message: "Cuerpo de evento inválido" });
    }

    const { event, data, timestamp, signature } = eventBody;

    // Validación de checksum si viene la firma
    if (signature && signature.properties && signature.checksum) {
      const properties = signature.properties;
      let valuesToHash = "";

      for (const propPath of properties) {
        const parts = propPath.split(".");
        let val = data;
        for (const p of parts) {
          if (val) val = val[p];
        }
        valuesToHash += val;
      }

      valuesToHash += timestamp;
      valuesToHash += WOMPI_EVENTS_SECRET;

      const calculatedChecksum = crypto.createHash("sha256").update(valuesToHash).digest("hex");

      if (calculatedChecksum !== signature.checksum) {
        console.warn("⚠️ Checksum de webhook Wompi no coincide. Evento ignorado.");
        return res.status(401).json({ message: "Firma de evento no válida" });
      }
    }

    if (event === "transaction.updated") {
      const transaction = data.transaction;
      const { id, reference, status } = transaction;

      console.log(`🔔 Webhook Wompi recibido para transacción ${id} (${reference}): Estado ${status}`);

      let order = null;
      if (isUsingMemoryDb) {
        order = memoryDb.orders.find((o) => o.reference === reference || o.transaction_id === id);
        if (order) {
          order.status = status;
          order.transaction_id = id;
        }
      } else {
        await pool.query(
          `UPDATE orders SET status = $1, transaction_id = $2 WHERE transaction_id = $3 OR transaction_id = $4`,
          [status, id, reference, id]
        );
      }
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error al procesar webhook de Wompi:", error);
    return res.status(500).json({ message: "Error procesando webhook" });
  }
};
