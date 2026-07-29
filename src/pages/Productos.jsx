import { FaStar, FaShoppingCart, FaHeart } from "react-icons/fa";
import Grid_Productos from "../Components/Grid_Productos";
import Footer from "../Components/Footer";
import PagosSeguros from "../Components/Pagos";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// 🔥 Animaciones reutilizables
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

export default function Productos() {
  return (
    <>
      <section className="bg-[#e9dfd4] py-16 px-6 text-center relative">
        <div className="max-w-6xl mx-auto mb-6 flex justify-start">
          <Link
            to="/agregar-productos"
            className="inline-flex items-center rounded-full bg-[#8b5e3c] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#754d31]"
          >
            Agregar productos
          </Link>
        </div>
        
        {/* HEADER */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#3b2a1f] mb-4">
            Productos Artesanales
          </h2>

          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
            Cada pieza cuenta una historia. Descubre productos únicos hechos a mano por
            artesanos locales de Sincelejo con técnicas transmitidas de generación en generación.
          </p>
        </motion.div>

        {/* ICONOS DECORATIVOS */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex justify-center gap-6 mt-8 text-[#8b5e3c] text-xl"
        >
          {[FaStar, FaShoppingCart, FaHeart].map((Icon, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ scale: 1.2 }}
            >
              <Icon />
            </motion.div>
          ))}
        </motion.div>

        {/* GRID PRODUCTOS */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-10"
        >
          <Grid_Productos />
        </motion.div>
      </section>

      {/* PAGOS */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <PagosSeguros /><br />
      </motion.div>

      <Footer />
    </>
  );
}