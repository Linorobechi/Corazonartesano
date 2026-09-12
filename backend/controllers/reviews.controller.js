import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";

/**
 * Obtener reseñas y calificaciones de un producto específico
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId, id } = req.params;
    const effectiveId = Number(productId || id);

    if (isUsingMemoryDb) {
      const reviews = memoryDb.reviews
        .filter((r) => r.product_id === effectiveId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.json({ reviews });
    }

    const rows = await pool.query(
      "SELECT id, product_id, user_id, user_name, rating, comentario, created_at FROM reviews WHERE product_id = $1 ORDER BY id DESC",
      [effectiveId]
    );

    return res.json({ reviews: rows.rows });
  } catch (error) {
    console.error("Error al consultar reseñas:", error);
    return res.status(500).json({ message: "Error al consultar las reseñas del producto" });
  }
};

/**
 * Publicar una nueva reseña (Usuario autenticado)
 */
export const addProductReview = async (req, res) => {
  try {
    const { productId, id } = req.params;
    const effectiveId = Number(productId || id);
    const { rating, comentario } = req.body;

    if (!rating || !comentario || !comentario.trim()) {
      return res.status(400).json({ message: "La calificación y el comentario son obligatorios" });
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const userName = req.user.nombre || "Comprador";
    const userId = req.user.id;

    if (isUsingMemoryDb) {
      const newRev = {
        id: memoryDb.nextReviewId++,
        product_id: effectiveId,
        user_id: userId,
        user_name: userName,
        rating: numericRating,
        comentario: comentario.trim(),
        created_at: new Date(),
      };
      memoryDb.reviews.unshift(newRev);

      const prodReviews = memoryDb.reviews.filter((r) => r.product_id === effectiveId);
      const avgRating = Number(
        (prodReviews.reduce((sum, r) => sum + Number(r.rating), 0) / prodReviews.length).toFixed(1)
      );

      const prod = memoryDb.products.find((p) => p.id === effectiveId);
      if (prod) {
        prod.rating = avgRating;
      }

      return res.status(201).json({
        message: "Reseña y calificación publicadas con éxito",
        review: newRev,
        averageRating: avgRating,
      });
    }

    const result = await pool.query(
      `INSERT INTO reviews (product_id, user_id, user_name, rating, comentario) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [effectiveId, userId, userName, numericRating, comentario.trim()]
    );

    const avgRows = await pool.query(
      "SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = $1",
      [effectiveId]
    );
    const avgRating = Number(Number(avgRows.rows[0]?.avg_rating || numericRating).toFixed(1));

    await pool.query("UPDATE products SET rating = $1 WHERE id = $2", [avgRating, effectiveId]);

    return res.status(201).json({
      message: "Reseña y calificación publicadas con éxito",
      review: result.rows[0],
      averageRating: avgRating,
    });
  } catch (error) {
    console.error("Error al guardar reseña:", error);
    return res.status(500).json({ message: "No se pudo guardar la reseña" });
  }
};

/**
 * Obtener reseñas recientes globales para la portada o testimonios
 */
export const getRecentReviews = async (_req, res) => {
  try {
    if (isUsingMemoryDb) {
      const recent = memoryDb.reviews.slice(0, 6);
      return res.json({ reviews: recent });
    }

    const rows = await pool.query(
      `SELECT r.id, r.product_id, r.user_name, r.rating, r.comentario, r.created_at, p.nombre as product_nombre 
       FROM reviews r 
       LEFT JOIN products p ON p.id = r.product_id 
       ORDER BY r.id DESC LIMIT 6`
    );
    return res.json({ reviews: rows.rows });
  } catch (error) {
    console.error("Error al consultar reseñas recientes:", error);
    return res.status(500).json({ message: "Error al consultar las reseñas recientes" });
  }
};
