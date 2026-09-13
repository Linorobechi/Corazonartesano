import { useState, useEffect, useCallback } from "react";
import { FaStar, FaUserCheck, FaPaperPlane } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProductReviews({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();
  const hasReviewed = Boolean(user && reviews.some((review) => Number(review.user_id) === Number(user.id)));

  const loadReviews = useCallback(async () => {
    const response = await fetch(`/api/products/${productId}/reviews`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "No se pudieron cargar las reseñas");
    setReviews(data.reviews || []);
    setAverageRating(Number(data.averageRating || 0));
    setReviewCount(Number(data.reviewCount || 0));
  }, [productId]);

  useEffect(() => {
    setRating(null);
    setComentario("");
    setError("");
    setSuccess("");
    loadReviews().catch((loadError) => {
      setReviews([]);
      setAverageRating(0);
      setReviewCount(0);
      setError(loadError.message);
    });
  }, [loadReviews]);

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!user) return setError("Debes iniciar sesión para calificar este producto.");
    if (hasReviewed) return setError("Ya calificaste este producto.");
    if (!rating) return setError("Selecciona una calificación de estrellas.");
    if (!comentario.trim()) return setError("Por favor escribe tu opinión o comentario.");

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ rating, comentario: comentario.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al enviar la calificación");
      setSuccess("¡Gracias por tu opinión y valoración!");
      setComentario("");
      setRating(null);
      await loadReviews();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf7f3] rounded-3xl p-6 border border-[#ede3d8] space-y-6">
      <div className="flex justify-between items-center border-b pb-4 border-[#e2d5c7]">
        <div>
          <h3 className="text-lg font-bold text-[#8b5e3c]">Calificaciones y Opiniones</h3>
          <p className="text-xs text-gray-500">Opiniones de compradores sobre {productName}</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
          <FaStar className={reviewCount ? "text-yellow-500" : "text-gray-300"} />
          <span className="text-sm font-bold text-gray-800">
            {reviewCount ? `${averageRating.toFixed(1)}/5` : "Sin calificación"}
          </span>
          <span className="text-xs text-gray-400">({reviewCount} reseñas)</span>
        </div>
      </div>

      {user && hasReviewed ? (
        <div className="bg-white p-4 rounded-2xl text-center text-xs text-gray-600">
          Ya calificaste este producto. Solo puedes dejar una reseña por producto.
        </div>
      ) : user ? (
        <form onSubmit={handleSubmitReview} className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-700">Deja tu valoración del producto y del artesano:</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl transition transform hover:scale-110"
                aria-label={`Calificar con ${star} estrellas`}
              >
                <FaStar className={star <= (hoverRating || rating || 0) ? "text-yellow-400" : "text-gray-200"} />
              </button>
            ))}
            <span className="text-xs font-bold text-[#8b5e3c] ml-2">
              {hoverRating || rating ? `${hoverRating || rating} de 5 Estrellas` : "Selecciona de 1 a 5 estrellas"}
            </span>
          </div>
          <textarea
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Escribe tu opinión sobre los acabados, la calidad artesanal y tu experiencia..."
            rows="3"
            className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
          />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <FaUserCheck className="text-green-600" /> Publicando como: {user.nombre}
            </span>
            <button type="submit" disabled={loading} className="bg-[#8b5e3c] text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-70">
              <FaPaperPlane className="inline mr-1" /> {loading ? "Publicando..." : "Publicar Opinión"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">{success}</p>}
        </form>
      ) : (
        <div className="bg-white p-4 rounded-2xl text-center text-xs text-gray-500">
          ¿Compraste este producto? <a href="/login" className="text-[#8b5e3c] font-bold hover:underline">Inicia sesión</a> para dejar tu opinión y estrellas.
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          <p className="text-xs text-center text-gray-400 py-4">Aún no hay opiniones para este producto. ¡Sé el primero en dejar una!</p>
        ) : reviews.map((review) => (
          <div key={review.id} className="bg-white p-3.5 rounded-2xl border border-gray-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-800">{review.user_name}</span>
              <div className="flex text-yellow-400 text-xs">
                {[...Array(5)].map((_, index) => <FaStar key={index} className={index < review.rating ? "text-yellow-400" : "text-gray-200"} />)}
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{review.comentario}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
