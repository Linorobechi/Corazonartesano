import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && item.id && Number(item.quantity) > 0).map((item) => ({
    ...item,
    quantity: Number(item.quantity),
  }));
};

export const getCart = async (req, res) => {
  try {
    if (isUsingMemoryDb) {
      const cart = memoryDb.carts?.find((item) => Number(item.user_id) === Number(req.user.id));
      return res.json({ items: cart?.items || [] });
    }
    const result = await pool.query("SELECT items FROM carts WHERE user_id = $1", [req.user.id]);
    return res.json({ items: result.rows[0]?.items || [] });
  } catch (error) {
    console.error("Error al cargar carrito:", error);
    return res.status(500).json({ message: "No se pudo cargar tu carrito" });
  }
};

export const saveCart = async (req, res) => {
  const items = normalizeItems(req.body.items);
  try {
    if (isUsingMemoryDb) {
      if (!memoryDb.carts) memoryDb.carts = [];
      const existing = memoryDb.carts.find((item) => Number(item.user_id) === Number(req.user.id));
      if (existing) existing.items = items;
      else memoryDb.carts.push({ user_id: req.user.id, items });
      return res.json({ items });
    }
    await pool.query(
      `INSERT INTO carts (user_id, items, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
      [req.user.id, JSON.stringify(items)]
    );
    return res.json({ items });
  } catch (error) {
    console.error("Error al guardar carrito:", error);
    return res.status(500).json({ message: "No se pudo guardar tu carrito" });
  }
};

export const clearCart = async (req, res) => {
  try {
    if (isUsingMemoryDb) {
      if (memoryDb.carts) {
        const cart = memoryDb.carts.find((item) => Number(item.user_id) === Number(req.user.id));
        if (cart) cart.items = [];
      }
    } else {
      await pool.query(
        `INSERT INTO carts (user_id, items, updated_at) VALUES ($1, '[]'::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET items = '[]'::jsonb, updated_at = NOW()`,
        [req.user.id]
      );
    }
    return res.json({ items: [] });
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    return res.status(500).json({ message: "No se pudo vaciar tu carrito" });
  }
};
