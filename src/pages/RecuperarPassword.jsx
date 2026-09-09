import { useState } from "react";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
import { FaEnvelope, FaKey, FaCheckCircle, FaArrowLeft } from "react-icons/fa";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [simulatedToken, setSimulatedToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSimulatedToken("");

    if (!email) {
      setError("Por favor ingresa tu correo electrónico registrado.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://corazonartesano.onrender.com/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al solicitar recuperación");
      }

      setMessage(data.message);
      if (data.tokenPreview || data.simulatedToken) {
        setSimulatedToken(data.tokenPreview || data.simulatedToken);
      }
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
              <FaKey className="text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-[#8b5e3c]">Recuperar Contraseña</h2>
            <p className="text-xs text-gray-500">
              Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />
                <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl hover:bg-[#754d31] transition font-semibold text-sm shadow-md disabled:opacity-70"
            >
              {loading ? "Enviando enlace..." : "Enviar Enlace de Recuperación"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              {error}
            </p>
          )}

          {message && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-green-800 text-xs font-semibold">
                <FaCheckCircle />
                <span>{message}</span>
              </div>

              {simulatedToken && (
                <div className="pt-2 border-t border-green-200 text-left">
                  <p className="text-[11px] text-gray-600 mb-1 font-semibold">
                    Simulación de Enlace Directo (Dev Mode):
                  </p>
                  <Link
                    to={`/restablecer-password?token=${simulatedToken}`}
                    className="text-xs text-[#8b5e3c] font-bold hover:underline block break-all"
                  >
                    Clic aquí para Restablecer Contraseña ahora
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8b5e3c] hover:underline"
            >
              <FaArrowLeft />
              Volver al inicio de sesión
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}
