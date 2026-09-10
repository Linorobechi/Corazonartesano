import { useEffect, useState, useCallback } from "react";
import Footer from "../Components/Footer";
import { FaPlus, FaEdit, FaTrash, FaStore, FaBoxOpen, FaLayerGroup, FaUserTag, FaCheckCircle } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "";

const safeFetch = async (endpoint, options = {}) => {
  let url = API_URL ? `${API_URL}${endpoint}` : endpoint;
  let response;
  try {
    response = await fetch(url, options);
    if (!response.ok && API_URL && url !== endpoint) {
      const localResponse = await fetch(endpoint, options);
      if (localResponse.ok) {
        response = localResponse;
      }
    }
  } catch (err) {
    if (url !== endpoint) {
      response = await fetch(endpoint, options);
    } else {
      throw err;
    }
  }
  return response;
};

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "",
};

export default function Panel() {
  const storedUser = localStorage.getItem("auth_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [filterTab, setFilterTab] = useState("todos"); // 'todos' | 'mis_productos'
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Edit Mode state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);
    setError("");
    try {
      const response = await safeFetch("/api/products");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los productos");
      }
      setProducts(data.products || []);
    } catch (loadError) {
      console.error("Error al cargar productos:", loadError);
      setError("No se pudieron cargar los productos del catálogo.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleChange = (e) => {
    if (e.target.name === "image_file") {
      const file = e.target.files?.[0];
      if (!file) {
        setImagePreview("");
        setImageFile(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        setImagePreview(result);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
      return;
    }

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setEditImagePreview("");
      setEditImageFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setEditImagePreview(result);
      setEditImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  // CREATE PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.nombre || !form.descripcion || !form.precio) {
      setError("Por favor completa todos los campos del producto.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("auth_token");
      const payload = new FormData();

      payload.append("nombre", form.nombre);
      payload.append("descripcion", form.descripcion);
      payload.append("precio", form.precio);

      if (imageFile) {
        payload.append("image_file", imageFile);
      }

      const response = await safeFetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo crear el producto");
      }

      setMessage("¡Producto publicado correctamente en el catálogo!");
      setForm(emptyForm);
      setImagePreview("");
      setImageFile(null);
      await refreshProducts();
      setTimeout(() => setMessage(""), 4000);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE PRODUCT
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${productName}" del catálogo?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await safeFetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo eliminar el producto");
      }

      setMessage(`Producto "${productName}" eliminado con éxito.`);
      await refreshProducts();
      setTimeout(() => setMessage(""), 4000);
    } catch (delErr) {
      setError(delErr.message);
    }
  };

  // UPDATE PRODUCT
  const handleStartEdit = (prod) => {
    setEditingProduct(prod);
    setEditImagePreview("");
    setEditImageFile(null);
    setEditForm({
      nombre: prod.nombre || "",
      descripcion: prod.descripcion || "",
      precio: prod.rawPrecio ? String(prod.rawPrecio) : (prod.precio ? String(prod.precio).replace(/[^0-9]/g, "") : ""),
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const token = localStorage.getItem("auth_token");
      const payload = new FormData();
      payload.append("nombre", editForm.nombre);
      payload.append("descripcion", editForm.descripcion);
      payload.append("precio", editForm.precio);

      if (editImageFile) {
        payload.append("image_file", editImageFile);
      }

      const response = await safeFetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el producto");
      }

      setMessage(`Producto "${editForm.nombre}" actualizado correctamente.`);
      setEditingProduct(null);
      setEditImageFile(null);
      setEditImagePreview("");
      await refreshProducts();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isMyProduct = (prod) => {
    if (!user) return false;
    if (prod.author_user_id && Number(prod.author_user_id) === Number(user.id)) return true;
    if (user.nombre && prod.autor && prod.autor.toLowerCase().trim() === user.nombre.toLowerCase().trim()) return true;
    return false;
  };

  const canEditProduct = (prod) => {
    if (!user) return false;
    if (user.rol === "admin") return true;
    return isMyProduct(prod);
  };

  const displayedProducts = filterTab === "mis_productos"
    ? products.filter((p) => isMyProduct(p))
    : products;

  const myProductsCount = products.filter((p) => isMyProduct(p)).length;

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-[#eae0d5] flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#f1ece7] text-[#8b5e3c] px-3.5 py-1 rounded-full text-xs font-semibold">
                <FaStore /> Panel de Gestión Artesanal
              </div>
              <h2 className="text-3xl font-bold text-[#8b5e3c] mt-2">
                Gestión & Publicación de Productos
              </h2>
              <p className="text-gray-600 text-xs mt-1">
                Publica piezas artesanales únicas, edita precios, fotos y gestiona el catálogo global.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-[#faf7f2] px-4 py-2 rounded-2xl border border-[#ede3d8] text-xs font-semibold text-[#8b5e3c]">
                Rol: <strong className="capitalize">{user?.rol || "Artesano"}</strong>
              </span>
            </div>
          </div>

          {/* User Info & Stats Bar */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae0d5] flex items-center gap-3">
              <div className="p-3 bg-[#fbf7f3] text-[#8b5e3c] rounded-xl text-lg">
                <FaUserTag />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-semibold uppercase">Artesano Creador</p>
                <p className="text-sm font-bold text-gray-800">{user?.nombre || "Artesano"}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae0d5] flex items-center gap-3">
              <div className="p-3 bg-[#fbf7f3] text-[#8b5e3c] rounded-xl text-lg">
                <FaLayerGroup />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-semibold uppercase">Catálogo Global</p>
                <p className="text-sm font-bold text-gray-800">{products.length} Productos</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae0d5] flex items-center gap-3">
              <div className="p-3 bg-[#fbf7f3] text-[#8b5e3c] rounded-xl text-lg">
                <FaBoxOpen />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-semibold uppercase">Mis Publicaciones</p>
                <p className="text-sm font-bold text-[#8b5e3c]">{myProductsCount} Productos</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae0d5] flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-lg">
                <FaCheckCircle />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-semibold uppercase">Estado de Cuenta</p>
                <p className="text-xs font-bold text-emerald-700">Verificado para Publicar</p>
              </div>
            </div>
          </div>

          {/* Notification Alerts */}
          {message && (
            <div className="text-xs text-green-800 bg-green-50 p-4 rounded-2xl border border-green-200 font-semibold shadow-sm flex justify-between items-center">
              <span>✅ {message}</span>
              <button onClick={() => setMessage("")} className="font-bold">✕</button>
            </div>
          )}
          {error && (
            <div className="text-xs text-red-700 bg-red-50 p-4 rounded-2xl border border-red-200 font-semibold shadow-sm flex justify-between items-center">
              <span>⚠️ {error}</span>
              <button onClick={() => setError("")} className="font-bold">✕</button>
            </div>
          )}

          {/* EDIT PRODUCT MODAL */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full space-y-4 border border-[#eae0d5] relative animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-lg font-bold text-[#8b5e3c] flex items-center gap-2">
                    <FaEdit /> Editar Producto #{editingProduct.id}
                  </h3>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Producto</label>
                    <input
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      required
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={editForm.descripcion}
                      onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                      rows="3"
                      required
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Precio en COP ($)</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.precio}
                      onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
                      required
                      className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cambiar Imagen (Opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="w-full rounded-xl bg-[#f1ece7] p-2 text-xs"
                    />
                  </div>

                  {editImagePreview && (
                    <div className="rounded-2xl border border-[#eaded3] bg-[#faf7f3] p-2">
                      <p className="text-[10px] text-gray-500 mb-1 font-semibold">Nueva Imagen Seleccionada:</p>
                      <img
                        src={editImagePreview}
                        alt="Previsualización"
                        className="h-28 w-full rounded-xl object-cover"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-xs font-semibold hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-[#8b5e3c] text-white text-xs font-bold hover:bg-[#754d31] transition shadow-md disabled:opacity-70"
                    >
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Form & List Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Create Product Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaPlus className="text-[#8b5e3c]" /> Publicar Nuevo Producto
              </h3>

              <div className="rounded-2xl border border-dashed border-[#d9c7b8] bg-[#fbf8f5] p-3 text-xs text-gray-600">
                La pieza se registrará automáticamente a tu nombre de artesano (<strong>{user?.nombre || "Artesano"}</strong>).
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Producto</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="ej. Mochila Wayuu Tejida a Mano"
                  required
                  className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción de la Pieza</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Detalla los materiales, origen y técnica artesanal empleada..."
                  rows="3"
                  required
                  className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Precio (COP $)</label>
                <input
                  name="precio"
                  type="number"
                  min="1"
                  value={form.precio}
                  onChange={handleChange}
                  placeholder="ej. 150000"
                  required
                  className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fotografía del Producto</label>
                <input
                  name="image_file"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#f1ece7] p-2 text-xs"
                />
              </div>

              {imagePreview && (
                <div className="rounded-2xl border border-[#eaded3] bg-[#faf7f3] p-3">
                  <p className="text-[11px] text-gray-500 mb-1.5 font-semibold">Vista Previa de la Fotografía</p>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="h-40 w-full rounded-xl object-cover shadow-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#8b5e3c] text-white py-3.5 rounded-xl hover:bg-[#754d31] transition font-bold text-xs shadow-md disabled:opacity-70"
              >
                {saving ? "Guardando en Catálogo..." : "Publicar Producto Artesanal"}
              </button>
            </form>

            {/* Existing Products List with CRUD controls */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">Gestión de Catálogo</h3>

                {/* Filter Tabs */}
                <div className="flex gap-1.5 bg-[#f5f1ec] p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFilterTab("todos")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filterTab === "todos"
                        ? "bg-[#8b5e3c] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Todos ({products.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab("mis_productos")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filterTab === "mis_productos"
                        ? "bg-[#8b5e3c] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Mis Productos ({myProductsCount})
                  </button>
                </div>
              </div>

              {loadingProducts ? (
                <div className="text-xs text-gray-500 py-12 text-center">
                  Cargando catálogo artesanal...
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="text-xs text-gray-500 py-12 text-center bg-[#faf7f3] rounded-2xl border border-dashed border-[#e2d5c7]">
                  {filterTab === "mis_productos"
                    ? "Aún no has publicado productos a tu nombre. ¡Usa el formulario para agregar tu primera pieza!"
                    : "No hay productos en el catálogo actualmente."}
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {displayedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="rounded-2xl border border-[#eaded3] bg-[#faf7f3] p-4 flex justify-between items-center gap-4 hover:border-[#d7c4b3] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-800">{prod.nombre}</p>
                          {isMyProduct(prod) && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                              Mi Pieza
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Por {prod.autor}</p>
                        <p className="text-xs font-bold text-[#8b5e3c]">{prod.precio}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canEditProduct(prod) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(prod)}
                              className="p-2.5 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition text-xs font-bold flex items-center gap-1"
                              title="Editar mi producto"
                            >
                              <FaEdit /> <span className="hidden sm:inline">Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                              className="p-2.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition text-xs font-bold flex items-center gap-1"
                              title="Eliminar mi producto"
                            >
                              <FaTrash /> <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-xl">
                            Solo lectura
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
