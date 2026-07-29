import React from "react";
import mochilas from "../assets/Mochilas.jpeg";
import { FaHeart, FaUsers, FaLeaf, FaBullseye } from "react-icons/fa";
import Footer from "../Components/Footer";
import { motion } from "framer-motion";


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
    transition: { staggerChildren: 0.2 },
  },
};

export default function Sobre() {
  return (
    <>
      {/* HERO */}
      <section className="w-full bg-[#f5ede4] py-20 px-6 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-[#3b2a1f] mb-6">
            Sobre Corazón Artesano
          </h1>

          <p className="text-base md:text-lg text-[#5c4a3f] leading-relaxed">
            Una plataforma digital que conecta y fideliza consumidores con artesanos 
            locales de Sincelejo, Sucre, promoviendo la sostenibilidad económica, 
            cultural y ambiental.
          </p>
        </motion.div>
      </section>

      {/* HISTORIA */}
      <section className="bg-[#f5f2ef] py-12 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Nuestra Historia
            </h2>

            <p className="text-gray-600 mb-4 leading-relaxed">
              Corazón Artesano nace de la necesidad de visibilizar y dignificar el
              trabajo de los artesanos de Sincelejo y el departamento de Sucre.
            </p>

            <p className="text-gray-600 mb-4 leading-relaxed">
              Nuestra plataforma digital no solo facilita la venta de productos
              artesanales, sino que también ofrece herramientas de capacitación.
            </p>

            <p className="text-gray-600 leading-relaxed">
              Creemos firmemente que la combinación de tradición y tecnología es clave.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <img
              src={mochilas}
              alt="Artesanías"
              className="w-full aspect-[4/3] rounded-2xl shadow-lg object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* MODELO DE NEGOCIO */}
      <section className="bg-[#8B5E3C] py-16 px-6 md:px-16 text-white">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
            Nuestro Modelo de Negocio
          </motion.h2>

          <motion.p variants={fadeUp} className="text-sm md:text-base text-white/80 mb-12">
            Un ecosistema integral que combina comercio electrónico, capacitación y logística
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              "Plataforma Web",
              "Tienda Madre",
              "Capacitaciones",
            ].map((title, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ scale: 1.05 }}
                className="bg-[#9C6B4A] p-6 rounded-xl text-left shadow-md"
              >
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  {
                    i === 0 && "Página web funcional donde se ofertan productos artesanales..."
                  }
                  {
                    i === 1 && "Centro logístico para almacenamiento, empaquetado y distribución..."
                  }
                  {
                    i === 2 && "Cursos en marketing digital, fotografía y habilidades digitales..."
                  }
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* VALORES */}
      <section className="bg-[#f7f3ef] py-16 px-6 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-semibold text-gray-800">
            Nuestros Valores
          </motion.h2>

          <motion.p variants={fadeUp} className="text-gray-500 mt-2 mb-12">
            Los principios que guían cada decisión y acción
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[FaHeart, FaUsers, FaLeaf, FaBullseye].map((Icon, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="bg-[#e9e2dc] p-4 rounded-xl mb-4 text-2xl text-[#8B5E3C] inline-block">
                  <Icon />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {["Autenticidad", "Comunidad", "Sostenibilidad", "Innovación"][i]}
                </h3>
                <p className="text-gray-500 text-sm">
                  {[
                    "Valoramos técnicas artesanales tradicionales",
                    "Conectamos artesanos con consumidores",
                    "Crecimiento responsable económico y ambiental",
                    "Mezclamos tradición y tecnología",
                  ][i]}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* IMPACTO */}
      <section className="bg-[#f5ede4] py-16 px-6 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-[#5a3e2b] mb-2">
            Nuestro Impacto
          </motion.h2>

          <motion.p variants={fadeUp} className="text-gray-600 mb-12">
            Transformando vidas y comunidades
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              ["200+", "Artesanos Registrados"],
              ["1,500+", "Productos Vendidos"],
              ["150+", "Estudiantes Capacitados"],
              ["5+", "Municipios Alcanzados"],
            ].map(([num, text], i) => (
              <motion.div key={i} variants={fadeUp}>
                <h3 className="text-4xl font-bold text-[#8B5E3C]">{num}</h3>
                <p className="text-sm text-gray-600 mt-2">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}