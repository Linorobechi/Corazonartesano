import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem("corazon_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("corazon_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const parsePrice = (priceStr) => {
    if (typeof priceStr === "number") return priceStr;
    if (!priceStr) return 0;
    const cleaned = priceStr.toString().replace(/[^0-9]/g, "");
    return Number(cleaned) || 0;
  };

  const addToCart = (product, qty = 1) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);
      const priceNum = product.rawPrecio || parsePrice(product.precio);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += qty;
        return updated;
      }

      return [
        ...prevItems,
        {
          id: product.id,
          nombre: product.nombre,
          autor: product.autor,
          precioStr: product.precio,
          price: priceNum,
          imagen: product.image_data || product.imagen_key,
          quantity: qty,
        },
      ];
    });

    window.dispatchEvent(
      new CustomEvent("app-notification", {
        detail: {
          type: "success",
          message: `"${product.nombre}" agregado al carrito`,
        },
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.19); // 19% IVA
  const shipping = subtotal > 150000 || subtotal === 0 ? 0 : 12000;
  const total = subtotal + tax + shipping;
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        shipping,
        total,
        totalItems,
        isCartOpen,
        setIsCartOpen,
        formatCurrency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
};
