import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
import {
  FaUserCheck,
  FaStore,
  FaGraduationCap,
  FaCheckCircle,
  FaFileAlt,
  FaShoppingBag,
} from "react-icons/fa";

export default function Requisitos() {
  const artesanoReqs = [
    "Contar con documento de identidad nacional o extranjera válido (CC, CE, NIT o Pasaporte).",
    "Elaborar piezas artesanales auténticas con técnicas tradicionales o híbridas.",
    "Contar con fotografías claras de tus productos para publicación en el catálogo.",
    "Disposición para recibir capacitaciones en marketing digital y finanzas a través de Moodle.",
    "Cumplir con los tiempos de entrega acordados para envíos a clientes.",
  ];

  const compradorReqs = [
    "No se requiere registro previo para navegar por el catálogo público y secciones informativas.",
    "Para finalizar compras, contar con un correo electrónico activo para recepción de comprobantes.",
    "Medios de pago admitidos: Tarjeta de Crédito/Débito, PSE, Nequi o Transferencia Bancaria.",
    "Para calificar productos y artesanos, haber completado un registro básico de usuario.",
  ];

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4 md:px-12 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-[#eae0d5]"
          >
            <span className="inline-flex items-center gap-2 bg-[#f1ece7] text-[#8b5e3c] px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <FaFileAlt /> Guía Oficial de Acceso
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-[#8b5e3c]">
              Requisitos de Participación
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              En Corazón Artesano promovemos la transparencia y la inclusión. Conoce las pautas
              necesarias para registrarte como Artesano Creador o Comprador en la plataforma.
            </p>
          </motion.div>

          {/* Grid de Requisitos */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Artesano Box */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#8b5e3c]">
                  <div className="p-3 bg-[#faf7f2] rounded-2xl border border-[#ede3d8]">
                    <FaStore className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Requisitos para Artesanos</h2>
                    <span className="text-xs text-gray-500">Rol: Artesano Creador</span>
                  </div>
                </div>

                <ul className="space-y-3 pt-2">
                  {artesanoReqs.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                      <FaCheckCircle className="text-emerald-600 text-sm flex-shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <Link
                  to="/register"
                  className="w-full bg-[#8b5e3c] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#754d31] transition text-center flex items-center justify-center gap-2 shadow-md"
                >
                  <FaUserCheck /> Registrarme como Artesano
                </Link>
              </div>
            </motion.div>

            {/* Comprador Box */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#8b5e3c]">
                  <div className="p-3 bg-[#faf7f2] rounded-2xl border border-[#ede3d8]">
                    <FaShoppingBag className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Requisitos para Compradores</h2>
                    <span className="text-xs text-gray-500">Rol: Comprador / Cliente</span>
                  </div>
                </div>

                <ul className="space-y-3 pt-2">
                  {compradorReqs.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                      <FaCheckCircle className="text-emerald-600 text-sm flex-shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <Link
                  to="/productos"
                  className="w-full bg-[#f1ece7] text-[#8b5e3c] py-3 rounded-xl font-bold text-xs hover:bg-[#e2d7cc] transition text-center flex items-center justify-center gap-2"
                >
                  Explorar Productos
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Moodle Information Banner */}
          <div className="bg-[#8b5e3c] text-white p-8 rounded-3xl shadow-md space-y-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-[#754d31] px-3.5 py-1 rounded-full text-xs font-semibold">
                <FaGraduationCap /> Capacitación Gratuita
              </div>
              <h3 className="text-2xl font-bold">Campus Virtual Moodle para Artesanos</h3>
              <p className="text-xs text-[#f3e9e1] leading-relaxed">
                Al registrarte como artesano obtienes acceso automático a cursos en fotografía,
                administración y comercio digital para potenciar tu marca.
              </p>
            </div>

            <Link
              to="/capacitaciones"
              className="bg-white text-[#8b5e3c] px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#f3e9e1] transition shadow-md flex-shrink-0"
            >
              Ver Módulo de Cursos
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}