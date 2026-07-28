import { Navigate, Outlet, useLocation } from "react-router-dom";

const getAuthState = () => Boolean(localStorage.getItem("auth_token"));

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = getAuthState();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children ?? <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const isAuthenticated = getAuthState();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}
