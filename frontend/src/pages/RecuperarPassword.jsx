import { useState } from "react";
import logoImg from "../assets/logo.jpeg";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2, ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { forgotPassword } from "../api/auth";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const targetEmail = (email || "").trim();
    if (!targetEmail) {
      setError("Por favor ingresa tu correo electrónico.");
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(targetEmail);
      setIsSent(true);
    } catch (err) {
      console.error("Error al enviar enlace de recuperación:", err);
      setError(
        err.message || "No se pudo enviar el enlace. Verifica que el correo esté registrado."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsSent(false);
    setError("");
  };

  return (
    <>
      <section className="bg-[#f5f1ec] pt-28 pb-20 px-4 flex justify-center items-center min-h-[85vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 max-w-md w-full border border-[#eae0d5]"
        >
          {/* LOGO */}
          <div className="flex justify-center mb-6">
            <Link to="/" className="group">
              <img
                src={logoImg}
                alt="Corazón Artesano"
                className="w-16 h-16 object-contain rounded-2xl drop-shadow-md group-hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {!isSent ? (
              /* ESTADO 1: FORMULARIO DE SOLICITUD */
              <motion.div
                key="form-view"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Recuperar Contraseña
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ingresa tu correo para recibir un enlace de restauración.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 block">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#8b5e3c] transition-colors">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8b5e3c]/20 focus:border-[#8b5e3c] transition-all duration-200 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-[#8b5e3c] hover:bg-[#754d31] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8b5e3c] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>ENVIANDO ENLACE...</span>
                      </>
                    ) : (
                      "ENVIAR ENLACE"
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-gray-100">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#8b5e3c] hover:text-[#754d31] transition-colors group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al Inicio de Sesión
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* ESTADO 2: ¡CORREO ENVIADO! */
              <motion.div
                key="sent-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <div className="flex justify-center mb-5">
                  <div className="p-4 bg-emerald-100 rounded-full text-emerald-600 shadow-sm">
                    <CheckCircle2 size={48} />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  ¡Correo Enviado!
                </h2>

                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Hemos enviado un enlace de recuperación a{" "}
                  <strong className="text-[#8b5e3c] font-semibold break-all bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block mt-1">
                    {email}
                  </strong>
                  . Por favor revisa tu bandeja de entrada.
                </p>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 mb-6 text-left text-xs text-amber-900 leading-relaxed">
                  💡 <strong>¿No lo encuentras?</strong> Revisa tu carpeta de <em>Spam</em> o Correo No Deseado. El enlace es válido durante <strong>1 hora</strong>.
                </div>

                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 bg-[#8b5e3c] text-white rounded-xl font-bold hover:bg-[#754d31] transition shadow-md text-sm active:scale-[0.99]"
                  >
                    VOLVER AL INICIO DE SESIÓN
                  </Link>

                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#8b5e3c] font-medium underline py-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    Intentar con otro correo electrónico
                  </button>
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
