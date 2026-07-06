import { useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";

function Header() {
  const [open, setOpen] = useState(false);

  // CLASE BASE
  const linkClass = ({ isActive }) =>
    `relative pb-1 ${
      isActive ? "text-black" : "text-gray-700 hover:text-black"
    }`;

  return (
    <header className="fixed top-0 left-0 w-full z-20 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <HeartIcon className="w-5 h-5 text-[#7a4b2c]" />
          <h1 className="text-[#7a4b2c] font-semibold">
            Corazón Artesano
          </h1>
        </div>

        {/* Botón móvil */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        {/* NAV DESKTOP */}
        <nav className="hidden md:flex gap-6">
          
          <NavLink to="/" className={linkClass}>
            {({ isActive }) => (
              <span className="relative">
                Inicio
                {isActive && (
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
                )}
              </span>
            )}
          </NavLink>

          <NavLink to="/login" className={linkClass}>
            {({ isActive }) => (
              <span className="relative">
                Iniciar Sesión
                {isActive && (
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
                )}
              </span>
            )}
          </NavLink>

          <NavLink to="/contacto" className={linkClass}>
            {({ isActive }) => (
              <span className="relative">
                Contacto
                {isActive && (
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
                )}
              </span>
            )}
          </NavLink>

          <NavLink to="/Nosotros" className={linkClass}>
            {({ isActive }) => (
              <span className="relative">
                Nosotros
                {isActive && (
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
                )}
              </span>
            )}
          </NavLink>

<NavLink to="/Productos" className={linkClass}>
            {({ isActive }) => (
              <span className="relative">
                Productos
                {isActive && (
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
                )}
              </span>
            )}
          </NavLink>
        </nav>
      </div>

      {/* NAV MÓVIL */}
      {open && (
        <div className="md:hidden bg-white shadow-md px-6 pb-6">
          <nav className="flex flex-col gap-4">

            <NavLink to="/" onClick={() => setOpen(false)} className={linkClass}>
              Inicio
            </NavLink>

            <NavLink to="/login" onClick={() => setOpen(false)} className={linkClass}>
              Iniciar Sesión
            </NavLink>

            <NavLink to="/contacto" onClick={() => setOpen(false)} className={linkClass}>
              Contacto
            </NavLink>

            <NavLink to="/Nosotros" onClick={() => setOpen(false)} className={linkClass}>
              Nosotros
            </NavLink>

          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;