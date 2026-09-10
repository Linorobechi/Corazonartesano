import { Navigate, Outlet, useLocation } from "react-router-dom";

const getAuthState = () => {
  const token = localStorage.getItem("auth_token");
  const storedUser = localStorage.getItem("auth_user");
  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }
  return { isAuthenticated: Boolean(token), user };
};

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = getAuthState();

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
  const { isAuthenticated, user } = getAuthState();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const userRole = user?.rol || "comprador";
  if (!allowedRoles.includes(userRole) && userRole !== "admin") {
    // Redirect if role is not authorized for this private module
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = getAuthState();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}
