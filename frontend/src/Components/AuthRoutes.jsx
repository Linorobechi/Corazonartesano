import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    if (location.pathname === "/checkout") {
      window.dispatchEvent(
        new CustomEvent("app-notification", {
          detail: {
            type: "warning",
            message: "Debes estar registrado e iniciar sesión para realizar una compra en Corazón Artesano.",
          },
        })
      );
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children ?? <Outlet />;
}

export function RoleRoute({ allowedRoles, children }) {
  const location = useLocation();
  const { isAuthenticated, user, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const userRole = role || user?.rol || "comprador";
  if (!allowedRoles.includes(userRole) && userRole !== "admin") {
    // Redirigir al inicio si el rol no tiene permisos para este módulo
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}
