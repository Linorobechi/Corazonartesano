import { useState, useEffect } from "react";
import logoImg from "../assets/logo.jpeg";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
import {
  FaEnvelope,
  FaCheckCircle,
  FaArrowLeft,
  FaPaperPlane,
  FaRedo,
  FaInfoCircle,
  FaSpinner,
} from "react-icons/fa";
import { forgotPassword } from "../api/auth";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Temporizador de cuenta regresiva para reenvío de correo
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const targetEmail = (email || "").trim();
    if (!targetEmail) {
      setError("Por favor ingresa tu correo electrónico registrado.");
      return;
    }

    setLoading(true);

    try {
      const data = await forgotPassword(targetEmail);
      setSuccessData({
        email: targetEmail,
        message: data.message || "Te hemos enviado las instrucciones para restablecer tu contraseña.",
        realEmailSent: data.realEmailSent ?? true,
        resetUrl: data.resetUrl || "",
        tokenPreview: data.tokenPreview || data.simulatedToken || "",
      });
      setCooldown(30); // 30 segundos de espera para reintentar
    } catch (err) {
      setError(err.message || "Hubo un error al procesar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setError("");
  };

  return (
    <>
      <section className="bg-[#f5f1ec] pt-28 pb-20 px-4 flex justify-center items-center min-h-[85vh]">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-xl p-6 sm:p-9 max-w-md w-full border border-[#eae0d5]"
        >
          <AnimatePresence mode="wait">
            {!successData ? (
              // VISTA 1: FORMULARIO DE SOLICITUD
              <motion.div
                key="form-view"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-center space-y-2 mb-6">
                  <div className="flex justify-center mb-3">
                    <img src={logoImg} alt="Corazón Artesano" className="w-14 h-14 object-contain rounded-2xl drop-shadow-md" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#8b5e3c]">
                    Recuperar Contraseña
                  </h2>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                    Ingresa el correo electrónico asociado a tu cuenta de <strong>Corazón Artesano</strong> y te enviaremos un enlace seguro para restablecerla.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu-correo@ejemplo.com"
                        required
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f7f4ef] text-sm text-gray-800 placeholder-gray-400 border border-[#e8dfd5] outline-none transition focus:border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c]/20 disabled:opacity-60"
                      />
                      <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2"
                    >
                      <FaInfoCircle className="text-sm flex-shrink-0 mt-0.5 text-red-500" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8b5e3c] text-white py-3.5 px-4 rounded-xl hover:bg-[#754d31] active:scale-[0.99] transition font-semibold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin text-base" />
                        <span>Enviando enlace seguro...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="text-xs" />
                        <span>Enviar Enlace de Recuperación</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 pt-4 border-t border-gray-100 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#8b5e3c] hover:text-[#6e462b] transition"
                  >
                    <FaArrowLeft className="text-[10px]" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </motion.div>
            ) : (
              // VISTA 2: CONFIRMACIÓN DE ENVÍO DE CORREO
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm">
                  <FaCheckCircle className="text-3xl" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    ¡Correo de Recuperación Enviado!
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Hemos enviado las instrucciones para restablecer tu contraseña a:
                  </p>
                  <p className="text-sm font-bold text-[#8b5e3c] mt-1 break-all bg-[#fbf8f5] py-1.5 px-3 rounded-lg border border-[#ebe0d4] inline-block">
                    {successData.email}
                  </p>
                </div>

                <div className="bg-[#fcfaf7] border border-[#eee4d9] rounded-2xl p-4 text-left space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-[#8b5e3c] font-bold">1.</span>
                    <span>Revisa tu <strong>bandeja de entrada</strong> y haz clic en el botón para crear una nueva clave.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#8b5e3c] font-bold">2.</span>
                    <span>Si no lo ves en un par de minutos, verifica tu carpeta de <strong>Correo no deseado (Spam)</strong> o <strong>Promociones</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#8b5e3c] font-bold">3.</span>
                    <span>El enlace tiene una validez de <strong>1 hora</strong> por seguridad.</span>
                  </div>
                </div>

                {/* Acciones de Reenvío o Cambio de correo */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading || cooldown > 0}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-[#8b5e3c] text-[#8b5e3c] hover:bg-[#8b5e3c] hover:text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Reenviando...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <>
                        <FaRedo className="text-[10px]" />
                        <span>Reenviar correo en {cooldown}s</span>
                      </>
                    ) : (
                      <>
                        <FaRedo className="text-[10px]" />
                        <span>¿No recibiste el correo? Reenviar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-gray-500 hover:text-gray-700 underline py-1 block w-full"
                  >
                    Intentar con otro correo electrónico
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#8b5e3c] transition"
                  >
                    <FaArrowLeft className="text-[10px]" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}
