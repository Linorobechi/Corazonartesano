import React, { useState } from "react";
import registerImg from "../assets/5.jpeg";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";

const emptyForm = {
  nombre: "",
  email: "",
  identificacion: "",
  password: "",
  confirmPassword: "",
};

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

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          identificacion: form.identificacion,
          password: form.password,
        }),
      });

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
            message: "Cuenta creada correctamente",
          },
        })
      );

      setSuccess("Cuenta creada correctamente. Ya puedes iniciar sesión.");
      setForm(emptyForm);
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (registerError) {
      setError(registerError.message);
      window.dispatchEvent(
        new CustomEvent("app-notification", {
          detail: {
            type: "error",
            message: registerError.message,
          },
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="bg-[#f5f1ec] py-20 px-4">
        <div className="flex justify-center">

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full"
          >

            {/* FORMULARIO */}
            <div className="p-8 flex flex-col justify-center">

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-semibold mb-6 text-[#8b5e3c]"
              >
                Crear Cuenta
              </motion.h2>

              <form onSubmit={handleSubmit} className="space-y-4">

                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  name="nombre"
                  placeholder="Nombre completo"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />

                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />
                                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="number"
                  name="identificacion"
                  placeholder="Identificación"
                  value={form.identificacion}
                  onChange={(e) => {
                    let value = e.target.value;

                    value = value.replace(/\D/g, "");
                    if (value.length > 10) return;

                    setForm({...form, identificacion: value,});
                  }}
                  maxLength={10}
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"/>

                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />

                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-[#8b5e3c] text-white py-3 rounded-md hover:bg-[#754d31]"
                  disabled={loading}
                >
                  {loading ? "Creando cuenta..." : "Registrarse"}
                </motion.button>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                    {success}
                  </p>
                )}

              </form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm mt-4 text-gray-500"
              >
                ¿Ya tienes cuenta?{" "}
                <Link
                  to="/login"
                  className="text-[#8b5e3c] hover:underline"
                >
                  Inicia sesión
                </Link>
              </motion.p>

            </div>

            {/* IMAGEN */}
            <motion.div
              className="hidden md:block overflow-hidden"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={registerImg}
                alt="registro"
                className="h-full w-full object-cover"
              />
            </motion.div>

          </motion.div>

        </div>
      </section>

      <Footer />
    </>
  );
}