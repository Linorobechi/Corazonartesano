import { useEffect, useMemo, useState } from "react";
import { FaStar, FaShoppingCart, FaEye, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import ProductReviews from "./ProductReviews";

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

const getProductImage = (product) => {
  if (!product) return img1;
  if (product.image_data) return product.image_data;
  return productImages[product.imagen_key] || img1;
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    nombre: "Sombrero Vueltiao Tradicional",
    autor: "María Contreras",
    descripcion: "Sombrero vueltiao auténtico tejido a mano por tejedores de Sucre",
    precio: "$ 180.000",
    rawPrecio: 180000,
    imagen_key: "1.jpeg",
    rating: 4.8,
  },
  {
    id: 2,
    nombre: "Collar Artesanal Multicolor",
    autor: "Carmen López",
    descripcion: "Collar de mostacilla hecho a mano con tintes tradicionales",
    precio: "$ 85.000",
    rawPrecio: 85000,
    imagen_key: "2.jpeg",
    rating: 4.8,
  },
  {
    id: 3,
    nombre: "Mochila Wayuu Tradicional",
    autor: "José Martínez",
    descripcion: "Mochila tejida a mano con patrones geométricos únicos",
    precio: "$ 250.000",
    rawPrecio: 250000,
    imagen_key: "3.jpeg",
    rating: 4.9,
  },
  {
    id: 4,
    nombre: "Pulseras Artesanales",
    autor: "Ana Pérez",
    descripcion: "Juego de 3 pulseras tejidas con colores vivos folclóricos",
    precio: "$ 40.000",
    rawPrecio: 40000,
    imagen_key: "4.jpeg",
    rating: 4.7,
  },
  {
    id: 5,
    nombre: "Accesorios Étnicos",
    autor: "Luis Gómez",
    descripcion: "Accesorios en madera e hilo con identidad cultural colombiana",
    precio: "$ 60.000",
    rawPrecio: 60000,
    imagen_key: "5.jpeg",
    rating: 4.6,
  },
  {
    id: 6,
    nombre: "Joyas Artesanales",
    autor: "Sofía Rojas",
    descripcion: "Joyas hechas a mano con detalles en filigrana",
    precio: "$ 120.000",
    rawPrecio: 120000,
    imagen_key: "6.jpeg",
    rating: 4.9,
  },
];

export default function Grid_Productos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { addToCart } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "";
        let response;
        try {
          response = await fetch(`${API_URL}/api/products`);
        } catch {
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
        <div className="col-span-full text-center text-gray-500 py-12">
          Cargando catálogo artesanal...
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="col-span-full text-center text-gray-500 py-12">
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
        whileHover={{ y: -6 }}
        className="bg-white rounded-3xl shadow-sm border border-[#eae0d5] overflow-hidden hover:shadow-xl transition flex flex-col justify-between"
      >
        <div className="relative overflow-hidden group">
          <motion.img
            src={getProductImage(product)}
            alt={product.nombre}
            className="w-full h-56 object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.4 }}
          />

          {product.destacado && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-300">
              ⭐ Primordial
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm text-gray-800">
            <FaStar className={Number(product.review_count || 0) > 0 ? "text-yellow-500" : "text-gray-300"} />
            {Number(product.review_count || 0) > 0
              ? `${Number(product.rating).toFixed(1)}/5`
              : "Sin calificación"}
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setSelectedProduct(product)}
              className="bg-white/90 p-2.5 rounded-full shadow-md text-gray-700 hover:text-[#8b5e3c]"
              title="Ver detalle y reseñas"
            >
              <FaEye />
            </motion.button>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] text-[#8b5e3c] font-bold uppercase tracking-wider">
              Artesano: {product.autor}
            </span>
            <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1">
              {product.nombre}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {product.descripcion}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="font-bold text-base text-[#8b5e3c]">{product.precio}</span>

            {/* Add to Shopping Cart */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addToCart(product)}
              className="flex items-center gap-1.5 bg-[#8b5e3c] text-white text-xs px-3.5 py-2 rounded-xl hover:bg-[#754d31] transition font-semibold shadow-sm"
            >
              <FaShoppingCart />
              Agregar
            </motion.button>
          </div>
        </div>
      </motion.div>
    ));
  }, [loading, products, addToCart]);

  return (
    <section className="bg-[#f5f2ef] py-16 px-4 md:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[#8b5e3c] text-xs font-bold uppercase tracking-widest">
            Tradición & Herencia
          </span>
          <h2 className="text-3xl font-bold text-[#8b5e3c]">Catálogo de Productos Artesanales</h2>
          <p className="text-xs text-gray-600">
            Explora piezas auténticas creadas a mano. Puedes agregarlas al carrito y calificarlas tras recibirlas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">{content}</div>
      </div>

      {/* PRODUCT DETAIL & REVIEWS MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 p-6 space-y-6 border border-[#eae0d5] relative"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="text-lg" />
              </button>

              <div className="grid md:grid-cols-2 gap-6 items-center">
                <img
                  src={getProductImage(selectedProduct)}
                  alt={selectedProduct.nombre}
                  className="w-full h-64 object-cover rounded-2xl border border-gray-200"
                />

                <div className="space-y-3">
                  <span className="bg-[#faf7f2] text-[#8b5e3c] px-3 py-1 rounded-full text-xs font-bold border border-[#ede3d8]">
                    Por {selectedProduct.autor}
                  </span>
                  <h2 className="text-xl font-bold text-gray-800">{selectedProduct.nombre}</h2>
                  <p className="text-xs text-gray-600 leading-relaxed">{selectedProduct.descripcion}</p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-[#8b5e3c]">
                      {selectedProduct.precio}
                    </span>

                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="bg-[#8b5e3c] text-white text-xs px-4 py-2.5 rounded-xl font-bold hover:bg-[#754d31] transition flex items-center gap-2"
                    >
                      <FaShoppingCart /> Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Reviews Widget */}
              <ProductReviews
                key={selectedProduct.id}
                productId={selectedProduct.id}
                productName={selectedProduct.nombre}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}