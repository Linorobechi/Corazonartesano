import { useState, useEffect, useCallback } from "react";
import { FaStar, FaUserCheck, FaPaperPlane } from "react-icons/fa";

export default function ProductReviews({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = localStorage.getItem("auth_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const loadReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch {
      setReviews([]);
    }
  }, [productId]);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/products/${productId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.reviews) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {
        if (!ignore) setReviews([]);
      });

    return () => {
      ignore = true;
    };
  }, [productId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Debes iniciar sesión para calificar este producto.");
      return;
    }

    if (!comentario.trim()) {
      setError("Por favor escribe tu opinión o comentario.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comentario }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar la calificación");
      }

      setSuccess("¡Gracias por tu opinión y valoración!");
      setComentario("");
      setRating(5);
      loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="bg-[#faf7f3] rounded-3xl p-6 border border-[#ede3d8] space-y-6">
      <div className="flex justify-between items-center border-b pb-4 border-[#e2d5c7]">
        <div>
          <h3 className="text-lg font-bold text-[#8b5e3c]">Calificaciones y Opiniones</h3>
          <p className="text-xs text-gray-500">Opiniones de compradores sobre {productName}</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
          <FaStar className="text-yellow-500 text-base" />
          <span className="text-sm font-bold text-gray-800">{avgRating}</span>
          <span className="text-xs text-gray-400">({reviews.length} reseñas)</span>
        </div>
      </div>

      {/* Review Form for Logged In User */}
      {user ? (
        <form onSubmit={handleSubmitReview} className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-700">Deja tu valoración del producto y del artesano:</p>

          {/* Star Input */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl transition transform hover:scale-110"
              >
                <FaStar
                  className={
                    star <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-200"
                  }
                />
              </button>
            ))}
            <span className="text-xs font-bold text-[#8b5e3c] ml-2">{hoverRating || rating} de 5 Estrellas</span>
          </div>

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe tu opinión sobre los acabados, la calidad artesanal y tu experiencia..."
            rows="3"
            className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
          />

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <FaUserCheck className="text-green-600" /> Publicando como: {user.nombre}
            </span>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#8b5e3c] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#754d31] transition flex items-center gap-1.5 disabled:opacity-70"
            >
              <FaPaperPlane className="text-xs" />
              {loading ? "Publicando..." : "Publicar Opinión"}
            </button>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">{success}</p>}
        </form>
      ) : (
        <div className="bg-white p-4 rounded-2xl text-center text-xs text-gray-500">
          ¿Compraste este producto?{" "}
          <a href="/login" className="text-[#8b5e3c] font-bold hover:underline">
            Inicia sesión
          </a>{" "}
          para dejar tu opinión y estrellas.
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          <p className="text-xs text-center text-gray-400 py-4">
            Aún no hay opiniones para este producto. ¡Sé el primero en dejar una!
          </p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-3.5 rounded-2xl border border-gray-100 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-800">{rev.user_name}</span>
                <div className="flex text-yellow-400 text-xs">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < rev.rating ? "text-yellow-400" : "text-gray-200"}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{rev.comentario}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
