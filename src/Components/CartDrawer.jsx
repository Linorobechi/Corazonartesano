
import { useCart } from "../context/CartContext";
import { FaTrash, FaTimes, FaShoppingBag, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Local image imports for preview fallback
import img1 from "../assets/1.jpeg";
import img2 from "../assets/2.jpeg";
import img3 from "../assets/3.jpeg";
import img4 from "../assets/4.jpeg";
import img5 from "../assets/5.jpeg";
import img6 from "../assets/6.jpeg";

const fallbackImages = {
  "1.jpeg": img1,
  "2.jpeg": img2,
  "3.jpeg": img3,
  "4.jpeg": img4,
  "5.jpeg": img5,
  "6.jpeg": img6,
};

export default function CartDrawer() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    subtotal,
    tax,
    shipping,
    total,
    isCartOpen,
    setIsCartOpen,
    formatCurrency,
  } = useCart();

  const navigate = useNavigate();

  const getImgSrc = (imgKey) => {
    if (!imgKey) return img1;
    if (imgKey.startsWith("/") || imgKey.startsWith("http")) return imgKey;
    return fallbackImages[imgKey] || img1;
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("app-notification", {
          detail: {
            type: "warning",
            message: "Debes estar registrado e iniciar sesión en el sitio para realizar una compra.",
          },
        })
      );
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-[#8b5e3c] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FaShoppingBag className="text-xl" />
                <h2 className="text-lg font-semibold">Carrito de Compras</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-[#754d31] rounded-full transition"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 space-y-3 text-gray-500">
                  <FaShoppingBag className="mx-auto text-5xl text-gray-300" />
                  <p className="font-medium text-base">Tu carrito está vacío</p>
                  <p className="text-xs text-gray-400">
                    Agrega productos de nuestra colección artesanal para iniciar tu compra.
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-[#fdfbf7] rounded-xl border border-[#ede3d8] items-center"
                  >
                    <img
                      src={getImgSrc(item.imagen)}
                      alt={item.nombre}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />

                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                        {item.nombre}
                      </h4>
                      <p className="text-xs text-gray-500">Por {item.autor}</p>
                      <p className="text-sm font-bold text-[#8b5e3c] mt-1">
                        {formatCurrency(item.price)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Eliminar producto"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cartItems.length > 0 && (
              <div className="p-5 bg-[#faf7f2] border-t border-[#ede3d8] space-y-3">
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-semibold text-gray-800">
                      {shipping === 0 ? "GRATIS" : formatCurrency(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#8b5e3c] pt-2 border-t border-[#e2d5c7]">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl hover:bg-[#754d31] transition font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  Proceder al Pago
                  <FaArrowRight />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
