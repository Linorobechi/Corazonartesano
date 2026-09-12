import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNotification = (event) => {
      const detail = event.detail || {};
      const id = crypto.randomUUID();

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          type: detail.type || "info",
          message: detail.message || "",
        },
      ]);

      window.setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== id)
        );
      }, detail.duration || 2800);
    };

    window.addEventListener("app-notification", handleNotification);

    return () => {
      window.removeEventListener("app-notification", handleNotification);
    };
  }, []);

  const toneClasses = {
    success: "border-emerald-500 bg-emerald-50 text-emerald-900",
    error: "border-rose-500 bg-rose-50 text-rose-900",
    warning: "border-amber-500 bg-amber-50 text-amber-900",
    info: "border-sky-500 bg-sky-50 text-sky-900",
  };

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${toneClasses[toast.type] || toneClasses.info}`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
