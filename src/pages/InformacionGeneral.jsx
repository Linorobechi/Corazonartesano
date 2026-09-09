
import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { FaShieldAlt, FaTruck, FaGraduationCap, FaStore, FaQuestionCircle, FaUserCheck } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function InformacionGeneral() {
  const features = [
    {
      icon: <FaShieldAlt className="text-3xl text-[#8b5e3c]" />,
      title: "Pagos 100% Seguros",
      description:
        "Procesamos todas tus compras con altos estándares de encriptación mediante pasarelas de pago nacionales e internacionales (Tarjetas, PSE, Nequi y Transferencias).",
    },
    {
      icon: <FaTruck className="text-3xl text-[#8b5e3c]" />,
      title: "Envíos a Nivel Nacional",
      description:
        "Despachamos directamente desde los talleres artesanales en Sincelejo y la región Caribe hacia todo el territorio colombiano con seguimiento garantizado.",
    },
    {
      icon: <FaGraduationCap className="text-3xl text-[#8b5e3c]" />,
      title: "Capacitación Moodle para Artesanos",
      description:
        "Ofrecemos a los maestros artesanos acceso gratuito a la plataforma Moodle con cursos de finanzas, marketing digital y preservación de técnicas auténticas.",
    },
    {
      icon: <FaStore className="text-3xl text-[#8b5e3c]" />,
      title: "Catálogo Directo de Creadores",
      description:
        "Sin intermediarios abusivos. El valor recibido va directamente a impulsar el trabajo de los artesanos colombianos y sus familias.",
    },
  ];

  const faqs = [
    {
      q: "¿Necesito estar registrado para navegar la tienda?",
      a: "No. Puedes acceder libremente a nuestras secciones informativas (Inicio, Nosotros, Contacto e Información General) y explorar todo el catálogo de productos sin necesidad de registro previo.",
    },
    {
      q: "¿Cómo me registro como Artesano o Comprador?",
      a: "En la sección de Registro pues elegir tu rol (Artesano o Comprador) e ingresar tu número de documento de identidad (CC, CE, NIT o Pasaporte). Los artesanos ganan acceso al panel para subir productos y tomar capacitaciones.",
    },
    {
      q: "¿Cómo recibo el comprobante de mi pago?",
      a: "Una vez finalizada la transacción en nuestra pasarela de pagos integrada, el sistema envía automáticamente una notificación detallada por correo electrónico indicando el estado (Aprobado o Rechazado) y resumen de tu orden.",
    },
    {
      q: "¿Puedo dejar reseñas sobre los productos recibidos?",
      a: "Sí. Los clientes confirmados pueden calificar con 1 a 5 estrellas y escribir su opinión sobre el producto y el artesano creador.",
    },
  ];

  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-16 px-4 md:px-12 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 bg-white p-8 md:p-12 rounded-3xl shadow-md border border-[#eae0d5]"
          >
            <span className="inline-block bg-[#f1ece7] text-[#8b5e3c] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              Información General & Requisitos
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-[#8b5e3c]">
              Conoce Corazón Artesano
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Somos la plataforma digital comprometida con revalorizar, difundir y comercializar
              el talento artesanal de Sincelejo y Colombia, conectando directamente a los artesanos tradicionales con compradores conscientes.
            </p>

            <div className="pt-4 flex justify-center gap-4 flex-wrap">
              <Link
                to="/register"
                className="bg-[#8b5e3c] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#754d31] transition shadow-md"
              >
                Crear Cuenta
              </Link>
              <Link
                to="/productos"
                className="bg-[#f1ece7] text-[#8b5e3c] px-6 py-3 rounded-xl font-medium hover:bg-[#e2d7cc] transition"
              >
                Explorar Catálogo
              </Link>
            </div>
          </motion.div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-[#eae0d5] flex gap-4"
              >
                <div className="p-3 bg-[#fbf8f5] rounded-xl h-fit">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">{f.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Requisitos por Rol */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6"
          >
            <div className="flex items-center gap-3">
              <FaUserCheck className="text-2xl text-[#8b5e3c]" />
              <h2 className="text-2xl font-bold text-[#8b5e3c]">Requisitos de Acceso por Rol</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#faf7f3] p-6 rounded-2xl border border-[#ede3d8]">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Para Artesanos</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                  <li>Registro con documento de identidad oficial (CC, CE, NIT).</li>
                  <li>Creación de catálogo artesanal con fotografías claras de producto.</li>
                  <li>Acceso a capacitaciones gratuitas en Moodle.</li>
                  <li>Gestión autónoma de precios y descripción de piezas.</li>
                </ul>
              </div>

              <div className="bg-[#faf7f3] p-6 rounded-2xl border border-[#ede3d8]">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Para Compradores</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                  <li>Navegación libre y pública sin obligación de registro inicial.</li>
                  <li>Procesamiento seguro de pago en carrito de compras.</li>
                  <li>Notificaciones automáticas por correo electrónico de la orden.</li>
                  <li>Calificación con estrellas y opiniones tras recibir la compra.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6">
            <div className="flex items-center gap-3">
              <FaQuestionCircle className="text-2xl text-[#8b5e3c]" />
              <h2 className="text-2xl font-bold text-[#8b5e3c]">Preguntas Frecuentes</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 bg-[#fbf8f5] rounded-xl border border-[#ede3d8]">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">{faq.q}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
