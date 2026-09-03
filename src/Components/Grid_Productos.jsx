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

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    nombre: "Sombrero Vueltiao Tradicional",
    autor: "María Contreras",
    descripcion: "Sombrero vueltiao auténtico tejido a mano",
    precio: "$ 180.000",
    imagen_key: "1.jpeg",
    rating: 4.8,
  },
  {
    id: 2,
    nombre: "Collar Artesanal Multicolor",
    autor: "Carmen López",
    descripcion: "Collar de mostacilla hecho a mano",
    precio: "$ 85.000",
    imagen_key: "2.jpeg",
    rating: 4.8,
  },
  {
    id: 3,
    nombre: "Mochila Wayuu Tradicional",
    autor: "José Martínez",
    descripcion: "Mochila tejida con patrones únicos",
    precio: "$ 250.000",
    imagen_key: "3.jpeg",
    rating: 4.8,
  },
  {
    id: 4,
    nombre: "Pulseras Artesanales",
    autor: "Ana Pérez",
    descripcion: "Pulseras tejidas con colores vivos",
    precio: "$ 40.000",
    imagen_key: "4.jpeg",
    rating: 4.8,
  },
  {
    id: 5,
    nombre: "Accesorios Étnicos",
    autor: "Luis Gómez",
    descripcion: "Accesorios con identidad cultural",
    precio: "$ 60.000",
    imagen_key: "5.jpeg",
    rating: 4.8,
  },
  {
    id: 6,
    nombre: "Joyas Artesanales",
    autor: "Sofía Rojas",
    descripcion: "Joyas hechas a mano",
    precio: "$ 120.000",
    imagen_key: "6.jpeg",
    rating: 4.8,
  },
];

export default function Grid_Productos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "";
        let response;
        try {
          response = await fetch(`${API_URL}/api/products`);
        } catch {
          // Intentar fetch relativo si el API_URL de produccion falla
          response = await fetch("/api/products");
        }

        if (!response.ok) {
          throw new Error("No se pudieron cargar los productos desde el servidor");
        }

        const data = await response.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }
      } catch (loadError) {
        console.warn("Usando catálogo de productos por defecto:", loadError);
        setProducts(DEFAULT_PRODUCTS);
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
  }, [loading, products]);

  return (
    <section className="bg-[#f5f2ef] py-16 px-6">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {content}

      </div>
    </section>
  );
}