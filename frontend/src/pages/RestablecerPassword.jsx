import { useState, useEffect } from "react";
import logoImg from "../assets/logo.jpeg";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../Components/Footer";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { resetPassword } from "../api/auth";

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = (searchParams.get("token") || "").trim();
  const emailFromUrl = (searchParams.get("email") || "").trim();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(4);

  const isLongEnough = password.length >= 6;
  const isMatching = password.length > 0 && password === confirmPassword;

  // Redirección suave con cuenta regresiva tras éxito
  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (isSuccess && countdown === 0) {
      navigate("/login");
    }
    return () => clearInterval(timer);
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tokenFromUrl) {
      setError("Falta el token de seguridad. Por favor solicita un nuevo enlace de recuperación.");
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

    setIsLoading(true);

    try {
      await resetPassword(tokenFromUrl, password);
      setIsSuccess(true);
    } catch (err) {
      console.error("Error al restablecer contraseña:", err);
      setError(
        err.message || "El enlace no es válido o ha expirado. Por favor solicita un nuevo correo."
      );
    } finally {
      setIsLoading(false);
    }
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
            {!isSuccess ? (
              /* ESTADO 1: FORMULARIO DE RESTABLECIMIENTO */
              <motion.div
                key="reset-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Restablecer Contraseña
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ingresa tu nueva contraseña para acceder a Corazón Artesano.
                  </p>
                </div>

                {/* ADVERTENCIA SI FALTA EL TOKEN */}
                {!tokenFromUrl && (
                  <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-2">
                    <div className="flex items-start gap-2 font-semibold">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>Falta el token de seguridad en la URL</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed pl-6">
                      Para restablecer tu contraseña necesitas ingresar desde el enlace recibido en tu correo electrónico.
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
                  {/* CORREO DEL USUARIO (Solo lectura para feedback, si existe en la URL) */}
                  {emailFromUrl && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1 block">
                        Para el usuario
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail size={18} />
                        </div>
                        <input
                          type="text"
                          value={emailFromUrl}
                          disabled
                          className="block w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}

                  {/* NUEVA CONTRASEÑA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 block">
                      Nueva Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#8b5e3c] transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={!tokenFromUrl || isLoading}
                        className="block w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8b5e3c]/20 focus:border-[#8b5e3c] transition-all duration-200 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={!tokenFromUrl}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#8b5e3c] transition cursor-pointer"
                        title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRMAR CONTRASEÑA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 block">
                      Confirmar Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#8b5e3c] transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repite tu nueva contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={!tokenFromUrl || isLoading}
                        className="block w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8b5e3c]/20 focus:border-[#8b5e3c] transition-all duration-200 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={!tokenFromUrl}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#8b5e3c] transition cursor-pointer"
                        title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* INDICADORES EN VIVO DE VALIDACIÓN */}
                  {password.length > 0 && (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isLongEnough ? "bg-emerald-600 text-white" : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          ✓
                        </span>
                        <span className={isLongEnough ? "text-emerald-800 font-medium" : "text-gray-500"}>
                          Al menos 6 caracteres ({password.length}/6)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isMatching ? "bg-emerald-600 text-white" : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          ✓
                        </span>
                        <span className={isMatching ? "text-emerald-800 font-medium" : "text-gray-500"}>
                          Las contraseñas coinciden
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ALERTA DE ERROR */}
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
                    disabled={isLoading || !tokenFromUrl || !isLongEnough || !isMatching}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-[#8b5e3c] hover:bg-[#754d31] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8b5e3c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>ACTUALIZANDO CONTRASEÑA...</span>
                      </>
                    ) : (
                      "ACTUALIZAR CONTRASEÑA"
                    )}
                  </button>
                </form>

                <div className="mt-7 pt-4 border-t border-gray-100 text-center">
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
              /* ESTADO 2: ¡CONTRASEÑA CAMBIADA! */
              <motion.div
                key="success-view"
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
                  ¡Contraseña Cambiada!
                </h2>

                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión en Corazón Artesano.
                </p>

                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 mb-6">
                  Redirigiendo al login en <strong>{countdown}</strong> segundos...
                </div>

                <Link
                  to="/login"
                  className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 bg-[#8b5e3c] text-white rounded-xl font-bold hover:bg-[#754d31] transition shadow-md text-sm active:scale-[0.99]"
                >
                  IR AL LOGIN
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}
