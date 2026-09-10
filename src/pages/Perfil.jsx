import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { getUserProfile, updateUserProfile } from "../api/auth";
import {
  FaUser,
  FaCamera,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPaintBrush,
  FaLock,
  FaCheckCircle,
  FaShieldAlt,
  FaStore,
  FaPen,
  FaCalendarAlt,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Perfil() {
  const [activeTab, setActiveTab] = useState("vista"); // 'vista' | 'editar' | 'seguridad'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [user, setUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: "",
    tipo_documento: "CC",
    identificacion: "",
    telefono: "",
    ubicacion: "",
    especialidad: "",
    biografia: "",
  });

  // Photo state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Password change state
  const [passData, setPassData] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUserProfile();
      if (data.user) {
        setUser(data.user);
        setFormData({
          nombre: data.user.nombre || "",
          tipo_documento: data.user.tipo_documento || "CC",
          identificacion: data.user.identificacion || "",
          telefono: data.user.telefono || "",
          ubicacion: data.user.ubicacion || "",
          especialidad: data.user.especialidad || "",
          biografia: data.user.biografia || "",
        });
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("auth-changed"));
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setError("No se pudieron cargar los datos del perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePassChange = (e) => {
    setPassData({
      ...passData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.nombre || !formData.identificacion) {
      setError("El nombre y la identificación son obligatorios.");
      return;
    }

    setSaving(true);

    try {
      const body = new FormData();
      body.append("nombre", formData.nombre);
      body.append("tipo_documento", formData.tipo_documento);
      body.append("identificacion", formData.identificacion);
      body.append("telefono", formData.telefono);
      body.append("ubicacion", formData.ubicacion);
      body.append("especialidad", formData.especialidad);
      body.append("biografia", formData.biografia);

      if (selectedFile) {
        body.append("foto", selectedFile);
      }

      const res = await updateUserProfile(body);

      if (res.user) {
        setUser(res.user);
        if (res.token) {
          localStorage.setItem("auth_token", res.token);
        }
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        window.dispatchEvent(new Event("auth-changed"));
        window.dispatchEvent(
          new CustomEvent("app-notification", {
            detail: {
              type: "success",
              message: "Perfil de artesano actualizado correctamente",
            },
          })
        );

        setSuccess("Perfil actualizado con éxito.");
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => setSuccess(""), 4000);
        setActiveTab("vista");
      }
    } catch (err) {
      setError(err.message || "Error al actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passData.passwordActual) {
      setError("Ingresa tu contraseña actual.");
      return;
    }

    if (passData.nuevaPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (passData.nuevaPassword !== passData.confirmarPassword) {
      setError("Las nuevas contraseñas no coinciden.");
      return;
    }

    setSaving(true);

    try {
      const body = new FormData();
      body.append("passwordActual", passData.passwordActual);
      body.append("password", passData.nuevaPassword);

      const res = await updateUserProfile(body);

      if (res.user) {
        setUser(res.user);
        if (res.token) {
          localStorage.setItem("auth_token", res.token);
        }
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        window.dispatchEvent(new Event("auth-changed"));
        window.dispatchEvent(
          new CustomEvent("app-notification", {
            detail: {
              type: "success",
              message: "Contraseña actualizada exitosamente",
            },
          })
        );

        setSuccess("Contraseña cambiada correctamente.");
        setPassData({ passwordActual: "", nuevaPassword: "", confirmarPassword: "" });
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch (err) {
      setError(err.message || "Error al cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  const getAvatarSrc = () => {
    if (previewUrl) return previewUrl;
    if (user?.foto) {
      if (user.foto.startsWith("http")) return user.foto;
      return `${API_URL}${user.foto}`;
    }
    return null;
  };

  const getInitials = (name) => {
    if (!name) return "CA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const isArtesano = user?.rol === "artesano" || user?.rol === "admin";

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-[#f5f1ec]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#8b5e3c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#7a4b2c]">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f7f4f0] pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* HEADER CARD DEL PERFIL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#eae0d5]"
          >
            {/* Banner de Fondo Artesanal */}
            <div className="h-44 bg-gradient-to-r from-[#7a4b2c] via-[#8b5e3c] to-[#a47148] relative p-6 flex items-start">
              <div className="absolute inset-0 opacity-15 bg-[radial-[#fff]_1px,transparent_1px] [background-size:16px_16px]"></div>
              <div className="relative z-10 text-white flex justify-between items-center w-full pt-1">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/30 shadow-sm">
                    {isArtesano ? "🎨 Artesano Creador" : "🛍️ Comprador Registrado"}
                  </span>
                </div>
                <div className="hidden sm:block text-right text-xs opacity-90">
                  <p className="font-medium">Corazón Artesano</p>
                  <p className="text-[11px] opacity-80">Sincelejo, Sucre - Colombia</p>
                </div>
              </div>
            </div>

            {/* AVATAR + DATOS RÁPIDOS */}
            <div className="px-6 md:px-8 pb-6 relative flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                {/* Foto Personal de Perfil con Cargador */}
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#e8decb] flex items-center justify-center text-[#8b5e3c] text-3xl font-bold">
                    {getAvatarSrc() ? (
                      <img
                        src={getAvatarSrc()}
                        alt={user?.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(user?.nombre)}</span>
                    )}
                  </div>

                  {/* Botón flotante para subir foto */}
                  <label
                    htmlFor="fotoInput"
                    className="absolute bottom-1 right-1 bg-[#8b5e3c] text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-[#754d31] transition hover:scale-110 border-2 border-white"
                    title="Cambiar foto de perfil"
                  >
                    <FaCamera className="text-sm" />
                    <input
                      type="file"
                      id="fotoInput"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-[#3e2723] flex items-center justify-center sm:justify-start gap-2">
                    {user?.nombre}
                    <FaCheckCircle className="text-emerald-500 text-sm" title="Usuario Verificado" />
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {user?.email}
                  </p>
                  {user?.especialidad && (
                    <p className="text-xs font-semibold text-[#8b5e3c] mt-1 bg-[#fbf7f3] inline-block px-2.5 py-0.5 rounded-lg border border-[#eee5db]">
                      ✨ {user.especialidad}
                    </p>
                  )}
                </div>
              </div>

              {/* Botón Acción rápida */}
              <div className="flex justify-center md:justify-end">
                <button
                  onClick={() => setActiveTab(activeTab === "editar" ? "vista" : "editar")}
                  className="flex items-center gap-2 bg-[#8b5e3c] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#754d31] transition shadow-md"
                >
                  <FaPen /> {activeTab === "editar" ? "Ver Mi Perfil" : "Editar Mis Datos"}
                </button>
              </div>
            </div>

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div className="border-t border-[#f0e6dd] bg-[#faf7f3] px-6 flex gap-6 text-xs font-bold">
              <button
                onClick={() => setActiveTab("vista")}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                  activeTab === "vista"
                    ? "border-[#8b5e3c] text-[#8b5e3c]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <FaUser /> Datos de Registro
              </button>

              <button
                onClick={() => setActiveTab("editar")}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                  activeTab === "editar"
                    ? "border-[#8b5e3c] text-[#8b5e3c]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <FaPen /> Editar Información
              </button>

              <button
                onClick={() => setActiveTab("seguridad")}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                  activeTab === "seguridad"
                    ? "border-[#8b5e3c] text-[#8b5e3c]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <FaShieldAlt /> Seguridad & Clave
              </button>
            </div>
          </motion.div>

          {/* ALERTAS */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 shadow-sm flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => setError("")} className="font-bold ml-4">✕</button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between font-semibold"
            >
              <span>✅ {success}</span>
              <button onClick={() => setSuccess("")} className="font-bold ml-4">✕</button>
            </motion.div>
          )}

          {/* ALERTA DE PREVISUALIZACIÓN DE FOTO SELECCIONADA */}
          {selectedFile && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Previsualización"
                  className="w-10 h-10 rounded-full object-cover border border-amber-300 shadow-sm"
                />
                <div>
                  <p className="font-bold">Nueva foto seleccionada: {selectedFile.name}</p>
                  <p className="text-[11px] text-amber-600">Haz clic en "Guardar Cambios" para confirmar la actualización de tu foto personal.</p>
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#8b5e3c] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#754d31] transition shrink-0"
              >
                {saving ? "Guardando foto..." : "Guardar Foto"}
              </button>
            </div>
          )}

          {/* TAB 1: VER DATOS DE REGISTRO */}
          {activeTab === "vista" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {/* Tarjeta Principal Datos de Registro */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eae0d5] space-y-6">
                <div className="border-b border-[#f1ece7] pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-[#7a4b2c] flex items-center gap-2">
                      <FaIdCard /> Información de Registro de Cuenta
                    </h3>
                    <p className="text-xs text-gray-500">
                      Datos personales ingresados durante el registro en Corazón Artesano.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#8b5e3c] bg-[#fbf7f3] px-3 py-1 rounded-full border border-[#eee3d7]">
                    Cuenta Verificada
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Nombre Completo
                    </span>
                    <p className="text-sm font-bold text-gray-800">{user?.nombre}</p>
                  </div>

                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Correo Electrónico
                    </span>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 break-all">
                      <FaEnvelope className="text-[#8b5e3c] shrink-0" />
                      {user?.email}
                    </p>
                  </div>

                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Documento de Identidad
                    </span>
                    <p className="text-sm font-bold text-gray-800">
                      {user?.tipo_documento || "CC"} - {user?.identificacion}
                    </p>
                  </div>

                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Rol en la Plataforma
                    </span>
                    <p className="text-sm font-bold text-[#8b5e3c] capitalize flex items-center gap-1.5">
                      {isArtesano ? <FaStore /> : <FaUser />}
                      {user?.rol || "comprador"}
                    </p>
                  </div>

                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Teléfono de Contacto
                    </span>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <FaPhone className="text-[#8b5e3c]" />
                      {user?.telefono || "No especificado"}
                    </p>
                  </div>

                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Ubicación / Municipio
                    </span>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-[#8b5e3c]" />
                      {user?.ubicacion || "Sincelejo, Sucre"}
                    </p>
                  </div>
                </div>

                {user?.especialidad && (
                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Especialidad Artesanal
                    </span>
                    <p className="text-sm font-bold text-[#7a4b2c] flex items-center gap-1.5">
                      <FaPaintBrush /> {user.especialidad}
                    </p>
                  </div>
                )}

                {user?.biografia && (
                  <div className="bg-[#faf7f3] p-4 rounded-2xl border border-[#f1ece7]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                      Biografía / Reseña del Artesano
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed italic">
                      "{user.biografia}"
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Derecha - Estado e Identidad Artesanal */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#eae0d5] space-y-4">
                  <h4 className="font-bold text-sm text-[#7a4b2c] flex items-center gap-2">
                    <FaShieldAlt className="text-[#8b5e3c]" /> Estado del Perfil
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-gray-500">Cuenta activa desde:</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1">
                        <FaCalendarAlt className="text-gray-400" />
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString("es-CO", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "2026"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-gray-500">Foto Personal:</span>
                      <span className="font-semibold text-emerald-600">
                        {user?.foto ? "Cargada ✅" : "No asignada 📷"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-gray-500">Capacitaciones Moodle:</span>
                      <span className="font-semibold text-[#8b5e3c]">Habilitado 🎓</span>
                    </div>
                  </div>
                </div>

                {isArtesano && (
                  <div className="bg-gradient-to-br from-[#7a4b2c] to-[#9c6943] rounded-3xl p-6 text-white shadow-md space-y-3">
                    <h4 className="font-bold text-base flex items-center gap-2">
                      <FaStore /> Taller Artesanal Activo
                    </h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                      Como artesano de Corazón Artesano, tus productos se muestran directamente en nuestro catálogo regional para compradores de todo Colombia.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: EDITAR PERFIL */}
          {activeTab === "editar" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eae0d5]"
            >
              <h3 className="text-lg font-bold text-[#7a4b2c] mb-1">
                Actualizar Información del Perfil
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Modifica tus datos de registro, especialidad y foto personal para que tus compradores te conozcan.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Cargador de foto personal */}
                <div className="bg-[#faf7f3] p-5 rounded-2xl border border-[#f1ece7] flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#e8decb] flex items-center justify-center font-bold text-[#8b5e3c] text-xl shrink-0 border-2 border-white shadow">
                    {getAvatarSrc() ? (
                      <img src={getAvatarSrc()} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(formData.nombre)}</span>
                    )}
                  </div>

                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <label className="block text-xs font-bold text-[#7a4b2c]">
                      Foto Personal de Perfil
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Sube una fotografía nítida (JPG, PNG). Tamaño recomendado máximo 15MB.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8b5e3c] file:text-white hover:file:bg-[#754d31] cursor-pointer pt-1"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Correo Electrónico (Solo Lectura)
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full p-3 rounded-xl bg-[#e5dfd8] text-xs text-gray-600 outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tipo de Documento
                    </label>
                    <select
                      name="tipo_documento"
                      value={formData.tipo_documento}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c] font-semibold text-gray-700"
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="NIT">NIT</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      name="identificacion"
                      value={formData.identificacion}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      placeholder="Ej: +57 300 123 4567"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Ubicación / Municipio
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      placeholder="Ej: Sincelejo, Sucre"
                      value={formData.ubicacion}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>
                </div>

                {isArtesano && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Especialidad Artesanal
                    </label>
                    <input
                      type="text"
                      name="especialidad"
                      placeholder="Ej: Tejido en Caña Flecha / Filigrana Momposina"
                      value={formData.especialidad}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Biografía / Historia del Artesano
                  </label>
                  <textarea
                    name="biografia"
                    rows="3"
                    placeholder="Escribe brevemente tu trayectoria, tradición o historia artesanal..."
                    value={formData.biografia}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setActiveTab("vista")}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#8b5e3c] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#754d31] transition shadow-md disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* TAB 3: CAMBIAR CONTRASEÑA */}
          {activeTab === "seguridad" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eae0d5] max-w-xl mx-auto"
            >
              <h3 className="text-lg font-bold text-[#7a4b2c] mb-1 flex items-center gap-2">
                <FaLock className="text-[#8b5e3c]" /> Seguridad de la Cuenta
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Actualiza tu contraseña para mantener protegida tu cuenta en Corazón Artesano.
              </p>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    name="passwordActual"
                    value={passData.passwordActual}
                    onChange={handlePassChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    name="nuevaPassword"
                    placeholder="Mínimo 6 caracteres"
                    value={passData.nuevaPassword}
                    onChange={handlePassChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    name="confirmarPassword"
                    value={passData.confirmarPassword}
                    onChange={handlePassChange}
                    required
                    className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#754d31] transition shadow-md disabled:opacity-60"
                  >
                    {saving ? "Cambiando contraseña..." : "Actualizar Contraseña"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
