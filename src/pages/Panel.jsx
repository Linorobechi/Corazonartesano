import { useEffect, useState } from "react";
import Footer from "../Components/Footer";

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

  useEffect(() => {
    const loadProducts = async () => {
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

    loadProducts();
  }, []);

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

  const refreshProducts = async () => {
    const response = await fetch("/api/products");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudieron cargar los productos");
    }

    setProducts(data.products || []);
  };

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
      window.dispatchEvent(
        new CustomEvent("app-notification", {
          detail: {
            type: "success",
            message: "Producto agregado correctamente",
          },
        })
      );
    } catch (saveError) {
      setError(saveError.message);
      window.dispatchEvent(
        new CustomEvent("app-notification", {
          detail: {
            type: "error",
            message: saveError.message,
          },
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="bg-[#f5f1ec] py-20 px-4 min-h-[70vh]">
        <div className="max-w-6xl mx-auto space-y-8 mt-10">
          <div className="flex justify-start">
            <a
              href="/agregar-productos"
              className="inline-flex items-center rounded-full bg-[#8b5e3c] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#754d31]"
            >
              Agregar productos
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-semibold text-[#8b5e3c] mb-4">
              Agregar productos
            </h2>
            <p className="text-gray-600 mb-6">
              Desde aquí puedes agregar productos a la base de datos local. El
              producto quedará asociado al usuario que inició sesión.
            </p>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="rounded-xl bg-[#f1ece7] p-4">
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-lg font-medium">{user?.nombre || "-"}</p>
              </div>
              <div className="rounded-xl bg-[#f1ece7] p-4">
                <p className="text-sm text-gray-500">Correo</p>
                <p className="text-lg font-medium">{user?.email || "-"}</p>
              </div>
              <div className="rounded-xl bg-[#f1ece7] p-4">
                <p className="text-sm text-gray-500">Identificación</p>
                <p className="text-lg font-medium">
                  {user?.identificacion || "-"}
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Nuevo producto
                </h3>

                <div className="rounded-xl border border-dashed border-[#d9c7b8] bg-[#fbf8f5] p-4 text-sm text-gray-600">
                  El autor se guardará automáticamente con tu cuenta.
                </div>

                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />

                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción"
                  rows="4"
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />

                <input
                  name="precio"
                  type="number"
                  min="1"
                  value={form.precio}
                  onChange={handleChange}
                  placeholder="Precio"
                  className="w-full p-3 rounded-md bg-[#f1ece7] outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                />

                <input
                  name="image_file"
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleChange}
                  className="w-full rounded-md bg-[#f1ece7] p-3 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#8b5e3c] file:px-4 file:py-2 file:text-white hover:file:bg-[#754d31]"
                />

                {imagePreview && (
                  <div className="rounded-xl border border-[#eaded3] bg-[#faf7f3] p-3">
                    <p className="text-xs text-gray-500 mb-2">Vista previa</p>
                    <img
                      src={imagePreview}
                      alt="Vista previa del producto"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#8b5e3c] text-white py-3 rounded-md hover:bg-[#754d31] disabled:opacity-70"
                >
                  {saving ? "Guardando..." : "Agregar producto"}
                </button>

                {message && (
                  <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                    {message}
                  </p>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </p>
                )}
              </form>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Productos en base de datos
                </h3>

                {loadingProducts ? (
                  <p className="text-gray-600">Cargando productos...</p>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl border border-[#eaded3] bg-[#faf7f3] p-4"
                      >
                        <p className="font-semibold text-[#3b2a1f]">
                          {product.nombre}
                        </p>
                        <p className="text-sm text-gray-600">{product.autor}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {product.precio} | {product.rating}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
