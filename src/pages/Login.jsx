import React, { useState } from "react";
import loginImg from "../assets/6.jpeg"; 
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({
    id: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", form);

  };

  return (

 <> <section className="bg-[#f5f1ec] py-20 px-4">
  <div className="flex justify-center">

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full"
    >
      
      {/* IMAGEN */}
      <motion.div
        className="hidden md:block overflow-hidden"
        whileHover={{ scale: 1.05 }}
      >
        <img
          src={loginImg}
          alt="login"
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* FORMULARIO */}
      <div className="p-8 flex flex-col justify-center">
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold mb-6 text-[#8b5e3c]"
        >
          Iniciar Sesión
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            name="id"
            placeholder="ID de usuario"
            value={form.id}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
          />

          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-[#8b5e3c] text-white py-3 rounded-md hover:bg-[#754d31]"
          >
            Iniciar Sesión
          </motion.button>

        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm mt-4 text-gray-500"
        >
          ¿No tienes cuenta?{" "}
          <Link 
            to="/Register" 
            className="text-[#8b5e3c] hover:underline"
          >
            Regístrate
          </Link>
        </motion.p>

      </div>

    </motion.div>

  </div>
 
</section>

  
  <Footer />
</>
  
  );
}