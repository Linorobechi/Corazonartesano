import { useEffect, useState, useCallback } from "react";
import logoImg from "../assets/logo.jpeg";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUserAccount,
  deleteProductAdmin,
  toggleProductDestacado,
} from "../api/admin";

import {
  FaCrown,
  FaUsers,
  FaStore,
  FaShoppingBag,
  FaDollarSign,
  FaTrash,
  FaSearch,
  FaUserShield,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaExclamationTriangle,
  FaChartLine,
  FaStar,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("stats"); // 'stats' | 'users' | 'products' | 'orders'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data States
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  // Search Filters
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Modal State for Deletion
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: "", // 'user' | 'product'
    id: null,
    name: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}");

  const loadAllAdminData = useCallback(async () => {
    try {
      const statsRes = await getAdminStats();
      if (statsRes.stats) {
        setStats(statsRes.stats);
        setRecentOrders(statsRes.recentOrders || []);
      }

      const usersRes = await getAdminUsers();
      if (usersRes.users) {
        setUsers(usersRes.users);
      }
    } catch (err) {
      console.error("Error al cargar datos administrativos:", err);
      setError("No se pudieron cargar los datos del servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      let res;
      try {
        res = await fetch(`${API_URL}/api/products`);
      } catch {
        res = await fetch("/api/products");
      }
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      } else if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initData = async () => {
      if (!ignore) {
        await loadAllAdminData();
        await fetchProducts();
      }
    };
    initData();
    return () => {
      ignore = true;
    };
  }, [loadAllAdminData, fetchProducts]);


  const handleRoleChange = async (userId, newRole) => {
    setError("");
    setSuccess("");
    try {
      const res = await updateUserRole(userId, newRole);
      setSuccess(res.message || "Rol actualizado correctamente.");
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, rol: newRole } : u))
      );
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Error al cambiar el rol.");
    }
  };

  const handleToggleDestacado = async (productId, currentDestacado) => {
    setError("");
    setSuccess("");
    try {
      const res = await toggleProductDestacado(productId, !currentDestacado);
      setSuccess(res.message || "Estado primordial actualizado.");
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, destacado: !currentDestacado } : p
        )
      );
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Error al actualizar estado del producto.");
    }
  };

  const confirmDelete = (type, id, name) => {
    setDeleteModal({ isOpen: true, type, id, name });
  };

  const executeDelete = async () => {
    const { type, id, name } = deleteModal;
    setDeleteModal({ isOpen: false, type: "", id: null, name: "" });
    setError("");
    setSuccess("");

    try {
      if (type === "user") {
        const res = await deleteUserAccount(id);
        setSuccess(res.message || `Usuario ${name} eliminado.`);
        setUsers(users.filter((u) => u.id !== id));
        loadAllAdminData();
      } else if (type === "product") {
        const res = await deleteProductAdmin(id);
        setSuccess(res.message || `Producto ${name} eliminado.`);
        setProducts(products.filter((p) => p.id !== id));
        loadAllAdminData();
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Error al procesar la eliminación.");
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.identificacion?.includes(userSearch)
  );

  const filteredProducts = products.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.autor?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getProductImage = (p) => {
    if (p.image_data) return p.image_data;
    if (p.imagen_key) return `/assets/${p.imagen_key}`;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-[#f5f1ec]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#7a4b2c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#7a4b2c]">
            Cargando Panel de Administración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f7f4f0] pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* HEADER DEL PANEL ADMINISTRATIVO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#2c1d11] via-[#4a2e1b] to-[#7a4b2c] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 opacity-10 text-9xl p-4 select-none pointer-events-none">
              👑
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={logoImg}
                  alt="Corazón Artesano"
                  className="w-16 h-16 object-contain rounded-2xl drop-shadow-md bg-white/10 p-1 border border-white/20"
                />
                <div>
                  <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold w-fit border border-amber-500/30 mb-1.5">
                    <FaCrown /> Control Total de la Plataforma
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Panel Administrador
                  </h1>
                  <p className="text-xs text-amber-100/80 mt-1">
                    Bienvenido, {currentUser.nombre}. Gestiona usuarios, productos y visualiza métricas de Corazón Artesano.
                  </p>
                </div>
              </div>

              <button
                onClick={loadAllAdminData}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition border border-white/20"
                title="Actualizar datos"
              >
                <FaSync className="text-xs" /> Recargar Datos
              </button>
            </div>

            {/* PESTAÑAS DEL PANEL */}
            <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-3 text-xs font-bold">
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                  activeTab === "stats"
                    ? "bg-amber-500 text-gray-900 shadow-md font-extrabold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <FaChartLine /> Estadísticas & Métricas
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                  activeTab === "users"
                    ? "bg-amber-500 text-gray-900 shadow-md font-extrabold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <FaUsers /> Cuentas de Usuarios ({users.length})
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                  activeTab === "products"
                    ? "bg-amber-500 text-gray-900 shadow-md font-extrabold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <FaBoxOpen /> Catálogo de Productos ({products.length})
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                  activeTab === "orders"
                    ? "bg-amber-500 text-gray-900 shadow-md font-extrabold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <FaShoppingBag /> Órdenes & Ventas ({stats?.totalOrders || 0})
              </button>
            </div>
          </motion.div>

          {/* MENSAJES Y ALERTAS */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 shadow-sm flex items-center justify-between font-medium"
            >
              <span>⚠️ {error}</span>
              <button onClick={() => setError("")} className="font-bold ml-4">
                ✕
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between font-bold"
            >
              <span>✅ {success}</span>
              <button onClick={() => setSuccess("")} className="font-bold ml-4">
                ✕
              </button>
            </motion.div>
          )}

          {/* CONTENIDO DE PESTAÑAS */}

          {/* TAB 1: ESTADÍSTICAS Y MÉTRICAS */}
          {activeTab === "stats" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* TARJETAS DE MÉTRICAS CLAVE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-[#eae0d5] shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-2xl font-bold">
                    <FaDollarSign />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Ingresos Totales
                    </span>
                    <h3 className="text-xl font-extrabold text-[#7a4b2c]">
                      {stats?.formattedRevenue || "$ 0"}
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#eae0d5] shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl text-2xl font-bold">
                    <FaUsers />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Total Usuarios
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-800">
                      {stats?.totalUsers || 0}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      {stats?.totalArtesanos || 0} Artesanos | {stats?.totalCompradores || 0} Compradores
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#eae0d5] shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-[#fbf7f3] text-[#8b5e3c] rounded-2xl text-2xl font-bold">
                    <FaStore />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Productos Creados
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-800">
                      {stats?.totalProducts || products.length || 0}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      En catálogo artesanal
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#eae0d5] shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-2xl font-bold">
                    <FaShoppingBag />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Órdenes Realizadas
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-800">
                      {stats?.totalOrders || 0}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      Ventas en plataforma
                    </p>
                  </div>
                </div>
              </div>

              {/* DISTRIBUCIÓN DE USUARIOS Y ACTIVIDAD */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-[#eae0d5] space-y-4">
                  <h3 className="text-base font-bold text-[#7a4b2c] flex items-center gap-2">
                    <FaShoppingBag /> Últimas Transacciones Registradas
                  </h3>

                  {recentOrders.length === 0 ? (
                    <p className="text-xs text-gray-500 py-6 text-center italic">
                      No hay compras registradas recientemente en la base de datos.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#f1ece7] text-gray-400 font-semibold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Orden #</th>
                            <th className="py-2.5 px-3">Método</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f0eb]">
                          {recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-[#faf7f3]">
                              <td className="py-3 px-3 font-bold text-gray-800">
                                #{order.id}
                              </td>
                              <td className="py-3 px-3 text-gray-600 font-medium">
                                {order.payment_method}
                              </td>
                              <td className="py-3 px-3">
                                {order.status === "APPROVED" ? (
                                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                                    <FaCheckCircle /> APROBADO
                                  </span>
                                ) : (
                                  <span className="bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                                    <FaTimesCircle /> RECHAZADO
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-extrabold text-[#7a4b2c]">
                                ${Number(order.total).toLocaleString("es-CO")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* DESGLOSE DE COMUNIDAD */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eae0d5] space-y-4">
                  <h3 className="text-base font-bold text-[#7a4b2c] flex items-center gap-2">
                    <FaUserShield /> Comunidad Corazón Artesano
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#faf7f3] rounded-2xl border border-[#f1ece7] flex justify-between items-center">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <FaStore className="text-[#8b5e3c]" /> Artesanos Creadores
                      </span>
                      <span className="font-extrabold text-[#8b5e3c] bg-white px-2.5 py-1 rounded-xl shadow-sm border border-[#eee3d7]">
                        {stats?.totalArtesanos || 0}
                      </span>
                    </div>

                    <div className="p-3 bg-[#faf7f3] rounded-2xl border border-[#f1ece7] flex justify-between items-center">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <FaUsers className="text-blue-600" /> Compradores
                      </span>
                      <span className="font-extrabold text-blue-700 bg-white px-2.5 py-1 rounded-xl shadow-sm border border-[#eee3d7]">
                        {stats?.totalCompradores || 0}
                      </span>
                    </div>

                    <div className="p-3 bg-[#faf7f3] rounded-2xl border border-[#f1ece7] flex justify-between items-center">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <FaCrown className="text-amber-600" /> Administradores
                      </span>
                      <span className="font-extrabold text-amber-700 bg-white px-2.5 py-1 rounded-xl shadow-sm border border-[#eee3d7]">
                        {stats?.totalAdmins || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: GESTIÓN Y ELIMINACIÓN DE CUENTAS DE USUARIO */}
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eae0d5] space-y-5"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#f1ece7] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#7a4b2c] flex items-center gap-2">
                    <FaUsers /> Gestión de Cuentas de Usuario
                  </h3>
                  <p className="text-xs text-gray-500">
                    Visualiza los datos de los usuarios registrados, altera roles o elimina cuentas según sea necesario.
                  </p>
                </div>

                {/* Buscador de Usuarios */}
                <div className="relative w-full sm:w-72">
                  <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo o cédula..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#f1ece7] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="text-xs text-gray-500 py-8 text-center">
                  No se encontraron usuarios registrados coincidentes.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#f1ece7] text-gray-400 font-semibold uppercase text-[10px]">
                        <th className="py-3 px-3">Usuario</th>
                        <th className="py-3 px-3">Documento</th>
                        <th className="py-3 px-3">Correo</th>
                        <th className="py-3 px-3">Rol</th>
                        <th className="py-3 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f0eb]">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#faf7f3] transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#8b5e3c] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                {u.foto ? (
                                  <img
                                    src={u.foto.startsWith("http") ? u.foto : `${API_URL}${u.foto}`}
                                    alt={u.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  u.nombre ? u.nombre[0].toUpperCase() : "U"
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{u.nombre}</p>
                                {u.especialidad && (
                                  <p className="text-[10px] text-[#8b5e3c] italic">
                                    {u.especialidad}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-gray-700">
                            {u.tipo_documento || "CC"} - {u.identificacion}
                          </td>

                          <td className="py-3 px-3 text-gray-600 font-medium">
                            {u.email}
                          </td>

                          <td className="py-3 px-3">
                            <select
                              value={u.rol || "comprador"}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className={`p-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer border ${
                                u.rol === "admin"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : u.rol === "artesano"
                                  ? "bg-[#fbf7f3] text-[#8b5e3c] border-[#eee3d7]"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              <option value="comprador">Comprador</option>
                              <option value="artesano">Artesano</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 text-right">
                            {u.id === currentUser.id ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                Tu Sesión
                              </span>
                            ) : (
                              <button
                                onClick={() => confirmDelete("user", u.id, u.nombre)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition font-bold"
                                title={`Eliminar cuenta de ${u.nombre}`}
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: GESTIÓN Y ELIMINACIÓN DE PRODUCTOS */}
          {activeTab === "products" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eae0d5] space-y-5"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#f1ece7] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#7a4b2c] flex items-center gap-2">
                    <FaBoxOpen /> Catálogo de Productos Registrados
                  </h3>
                  <p className="text-xs text-gray-500">
                    Administra o elimina cualquier producto artesanal publicado en la tienda.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Buscar producto o autor artesano..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#f1ece7] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="text-xs text-gray-500 py-8 text-center">
                  No hay productos que coincidan con la búsqueda.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-2xl p-4 border transition flex gap-3 items-center justify-between ${
                        p.destacado
                          ? "bg-amber-50/70 border-amber-300 shadow-sm"
                          : "bg-[#faf7f3] border-[#f1ece7]"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0 overflow-hidden border border-gray-300 relative">
                          {getProductImage(p) ? (
                            <img
                              src={getProductImage(p)}
                              alt={p.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-gray-800 truncate">
                              {p.nombre}
                            </h4>
                            {p.destacado && (
                              <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                                ⭐ Primordial
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            Por: <span className="font-semibold text-[#8b5e3c]">{p.autor}</span>
                          </p>
                          <p className="text-xs font-extrabold text-[#7a4b2c] mt-0.5">
                            ${Number(p.precio).toLocaleString("es-CO")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleDestacado(p.id, p.destacado)}
                          className={`p-2.5 rounded-xl font-bold transition flex items-center gap-1 text-xs ${
                            p.destacado
                              ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                              : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700"
                          }`}
                          title={p.destacado ? "Quitar de primordiales" : "Hacer primordial (saldrá de primero en el catálogo)"}
                        >
                          <FaStar className="text-xs" />
                          <span className="hidden sm:inline">
                            {p.destacado ? "Primordial" : "Destacar"}
                          </span>
                        </button>

                        <button
                          onClick={() => confirmDelete("product", p.id, p.nombre)}
                          className="p-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl transition font-bold"
                          title="Eliminar este producto"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: HISTORIAL DE ÓRDENES */}
          {activeTab === "orders" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eae0d5] space-y-4"
            >
              <h3 className="text-lg font-bold text-[#7a4b2c] flex items-center gap-2">
                <FaShoppingBag /> Registro General de Órdenes de Compra
              </h3>
              <p className="text-xs text-gray-500">
                Historial de compras realizadas por los usuarios y su estado de aprobación de pago.
              </p>

              {recentOrders.length === 0 ? (
                <p className="text-xs text-gray-500 py-8 text-center italic">
                  No se han registrado transacciones electrónicas aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#f1ece7] text-gray-400 font-semibold uppercase text-[10px]">
                        <th className="py-3 px-3">ID Orden</th>
                        <th className="py-3 px-3">Transacción ID</th>
                        <th className="py-3 px-3">Método de Pago</th>
                        <th className="py-3 px-3">Estado</th>
                        <th className="py-3 px-3 text-right">Total ($ COP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f0eb]">
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-[#faf7f3]">
                          <td className="py-3 px-3 font-bold text-gray-800">
                            #{o.id}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                            {o.transaction_id}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-700">
                            {o.payment_method}
                          </td>
                          <td className="py-3 px-3">
                            {o.status === "APPROVED" ? (
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                                <FaCheckCircle /> APROBADO
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                                <FaTimesCircle /> RECHAZADO
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-[#7a4b2c]">
                            ${Number(o.total).toLocaleString("es-CO")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl mx-auto">
              <FaExclamationTriangle />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-800">
                Confirmar Eliminación
              </h3>
              <p className="text-xs text-gray-500">
                ¿Estás seguro de que deseas eliminar{" "}
                <span className="font-bold text-red-600">"{deleteModal.name}"</span>?
                Esta acción borra la información permanentemente.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, type: "", id: null, name: "" })
                }
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </>
  );
}
