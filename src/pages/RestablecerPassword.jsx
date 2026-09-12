import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../Components/Footer";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  FaLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaSpinner,
  FaShieldAlt,
} from "react-icons/fa";
import { resetPassword } from "../api/auth";

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = (searchParams.get("token") || "").trim();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(3);

  const isLongEnough = password.length >= 6;
  const isMatching = password.length > 0 && password === confirmPassword;

  // Manejo de la cuenta regresiva tras éxito
  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      navigate("/login");
    }
    return () => clearInterval(timer);
  }, [success, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!tokenFromUrl) {
      setError("No se ha detectado el token de seguridad. Por favor solicita un nuevo enlace.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Por favor completa ambos campos de contraseña.");
      return;
    }

    if (!isLongEnough) {
      setError("La nueva contraseña debe tener como mínimo 6 caracteres.");
      return;
    }

    if (!isMatching) {
      setError("Las contraseñas ingresadas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const data = await resetPassword(tokenFromUrl, password);
      setMessage(data.message || "Tu contraseña ha sido restablecida con éxito.");
      setSuccess(true);
    } catch (err) {
      setError(err.message || "El enlace no es válido o ha expirado. Solicita un nuevo correo.");
    } finally {
      setLoading(false);
    }
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
            {!success ? (
              <motion.div
                key="reset-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="text-center space-y-2 mb-6">
                  <div className="w-14 h-14 bg-[#f8f2eb] rounded-2xl flex items-center justify-center mx-auto text-[#8b5e3c] shadow-inner">
                    <FaLock className="text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#8b5e3c]">
                    Restablecer Contraseña
                  </h2>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                    Crea una nueva contraseña segura para volver a ingresar a tu cuenta.
                  </p>
                </div>

                {/* ALERTA DE TOKEN AUSENTE */}
                {!tokenFromUrl && (
                  <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-2">
                    <div className="flex items-start gap-2 font-semibold">
                      <FaExclamationTriangle className="text-base flex-shrink-0 mt-0.5 text-amber-600" />
                      <span>Falta el token de seguridad en la URL</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed pl-6">
                      Para restablecer tu contraseña necesitas ingresar desde el enlace que recibiste en tu correo electrónico.
                    </p>
                    <div className="pl-6 pt-1">
                      <Link
                        to="/recuperar-password"
                        className="inline-flex items-center gap-1 font-bold text-[#8b5e3c] hover:underline text-xs"
                      >
                        Solicitar un nuevo enlace de recuperación →
                      </Link>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* NUEVA CONTRASEÑA */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        disabled={!tokenFromUrl || loading}
                        className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#f7f4ef] text-sm text-gray-800 placeholder-gray-400 border border-[#e8dfd5] outline-none transition focus:border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c]/20 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={!tokenFromUrl}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8b5e3c] transition p-1"
                        title={showPassword ? "Ocultar" : "Mostrar"}
                      >
                        {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRMAR CONTRASEÑA */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu nueva contraseña"
                        required
                        disabled={!tokenFromUrl || loading}
                        className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#f7f4ef] text-sm text-gray-800 placeholder-gray-400 border border-[#e8dfd5] outline-none transition focus:border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c]/20 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={!tokenFromUrl}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8b5e3c] transition p-1"
                        title={showConfirmPassword ? "Ocultar" : "Mostrar"}
                      >
                        {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                      </button>
                    </div>
                  </div>

                  {/* INDICADORES DE VALIDACIÓN EN VIVO */}
                  {password.length > 0 && (
                    <div className="p-3 bg-[#fcfaf7] border border-[#ebe1d5] rounded-xl space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            isLongEnough ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          ✓
                        </span>
                        <span className={isLongEnough ? "text-green-800 font-medium" : "text-gray-500"}>
                          Al menos 6 caracteres ({password.length}/6)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            isMatching ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          ✓
                        </span>
                        <span className={isMatching ? "text-green-800 font-medium" : "text-gray-500"}>
                          Las contraseñas coinciden
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MENSAJE DE ERROR */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl space-y-1">
                      <div className="flex items-start gap-2 font-medium">
                        <FaExclamationTriangle className="text-xs flex-shrink-0 mt-0.5 text-red-500" />
                        <span>{error}</span>
                      </div>
                      <div className="pl-5 pt-1">
                        <Link
                          to="/recuperar-password"
                          className="font-bold underline text-[11px] text-red-800"
                        >
                          Solicitar un nuevo enlace de recuperación
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* BOTÓN DE ENVÍO */}
                  <button
                    type="submit"
                    disabled={loading || !tokenFromUrl || !isLongEnough || !isMatching}
                    className="w-full bg-[#8b5e3c] text-white py-3.5 px-4 rounded-xl hover:bg-[#754d31] active:scale-[0.99] transition font-semibold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin text-base" />
                        <span>Guardando nueva contraseña...</span>
                      </>
                    ) : (
                      <>
                        <FaShieldAlt className="text-xs" />
                        <span>Guardar Nueva Contraseña</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 pt-4 border-t border-gray-100 text-center">
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-gray-600 hover:text-[#8b5e3c] transition"
                  >
                    Volver a Iniciar Sesión
                  </Link>
                </div>
              </motion.div>
            ) : (
              // VISTA DE ÉXITO
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm">
                  <FaCheckCircle className="text-3xl" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    ¡Contraseña Restablecida!
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="p-4 bg-[#fbf9f6] border border-[#ebdcd0] rounded-2xl text-xs text-[#8b5e3c] font-medium">
                  Redirigiendo a la pantalla de acceso en <strong>{countdown}</strong> segundos...
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full bg-[#8b5e3c] text-white py-3 px-4 rounded-xl hover:bg-[#754d31] transition font-semibold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Iniciar Sesión Ahora</span>
                    <FaArrowRight className="text-[10px]" />
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
