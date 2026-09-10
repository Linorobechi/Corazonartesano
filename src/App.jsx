import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import Inicio from "./pages/Inicio.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Contacto from "./pages/Contacto.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import InformacionGeneral from "./pages/InformacionGeneral.jsx";
import RecuperarPassword from "./pages/RecuperarPassword.jsx";
import RestablecerPassword from "./pages/RestablecerPassword.jsx";
import Checkout from "./pages/Checkout.jsx";
import Navbar from "./Components/Header.jsx";
import Productos from "./pages/Productos.jsx";
import Panel from "./pages/Panel.jsx";
import Capacitaciones from "./pages/Capacitaciones.jsx";
import CartDrawer from "./Components/CartDrawer.jsx";
import Galeria from "./pages/Galeria.jsx";
import Requisitos from "./pages/Requisitos.jsx";
import ToastHost from "./Components/ToastHost.jsx";
import Perfil from "./pages/Perfil.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from "./Components/AuthRoutes.jsx";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ToastHost />
        <Navbar />
        <CartDrawer />

        <Routes>
          {/* Secciones Informativas Públicas de libre acceso sin autenticación */}
          <Route path="/" element={<Inicio />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/informacion-general" element={<InformacionGeneral />} />
          <Route path="/requisitos" element={<Requisitos />} />
          <Route path="/galeria" element={<Galeria />} />
          <Route path="/productos" element={<Productos />} />

          {/* Rutas de autenticación y recuperación */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route path="/restablecer-password" element={<RestablecerPassword />} />
          </Route>

          {/* Rutas protegidas genéricas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          {/* Rutas restringidas para Administrador */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* Rutas restringidas por Rol para Artesanos / Administradores */}
          <Route element={<RoleRoute allowedRoles={["artesano", "admin"]} />}>
            <Route path="/panel" element={<Navigate to="/agregar-productos" replace />} />
            <Route path="/agregar-productos" element={<Panel />} />
            <Route path="/capacitaciones" element={<Capacitaciones />} />
            <Route path="/cursos" element={<Capacitaciones />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;