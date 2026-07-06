import React from "react";
import { FaStar, FaShoppingCart, FaHeart } from "react-icons/fa";
import { motion } from "framer-motion";

// IMÁGENES
import img1 from "../assets/1.jpeg";
import img2 from "../assets/2.jpeg";
import img3 from "../assets/3.jpeg";
import img4 from "../assets/4.jpeg";
import img5 from "../assets/5.jpeg";
import img6 from "../assets/6.jpeg";

const productos = [
  {
    img: img1,
    titulo: "Sombrero Vueltiao Tradicional",
    autor: "María Contreras",
    descripcion: "Sombrero vueltiao auténtico tejido a mano",
    precio: "$180.000",
  },
  {
    img: img2,
    titulo: "Collar Artesanal Multicolor",
    autor: "Carmen López",
    descripcion: "Collar de mostacilla hecho a mano",
    precio: "$85.000",
  },
  {
    img: img3,
    titulo: "Mochila Wayuu Tradicional",
    autor: "José Martínez",
    descripcion: "Mochila tejida con patrones únicos",
    precio: "$250.000",
  },
  {
    img: img4,
    titulo: "Pulseras Artesanales",
    autor: "Ana Pérez",
    descripcion: "Pulseras tejidas con colores vivos",
    precio: "$40.000",
  },
  {
    img: img5,
    titulo: "Accesorios Étnicos",
    autor: "Luis Gómez",
    descripcion: "Accesorios con identidad cultural",
    precio: "$60.000",
  },
  {
    img: img6,
    titulo: "Joyas Artesanales",
    autor: "Sofía Rojas",
    descripcion: "Joyas hechas a mano",
    precio: "$120.000",
  },
];

// 🔥 animaciones
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Grid_Productos() {
  return (
    <section className="bg-[#f5f2ef] py-16 px-6">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-8">

        {productos.map((p, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
          >

            {/* IMAGEN */}
            <div className="relative overflow-hidden">
              <motion.img
                src={p.img}
                alt={p.titulo}
                className="w-full h-52 object-cover"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.4 }}
              />

              {/* RATING */}
              <div className="absolute bottom-2 left-2 bg-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow">
                <FaStar className="text-yellow-500" />
                4.8
              </div>

              {/* FAVORITO */}
              <motion.button
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.2 }}
                className="absolute top-2 right-2 bg-white p-2 rounded-full shadow"
              >
                <FaHeart className="text-gray-600 hover:text-red-500 transition" />
              </motion.button>
            </div>

            {/* CONTENIDO */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-1">
                {p.titulo}
              </h3>

              <p className="text-xs text-gray-500 mb-2">
                Por {p.autor}
              </p>

              <p className="text-xs text-gray-600 mb-4">
                {p.descripcion}
              </p>

              {/* PRECIO + BOTÓN */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#8B5E3C]">
                  {p.precio}
                </span>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 bg-[#8B5E3C] text-white text-xs px-3 py-2 rounded-md hover:bg-[#6f472c]"
                >
                  <FaShoppingCart />
                  Agregar
                </motion.button>
              </div>
            </div>

          </motion.div>
        ))}

      </div>
    </section>
  );
}