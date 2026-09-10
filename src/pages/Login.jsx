import { useState } from "react";
import loginImg from "../assets/6.jpeg";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const emptyForm = {
  identifier: "",
  password: "",
};

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;
      try {
        response = await fetch(`${API_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } catch {
        response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo iniciar sesión");
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-changed"));
      window.dispatchEvent(
        new CustomEvent("app-notification", {
          detail: {
            type: "success",
            message: `Bienvenido, ${data.user.nombre}`,
          },
        })
      );

      setForm(emptyForm);

      if (data.user.rol === "admin") {
        navigate("/admin");
      } else if (data.user.rol === "artesano") {
        navigate("/agregar-productos");
      } else {
        navigate("/");
      }
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full border border-[#eae0d5]"
          >
            {/* IMAGEN */}
            <div className="hidden md:block overflow-hidden relative">
              <img
                src={loginImg}
                alt="login"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8 text-white">
                <div>
                  <h3 className="font-bold text-xl">Acceso a Corazón Artesano</h3>
                  <p className="text-xs opacity-90">
                    Gestiona tu catálogo artesanal o realiza compras 100% seguras.
                  </p>
                </div>
              </div>
            </div>

            {/* FORMULARIO */}
            <div className="p-8 flex flex-col justify-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#8b5e3c]">Iniciar Sesión</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa tu correo o número de documento para acceder.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Documento o Correo Electrónico
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    placeholder="Documento o Correo"
                    value={form.identifier}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Contraseña
                    </label>
                    <Link
                      to="/recuperar-password"
                      className="text-[11px] text-[#8b5e3c] font-semibold hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="w-full p-3 pr-10 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#8b5e3c] transition p-1"
                      title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl hover:bg-[#754d31] transition font-bold text-xs shadow-md disabled:opacity-70"
                >
                  {loading ? "Ingresando..." : "Iniciar Sesión"}
                </button>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}
              </form>

              <p className="text-xs text-center text-gray-500 pt-2 border-t">
                ¿No tienes cuenta aún?{" "}
                <Link to="/register" className="text-[#8b5e3c] font-bold hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}