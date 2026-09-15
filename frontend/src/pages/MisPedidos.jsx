import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Footer from "../Components/Footer";
import { getUserOrders } from "../api/orders";
import { useAuth } from "../context/AuthContext";
import { FaBoxOpen, FaCheck, FaClock, FaTruck } from "react-icons/fa";

const labels = {
  PENDIENTE: "Pendiente de aprobar",
  APROBADA: "Aprobada",
  ENVIADO: "Enviado",
};

export default function MisPedidos() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserOrders()
      .then((data) => setOrders(data.orders || []))
      .catch((loadError) => setError(loadError.message || "No se pudieron cargar tus pedidos."))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <main className="min-h-screen bg-[#f5f1ec] px-4 pb-20 pt-24">
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="rounded-3xl border border-[#eae0d5] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e8df] text-xl text-[#8b5e3c]"><FaBoxOpen /></span>
              <div>
                <h1 className="text-2xl font-bold text-[#8b5e3c]">Mis pedidos</h1>
                <p className="mt-1 text-sm text-gray-600">Consulta el estado y avance de tus compras.</p>
              </div>
            </div>
          </header>
          {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          {loading ? <p className="rounded-3xl bg-white p-8 text-center text-gray-500">Cargando pedidos...</p> : (
            orders.length === 0 ? <p className="rounded-3xl bg-white p-8 text-center text-gray-500">Todavía no tienes pedidos.</p> : (
              orders.map((order) => {
                const status = order.fulfillment_status || "PENDIENTE";
                return (
                  <article key={order.id} className="rounded-3xl border border-[#eae0d5] bg-white p-6 shadow-sm transition hover:shadow-md">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-gray-800">Pedido #{order.id}</h2>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CO")}</p>
                      </div>
                      <span className="rounded-full bg-[#f5eee7] px-3 py-1.5 text-xs font-bold text-[#8b5e3c]">{labels[status] || status}</span>
                    </div>
                    <OrderProgress status={status} />
                    <div className="mt-5 space-y-1 border-t border-gray-100 pt-4 text-sm text-gray-700">
                      {(order.items || []).map((item, index) => <p key={`${order.id}-${index}`}>{item.nombre} × {item.cantidad}</p>)}
                    </div>
                    {status === "ENVIADO" && order.tracking_number && (
                      <div className="mt-4 rounded-xl border border-[#e5d2bf] bg-[#fffaf5] px-4 py-3 text-sm text-[#8b5e3c]">
                        <span className="font-bold">Número de guía:</span> {order.tracking_number}
                      </div>
                    )}
                  </article>
                );
              })
            )
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function OrderProgress({ status }) {
  const steps = [
    { key: "PENDIENTE", label: "Pendiente", icon: FaClock },
    { key: "APROBADA", label: "Aprobada", icon: FaCheck },
    { key: "ENVIADO", label: "Enviado", icon: FaTruck },
  ];
  const activeIndex = steps.findIndex((step) => step.key === status);
  return (
    <div className="mt-6 grid grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = index <= activeIndex;
        return (
          <div key={step.key} className="relative text-center">
            {index < steps.length - 1 && <span className={`absolute left-1/2 top-4 h-0.5 w-full ${index < activeIndex ? "bg-[#8b5e3c]" : "bg-[#eadfd4]"}`} />}
            <span className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs ${active ? "bg-[#8b5e3c] text-white" : "bg-[#f1ece7] text-gray-400"}`}><Icon /></span>
            <span className={`mt-2 block text-[10px] font-bold uppercase tracking-wide ${active ? "text-[#8b5e3c]" : "text-gray-400"}`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
