import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { clearSavedCart, getSavedCart, saveCart } from "../api/cart.js";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const userKey = user?.id ? `corazon_cart_user_${user.id}` : "corazon_cart_guest";
  const loadedUserRef = useRef(null);
  const syncingRef = useRef(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem("corazon_cart_guest");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !user?.id) {
      loadedUserRef.current = null;
      setCartItems([]);
      return undefined;
    }
    setCartItems([]);
    loadedUserRef.current = null;
    getSavedCart()
      .then((data) => {
        if (!cancelled) {
          setCartItems(Array.isArray(data.items) ? data.items : []);
          loadedUserRef.current = user.id;
        }
      })
      .catch((error) => {
        console.error("Error al cargar el carrito del usuario:", error);
        if (!cancelled) loadedUserRef.current = user.id;
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    localStorage.setItem(userKey, JSON.stringify(cartItems));
    if (isAuthenticated && user?.id && loadedUserRef.current === user.id && !syncingRef.current) {
      saveCart(cartItems).catch((error) => console.error("Error al sincronizar el carrito:", error));
    }
  }, [cartItems, isAuthenticated, user?.id, userKey]);

  const parsePrice = (priceStr) => {
    if (typeof priceStr === "number") return priceStr;
    if (!priceStr) return 0;
    const cleaned = priceStr.toString().replace(/[^0-9]/g, "");
    return Number(cleaned) || 0;
  };

  const addToCart = (product, qty = 1) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.color === (product.selectedColor || null)
      );
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
          color: product.selectedColor || null,
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

  const matchesItem = (item, productId, color) => item.id === productId && (color === undefined || item.color === color);

  const removeFromCart = (productId, color) => {
    setCartItems((prev) => prev.filter((item) => !matchesItem(item, productId, color)));
  };

  const updateQuantity = (productId, newQty, color) => {
    if (newQty <= 0) {
      removeFromCart(productId, color);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (matchesItem(item, productId, color) ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    if (isAuthenticated && user?.id) {
      syncingRef.current = true;
      clearSavedCart()
        .catch((error) => console.error("Error al vaciar el carrito guardado:", error))
        .finally(() => { syncingRef.current = false; });
    }
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
