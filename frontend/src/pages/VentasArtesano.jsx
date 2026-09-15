import { useEffect, useState } from "react";
import { FaBoxOpen, FaChartLine, FaCheck, FaClock, FaStore, FaTruck } from "react-icons/fa";
import Footer from "../Components/Footer";
import logoImg from "../assets/logo.jpeg";
import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import { getArtisanOrders, updateArtisanOrderStatus } from "../api/orders";

const API_URL = import.meta.env.VITE_API_URL || "";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function VentasArtesano() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [shipmentOrder, setShipmentOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const endpoint = `${API_URL}/api/orders/artesano/estadisticas`;
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "No se pudieron cargar las ventas");
        setStats(data.stats);
        const ordersData = await getArtisanOrders();
        setOrders(ordersData.orders || []);
      } catch (loadError) {
        console.error("Error al cargar estadísticas de ventas:", loadError);
        setError("No se pudieron cargar tus estadísticas de ventas.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.rol === "artesano") loadStats();
    else setLoading(false);
  }, [user?.rol]);

  const changeStatus = async (orderId, status) => {
    if (status === "ENVIADO") {
      setShipmentOrder(orderId);
      setTrackingNumber("");
      return;
    }
    setUpdatingOrder(orderId);
    try {
      await updateArtisanOrderStatus(orderId, status);
      setOrders((current) => current.map((order) =>
        order.id === orderId ? { ...order, fulfillment_status: status } : order
      ));
    } catch (statusError) {
      setError(statusError.message || "No se pudo actualizar el estado.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const confirmShipment = async (orderId) => {
    const cleanTrackingNumber = trackingNumber.trim();
    if (!cleanTrackingNumber) {
      setError("Ingresa el número de guía para marcar el pedido como enviado.");
      return;
    }
    setUpdatingOrder(orderId);
    try {
      const result = await updateArtisanOrderStatus(orderId, "ENVIADO", cleanTrackingNumber);
      setOrders((current) => current.map((order) =>
        order.id === orderId
          ? { ...order, fulfillment_status: "ENVIADO", tracking_number: result.trackingNumber || cleanTrackingNumber }
          : order
      ));
      setShipmentOrder(null);
      setTrackingNumber("");
      setError("");
    } catch (statusError) {
      setError(statusError.message || "No se pudo actualizar el estado.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (user?.rol !== "artesano") return <Navigate to="/" replace />;

  return (
    <>
      <main className="min-h-screen bg-[#f5f1ec] px-4 pb-20 pt-24">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex flex-wrap items-center gap-4 rounded-3xl border border-[#eae0d5] bg-white p-8 shadow-sm">
            <img src={logoImg} alt="Corazón Artesano" className="h-16 w-16 rounded-2xl object-contain bg-[#faf7f2] p-1" />
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f1ece7] px-3.5 py-1 text-xs font-semibold text-[#8b5e3c]">
                <FaStore /> Panel de ventas
              </div>
              <h1 className="mt-1.5 text-2xl font-bold text-[#8b5e3c]">Estadísticas de ventas</h1>
              <p className="mt-1 text-xs text-gray-600">Consulta el rendimiento de tus productos y tus ventas aprobadas.</p>
            </div>
          </header>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</div>}
          {loading ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm">Cargando estadísticas...</div>
          ) : (
            <section className="rounded-3xl border border-[#eae0d5] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800"><FaChartLine className="text-[#8b5e3c]" /> Resumen de ventas</h2>
                <span className="text-xs font-semibold capitalize text-[#8b5e3c]">
                  {new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(new Date())}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Ventas del mes" value={formatCurrency(stats?.monthRevenue)} />
                <Stat label="Unidades vendidas" value={stats?.monthUnits || 0} />
                <Stat label="Pedidos del mes" value={stats?.monthOrders || 0} />
                <Stat label="Ventas acumuladas" value={formatCurrency(stats?.totalRevenue)} />
              </div>
            </section>
          )}

          {!loading && (
            <section className="rounded-3xl border border-[#eae0d5] bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Gestión de pedidos</h2>
                  <p className="mt-1 text-xs text-gray-500">Actualiza el avance para mantener informado al comprador.</p>
                </div>
                <span className="rounded-full bg-[#fbf7f3] px-3 py-1.5 text-xs font-semibold text-[#8b5e3c]">
                  {orders.length} pedido{orders.length === 1 ? "" : "s"}
                </span>
              </div>
              {orders.length === 0 ? (
                <p className="rounded-2xl bg-[#fbf7f3] p-6 text-center text-sm text-gray-500">Aún no tienes ventas registradas.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <article key={order.id} className="overflow-hidden rounded-2xl border border-[#eee5dc] bg-white shadow-sm transition hover:border-[#d9c8b8] hover:shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f1e9e1] bg-[#fdfbf9] p-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1e8df] text-[#8b5e3c]"><FaBoxOpen /></span>
                            <p className="font-bold text-[#8b5e3c]">Pedido #{order.id}</p>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            {order.buyer_name || "Cliente"} · {new Date(order.created_at).toLocaleDateString("es-CO")}
                          </p>
                        </div>
                        <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          Actualizar estado
                          <select
                            value={order.fulfillment_status || "PENDIENTE"}
                            disabled={updatingOrder === order.id || order.status !== "APPROVED" || order.fulfillment_status === "ENVIADO"}
                            onChange={(event) => changeStatus(order.id, event.target.value)}
                            className="rounded-xl border border-[#d9c8b8] bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-[#8b5e3c] outline-none transition focus:border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c]/15 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <StatusOption value="PENDIENTE" label="Pendiente de aprobar" currentStatus={order.fulfillment_status || "PENDIENTE"} />
                            <StatusOption value="APROBADA" label="Aprobada" currentStatus={order.fulfillment_status || "PENDIENTE"} />
                            <StatusOption value="ENVIADO" label="Enviado" currentStatus={order.fulfillment_status || "PENDIENTE"} />
                          </select>
                        </label>
                      </div>
                      <div className="p-5">
                        <StatusProgress status={order.fulfillment_status || "PENDIENTE"} />
                        <div className="mt-5 space-y-2 rounded-xl bg-[#fbf7f3] p-4 text-sm text-gray-700">
                          {(order.items || []).map((item, index) => (
                            <div className="flex items-center justify-between gap-3" key={`${order.id}-${item.product_id}-${index}`}>
                              <span>{item.nombre} <span className="text-gray-400">× {item.cantidad}</span></span>
                              <span className="font-semibold text-[#8b5e3c]">{formatCurrency(Number(item.precio) * Number(item.cantidad))}</span>
                            </div>
                          ))}
                        </div>
                        {order.fulfillment_status === "ENVIADO" && order.tracking_number && (
                          <div className="mt-3 rounded-xl border border-[#e5d2bf] bg-[#fffaf5] px-4 py-3 text-sm text-[#8b5e3c]">
                            <span className="font-bold">Número de guía:</span> {order.tracking_number}
                          </div>
                        )}
                        {shipmentOrder === order.id && (
                          <div className="mt-4 rounded-2xl border border-[#d9c8b8] bg-[#fffaf5] p-4">
                            <p className="text-sm font-bold text-[#8b5e3c]">Confirmar envío</p>
                            <p className="mt-1 text-xs text-gray-600">Este cambio es definitivo. Ingresa el número de guía para continuar.</p>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                              <input
                                value={trackingNumber}
                                onChange={(event) => setTrackingNumber(event.target.value)}
                                placeholder="Ej. 1234567890"
                                maxLength={120}
                                className="min-w-0 flex-1 rounded-xl border border-[#d9c8b8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b5e3c] focus:ring-2 focus:ring-[#8b5e3c]/15"
                              />
                              <button
                                type="button"
                                onClick={() => confirmShipment(order.id)}
                                disabled={updatingOrder === order.id}
                                className="rounded-xl bg-[#8b5e3c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#704728] disabled:opacity-60"
                              >
                                Confirmar envío
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShipmentOrder(null); setTrackingNumber(""); }}
                                className="rounded-xl border border-[#d9c8b8] px-4 py-2.5 text-sm font-semibold text-[#8b5e3c]"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {order.status !== "APPROVED" && (
                        <p className="mt-3 text-xs font-semibold text-amber-700">El pago aún no está aprobado; el estado se habilitará después.</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusOption({ value, label, currentStatus }) {
  const rank = { PENDIENTE: 0, APROBADA: 1, ENVIADO: 2 };
  const disabled = rank[value] !== rank[currentStatus] && rank[value] !== rank[currentStatus] + 1;
  return <option value={value} disabled={disabled}>{label}{rank[value] < rank[currentStatus] ? " (completado)" : ""}</option>;
}

function StatusProgress({ status }) {
  const steps = [
    { key: "PENDIENTE", label: "Pendiente", icon: FaClock },
    { key: "APROBADA", label: "Aprobada", icon: FaCheck },
    { key: "ENVIADO", label: "Enviado", icon: FaTruck },
  ];
  const activeIndex = steps.findIndex((step) => step.key === status);

  return (
    <div className="grid grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = index <= activeIndex;
        return (
          <div key={step.key} className="relative text-center">
            {index < steps.length - 1 && <span className={`absolute left-1/2 top-4 h-0.5 w-full ${index < activeIndex ? "bg-[#8b5e3c]" : "bg-[#eadfd4]"}`} />}
            <span className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs ${active ? "bg-[#8b5e3c] text-white" : "bg-[#f1ece7] text-gray-400"}`}>
              <Icon />
            </span>
            <span className={`mt-2 block text-[10px] font-bold uppercase tracking-wide ${active ? "text-[#8b5e3c]" : "text-gray-400"}`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#fbf7f3] p-5">
      <p className="text-[11px] font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#8b5e3c]">{value}</p>
    </div>
  );
}
