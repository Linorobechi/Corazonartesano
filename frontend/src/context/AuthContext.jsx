import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, getUserProfile } from "../api/auth.js";

const AuthContext = createContext(null);

const getTokenExpiration = (authToken) => {
  try {
    const payload = JSON.parse(atob(authToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Number(payload.exp) * 1000;
  } catch {
    return 0;
  }
};

const isTokenExpired = (authToken) =>
  !authToken || getTokenExpiration(authToken) <= Date.now();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem("auth_token");
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        return null;
      }
      return storedToken;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      if (isTokenExpired(localStorage.getItem("auth_token"))) return null;
      const stored = localStorage.getItem("auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const syncAuthState = useCallback(() => {
    try {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
        return;
      }
      setToken(storedToken || null);
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
      window.dispatchEvent(new CustomEvent("app-notification", {
        detail: { type: "warning", message: "Tu sesión expiró. Inicia sesión nuevamente." },
      }));
    };

    window.addEventListener("auth-expired", handleExpiredSession);
    return () => window.removeEventListener("auth-expired", handleExpiredSession);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const remainingTime = getTokenExpiration(token) - Date.now();
    if (remainingTime <= 0) {
      window.dispatchEvent(new Event("auth-expired"));
      return undefined;
    }
    const timer = window.setTimeout(() => window.dispatchEvent(new Event("auth-expired")), remainingTime);
    return () => window.clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    window.addEventListener("auth-changed", syncAuthState);
    window.addEventListener("storage", syncAuthState);
    return () => {
      window.removeEventListener("auth-changed", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, [syncAuthState]);

  const setAuthSession = (authToken, authUser) => {
    localStorage.setItem("auth_token", authToken);
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
    window.dispatchEvent(new CustomEvent("auth-changed"));
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await loginUser(credentials);
      if (data.token && data.user) {
        setAuthSession(data.token, data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await registerUser(payload);
      if (data.token && data.user) {
        setAuthSession(data.token, data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new CustomEvent("auth-changed"));
  };

  const updateUser = (updatedUser, updatedToken) => {
    if (updatedToken) {
      localStorage.setItem("auth_token", updatedToken);
      setToken(updatedToken);
    }
    if (updatedUser) {
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    window.dispatchEvent(new CustomEvent("auth-changed"));
  };

  const refreshProfile = async () => {
    if (!token) return null;
    try {
      const data = await getUserProfile();
      if (data.user) {
        updateUser(data.user);
      }
      return data.user;
    } catch {
      return null;
    }
  };

  const role = user?.rol || "comprador";
  const isAuthenticated = Boolean(token && user);
  const isArtesano = role === "artesano" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role,
        isAuthenticated,
        isArtesano,
        isAdmin,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
};
