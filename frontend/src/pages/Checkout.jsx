import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaShoppingBag,
  FaEnvelope,
  FaGlobe,
  FaShieldAlt,
  FaCreditCard,
  FaUniversity,
} from "react-icons/fa";
import { initiateWompiPayment, verifyWompiPayment } from "../api/orders";

export default function Checkout() {
  const { cartItems, subtotal, tax, shipping, total, clearCart, formatCurrency } = useCart();
  const [searchParams] = useSearchParams();
  const wompiContainerRef = useRef(null);

  const storedUser = localStorage.getItem("auth_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [loading, setLoading] = useState(false);
  const [wompiData, setWompiData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // 1. Verificar si regresamos de un pago de Wompi con el ID de transacción en la URL (?id=...)
  useEffect(() => {
    const transactionId = searchParams.get("id");
    if (transactionId) {
      const verifyTx = async () => {
        setLoading(true);
        setError("");
        try {
          const data = await verifyWompiPayment(transactionId);
          setResult(data);
          if (data.status === "APPROVED") {
            clearCart();
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          setError("No se pudo verificar el estado de la transacción con Wompi");
        } finally {
          setLoading(false);
        }
      };
      verifyTx();
    }
  }, [searchParams]);

  // 2. Cargar automáticamente la referencia y firma de Wompi al entrar al Checkout
  useEffect(() => {
    if (cartItems.length > 0 && !result && !wompiData && !loading) {
      const initPaymentData = async () => {
        setLoading(true);
        setError("");
        try {
          const token = localStorage.getItem("auth_token");
          if (!token) {
            throw new Error("Debes iniciar sesión para finalizar la compra");
          }

          const data = await initiateWompiPayment({
            items: cartItems,
            customerData: {
              email: user?.email || "",
              fullName: user?.nombre || "",
              phoneNumber: user?.telefono || "",
              legalId: user?.identificacion || "",
            },
          });

          if (!data.ok) {
            throw new Error(data.message || "Error al conectar con la pasarela de Wompi");
          }

          setWompiData(data);
        } catch (err) {
          setError(err.message || "No se pudo preparar la transacción con Wompi");
        } finally {
          setLoading(false);
        }
      };
      initPaymentData();
    }
  }, [cartItems, result]);

  // 3. Montar el botón oficial con la etiqueta de script de Wompi cuando tengamos los datos
  useEffect(() => {
    if (wompiData && wompiContainerRef.current) {
      wompiContainerRef.current.innerHTML = ""; // Limpiar contenido previo

      const isHttps = window.location.protocol === "https:";
      const redirectUrl = isHttps ? `${window.location.origin}/checkout` : undefined;

      const script = document.createElement("script");
      script.src = "https://checkout.wompi.co/widget.js";
      script.setAttribute("data-render", "button");
      script.setAttribute("data-public-key", wompiData.publicKey);
      script.setAttribute("data-currency", wompiData.currency);
      script.setAttribute("data-amount-in-cents", wompiData.amountInCents.toString());
      script.setAttribute("data-reference", wompiData.reference);
      script.setAttribute("data-signature:integrity", wompiData.signature);

      if (redirectUrl) {
        script.setAttribute("data-redirect-url", redirectUrl);
      }

      if (user?.email) script.setAttribute("data-customer-data:email", user.email);
      if (user?.nombre) script.setAttribute("data-customer-data:full-name", user.nombre);
      if (user?.telefono) script.setAttribute("data-customer-data:phone-number", user.telefono);
      script.setAttribute("data-customer-data:phone-number-prefix", "+57");
      if (user?.identificacion) script.setAttribute("data-customer-data:legal-id", user.identificacion);
      script.setAttribute("data-customer-data:legal-id-type", "CC");

      wompiContainerRef.current.appendChild(script);
    }
  }, [wompiData, user]);

  // Función para abrir el modal manualmente si el usuario da clic en el botón principal
  const handleOpenWompiWidget = () => {
    if (!wompiData) return;

    const isHttps = window.location.protocol === "https:";
    const redirectUrl = isHttps ? `${window.location.origin}/checkout` : undefined;

    if (window.WidgetCheckout) {
      const config = {
        currency: wompiData.currency,
        amountInCents: wompiData.amountInCents,
        reference: wompiData.reference,
        publicKey: wompiData.publicKey,
        signature: {
          integrity: wompiData.signature,
        },
        customerData: {
          email: user?.email || "",
          fullName: user?.nombre || "",
          phoneNumber: user?.telefono || "3000000000",
          phoneNumberPrefix: "+57",
          legalId: user?.identificacion || "1000000000",
          legalIdType: "CC",
        },
      };

      if (redirectUrl) {
        config.redirectUrl = redirectUrl;
      }

      const checkout = new window.WidgetCheckout(config);

      checkout.open(async (res) => {
        const transaction = res?.transaction;
        if (transaction?.id) {
          setLoading(true);
          try {
            const data = await verifyWompiPayment(transaction.id);
            setResult(data);
            if (data.status === "APPROVED") {
              clearCart();
            }
          } catch (err) {
            setError("Error al verificar la transacción con Wompi");
          } finally {
            setLoading(false);
          }
        }
      });
    } else {
      // Formulario de redirección Web Checkout
      const form = document.createElement("form");
      form.action = "https://checkout.wompi.co/p/";
      form.method = "GET";

      const fields = {
        "public-key": wompiData.publicKey,
        currency: wompiData.currency,
        "amount-in-cents": wompiData.amountInCents,
        reference: wompiData.reference,
        "signature:integrity": wompiData.signature,
        "customer-data:email": user?.email || "",
        "customer-data:full-name": user?.nombre || "",
      };

      if (redirectUrl) {
        fields["redirect-url"] = redirectUrl;
      }

      Object.entries(fields).forEach(([name, value]) => {
        if (value) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    }
  };

  if (cartItems.length === 0 && !result && !loading) {
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
              <FaLock className="text-xs" /> Integración Oficial Pasarela Wompi Colombia
            </span>
            <h1 className="text-3xl font-bold text-[#8b5e3c]">Finalizar Compra con Wompi</h1>
            <p className="text-xs text-gray-600">
              Procesamiento de pagos directo con Tarjetas de Crédito, Débito, PSE, Nequi, Daviplata y Bancolombia.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-xl p-12 max-w-xl mx-auto text-center border border-[#eae0d5] space-y-4">
              <div className="w-12 h-12 border-4 border-[#8b5e3c] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h2 className="text-xl font-bold text-[#8b5e3c]">Conectando con la Pasarela de Wompi...</h2>
              <p className="text-xs text-gray-500">Generando firma de integridad SHA-256 y referencia única.</p>
            </div>
          ) : result ? (
            /* VISTA DE RESULTADO DE TRANSACCION */
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
                    <h2 className="text-2xl font-bold text-green-700">¡Pago Aprobado con Wompi!</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Orden #{result.orderId} | ID Transacción: {result.transaction_id}
                    </p>
                  </div>

                  <div className="bg-[#faf7f2] p-5 rounded-2xl text-left text-xs space-y-2 border border-[#ede3d8]">
                    <p className="font-semibold text-gray-800 border-b pb-2 text-sm">
                      Resumen Oficial de Transacción Wompi
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
                      <p className="font-semibold">Notificación Registrada</p>
                      <p>Se ha enviado la confirmación de la compra a tu correo electrónico registrado.</p>
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
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <FaTimesCircle className="text-4xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-700">Pago Rechazado o Incompleto</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      ID Transacción Wompi: {result.transaction_id || "N/A"}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600">
                    La transacción no fue aprobada por la entidad financiera. Puedes intentarlo de nuevo.
                  </p>

                  <button
                    onClick={() => {
                      setResult(null);
                      setWompiData(null);
                    }}
                    className="bg-[#8b5e3c] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#754d31]"
                  >
                    Reintentar Pago con Wompi
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            /* VISTA PRINCIPAL DE PASARELA WOMPI */
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Sección Principal Wompi */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 text-[#3b82f6] rounded-2xl flex items-center justify-center">
                        <FaGlobe className="text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Pasarela Wompi Colombia</h2>
                        <p className="text-xs text-gray-500">Respaldado por Bancolombia</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                      Sandbox Activo
                    </span>
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 p-4 rounded-2xl border border-red-200">
                      {error}
                    </p>
                  )}

                  <div className="grid sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-[#faf7f2] rounded-2xl border border-[#ede3d8] flex flex-col items-center gap-2">
                      <FaCreditCard className="text-2xl text-[#8b5e3c]" />
                      <span className="text-xs font-bold text-gray-800">Tarjetas</span>
                      <span className="text-[10px] text-gray-500">Visa, Mastercard, Amex</span>
                    </div>

                    <div className="p-4 bg-[#faf7f2] rounded-2xl border border-[#ede3d8] flex flex-col items-center gap-2">
                      <FaUniversity className="text-2xl text-[#8b5e3c]" />
                      <span className="text-xs font-bold text-gray-800">PSE</span>
                      <span className="text-[10px] text-gray-500">Débito todos los bancos</span>
                    </div>

                    <div className="p-4 bg-[#faf7f2] rounded-2xl border border-[#ede3d8] flex flex-col items-center gap-2">
                      <FaShieldAlt className="text-2xl text-[#8b5e3c]" />
                      <span className="text-xs font-bold text-gray-800">Nequi / Daviplata</span>
                      <span className="text-[10px] text-gray-500">Billeteras digitales</span>
                    </div>
                  </div>

                  {wompiData && (
                    <div className="bg-[#f9f6f0] p-6 rounded-2xl border border-[#ede3d8] space-y-4">
                      <h4 className="text-sm font-bold text-[#8b5e3c]">Detalles de la Transacción Wompi</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Referencia Única:</span>
                          <p className="font-mono font-bold text-gray-800 truncate">{wompiData.reference}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Monto en Centavos:</span>
                          <p className="font-mono font-bold text-gray-800">{wompiData.amountInCents} centavos</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Llave Pública:</span>
                          <p className="font-mono font-bold text-gray-800 truncate">{wompiData.publicKey}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Firma SHA-256 (Servidor):</span>
                          <p className="font-mono text-[10px] text-gray-700 truncate">{wompiData.signature}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTÓN OFICIAL WOMPI SCRIPT & BOTÓN MANUAL */}
                  <div className="space-y-4 pt-2">
                    <button
                      onClick={handleOpenWompiWidget}
                      disabled={!wompiData}
                      className="w-full bg-[#8b5e3c] text-white py-4 rounded-2xl hover:bg-[#754d31] transition font-bold text-base shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <FaLock />
                      Pagar con Wompi {formatCurrency(total)}
                    </button>

                    {/* Contenedor del Botón Oficial Renderizado por Wompi Widget Script */}
                    <div className="flex flex-col items-center justify-center pt-2">
                      <span className="text-[11px] text-gray-400 mb-2 font-medium">
                        O usa el Botón Oficial Widget de Wompi:
                      </span>
                      <div ref={wompiContainerRef} className="w-full flex justify-center"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lateral Resumen de la Orden */}
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
