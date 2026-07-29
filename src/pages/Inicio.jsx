import { Link } from "react-router-dom";
import React from "react";
import { FaHeart,FaUsers,FaMapMarkerAlt,FaArrowRight,FaMagic,} from "react-icons/fa";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import fondo from "../assets/Fondoinicio.jpeg";
import img from "../assets/bolsos.jpeg";
import img1 from "../assets/1.jpeg";
import img2 from "../assets/2.jpeg";
import img3 from "../assets/3.jpeg";
import img4 from "../assets/4.jpeg";
import img5 from "../assets/5.jpeg";
import img6 from "../assets/6.jpeg";

const images = [img1, img2, img3, img4, img5, img6];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },show: {opacity: 1,y: 0,transition: { duration: 0.6 },},};

const stagger = {hidden: {},show: {transition: {staggerChildren: 0.2,},},};

export default function Inicio() {
  return (
    <>
      {/* HERO */}
      <section
        className="relative w-full h-[90vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-white/70"></div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-2xl px-6"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-1 rounded-full text-sm text-[#7a4b2c] mb-6">
            <FaMapMarkerAlt />
            Sincelejo, Sucre
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[#3b2a1f] mb-6">
            Corazón Artesano
          </h1>

          <p className="text-gray-700 mb-8 leading-relaxed">
            Conectamos artesanos locales con el mundo digital...
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/productos"className="flex items-center gap-2 bg-[#8B5E3C] text-white px-6 py-3 rounded-lg hover:opacity-90">
  Explorar Productos <FaArrowRight />
</Link>

          <Link to="/Capacitaciones"> 
          <button className="bg-[#d2a679] text-[#3b2a1f] px-6 py-3 rounded-lg hover:opacity-90">Ver Capacitaciones</button></Link>
          </div>
        </motion.div>
      </section>

      {/* SECCIÓN 2 */}
      <section className="bg-[#f5f2ef] py-16 px-6 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-[#3b2a1f] mb-4"
        >
          Tradición y Tecnología
        </motion.h2>

        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          Dignificamos el trabajo artesanal mediante herramientas digitales...
        </p>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {[FaHeart, FaUsers, FaMagic].map((Icon, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-white border rounded-xl p-6 text-left"
            >
              <div className="bg-[#efe7e1] w-12 h-12 flex items-center justify-center rounded-lg mb-4 text-[#8B5E3C]">
                <Icon />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {i === 0 && "Productos Auténticos"}
                {i === 1 && "Conecta con Artesanos"}
                {i === 2 && "Capacitación Digital"}
              </h3>
              <p className="text-gray-600 text-sm">
                Artesanías únicas hechas a mano...
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SECCIÓN 3 */}
      <section className="bg-[#f3ede7] py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src={img}
              alt="Artesanías"
              className="w-full aspect-[4/3] rounded-2xl shadow-lg object-cover"
            />
        
        <Link to="/aleria">
        <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow text-sm">
          Ver Galería Completa
        </button>
        </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#3b2a1f] mb-4">
              Sostenibilidad en Cada Pieza
            </h2>

            <p className="text-gray-700 mb-4">
              Promovemos la sostenibilidad económica...
            </p>

            <p className="text-gray-700 mb-6">
              Nuestra plataforma conecta compradores...
            </p>
            <Link to="/Nosotros"className="flex items-center gap-2 text-[#8B5E3C] font-medium hover:underline">
  Conoce más sobre nosotros <FaArrowRight /></Link>
            
          </motion.div>
        </div>
      </section>

      {/* GALERÍA */}
      <section className="bg-[#e9dfd4] py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Descubre Nuestras Artesanías
          </h2>

          <p className="text-gray-600 mt-2 mb-10">
            Explora la diversidad y belleza...
          </p>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {images.map((img, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                whileHover={{ scale: 1.05 }}
                className="overflow-hidden rounded-xl shadow-md"
              >
                <img
                  src={img}
                  alt={`artesania-${index}`}
                  className="w-full h-48 object-cover"
                />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10">
            

        <Link to="/Galeria">
          <button className="bg-[#8b5e3c] text-white px-6 py-3 rounded-lg shadow hover:bg-[#6f472c] transition">
            Ver Galería Completa →
          </button>
        </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 px-6 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#3b2a1f] mb-4">
            ¿Eres artesano?
          </h2>

          <p className="text-gray-700 mb-8 leading-relaxed">
            Únete a nuestra plataforma y lleva tus productos al mundo digital.
          </p>

          <Link to="/contacto"className="inline-flex items-center gap-2 bg-[#8B5E3C] text-white px-6 py-3 rounded-lg shadow hover:bg-[#6f472c] transition">
          Contáctanos <FaArrowRight /></Link>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}