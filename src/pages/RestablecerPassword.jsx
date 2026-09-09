import { useState } from "react";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FaLock, FaCheckCircle } from "react-icons/fa";

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!password || !confirmPassword) {
      setError("Diligencia ambas contraseñas.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al restablecer la contraseña");
      }

      setMessage(data.message);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="bg-[#f5f1ec] pt-28 pb-20 px-4 flex justify-center items-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-[#eae0d5]"
        >
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-[#f8f2eb] rounded-2xl flex items-center justify-center mx-auto text-[#8b5e3c]">
              <FaLock className="text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-[#8b5e3c]">Restablecer Contraseña</h2>
            <p className="text-xs text-gray-500">Ingresa tu nueva contraseña a continuación.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl hover:bg-[#754d31] transition font-semibold text-sm shadow-md disabled:opacity-70"
            >
              {loading ? "Guardando nueva contraseña..." : "Guardar Nueva Contraseña"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              {error}
            </p>
          )}

          {message && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2 text-green-800 text-xs font-semibold">
              <FaCheckCircle className="text-lg flex-shrink-0" />
              <span>{message} Redirigiendo al inicio de sesión...</span>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/login" className="text-xs font-semibold text-[#8b5e3c] hover:underline">
              Ir al inicio de sesión
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}
