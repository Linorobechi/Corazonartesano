import { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";

function Header() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("auth_token"))
  );
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("auth_user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

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
    `relative pb-1 ${
      isActive ? "text-black" : "text-gray-700 hover:text-black"
    }`;

  const publicLinks = [
    { to: "/", label: "Inicio" },
    { to: "/contacto", label: "Contacto" },
    { to: "/nosotros", label: "Nosotros" },
    { to: "/productos", label: "Productos" },
  ];

  const authLinks = [
    { to: "/login", label: "Iniciar Sesión" },
    { to: "/register", label: "Registrarse" },
  ];

  const privateLinks = [];

  const renderDesktopLink = ({ to, label }) => (
    <NavLink key={to} to={to} className={linkClass}>
      {({ isActive }) => (
        <span className="relative">
          {label}
          {isActive && (
            <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
          )}
        </span>
      )}
    </NavLink>
  );

  return (
    <header className="fixed top-0 left-0 w-full z-20 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <HeartIcon className="w-5 h-5 text-[#7a4b2c]" />
          <h1 className="text-[#7a4b2c] font-semibold">Corazón Artesano</h1>
        </div>

        <button
          className="md:hidden text-2xl"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        <nav className="hidden md:flex gap-6">
          {publicLinks.map(renderDesktopLink)}
          {isAuthenticated && privateLinks.map(renderDesktopLink)}

          {isAuthenticated ? (
                      <>
                       <a
                href="https://corazonartesano.moodlecloud.com/login/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="relative pb-1 text-[#7a4b2c]"
              >
                <span className="relative">
                  Cursos
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
                </span>
              </a>
              <span className="text-gray-500">
                Hola, {user?.nombre || "usuario"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#7a4b2c] font-medium hover:underline"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            authLinks.map(renderDesktopLink)
          )}
        </nav>
      </div>

      {open && (
        <div className="md:hidden bg-white shadow-md px-6 pb-6">
          <nav className="flex flex-col gap-4">
            {publicLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {label}
              </NavLink>
            ))}

            {isAuthenticated &&
              privateLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {label}
                </NavLink>
              ))}

            {isAuthenticated ? (
              <>
              <a
                href="https://corazonartesano.moodlecloud.com/login/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="relative pb-1 text-[#7a4b2c]"
              >
                <span className="relative">
                  Cursos
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#7a4b2c]"></span>
                </span>
              </a>
                <span className="text-sm text-gray-500">
                  Hola, {user?.nombre || "usuario"}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-[#7a4b2c] font-medium hover:underline"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              authLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {label}
                </NavLink>
              ))
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;