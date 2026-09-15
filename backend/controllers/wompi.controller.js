import crypto from "crypto";
import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";
import { formatCurrency } from "../utils/formatters.js";
import { sendEmailNotification } from "../config/mailer.js";
import { sendArtisanOrderNotifications } from "./orders.controller.js";

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || "pub_test_IJJQqhI6kPJX5Ur4SmNqWSzFNGFuGHgL";
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || "test_events_fjrySglKsf7JV26Zt3j8admfHDCqljRt";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "test_integrity_3ao8BfKuIgf1pVEm7JSpobwkkX09jas3";
const WOMPI_API_URL = process.env.WOMPI_API_URL || "https://sandbox.wompi.co/v1";

/**
 * Helper para enviar el comprobante por correo electrónico tanto para pagos APROBADOS como FALLIDOS/RECHAZADOS.
 */
const sendWompiReceiptEmail = async ({
  email,
  nombre,
  orderId,
  transactionId,
  reference,
  status,
  total,
  paymentMethod,
}) => {
  if (!email) return;

  const isApproved = status === "APPROVED";
  const statusLabel = isApproved ? "APROBADO" : "RECHAZADO / FALLIDO";
  const headerColor = isApproved ? "#2e7d32" : "#c62828";
  const statusBg = isApproved ? "#e8f5e9" : "#ffebee";
  const statusTextColor = isApproved ? "#1b5e20" : "#b71c1c";

  const emailSubject = isApproved
    ? `¡Pago Aprobado! Comprobante de Compra Orden #${orderId} - Corazón Artesano`
    : `Comprobante de Pago Rechazado / Fallido Orden #${orderId} - Corazón Artesano`;

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0e6dd;">
        <h2 style="color: ${headerColor}; margin: 0; font-size: 22px;">
          ${isApproved ? "¡Pago Aprobado Exitosamente!" : "Notificación de Pago Rechazado / Fallido"}
        </h2>
        <p style="color: #777; font-size: 13px; margin-top: 5px;">Pasarela de Pagos Wompi Colombia</p>
      </div>

      <p style="font-size: 15px; color: #333; margin-top: 20px;">Hola <strong>${nombre || "Cliente"}</strong>,</p>
      <p style="font-size: 14px; color: #555; line-height: 1.5;">
        ${
          isApproved
            ? "Tu pago ha sido procesado con éxito mediante Wompi. Tu orden ha sido confirmada y está en preparación para su envío."
            : "Lamentamos informarte que la transacción realizada en la pasarela Wompi fue <strong>rechazada o no pudo ser completada</strong> por la entidad bancaria."
        }
      </p>

      <div style="background-color: #faf7f2; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #ede3d8;">
        <h3 style="margin-top: 0; color: #8b5e3c; font-size: 16px; border-bottom: 1px solid #e5d8cb; padding-bottom: 8px;">
          Resumen del Comprobante
        </h3>
        <table style="width: 100%; font-size: 14px; color: #444; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0;"><strong>N° de Orden:</strong></td>
            <td style="text-align: right;">#${orderId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>ID Transacción Wompi:</strong></td>
            <td style="text-align: right; font-family: monospace;">${transactionId || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Referencia Única:</strong></td>
            <td style="text-align: right; font-family: monospace;">${reference || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Método de Pago:</strong></td>
            <td style="text-align: right;">${paymentMethod || "Wompi Colombia"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Estado del Pago:</strong></td>
            <td style="text-align: right;">
              <span style="background-color: ${statusBg}; color: ${statusTextColor}; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px;">
                ${statusLabel}
              </span>
            </td>
          </tr>
          <tr style="border-top: 1px solid #e5d8cb;">
            <td style="padding: 10px 0 0 0; font-size: 16px; color: #8b5e3c;"><strong>Total:</strong></td>
            <td style="padding: 10px 0 0 0; text-align: right; font-size: 16px; font-weight: bold; color: #8b5e3c;">
              ${formatCurrency(total)}
            </td>
          </tr>
        </table>
      </div>

      ${
        !isApproved
          ? `<div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #e65100; border-radius: 4px;">
              <strong>¿Qué puedes hacer?</strong><br />
              Puedes ingresar a la tienda e intentar realizar el pago nuevamente con otra tarjeta, Nequi, Daviplata o PSE.
             </div>`
          : ""
      }

      <div style="text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eeeeee; padding-top: 15px; margin-top: 20px;">
        <p style="margin: 0;">Corazón Artesano - Apoyando la tradición artesanal colombiana.</p>
      </div>
    </div>
  `;

  await sendEmailNotification({
    to: email,
    subject: emailSubject,
    html: emailHtml,
    text: `Comprobante Wompi Orden #${orderId}: Estado ${statusLabel}. Total: ${formatCurrency(total)}`,
  });
};

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

    const amountInCents = Math.round(total * 100);
    const currency = "COP";

    const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
        email_sent: false,
      };
      memoryDb.orders.unshift(order);
    } else {
      const resOrder = await pool.query(
        `INSERT INTO orders (user_id, subtotal, tax, shipping, total, payment_method, status, fulfillment_status, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [req.user.id, subtotal, tax, shipping, total, "Wompi Widget / Web Checkout", "PENDING", "PENDIENTE", reference]
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
 * 2. Verificar estado de transacción Wompi tras la redirección/retorno del cliente
 */
export const verifyWompiTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID de transacción no proporcionado" });
    }

    let wompiTxData = null;

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

    const status = wompiTxData?.status || order?.status || "APPROVED";
    const transactionId = wompiTxData?.id || order?.transaction_id || id;
    const orderId = order?.id || 1;

    // Actualizar estado en la base de datos si cambió o si estaba PENDING
    if (order) {
      const statusChanged = order.status !== status;
      order.status = status;
      order.transaction_id = transactionId;

      if (!isUsingMemoryDb && statusChanged) {
        await pool.query(`UPDATE orders SET status = $1, transaction_id = $2 WHERE id = $3`, [
          status,
          transactionId,
          order.id,
        ]);
      }

      // Enviar correo de comprobante si no se ha enviado aún para este estado final
      if (!order.email_sent || statusChanged) {
        order.email_sent = true;

        const customerEmail =
          req.user?.email ||
          order.customer_data?.email ||
          wompiTxData?.customer_email ||
          wompiTxData?.user_email;

        const customerName =
          req.user?.nombre ||
          order.customer_data?.fullName ||
          wompiTxData?.customer_data?.full_name;

        await sendWompiReceiptEmail({
          email: customerEmail,
          nombre: customerName,
          orderId,
          transactionId,
          reference: ref,
          status,
          total: order.total || (wompiTxData?.amount_in_cents ? wompiTxData.amount_in_cents / 100 : 0),
          paymentMethod: wompiTxData?.payment_method_type || order.payment_method || "Wompi Colombia",
        });

        if (status === "APPROVED" && statusChanged) {
          const artisanItems = isUsingMemoryDb
            ? order.items || []
            : (await pool.query(
                "SELECT product_id, nombre, cantidad, precio FROM order_items WHERE order_id = $1",
                [order.id]
              )).rows;
          await sendArtisanOrderNotifications({
            items: artisanItems,
            orderId: order.id,
            clientName: customerName || "Un cliente",
            status,
          });
        }
      }
    }

    const finalSubtotal = Number(order?.subtotal || (wompiTxData?.amount_in_cents ? wompiTxData.amount_in_cents / 119 : 0));
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
      paymentMethod: wompiTxData?.payment_method_type || "Wompi Colombia",
    });
  } catch (error) {
    console.error("Error al verificar transacción Wompi:", error);
    return res.status(500).json({ message: "Error al verificar el estado de la transacción" });
  }
};

/**
 * 3. Webhook / Listener de eventos Wompi para notificaciones asíncronas de cambios de estado
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
      const { id, reference, status, customer_email, payment_method_type, amount_in_cents } = transaction;

      console.log(`🔔 Webhook Wompi recibido para transacción ${id} (${reference}): Estado ${status}`);

      let order = null;
      if (isUsingMemoryDb) {
        order = memoryDb.orders.find((o) => o.reference === reference || o.transaction_id === id);
        if (order) {
          order.status = status;
          order.transaction_id = id;
        }
      } else {
        const resOrder = await pool.query(
          `UPDATE orders SET status = $1, transaction_id = $2 WHERE transaction_id = $3 OR transaction_id = $4 RETURNING *`,
          [status, id, reference, id]
        );
        order = resOrder.rows[0];
      }

      if (order && !order.email_sent) {
        order.email_sent = true;
        const total = order.total || (amount_in_cents ? amount_in_cents / 100 : 0);
        const email = customer_email || order.customer_data?.email;
        const nombre = order.customer_data?.fullName;

        await sendWompiReceiptEmail({
          email,
          nombre,
          orderId: order.id,
          transactionId: id,
          reference,
          status,
          total,
          paymentMethod: payment_method_type || "Wompi Colombia",
        });
      }
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error al procesar webhook de Wompi:", error);
    return res.status(500).json({ message: "Error procesando webhook" });
  }
};
