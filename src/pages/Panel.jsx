import { useEffect, useState } from "react";
import Footer from "../Components/Footer";
import { FaPlus, FaEdit, FaTrash, FaStore, FaImage } from "react-icons/fa";

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "",
};

export default function Panel() {
  const storedUser = localStorage.getItem("auth_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Edit Mode state (RF-06)
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editImageFile, setEditImageFile] = useState(null);

  useEffect(() => {
    refreshProducts();
  }, []);

  const refreshProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los productos");
      }
      setProducts(data.products || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadingProducts(false);
    }
  };

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

  // RF-06: CREATE PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
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

      const response = await fetch("/api/products", {
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

      setMessage("Producto agregado correctamente");
      setForm(emptyForm);
      setImagePreview("");
      setImageFile(null);
      await refreshProducts();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  // RF-06: DELETE PRODUCT
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${productName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/products/${productId}`, {
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
    } catch (delErr) {
      setError(delErr.message);
    }
  };

  // RF-06: UPDATE PRODUCT
  const handleStartEdit = (prod) => {
    setEditingProduct(prod);
    setEditForm({
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: prod.rawPrecio || prod.precio.toString().replace(/[^0-9]/g, ""),
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("auth_token");
      const payload = new FormData();
      payload.append("nombre", editForm.nombre);
      payload.append("descripcion", editForm.descripcion);
      payload.append("precio", editForm.precio);

      if (editImageFile) {
        payload.append("image_file", editImageFile);
      }

      const response = await fetch(`/api/products/${editingProduct.id}`, {
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

      setMessage("Producto actualizado correctamente");
      setEditingProduct(null);
      setEditImageFile(null);
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-[#eae0d5] flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#f1ece7] text-[#8b5e3c] px-3.5 py-1 rounded-full text-xs font-semibold">
                <FaStore /> Panel de Gestión Artesanal (RF-06)
              </div>
              <h2 className="text-3xl font-bold text-[#8b5e3c] mt-2">
                Gestión de Productos Artesanales
              </h2>
              <p className="text-gray-600 text-xs mt-1">
                Crea, consulta, actualiza y elimina tus publicaciones en el catálogo global.
              </p>
            </div>

            <div className="flex gap-4">
              <span className="bg-[#faf7f2] px-4 py-2 rounded-2xl border border-[#ede3d8] text-xs">
                Rol: <strong className="text-[#8b5e3c] capitalize">{user?.rol || "Artesano"}</strong>
              </span>
            </div>
          </div>

          {/* User Info Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae0d5]">
              <p className="text-xs text-gray-500">Nombre Artesano</p>
              <p className="text-sm font-semibold text-gray-800">{user?.nombre || "-"}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae0d5]">
              <p className="text-xs text-gray-500">Correo Registrado</p>
              <p className="text-sm font-semibold text-gray-800">{user?.email || "-"}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae0d5]">
              <p className="text-xs text-gray-500">Documento de Identidad</p>
              <p className="text-sm font-semibold text-gray-800">
                {user?.tipo_documento || "CC"} {user?.identificacion || "-"}
              </p>
            </div>
          </div>

          {/* Notification Messages */}
          {message && (
            <p className="text-xs text-green-700 bg-green-50 p-3 rounded-2xl border border-green-200 font-semibold">
              {message}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200 font-semibold">
              {error}
            </p>
          )}

          {/* EDIT PRODUCT MODAL (RF-06) */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full space-y-4 border border-[#eae0d5]">
                <h3 className="text-lg font-bold text-[#8b5e3c]">
                  Editar Producto #{editingProduct.id}
                </h3>

                <form onSubmit={handleUpdateProduct} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Precio (COP)</label>
                    <input
                      type="number"
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
                      onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl bg-[#f1ece7] p-2 text-xs"
                    />
                  </div>

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
                      className="px-5 py-2 rounded-xl bg-[#8b5e3c] text-white text-xs font-semibold hover:bg-[#754d31]"
                    >
                      Guardar Cambios
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
                El autor se asociará automáticamente a tu nombre de artesano (<strong>{user?.nombre}</strong>).
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
                  placeholder="Detalla los materiales, origen y elaboración..."
                  rows="3"
                  required
                  className="w-full p-3 rounded-xl bg-[#f1ece7] text-xs outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Precio (COP)</label>
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
                  <p className="text-[11px] text-gray-500 mb-1.5 font-semibold">Vista Previa</p>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="h-36 w-full rounded-xl object-cover"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl hover:bg-[#754d31] transition font-bold text-xs shadow-md disabled:opacity-70"
              >
                {saving ? "Guardando en Catálogo..." : "Publicar Producto Artesanal"}
              </button>
            </form>

            {/* Existing Products List with CRUD controls */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">Catálogo de Productos</h3>
                <span className="text-xs text-gray-500">{products.length} productos</span>
              </div>

              {loadingProducts ? (
                <p className="text-xs text-gray-500 py-8 text-center">Cargando catálogo...</p>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="rounded-2xl border border-[#eaded3] bg-[#faf7f3] p-4 flex justify-between items-center gap-4"
                    >
                      <div>
                        <p className="font-bold text-sm text-gray-800">{prod.nombre}</p>
                        <p className="text-xs text-gray-500">Por {prod.autor}</p>
                        <p className="text-xs font-bold text-[#8b5e3c] mt-1">{prod.precio}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(prod)}
                          className="p-2.5 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition text-xs"
                          title="Editar producto"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                          className="p-2.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition text-xs"
                          title="Eliminar producto"
                        >
                          <FaTrash />
                        </button>
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
