import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";
import { formatCurrency } from "../utils/formatters.js";
import { sendEmailNotification } from "../config/mailer.js";

/**
 * Procesar compra / pago electrónico simulado con confirmación por correo
 */
export const checkout = async (req, res) => {
  try {
    const { items, paymentMethod, paymentDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "El carrito de compras está vacío" });
    }

    let subtotal = 0;
    const validatedItems = items.map((item) => {
      const price = Number(item.price || item.precioRaw || 50000);
      const qty = Number(item.quantity || 1);
      subtotal += price * qty;
      return {
        product_id: item.id,
        nombre: item.nombre,
        cantidad: qty,
        precio: price,
      };
    });

    const tax = Math.round(subtotal * 0.19); // 19% IVA
    const shipping = subtotal > 150000 ? 0 : 12000;
    const total = subtotal + tax + shipping;

    // Simulación de rechazo para tarjetas terminadas en 0000
    const cardNumber = paymentDetails?.cardNumber || "";
    const isRejected = cardNumber.endsWith("0000");
    const status = isRejected ? "REJECTED" : "APPROVED";
    const transaction_id = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
        payment_method: paymentMethod || "Tarjeta de Crédito",
        status,
        transaction_id,
        created_at: new Date(),
        items: validatedItems,
      };
      memoryDb.orders.unshift(order);
    } else {
      const resOrder = await pool.query(
        `INSERT INTO orders (user_id, subtotal, tax, shipping, total, payment_method, status, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [req.user.id, subtotal, tax, shipping, total, paymentMethod || "Tarjeta de Crédito", status, transaction_id]
      );
      orderId = resOrder.rows[0].id;

      for (const item of validatedItems) {
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, nombre, cantidad, precio) VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.product_id, item.nombre, item.cantidad, item.precio]
        );
      }
    }

    // Notificación por correo electrónico sobre el estado del pago
    const clientEmail = req.user.email;
    const clientName = req.user.nombre;
    const isApproved = status === "APPROVED";

    const emailSubject = isApproved
      ? `¡Pago Aprobado! Confirmación de Compra #${orderId} - Corazón Artesano`
      : `Notificación: Pago Rechazado para la Orden #${orderId} - Corazón Artesano`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: ${isApproved ? "#2e7d32" : "#c62828"};">
          ${isApproved ? "¡Pago Aprobado Exitosamente!" : "Tu Pago No Pudo Ser Procesado"}
        </h2>
        <p>Hola <strong>${clientName}</strong>,</p>
        <p>${
          isApproved
            ? "Tu pago ha sido procesado con éxito. Tus productos artesanales se están preparando para el envío."
            : "Lamentamos informarte que la transacción fue rechazada por la entidad bancaria. Por favor verifica tus datos o intenta con otro método de pago."
        }</p>

        <div style="background-color: #f9f6f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top:0; color: #8b5e3c;">Resumen de la Transacción</h3>
          <p><strong>N° de Orden:</strong> #${orderId}</p>
          <p><strong>ID Transacción:</strong> ${transaction_id}</p>
          <p><strong>Estado:</strong> ${isApproved ? "APROBADO" : "RECHAZADO"}</p>
          <p><strong>Método de Pago:</strong> ${paymentMethod}</p>
          <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
          <p><strong>IVA (19%):</strong> ${formatCurrency(tax)}</p>
          <p><strong>Envío:</strong> ${shipping === 0 ? "GRATIS" : formatCurrency(shipping)}</p>
          <p style="font-size: 18px; color: #8b5e3c;"><strong>Total:</strong> ${formatCurrency(total)}</p>
        </div>

        <p style="font-size: 12px; color: #777;">Corazón Artesano - Apoyando la tradición artesanal colombiana.</p>
      </div>
    `;

    await sendEmailNotification({
      to: clientEmail,
      subject: emailSubject,
      html: emailHtml,
      text: `Estado de Pago para Orden #${orderId}: ${status}. Total: ${formatCurrency(total)}`,
    });

    return res.json({
      message: isApproved ? "Transacción completada exitosamente" : "El pago fue rechazado por el banco",
      orderId,
      status,
      transaction_id,
      subtotal,
      tax,
      shipping,
      total,
      formattedTotal: formatCurrency(total),
      emailSentTo: clientEmail,
    });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res.status(500).json({ message: "Error al procesar el pago" });
  }
};

/**
 * Obtener compras / órdenes del usuario autenticado
 */
export const getUserOrders = async (req, res) => {
  try {
    if (isUsingMemoryDb) {
      const userOrders = memoryDb.orders.filter((o) => o.user_id === req.user.id);
      return res.json({ orders: userOrders });
    }

    const orders = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );
    return res.json({ orders: orders.rows });
  } catch (error) {
    console.error("Error al consultar compras:", error);
    return res.status(500).json({ message: "Error al consultar las compras" });
  }
};
