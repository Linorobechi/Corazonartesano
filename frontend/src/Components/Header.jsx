import { useState } from "react";
import logoImg from "../assets/logo.jpeg";
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { FaShoppingBag, FaSignOutAlt, FaGraduationCap, FaStore, FaCrown, FaChartLine } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "";

function Header() {
  const [open, setOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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

  const getAvatarSrc = () => {
    if (!user?.foto) return null;
    if (user.foto.startsWith("http")) return user.foto;
    return `${API_URL}${user.foto}`;
  };

  const getInitials = (name) => {
    if (!name) return "CA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

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

  const isAdmin = user?.rol === "admin";
  const isArtesano = user?.rol === "artesano";

  let visiblePublicLinks = publicLinks;
  if (isAdmin) {
    visiblePublicLinks = [];
  } else if (isArtesano) {
    visiblePublicLinks = [
      { to: "/", label: "Inicio" },
      { to: "/productos", label: "Productos" },
    ];
  }

  return (
    <header className="fixed top-0 left-0 w-full z-30 bg-white/90 backdrop-blur-md shadow-sm border-b border-[#f1ece7]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <img
            src={logoImg}
            alt="Corazón Artesano Logo"
            className="w-9 h-9 object-contain rounded-xl drop-shadow-sm group-hover:scale-105 transition"
          />
          <div>
            <h1 className="text-[#7a4b2c] font-bold text-base tracking-tight leading-tight">
              Corazón Artesano
            </h1>
            <span className="text-[10px] text-gray-400 block -mt-0.5 font-medium">Sincelejo - Sucre</span>
          </div>
        </NavLink>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Cart Icon trigger (Oculto para Administrador) */}
          {!isAdmin && (
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
          )}

          {isAuthenticated && (
            <NavLink
              to="/perfil"
              className="w-8 h-8 rounded-full bg-[#8b5e3c] text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-[#ede3d8]"
              title="Mi Perfil"
            >
              {getAvatarSrc() ? (
                <img src={getAvatarSrc()} alt={user?.nombre} className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.nombre)
              )}
            </NavLink>
          )}

          <button
            className="text-2xl text-[#7a4b2c]"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {visiblePublicLinks.map(({ to, label }) => (
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

          {/* Role Specific Actions */}
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className={linkClass}>
                  <span className="flex items-center gap-1 font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-200 shadow-sm transition">
                    <FaCrown className="text-amber-600" /> Panel Administrador
                  </span>
                </NavLink>
              )}

              {isArtesano && (
                <>
                  <NavLink to="/agregar-productos" className={linkClass}>
                    <span className="flex items-center gap-1 font-semibold text-[#8b5e3c]">
                      <FaStore className="text-xs" /> Agregar Productos
                    </span>
                  </NavLink>
                  <NavLink to="/ventas-artesano" className={linkClass}>
                    <span className="flex items-center gap-1 font-semibold text-[#8b5e3c]">
                      <FaChartLine className="text-xs" /> Mis Ventas
                    </span>
                  </NavLink>
                  <NavLink to="/capacitaciones" className={linkClass}>
                    <span className="flex items-center gap-1">
                      <FaGraduationCap className="text-xs" /> Capacitaciones
                    </span>
                  </NavLink>
                </>
              )}
              {!isAdmin && (
                <NavLink to="/mis-pedidos" className={linkClass}>
                  Mis pedidos
                </NavLink>
              )}

              {/* Shopping Cart Drawer Trigger (Oculto para Administrador) */}
              {!isAdmin && (
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
              )}

              <div className="h-4 w-[1px] bg-gray-200" />

              {/* User Profile Link & Avatar Badge */}
              <div className="flex items-center gap-3">
                <NavLink
                  to="/perfil"
                  className="flex items-center gap-2 bg-[#faf7f2] hover:bg-[#f3ece2] px-3 py-1.5 rounded-full border border-[#ede3d8] transition group"
                  title="Ver y cambiar datos de perfil y foto personal"
                >
                  <div className="w-7 h-7 rounded-full bg-[#8b5e3c] text-white flex items-center justify-center font-bold text-[11px] overflow-hidden border border-white shrink-0 group-hover:scale-105 transition">
                    {getAvatarSrc() ? (
                      <img src={getAvatarSrc()} alt={user?.nombre} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user?.nombre)
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#7a4b2c] group-hover:underline leading-tight">
                      {user?.nombre?.split(" ")[0]}
                    </span>
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                      {user?.rol || "comprador"}
                    </span>
                  </div>
                </NavLink>

                {/* Explicit Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 transition py-1.5 px-2.5 rounded-lg hover:bg-red-50"
                  title="Cerrar sesión"
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
            {visiblePublicLinks.map(({ to, label }) => (
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
                <NavLink
                  to="/perfil"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-2 bg-[#fbf7f3] rounded-xl border border-[#eee3d7] text-[#7a4b2c] font-bold text-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#8b5e3c] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                    {getAvatarSrc() ? (
                      <img src={getAvatarSrc()} alt={user?.nombre} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user?.nombre)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{user?.nombre}</p>
                    <p className="text-[10px] text-gray-500">Ver y editar mi perfil ({user?.rol})</p>
                  </div>
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="text-sm font-bold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2"
                  >
                    <FaCrown className="text-amber-600" /> Panel Administrador
                  </NavLink>
                )}

                {isArtesano && (
                  <>
                    <NavLink
                      to="/agregar-productos"
                      onClick={() => setOpen(false)}
                      className="text-sm font-semibold text-[#8b5e3c] flex items-center gap-2"
                    >
                      <FaStore /> Agregar Productos
                    </NavLink>
                    <NavLink
                      to="/capacitaciones"
                      onClick={() => setOpen(false)}
                      className="text-sm font-semibold text-[#8b5e3c] flex items-center gap-2"
                    >
                      <FaGraduationCap /> Capacitaciones Moodle
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