import { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FaShoppingBag, FaSignOutAlt, FaGraduationCap, FaStore } from "react-icons/fa";

function Header() {
  const [open, setOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("auth_token"))
  );

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");

      setIsAuthenticated(Boolean(token));

      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("auth-changed", syncAuthState);
    window.addEventListener("storage", syncAuthState);
    syncAuthState();

    return () => {
      window.removeEventListener("auth-changed", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  // RF-05: EXPLICIT LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    window.dispatchEvent(new Event("auth-changed"));
    window.dispatchEvent(
      new CustomEvent("app-notification", {
        detail: {
          type: "warning",
          message: "Sesión cerrada correctamente",
        },
      })
    );

    setOpen(false);
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `relative pb-1 text-sm font-medium transition ${
      isActive ? "text-[#7a4b2c] font-semibold" : "text-gray-700 hover:text-[#7a4b2c]"
    }`;

  // RF-01: Public Links accessible without prior authentication
  const publicLinks = [
    { to: "/", label: "Inicio" },
    { to: "/nosotros", label: "Quiénes Somos" },
    { to: "/contacto", label: "Contacto" },
    { to: "/informacion-general", label: "Información General" },
    { to: "/productos", label: "Productos" },
  ];

  const authLinks = [
    { to: "/login", label: "Iniciar Sesión" },
    { to: "/register", label: "Registrarse" },
  ];

  const isArtesano = user?.rol === "artesano" || user?.rol === "admin";

  return (
    <header className="fixed top-0 left-0 w-full z-30 bg-white/90 backdrop-blur-md shadow-sm border-b border-[#f1ece7]">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-[#fbf7f3] rounded-xl text-[#7a4b2c] group-hover:scale-105 transition">
            <HeartIcon className="w-5 h-5 text-[#7a4b2c]" />
          </div>
          <div>
            <h1 className="text-[#7a4b2c] font-bold text-base tracking-tight">
              Corazón Artesano
            </h1>
            <span className="text-[10px] text-gray-400 block -mt-1">Sincelejo - Sucre</span>
          </div>
        </NavLink>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Cart Icon trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-[#7a4b2c] hover:bg-[#fbf7f3] rounded-full"
          >
            <FaShoppingBag className="text-xl" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <button
            className="text-2xl text-[#7a4b2c]"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>

        {/* Desktop Navigation (RF-01, RF-04) */}
        <nav className="hidden md:flex items-center gap-6">
          {publicLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {({ isActive }) => (
                <span className="relative">
                  {label}
                  {isActive && (
                    <span className="absolute left-0 -bottom-1.5 w-full h-[2px] bg-[#7a4b2c] rounded-full" />
                  )}
                </span>
              )}
            </NavLink>
          ))}

          {/* Role Specific Actions (RF-04) */}
          {isAuthenticated ? (
            <>
              {isArtesano && (
                <>
                  <NavLink to="/agregar-productos" className={linkClass}>
                    <span className="flex items-center gap-1">
                      <FaStore className="text-xs" /> Panel Artesano
                    </span>
                  </NavLink>
                  <NavLink to="/capacitaciones" className={linkClass}>
                    <span className="flex items-center gap-1">
                      <FaGraduationCap className="text-xs" /> Capacitaciones
                    </span>
                  </NavLink>
                </>
              )}

              {/* Shopping Cart Drawer Trigger (RF-09) */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-[#7a4b2c] hover:bg-[#fbf7f3] rounded-full transition"
                title="Ver Carrito de Compras"
              >
                <FaShoppingBag className="text-lg" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>

              <div className="h-4 w-[1px] bg-gray-200" />

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#8b5e3c] bg-[#faf7f2] px-3 py-1.5 rounded-full border border-[#ede3d8]">
                  {user?.nombre?.split(" ")[0]} ({user?.rol || "comprador"})
                </span>

                {/* RF-05: Explicit Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 transition py-1 px-2.5 rounded-lg hover:bg-red-50"
                  title="Cerrar sesión explícitamente"
                >
                  <FaSignOutAlt />
                  Salir
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-[#7a4b2c] hover:bg-[#fbf7f3] rounded-full transition"
              >
                <FaShoppingBag className="text-lg" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {authLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    to === "/register"
                      ? "bg-[#8b5e3c] text-white hover:bg-[#754d31]"
                      : "text-[#7a4b2c] hover:bg-[#fbf7f3]"
                  }`}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {open && (
        <div className="md:hidden bg-white shadow-lg border-b px-6 py-4 space-y-3">
          <nav className="flex flex-col gap-3">
            {publicLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-gray-700 hover:text-[#7a4b2c]"
              >
                {label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                {isArtesano && (
                  <>
                    <NavLink
                      to="/agregar-productos"
                      onClick={() => setOpen(false)}
                      className="text-sm font-semibold text-[#8b5e3c]"
                    >
                      Panel Artesano
                    </NavLink>
                    <NavLink
                      to="/capacitaciones"
                      onClick={() => setOpen(false)}
                      className="text-sm font-semibold text-[#8b5e3c]"
                    >
                      Capacitaciones Moodle
                    </NavLink>
                  </>
                )}

                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Hola, {user?.nombre} ({user?.rol})
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                  >
                    <FaSignOutAlt /> Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t">
                {authLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-[#8b5e3c]"
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;