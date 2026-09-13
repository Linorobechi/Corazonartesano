import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";

/**
 * Obtener reseñas y calificaciones de un producto específico
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId, id } = req.params;
    const effectiveId = Number(productId || id);

    if (!Number.isInteger(effectiveId) || effectiveId <= 0) {
      return res.status(400).json({ message: "El identificador del producto no es válido" });
    }

    if (isUsingMemoryDb) {
      const reviews = memoryDb.reviews
        .filter((r) => r.product_id === effectiveId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const averageRating = reviews.length
        ? Number((reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1))
        : 0;
      return res.json({ reviews, averageRating, reviewCount: reviews.length });
    }

    const rows = await pool.query(
      "SELECT id, product_id, user_id, user_name, rating, comentario, created_at FROM reviews WHERE product_id = $1 ORDER BY id DESC",
      [effectiveId]
    );

    const averageRows = await pool.query(
      `SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating
       FROM products p
       LEFT JOIN reviews r ON r.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [effectiveId]
    );

    if (averageRows.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.json({
      reviews: rows.rows,
      averageRating: Number(averageRows.rows[0].average_rating || 0),
      reviewCount: rows.rows.length,
    });
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

    if (!Number.isInteger(effectiveId) || effectiveId <= 0) {
      return res.status(400).json({ message: "El identificador del producto no es válido" });
    }

    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "La calificación debe ser un número entero entre 1 y 5" });
    }

    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ message: "La calificación y el comentario son obligatorios" });
    }

    const numericRating = Number(rating);
    const userName = req.user.nombre || "Comprador";
    const userId = req.user.id;

    if (isUsingMemoryDb) {
      const alreadyReviewed = memoryDb.reviews.some(
        (review) => review.product_id === effectiveId && review.user_id === userId
      );
      if (alreadyReviewed) {
        return res.status(409).json({ message: "Ya calificaste este producto" });
      }

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

    let result;
    try {
      result = await pool.query(
        `INSERT INTO reviews (product_id, user_id, user_name, rating, comentario)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [effectiveId, userId, userName, numericRating, comentario.trim()]
      );
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "Ya calificaste este producto" });
      }
      throw error;
    }

    const avgRows = await pool.query(
      "SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = $1",
      [effectiveId]
    );
    const avgRating = Number(Number(avgRows.rows[0]?.avg_rating || numericRating).toFixed(1));

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
