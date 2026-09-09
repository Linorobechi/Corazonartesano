import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
import { FaEye, FaTimes, FaCamera, FaShoppingBag } from "react-icons/fa";

import img1 from "../assets/1.jpeg";
import img2 from "../assets/2.jpeg";
import img3 from "../assets/3.jpeg";
import img4 from "../assets/4.jpeg";
import img5 from "../assets/5.jpeg";
import img6 from "../assets/6.jpeg";
import bolsos from "../assets/bolsos.jpeg";

const galleryItems = [
  {
    id: 1,
    title: "Sombrero Vueltiao Auténtico",
    category: "Tejidos",
    artisan: "María Contreras",
    location: "Sampués, Sucre",
    image: img1,
    description: "Icono de la artesanía colombiana tejido a mano en caña flecha.",
  },
  {
    id: 2,
    title: "Collar Ancestral de Mostacilla",
    category: "Joyería",
    artisan: "Carmen López",
    location: "Sincelejo, Sucre",
    image: img2,
    description: "Diseño geométrico elaborado con pigmentos naturales y mostacillas.",
  },
  {
    id: 3,
    title: "Mochila Wayuu Ancestral",
    category: "Bolsos",
    artisan: "José Martínez",
    location: "La Guajira / Sucre",
    image: img3,
    description: "Pieza única tejida con simbología ancestral colombiana.",
  },
  {
    id: 4,
    title: "Juego de Pulseras Folclóricas",
    category: "Accesorios",
    artisan: "Ana Pérez",
    location: "Corozal, Sucre",
    image: img4,
    description: "Tejidos a mano que destacan los tonos caribeños.",
  },
  {
    id: 5,
    title: "Accesorios Étnicos en Madera",
    category: "Accesorios",
    artisan: "Luis Gómez",
    location: "Tolú, Sucre",
    image: img5,
    description: "Tallados artesanales de madera tratada con tintes biológicos.",
  },
  {
    id: 6,
    title: "Filigrana y Joyas Tradicionales",
    category: "Joyería",
    artisan: "Sofía Rojas",
    location: "Mompox / Sincelejo",
    image: img6,
    description: "Detalle fino en metalurgia y filigrana tradicional.",
  },
  {
    id: 7,
    title: "Colección de Bolsos Teñidos",
    category: "Bolsos",
    artisan: "Colectivo Artesanal Sucre",
    location: "Sincelejo, Sucre",
    image: bolsos,
    description: "Colección de bolsos y fibras vegetales teñidas con cáscaras de árboles.",
  },
];

const categories = ["Todos", "Tejidos", "Joyería", "Bolsos", "Accesorios"];

export default function Galeria() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedImage, setSelectedImage] = useState(null);

  const filteredItems =
    activeCategory === "Todos"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4 md:px-12 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-[#eae0d5] text-[#8b5e3c] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <FaCamera /> Galería Artesanal Visual
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[#8b5e3c]">
              Muestra de Obras y Tradición
            </h1>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Explora en detalle el talento de los artesanos de Sincelejo y la región Caribe.
              Cada fotografía representa horas de dedicación, patrimonio e identidad cultural.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex justify-center flex-wrap gap-2 md:gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
                  activeCategory === cat
                    ? "bg-[#8b5e3c] text-white"
                    : "bg-white text-gray-700 hover:bg-[#eae0d5] hover:text-[#8b5e3c] border border-[#eae0d5]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Image Grid */}
          <motion.div layout className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.id}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#eae0d5] group cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                >
                  <div className="relative overflow-hidden h-64">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white">
                      <span className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                        <FaEye className="text-lg" />
                      </span>
                    </div>

                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#8b5e3c] px-3 py-1 rounded-full shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-gray-800 text-base">{item.title}</h3>
                    <p className="text-xs text-gray-500">
                      Por <strong>{item.artisan}</strong> | {item.location}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* CTA Banner */}
          <div className="bg-white p-8 rounded-3xl border border-[#eae0d5] text-center space-y-4 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#8b5e3c]">¿Deseas adquirir estas piezas?</h2>
            <p className="text-xs text-gray-600">
              Visita nuestro catálogo completo de productos con pasarela de compras integrada.
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center gap-2 bg-[#8b5e3c] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#754d31] transition shadow-md"
            >
              <FaShoppingBag /> Ver Catálogo Comercial
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 bg-black"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden z-10 border border-[#eae0d5] relative"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black transition z-20"
              >
                <FaTimes />
              </button>

              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="w-full h-72 object-cover"
              />

              <div className="p-6 space-y-3">
                <span className="bg-[#faf7f2] text-[#8b5e3c] px-3 py-1 rounded-full text-xs font-bold border border-[#ede3d8]">
                  {selectedImage.category}
                </span>
                <h3 className="text-xl font-bold text-gray-800">{selectedImage.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedImage.description}</p>

                <div className="pt-3 border-t flex justify-between items-center text-xs text-gray-500">
                  <span>Artesano: <strong>{selectedImage.artisan}</strong></span>
                  <span>Ubicación: <strong>{selectedImage.location}</strong></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}