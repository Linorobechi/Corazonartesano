import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";
import { formatCurrency } from "../utils/formatters.js";
import { sendEmailNotification } from "../config/mailer.js";

const buildArtisanOrderGroups = async (items) => {
  if (isUsingMemoryDb) {
    const groups = new Map();
    items.forEach((item) => {
      const product = memoryDb.products.find((candidate) => Number(candidate.id) === Number(item.product_id));
      const artisan = memoryDb.users.find((candidate) => Number(candidate.id) === Number(product?.author_user_id));
      if (!artisan?.email) return;
      if (!groups.has(artisan.email)) {
        groups.set(artisan.email, { name: artisan.nombre || "Artesano", items: [] });
      }
      groups.get(artisan.email).items.push(item);
    });
    return groups;
  }

  const productIds = items.map((item) => item.product_id);
  const result = await pool.query(
    `SELECT p.id AS product_id, u.email, u.nombre AS artisan_name
     FROM products p
     JOIN users u ON u.id = p.author_user_id
     WHERE p.id = ANY($1::int[])`,
    [productIds]
  );
  const artisanByProduct = new Map(
    result.rows.map((row) => [Number(row.product_id), { email: row.email, name: row.artisan_name || "Artesano" }])
  );
  const groups = new Map();
  items.forEach((item) => {
    const artisan = artisanByProduct.get(Number(item.product_id));
    if (!artisan?.email) return;
    if (!groups.has(artisan.email)) groups.set(artisan.email, { name: artisan.name, items: [] });
    groups.get(artisan.email).items.push(item);
  });
  return groups;
};

export const sendArtisanOrderNotifications = async ({ items, orderId, clientName, status }) => {
  if (status !== "APPROVED") return;
  const artisanGroups = await buildArtisanOrderGroups(items);
  await Promise.all(
    [...artisanGroups.entries()].map(async ([email, group]) => {
      const orderRows = group.items
        .map(
          (item) =>
            `<li>${item.nombre} - ${item.cantidad} unidad(es) x ${formatCurrency(item.precio)}</li>`
        )
        .join("");
      const total = group.items.reduce(
        (sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0),
        0
      );

      await sendEmailNotification({
        to: email,
        subject: `Nuevo pedido recibido #${orderId} - Corazón Artesano`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8b5e3c;">¡Tienes un nuevo pedido!</h2>
            <p>Hola <strong>${group.name}</strong>,</p>
            <p>${clientName} realizó un pedido que incluye tus productos.</p>
            <p><strong>N° de orden:</strong> #${orderId}</p>
            <ul>${orderRows}</ul>
            <p style="font-size: 18px; color: #8b5e3c;"><strong>Total de tus productos:</strong> ${formatCurrency(total)}</p>
            <p>Ingresa a tu panel de ventas para consultar tus estadísticas.</p>
          </div>
        `,
        text: `Nuevo pedido #${orderId}. Cliente: ${clientName}. Total de tus productos: ${formatCurrency(total)}.`,
      });
    })
  );
};

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
        fulfillment_status: "PENDIENTE",
        transaction_id,
        created_at: new Date(),
        items: validatedItems,
      };
      memoryDb.orders.unshift(order);
    } else {
      const resOrder = await pool.query(
        `INSERT INTO orders (user_id, subtotal, tax, shipping, total, payment_method, status, fulfillment_status, transaction_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [req.user.id, subtotal, tax, shipping, total, paymentMethod || "Tarjeta de Crédito", status, "PENDIENTE", transaction_id]
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

    await sendArtisanOrderNotifications({
      items: validatedItems,
      orderId,
      clientName,
      status,
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
      `SELECT o.*,
              COALESCE(json_agg(json_build_object(
                'product_id', oi.product_id, 'nombre', oi.nombre,
                'cantidad', oi.cantidad, 'precio', oi.precio
              )) FILTER (WHERE oi.product_id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.id DESC`,
      [req.user.id]
    );
    return res.json({ orders: orders.rows });
  } catch (error) {
    console.error("Error al consultar compras:", error);
    return res.status(500).json({ message: "Error al consultar las compras" });
  }
};

export const getArtisanOrders = async (req, res) => {
  try {
    if (isUsingMemoryDb) {
      const productIds = new Set(
        memoryDb.products
          .filter((product) => Number(product.author_user_id) === Number(req.user.id))
          .map((product) => Number(product.id))
      );
      const orders = memoryDb.orders
        .filter((order) => (order.items || []).some((item) => productIds.has(Number(item.product_id))))
        .map((order) => ({
          ...order,
          items: (order.items || []).filter((item) => productIds.has(Number(item.product_id))),
        }));
      return res.json({ orders });
    }

    const result = await pool.query(
      `SELECT o.id, o.created_at, o.status, o.fulfillment_status, o.tracking_number, o.total, o.user_id,
              u.nombre AS buyer_name, u.email AS buyer_email,
              COALESCE(json_agg(json_build_object(
                'product_id', oi.product_id, 'nombre', oi.nombre,
                'cantidad', oi.cantidad, 'precio', oi.precio
              )) FILTER (WHERE oi.product_id IS NOT NULL), '[]') AS items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE p.author_user_id = $1
       GROUP BY o.id, u.nombre, u.email
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.json({ orders: result.rows });
  } catch (error) {
    console.error("Error al obtener pedidos del artesano:", error);
    return res.status(500).json({ message: "No se pudieron cargar tus pedidos" });
  }
};

export const updateArtisanOrderStatus = async (req, res) => {
  const validStatuses = ["PENDIENTE", "APROBADA", "ENVIADO"];
  const { status } = req.body;
  const trackingNumber = String(req.body.trackingNumber || "").trim();
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Estado de pedido no válido" });
  }
  if (status === "ENVIADO" && !trackingNumber) {
    return res.status(400).json({ message: "El número de guía es obligatorio para marcar el pedido como enviado" });
  }

  try {
    if (isUsingMemoryDb) {
      const productIds = new Set(
        memoryDb.products
          .filter((product) => Number(product.author_user_id) === Number(req.user.id))
          .map((product) => Number(product.id))
      );
      const order = memoryDb.orders.find((candidate) => Number(candidate.id) === Number(req.params.id));
      if (
        !order ||
        order.status !== "APPROVED" ||
        !(order.items || []).some((item) => productIds.has(Number(item.product_id)))
      ) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      const statusRank = { PENDIENTE: 0, APROBADA: 1, ENVIADO: 2 };
      if (statusRank[status] !== statusRank[order.fulfillment_status || "PENDIENTE"] + 1) {
        return res.status(409).json({ message: "El pedido debe avanzar al siguiente estado" });
      }
      order.fulfillment_status = status;
      if (status === "ENVIADO") order.tracking_number = trackingNumber;
      return res.json({ message: "Estado del pedido actualizado", status, trackingNumber: order.tracking_number || null });
    }

    const result = await pool.query(
      `UPDATE orders o SET fulfillment_status = $1, tracking_number = CASE WHEN $1 = 'ENVIADO' THEN $4 ELSE o.tracking_number END
       WHERE o.id = $2 AND o.status = 'APPROVED'
         AND CASE o.fulfillment_status WHEN 'PENDIENTE' THEN 0 WHEN 'APROBADA' THEN 1 WHEN 'ENVIADO' THEN 2 ELSE 0 END
             + 1 = CASE $1 WHEN 'PENDIENTE' THEN 0 WHEN 'APROBADA' THEN 1 WHEN 'ENVIADO' THEN 2 ELSE 3 END
         AND EXISTS (
         SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = o.id AND p.author_user_id = $3
       )
       RETURNING o.id, o.fulfillment_status, o.tracking_number`,
      [status, req.params.id, req.user.id, trackingNumber || null]
    );
    if (!result.rows.length) return res.status(409).json({ message: "El pedido no existe, no está aprobado o debe avanzar al siguiente estado" });
    return res.json({
      message: "Estado del pedido actualizado",
      status: result.rows[0].fulfillment_status,
      trackingNumber: result.rows[0].tracking_number || null,
    });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    return res.status(500).json({ message: "No se pudo actualizar el pedido" });
  }
};

/**
 * Obtener estadísticas de ventas de los productos del artesano autenticado.
 */
export const getArtisanSalesStats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (isUsingMemoryDb) {
      const products = memoryDb.products.filter(
        (product) => Number(product.author_user_id) === Number(req.user.id)
      );
      const productIds = new Set(products.map((product) => Number(product.id)));
      const sales = memoryDb.orders
        .filter((order) => order.status === "APPROVED")
        .flatMap((order) =>
          (order.items || [])
            .filter((item) => productIds.has(Number(item.product_id)))
            .map((item) => ({
              ...item,
              created_at: order.created_at,
              order_id: order.id,
            }))
        );
      const monthSales = sales.filter((sale) => {
        const date = new Date(sale.created_at);
        return date >= monthStart && date < nextMonthStart;
      });
      const sumSales = (items) => items.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0), 0);
      const uniqueOrders = (items) => new Set(items.map((item) => item.order_id)).size;

      return res.json({
        stats: {
          monthRevenue: sumSales(monthSales),
          monthUnits: monthSales.reduce((sum, item) => sum + Number(item.cantidad || 0), 0),
          monthOrders: uniqueOrders(monthSales),
          totalRevenue: sumSales(sales),
          totalUnits: sales.reduce((sum, item) => sum + Number(item.cantidad || 0), 0),
        },
      });
    }

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN o.created_at >= date_trunc('month', CURRENT_DATE)
           AND o.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
           THEN oi.precio * oi.cantidad ELSE 0 END), 0) AS month_revenue,
         COALESCE(SUM(CASE WHEN o.created_at >= date_trunc('month', CURRENT_DATE)
           AND o.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
           THEN oi.cantidad ELSE 0 END), 0) AS month_units,
         COUNT(DISTINCT CASE WHEN o.created_at >= date_trunc('month', CURRENT_DATE)
           AND o.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
           THEN o.id END) AS month_orders,
         COALESCE(SUM(oi.precio * oi.cantidad), 0) AS total_revenue,
         COALESCE(SUM(oi.cantidad), 0) AS total_units
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status = 'APPROVED' AND p.author_user_id = $1`,
      [req.user.id]
    );
    const row = result.rows[0] || {};

    return res.json({
      stats: {
        monthRevenue: Number(row.month_revenue || 0),
        monthUnits: Number(row.month_units || 0),
        monthOrders: Number(row.month_orders || 0),
        totalRevenue: Number(row.total_revenue || 0),
        totalUnits: Number(row.total_units || 0),
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del artesano:", error);
    return res.status(500).json({ message: "No se pudieron cargar tus estadísticas de ventas" });
  }
};
