import { useEffect, useMemo, useState } from "react";
import { FaStar, FaShoppingCart, FaHeart } from "react-icons/fa";
import { motion } from "framer-motion";

// IMÁGENES
import img1 from "../assets/1.jpeg";
import img2 from "../assets/2.jpeg";
import img3 from "../assets/3.jpeg";
import img4 from "../assets/4.jpeg";
import img5 from "../assets/5.jpeg";
import img6 from "../assets/6.jpeg";

const productImages = {
  "1.jpeg": img1,
  "2.jpeg": img2,
  "3.jpeg": img3,
  "4.jpeg": img4,
  "5.jpeg": img5,
  "6.jpeg": img6,
};

const getProductImage = (product) => product.image_data || productImages[product.imagen_key];

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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("https://corazonartesano.onrender.com/api/products");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "No se pudieron cargar los productos");
        }

        setProducts(data.products || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="col-span-full text-center text-gray-600 py-10">
          Cargando productos...
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-full text-center text-red-700 bg-red-50 border border-red-200 rounded-xl py-6 px-4">
          {error}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="col-span-full text-center text-gray-600 py-10">
          No hay productos disponibles por ahora.
        </div>
      );
    }

    return products.map((product) => (
      <motion.div
        key={product.id}
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
      >
        <div className="relative overflow-hidden">
          <motion.img
            src={getProductImage(product)}
            alt={product.nombre}
            className="w-full h-52 object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
          />

          <div className="absolute bottom-2 left-2 bg-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow">
            <FaStar className="text-yellow-500" />
            {product.rating}
          </div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.2 }}
            className="absolute top-2 right-2 bg-white p-2 rounded-full shadow"
          >
            <FaHeart className="text-gray-600 hover:text-red-500 transition" />
          </motion.button>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">
            {product.nombre}
          </h3>

          <p className="text-xs text-gray-500 mb-2">Por {product.autor}</p>

          <p className="text-xs text-gray-600 mb-4">{product.descripcion}</p>

          <div className="flex items-center justify-between">
            <span className="font-bold text-[#8B5E3C]">{product.precio}</span>

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
    ));
  }, [error, loading, products]);

  return (
    <section className="bg-[#f5f2ef] py-16 px-6">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {content}

      </div>
    </section>
  );
}