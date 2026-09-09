import React, { useState } from "react";
import registerImg from "../assets/5.jpeg";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaStore, FaIdCard, FaLock, FaEnvelope } from "react-icons/fa";

const emptyForm = {
  nombre: "",
  email: "",
  tipo_documento: "CC",
  identificacion: "",
  password: "",
  confirmPassword: "",
  rol: "comprador", // default role (RF-02)
};

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");

    if (!form.nombre || !form.email || !form.identificacion || !form.password) {
      setError("Todos los campos obligatorios deben diligenciarse.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const bodyData = JSON.stringify({
        nombre: form.nombre,
        email: form.email,
        tipo_documento: form.tipo_documento,
        identificacion: form.identificacion,
        password: form.password,
        rol: form.rol,
      });

      let response;
      try {
        response = await fetch(`${API_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyData,
        });
      } catch {
        response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo registrar el usuario");
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-changed"));
      window.dispatchEvent(
        new CustomEvent("app-notification", {
          detail: {
            type: "success",
            message: `Cuenta de ${data.user.rol === "artesano" ? "Artesano" : "Comprador"} creada exitosamente`,
          },
        })
      );

      setSuccess("Cuenta creada correctamente. Redirigiendo...");
      setForm(emptyForm);

      setTimeout(() => {
        if (data.user.rol === "artesano") {
          navigate("/agregar-productos");
        } else {
          navigate("/");
        }
      }, 1000);
    } catch (registerError) {
      setError(registerError.message);
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
            {/* FORMULARIO */}
            <div className="p-8 flex flex-col justify-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#8b5e3c]">Crear Cuenta</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Regístrate para comprar piezas artesanales o vender tus creaciones (RF-02).
                </p>
              </div>

              {/* Selector de Rol (RF-02) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Selecciona tu Rol en la Plataforma:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, rol: "comprador" })}
                    className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                      form.rol === "comprador"
                        ? "border-[#8b5e3c] bg-[#fbf7f3] text-[#8b5e3c]"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <FaUser /> Comprador / Cliente
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, rol: "artesano" })}
                    className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                      form.rol === "artesano"
                        ? "border-[#8b5e3c] bg-[#fbf7f3] text-[#8b5e3c]"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <FaStore /> Artesano Creador
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre completo"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                {/* Tipo de Documento + Número (RF-02) */}
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="tipo_documento"
                    value={form.tipo_documento}
                    onChange={handleChange}
                    className="col-span-1 p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c] font-semibold text-gray-700"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>

                  <input
                    type="text"
                    name="identificacion"
                    placeholder="N° de Documento"
                    value={form.identificacion}
                    onChange={handleChange}
                    required
                    className="col-span-2 p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirmar contraseña"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl hover:bg-[#754d31] transition font-bold text-xs shadow-md disabled:opacity-70"
                >
                  {loading ? "Creando cuenta..." : `Registrarme como ${form.rol === "artesano" ? "Artesano" : "Comprador"}`}
                </button>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-xs text-green-700 bg-green-50 p-3 rounded-xl border border-green-200">
                    {success}
                  </p>
                )}
              </form>

              <p className="text-xs text-center text-gray-500 pt-2 border-t">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="text-[#8b5e3c] font-bold hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>

            {/* IMAGEN */}
            <div className="hidden md:block overflow-hidden relative">
              <img
                src={registerImg}
                alt="registro artesanal"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8 text-white">
                <div>
                  <h3 className="font-bold text-xl">Artesanías con Historia</h3>
                  <p className="text-xs opacity-90">
                    Conectando raíces colombianas con compradores de todo el mundo.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}