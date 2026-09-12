import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaShoppingBag,
  FaEnvelope,
  FaClock,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { createMercadoPagoPreference } from "../api/orders";

export default function Checkout() {
  const { cartItems, subtotal, tax, shipping, total, clearCart, formatCurrency } = useCart();

  const storedUser = localStorage.getItem("auth_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get("status") || searchParams.get("collection_status");
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id") || searchParams.get("external_reference");
  const paymentType = searchParams.get("payment_type");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inicializar el resultado sincronizadamente si venimos redirigidos de Mercado Pago
  const [result, setResult] = useState(() => {
    if (!urlStatus) return null;
    if (urlStatus === "approved") {
      return {
        status: "APPROVED",
        orderId: orderId || "MP-ORDEN",
        transaction_id: paymentId || `MP-${Date.now()}`,
        paymentMethod: paymentType ? `Mercado Pago (${paymentType})` : "Mercado Pago Colombia",
        formattedTotal: "Aprobado",
        emailSentTo: user?.email || "tu correo registrado",
      };
    }
    if (urlStatus === "pending" || urlStatus === "in_process") {
      return {
        status: "PENDING",
        orderId: orderId || "MP-PENDIENTE",
        transaction_id: paymentId || "Pendiente",
        paymentMethod: "Mercado Pago (Efecty / Transferencia)",
        formattedTotal: "En proceso",
        emailSentTo: user?.email || "tu correo registrado",
      };
    }
    if (urlStatus === "failure" || urlStatus === "rejected") {
      return {
        status: "REJECTED",
        orderId: orderId || "MP-FALLIDO",
        transaction_id: paymentId || "Cancelado",
        paymentMethod: "Mercado Pago",
        emailSentTo: user?.email || "tu correo registrado",
      };
    }
    return null;
  });

  // Limpiar el carrito de compras cuando el pago es aprobado por Mercado Pago
  useEffect(() => {
    if (urlStatus === "approved") {
      clearCart();
    }
  }, [urlStatus, clearCart]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const preferenceData = await createMercadoPagoPreference(cartItems);
      const redirectUrl = preferenceData?.sandboxInitPoint || preferenceData?.initPoint;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      throw new Error(preferenceData?.message || "No se pudo generar el enlace de pago de Mercado Pago");
    } catch (err) {
      setError(err.message || "Ocurrió un problema al conectar con Mercado Pago");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !result && !urlStatus) {
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
              Pagos protegidos mediante cifrado de 256 bits y verificación instantánea con Mercado Pago Colombia.
            </p>
          </div>

          {result ? (
            /* PAYMENT RESULT MODAL / VIEW */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-xl p-8 max-w-xl mx-auto text-center border border-[#eae0d5] space-y-6"
            >
              {result.status === "APPROVED" && (
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
                    {result.subtotal && (
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(result.subtotal)}</span>
                      </div>
                    )}
                    {result.tax && (
                      <div className="flex justify-between">
                        <span>IVA (19%):</span>
                        <span className="font-semibold">{formatCurrency(result.tax)}</span>
                      </div>
                    )}
                    {result.shipping !== undefined && (
                      <div className="flex justify-between">
                        <span>Envío:</span>
                        <span className="font-semibold">
                          {result.shipping === 0 ? "GRATIS" : formatCurrency(result.shipping)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#8b5e3c] pt-2 border-t">
                      <span>Total Abonado:</span>
                      <span>{result.formattedTotal || formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-left text-xs text-blue-800">
                    <FaEnvelope className="text-xl flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Transacción Registrada</p>
                      <p>
                        Tu orden ha sido registrada en el sistema y se encuentra en preparación para despacho.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center gap-4">
                    <Link
                      to="/panel"
                      className="bg-[#8b5e3c] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#754d31]"
                    >
                      Ver Mis Pedidos
                    </Link>
                    <Link
                      to="/productos"
                      className="bg-[#eae0d5] text-[#8b5e3c] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#ded2c4]"
                    >
                      Seguir Comprando
                    </Link>
                  </div>
                </>
              )}

              {result.status === "PENDING" && (
                <>
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                    <FaClock className="text-4xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-700">Pago en Proceso de Acreditación</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Orden #{result.orderId} | ID Transacción: {result.transaction_id}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">
                    Tu pago a través de Mercado Pago está en proceso. Si seleccionaste pago en efectivo (Efecty) o transferencia bancaria, se confirmará una vez recibido el depósito.
                  </p>

                  <div className="pt-4 flex justify-center gap-4">
                    <Link
                      to="/panel"
                      className="bg-[#8b5e3c] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#754d31]"
                    >
                      Ver Mis Pedidos
                    </Link>
                    <Link
                      to="/productos"
                      className="bg-[#eae0d5] text-[#8b5e3c] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#ded2c4]"
                    >
                      Seguir Comprando
                    </Link>
                  </div>
                </>
              )}

              {result.status === "REJECTED" && (
                <>
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <FaTimesCircle className="text-4xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-700">Pago Rechazado o Cancelado</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      ID Transacción: {result.transaction_id}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">
                    La pasarela de pago no pudo completar la transacción o fue cancelada. Por favor verifica tus datos o intenta con otro medio de pago en Mercado Pago.
                  </p>

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
              {/* Payment Info & Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Method presentation */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Método de Pago</h3>
                  <div className="p-4 rounded-2xl border-2 border-[#009ee3] bg-[#f0f9ff] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#009ee3] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FaShieldAlt className="text-2xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Mercado Pago Colombia</h4>
                        <span className="bg-[#009ee3] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Oficial
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        PSE, Tarjetas de Crédito y Débito, Nequi y Efectivo en Efecty.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleProcessPayment}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae0d5] space-y-5"
                >
                  <h3 className="text-lg font-bold text-gray-800">Confirmación y Pago</h3>

                  <div className="p-5 bg-gradient-to-br from-[#009ee3]/10 via-[#009ee3]/5 to-transparent border border-[#009ee3]/30 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#009ee3] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        Mercado Pago Oficial
                      </span>
                      <span className="text-xs text-gray-600 font-medium">Colombia (MCO - COP)</span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                      Al hacer clic en <strong>Pagar con Mercado Pago</strong>, serás redirigido a la pasarela segura oficial de Mercado Pago Colombia para seleccionar tu método favorito y completar la transacción.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-center shadow-xs">
                        <p className="text-[11px] font-bold text-gray-800">PSE</p>
                        <p className="text-[9px] text-gray-500">Cualquier banco</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-center shadow-xs">
                        <p className="text-[11px] font-bold text-gray-800">Tarjetas</p>
                        <p className="text-[9px] text-gray-500">Crédito y Débito</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-center shadow-xs">
                        <p className="text-[11px] font-bold text-gray-800">Nequi</p>
                        <p className="text-[9px] text-gray-500">Billetera virtual</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-center shadow-xs">
                        <p className="text-[11px] font-bold text-gray-800">Efecty</p>
                        <p className="text-[9px] text-gray-500">Efectivo en punto</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <FaLock className="text-[10px] text-green-600" /> Transacción encriptada con tecnología SSL de 256 bits y Checkout Pro oficial.
                    </p>
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl transition font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-70 bg-[#009ee3] hover:bg-[#0087c2] text-white"
                  >
                    <FaShieldAlt />
                    {loading
                      ? "Conectando con Mercado Pago..."
                      : `Pagar ${formatCurrency(total)} con Mercado Pago`}
                    <FaExternalLinkAlt className="text-xs ml-1" />
                  </button>
                </form>
              </div>

              {/* Order Summary Sidebar */}
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
