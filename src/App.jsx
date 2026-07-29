import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Inicio from "./pages/Inicio.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Contacto from "./pages/Contacto.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Navbar from "./Components/Header.jsx";
import Productos from "./pages/Productos.jsx";
import Panel from "./pages/Panel.jsx";
import ToastHost from "./Components/ToastHost.jsx";
import { ProtectedRoute, PublicOnlyRoute } from "./Components/AuthRoutes.jsx";




function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <Navbar />

      <Routes>
        <Route path="/" element={<Inicio/>} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/productos" element={<Productos />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/panel" element={<Navigate to="/agregar-productos" replace />} />
          <Route path="/agregar-productos" element={<Panel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;