import { useState } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
import {
  FaCreditCard,
  FaUniversity,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaShoppingBag,
  FaEnvelope,
} from "react-icons/fa";

export default function Checkout() {
  const { cartItems, subtotal, tax, shipping, total, clearCart, formatCurrency } = useCart();

  const storedUser = localStorage.getItem("auth_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardForm, setCardForm] = useState({
    name: user?.nombre || "",
    number: "4532 8901 2345 6789",
    expiry: "12/28",
    cvc: "888",
  });

  const [pseBank, setPseBank] = useState("Bancolombia");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCardChange = (e) => {
    setCardForm({ ...cardForm, [e.target.name]: e.target.value });
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Debes iniciar sesión para finalizar la compra");
      }

      const payload = {
        items: cartItems,
        paymentMethod:
          paymentMethod === "card"
            ? "Tarjeta de Crédito / Débito"
            : paymentMethod === "pse"
            ? `PSE (${pseBank})`
            : "Transferencia / Nequi",
        paymentDetails: {
          cardNumber: cardForm.number,
          cardName: cardForm.name,
          bank: pseBank,
        },
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo procesar la transacción");
      }

      setResult(data);
      if (data.status === "APPROVED") {
        clearCart();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !result) {
    return (
      <>
        <div className="bg-[#f5f1ec] pt-28 pb-20 px-4 min-h-[70vh] flex flex-col items-center justify-center text-center">
          <FaShoppingBag className="text-6xl text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-[#8b5e3c] mb-2">Tu carrito está vacío</h2>
          <p className="text-sm text-gray-600 mb-6">
            Agrega productos a tu carrito antes de proceder a la pasarela de pagos.
          </p>
          <Link
            to="/productos"
            className="bg-[#8b5e3c] text-white px-6 py-3 rounded-xl hover:bg-[#754d31] transition font-semibold"
          >
            Ver Catálogo de Productos
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4 md:px-12 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-[#eae0d5] text-[#8b5e3c] px-3.5 py-1 rounded-full text-xs font-semibold">
              <FaLock className="text-xs" /> Pasarela de Pagos Segura
            </span>
            <h1 className="text-3xl font-bold text-[#8b5e3c]">Finalizar Compra</h1>
            <p className="text-xs text-gray-600">
              Procesamiento de pagos cifrado con notificación automática por correo electrónico.
            </p>
          </div>

          {result ? (
            /* PAYMENT RESULT MODAL / VIEW (RF-07, RF-10) */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-xl p-8 max-w-xl mx-auto text-center border border-[#eae0d5] space-y-6"
            >
              {result.status === "APPROVED" ? (
                <>
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <FaCheckCircle className="text-4xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-700">¡Pago Aprobado Exitosamente!</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Orden #{result.orderId} | ID Transacción: {result.transaction_id}
                    </p>
                  </div>

                  <div className="bg-[#faf7f2] p-5 rounded-2xl text-left text-xs space-y-2 border border-[#ede3d8]">
                    <p className="font-semibold text-gray-800 border-b pb-2 text-sm">
                      Resumen del Pago
                    </p>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(result.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (19%):</span>
                      <span className="font-semibold">{formatCurrency(result.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span className="font-semibold">
                        {result.shipping === 0 ? "GRATIS" : formatCurrency(result.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#8b5e3c] pt-2 border-t">
                      <span>Total Abonado:</span>
                      <span>{result.formattedTotal}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-left text-xs text-blue-800">
                    <FaEnvelope className="text-xl flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Notificación Enviada (RF-10)</p>
                      <p>
                        Se ha enviado el comprobante oficial de pago aprobado al correo:{" "}
                        <strong>{result.emailSentTo}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center gap-4">
                    <Link
                      to="/productos"
                      className="bg-[#8b5e3c] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#754d31]"
                    >
                      Seguir Comprando
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <FaTimesCircle className="text-4xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-700">Pago Rechazado</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      ID Transacción: {result.transaction_id}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">
                    La entidad financiera no aprobó la transacción. Por favor verifica el saldo o intenta con otro método de pago.
                  </p>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-left text-xs text-red-800">
                    <FaEnvelope className="text-xl flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Notificación de Rechazo Enviada (RF-10)</p>
                      <p>
                        Se envió la notificación al correo: <strong>{result.emailSentTo}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setResult(null)}
                    className="bg-[#8b5e3c] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#754d31]"
                  >
                    Reintentar Pago
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            /* CHECKOUT FORM */
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Payment Methods & Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Method selector */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">1. Selecciona Método de Pago</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition ${
                        paymentMethod === "card"
                          ? "border-[#8b5e3c] bg-[#fbf7f3] text-[#8b5e3c] font-bold"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <FaCreditCard className="text-2xl" />
                      <span className="text-xs">Tarjeta Crédito / Débito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pse")}
                      className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition ${
                        paymentMethod === "pse"
                          ? "border-[#8b5e3c] bg-[#fbf7f3] text-[#8b5e3c] font-bold"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <FaUniversity className="text-2xl" />
                      <span className="text-xs">PSE (Débito Bancario)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("transfer")}
                      className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition ${
                        paymentMethod === "transfer"
                          ? "border-[#8b5e3c] bg-[#fbf7f3] text-[#8b5e3c] font-bold"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <FaShieldAlt className="text-2xl" />
                      <span className="text-xs">Nequi / Daviplata</span>
                    </button>
                  </div>
                </div>

                {/* Method Form */}
                <form
                  onSubmit={handleProcessPayment}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-4"
                >
                  <h3 className="text-lg font-bold text-gray-800">2. Datos de Pago</h3>

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nombre en la Tarjeta
                        </label>
                        <input
                          name="name"
                          value={cardForm.name}
                          onChange={handleCardChange}
                          required
                          placeholder="Nombre del Titular"
                          className="w-full px-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Número de Tarjeta
                        </label>
                        <input
                          name="number"
                          value={cardForm.number}
                          onChange={handleCardChange}
                          required
                          placeholder="4532 0000 0000 0000"
                          className="w-full px-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          Tip: Tarjetas que terminen en <strong>0000</strong> simularán un pago RECHAZADO para pruebas de notificación.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Vencimiento
                          </label>
                          <input
                            name="expiry"
                            value={cardForm.expiry}
                            onChange={handleCardChange}
                            required
                            placeholder="MM/AA"
                            className="w-full px-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            CVC / CVV
                          </label>
                          <input
                            name="cvc"
                            value={cardForm.cvc}
                            onChange={handleCardChange}
                            required
                            placeholder="123"
                            maxLength="4"
                            className="w-full px-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "pse" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Selecciona tu Banco
                        </label>
                        <select
                          value={pseBank}
                          onChange={(e) => setPseBank(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#f1ece7] text-sm outline-none focus:ring-2 focus:ring-[#8b5e3c]"
                        >
                          <option value="Bancolombia">Bancolombia</option>
                          <option value="Davivienda">Davivienda</option>
                          <option value="Nequi">Nequi</option>
                          <option value="Banco de Bogotá">Banco de Bogotá</option>
                          <option value="BBVA Colombia">BBVA Colombia</option>
                        </select>
                      </div>

                      <p className="text-xs text-gray-500 bg-[#faf7f2] p-3 rounded-xl border border-[#ede3d8]">
                        Al hacer clic en pagar, serás redirigido a la interfaz bancaria segura de {pseBank} para confirmar el débito.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "transfer" && (
                    <div className="bg-[#faf7f2] p-4 rounded-xl border border-[#ede3d8] space-y-2 text-xs text-gray-700">
                      <p className="font-semibold text-gray-800 text-sm">Transferencia Directa Nequi / Daviplata</p>
                      <p>
                        Transferir al número: <strong>300 123 4567</strong> a nombre de <em>Corazón Artesano S.A.S.</em>
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Una vez completado la confirmación procesará automáticamente el pedido y te enviará la notificación al correo registrado.
                      </p>
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8b5e3c] text-white py-3.5 rounded-xl hover:bg-[#754d31] transition font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <FaLock />
                    {loading ? "Procesando Pago Seguro..." : `Pagar ${formatCurrency(total)}`}
                  </button>
                </form>
              </div>

              {/* Order Summary Sidebar (RF-09) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-4 h-fit">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-3">Resumen de la Orden</h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{item.nombre}</p>
                        <p className="text-gray-500">Cantidad: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-[#8b5e3c]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal Productos:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-semibold text-gray-800">
                      {shipping === 0 ? "GRATIS" : formatCurrency(shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-[#8b5e3c] pt-3 border-t border-[#eae0d5]">
                    <span>Total a Pagar:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
