import React from "react";
import Formulario from "../components/Formulario";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import contacto from "../assets/contacto.jpg";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
const MotionLink = motion(Link);
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function ContactSection() {
  const handleFormSubmit = (data) => {
    console.log("Datos del formulario:", data);
  };

  return (
    <>
      <section className="bg-[#f5f1ec] py-12 px-4 md:px-16"><br /><br />
        <div className="grid md:grid-cols-2 gap-10">
          
          {/* FORMULARIO */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-bold mb-6">
              Envíanos un Mensaje
            </h2>

            <Formulario onSubmit={handleFormSubmit} />
          </motion.div>

          {/* INFORMACIÓN */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.h2 variants={fadeUp} className="text-xl font-bold">
              Información de Contacto
            </motion.h2>

            <div className="space-y-4 text-sm">

              <motion.div variants={fadeUp} className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-[#8b5e3c] mt-1" />
                <p>
                  <strong>Ubicación:</strong><br />
                  Sincelejo, Sucre<br />
                  Colombia
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="flex items-start gap-3">
                <FaEnvelope className="text-[#8b5e3c] mt-1" />
                <p>
                  <strong>Correo Electrónico:</strong><br />
                  info@crozanartesano.com<br />
                  ventas@crozanartesano.com
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="flex items-start gap-3">
                <FaPhoneAlt className="text-[#8b5e3c] mt-1" />
                <p>
                  <strong>Teléfono:</strong><br />
                  +57 300 123 4567<br />
                  +57 315 987 6543
                </p>
              </motion.div>

            </div>

            {/* HORARIO */}
            <motion.div
              variants={fadeUp}
              className="bg-[#ede7e1] p-5 rounded-lg text-sm"
            >
              <h3 className="font-bold mb-2">Horario de Atención</h3>

              <div className="flex justify-between">
                <span>Lunes - Viernes</span>
                <span>8:00 AM - 6:00 PM</span>
              </div>

              <div className="flex justify-between">
                <span>Sábados</span>
                <span>9:00 AM - 2:00 PM</span>
              </div>

              <div className="flex justify-between">
                <span>Domingos</span>
                <span>Cerrado</span>
              </div>
            </motion.div>

            {/* IMAGEN */}
            <motion.img
              variants={fadeUp}
              whileHover={{ scale: 1.05 }}
              src={contacto}
              alt="contacto"
              className="rounded-lg w-full h-48 object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#8b5e3c] text-white py-16 px-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold">
            ¿Eres Artesano?
          </h2>

          <p className="text-sm md:text-base text-[#f3e9e1] max-w-2xl mx-auto">
            Si eres artesano y quieres formar parte de nuestra plataforma,
            contáctanos. Te ayudaremos a digitalizar tu negocio y llegar a más clientes.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            
            <MotionLink
              to="/Register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-[#8b5e3c] px-6 py-3 rounded-md font-medium hover:bg-[#f1e7de] transition inline-block text-center"
            >
              Registrarme como Artesano
            </MotionLink>

                  <Link to="/Requisitos"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="border border-white px-6 py-3 rounded-md hover:bg-white hover:text-[#8b5e3c] transition">
          Ver Requisitos
        </motion.button>
      </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}