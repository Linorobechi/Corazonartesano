import { motion } from "framer-motion";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
import {
  FaGavel,
  FaHandshake,
  FaStore,
  FaShoppingBag,
  FaShieldAlt,
  FaUserShield,
  FaBookOpen,
} from "react-icons/fa";


export default function Terminos() {
  return (
    <>
      <section className="bg-[#f5f1ec] pt-24 pb-20 px-4 md:px-12 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-[#eae0d5]"
          >
            <span className="inline-flex items-center gap-2 bg-[#f1ece7] text-[#8b5e3c] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <FaGavel /> Marco Legal & Normativa Comunitaria
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-[#8b5e3c]">
              Términos y Condiciones de Uso
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
              Bienvenido a <strong>Corazón Artesano</strong>. Nuestra plataforma conecta de forma directa a artesanos tradicionales de Sincelejo y Sucre con compradores de todo el país e internacionales. Al registrarte o utilizar nuestros servicios, aceptas cumplir con los siguientes términos y reglamentos de convivencia y comercio justo.
            </p>
            <div className="text-xs text-gray-400 font-medium pt-2">
              Última actualización: Septiembre de 2026 | Aplicable a Artesanos y Clientes
            </div>
          </motion.div>

          {/* Destacados Informativos */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl border border-[#eae0d5] shadow-sm space-y-3"
            >
              <div className="p-3 bg-[#faf7f2] rounded-xl w-fit text-[#8b5e3c]">
                <FaHandshake className="text-xl" />
              </div>
              <h3 className="font-bold text-gray-800 text-base">Comercio Justo</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sin intermediarios abusivos. El valor recibido por cada pieza va directamente al taller del artesano creador.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-2xl border border-[#eae0d5] shadow-sm space-y-3"
            >
              <div className="p-3 bg-[#faf7f2] rounded-xl w-fit text-[#8b5e3c]">
                <FaShieldAlt className="text-xl" />
              </div>
              <h3 className="font-bold text-gray-800 text-base">Autenticidad Garantizada</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cada producto listado cuenta con certificación de elaboración manual y técnicas autóctonas representativas.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-2xl border border-[#eae0d5] shadow-sm space-y-3"
            >
              <div className="p-3 bg-[#faf7f2] rounded-xl w-fit text-[#8b5e3c]">
                <FaUserShield className="text-xl" />
              </div>
              <h3 className="font-bold text-gray-800 text-base">Protección al Usuario</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Tratamiento transparente de datos personales y pagos seguros respaldados por la legislación vigente.
              </p>
            </motion.div>
          </div>

          {/* Sección 1: Reglas para Artesanos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6"
          >
            <div className="flex items-center gap-3 text-[#8b5e3c]">
              <div className="p-3 bg-[#faf7f2] rounded-2xl border border-[#ede3d8]">
                <FaStore className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  1. Reglas y Obligaciones para Artesanos Creadores
                </h2>
                <span className="text-xs text-gray-500">Normativa para la publicación y venta de artesanías</span>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">1.1 Autenticidad y Calidad de las Piezas</h4>
                <p>
                  El artesano garantiza que todas las obras publicadas en su catálogo son piezas artesanales auténticas, elaboradas a mano o mediante procesos semi-artesanales tradicionales (como caña flecha, tejeduría Wayuu, alfarería o tallado). Queda estrictamente prohibida la reventa de productos industriales o de producción masiva.
                </p>
              </div>

              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">1.2 Precios Justos e Información Veraz</h4>
                <p>
                  Los precios deben reflejar el costo de los insumos y el valor del trabajo artesanal. El artesano se compromete a publicar imágenes reales del producto, descripciones precisas de dimensiones, materiales y colores.
                </p>
              </div>

              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">1.3 Tiempos de Despacho y Empaque</h4>
                <p>
                  Una vez confirmada la orden, el artesano cuenta con un plazo máximo estipulado (habitualmente entre 2 a 5 días hábiles según la técnica) para despachar el producto adecuadamente protegido contra impactos o humedad.
                </p>
              </div>

              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">1.4 Capacitación Continua en Moodle</h4>
                <p>
                  Los artesanos registrados tienen derecho a participar en las capacitaciones gratuitas disponibles en el Campus Virtual Moodle para mejorar sus competencias comerciales, contables y digitales.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sección 2: Reglas para Clientes / Compradores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6"
          >
            <div className="flex items-center gap-3 text-[#8b5e3c]">
              <div className="p-3 bg-[#faf7f2] rounded-2xl border border-[#ede3d8]">
                <FaShoppingBag className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  2. Reglas y Derechos de los Clientes y Compradores
                </h2>
                <span className="text-xs text-gray-500">Normativa para adquisiciones, pagos y revisiones</span>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">2.1 Naturaleza del Trabajo Artesanal</h4>
                <p>
                  Al comprar una pieza hecha a mano, el cliente reconoce que pueden existir variaciones menores en tono, textura o trazado respecto a la fotografía del catálogo. Estas ligeras diferencias son testimonio del valor único y artesanal de cada obra.
                </p>
              </div>

              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">2.2 Medios de Pago y Veracidad de Información</h4>
                <p>
                  El comprador se compromete a suministrar datos de envío completos y verídicos, así como realizar los pagos a través de los canales autorizados en la plataforma (tarjeta de crédito/débito, PSE, Nequi, etc.).
                </p>
              </div>

              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">2.3 Políticas de Devolución y Garantías</h4>
                <p>
                  Si la pieza llega en estado defectuoso por transporte o difiere radicalmente de lo especificado, el comprador puede solicitar cambio o reembolso dentro de los 5 días hábiles posteriores a la entrega.
                </p>
              </div>

              <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#ede3d8] space-y-2">
                <h4 className="font-bold text-[#8b5e3c]">2.4 Reseñas y Respeto a la Comunidad</h4>
                <p>
                  Las calificaciones y comentarios hacia los productos o talleres deben ser respetuosos y fundamentados en la experiencia de compra real. Queda prohibido el lenguaje ofensivo o las difamaciones.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sección 3: Protección de Datos y Propiedad Intelectual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#eae0d5] space-y-6"
          >
            <div className="flex items-center gap-3 text-[#8b5e3c]">
              <div className="p-3 bg-[#faf7f2] rounded-2xl border border-[#ede3d8]">
                <FaShieldAlt className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  3. Tratamiento de Datos y Propiedad Intelectual
                </h2>
                <span className="text-xs text-gray-500">Habeas Data y resguardo del patrimonio cultural</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
                  <FaUserShield className="text-[#8b5e3c]" /> Protección de Datos Personales
                </h4>
                <p className="text-xs text-gray-600">
                  Corazón Artesano protege tus datos de conformidad con la Ley 1581 de 2012 de Habeas Data en Colombia. Los datos recopilados únicamente se emplean para la gestión de órdenes, facturación, soporte y comunicación del campus de capacitaciones.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
                  <FaBookOpen className="text-[#8b5e3c]" /> Propiedad Cultural e Intelectual
                </h4>
                <p className="text-xs text-gray-600">
                  Los diseños ancestrales e identidades culturales pertenecen a las comunidades y artesanos creadores. Queda prohibida la reproducción industrial no autorizada o copia indebida de los catálogos exhibidos.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Banner de Registro o Consulta */}
          <div className="bg-[#8b5e3c] text-white p-8 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <h3 className="text-2xl font-bold">¿Tienes dudas sobre los términos o normativas?</h3>
              <p className="text-xs text-[#f3e9e1] leading-relaxed">
                Si deseas consultar más detalles sobre la inscripción de artesanos o requisitos de compra, contáctanos o revisa nuestros canales directos.
              </p>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Link
                to="/contacto"
                className="bg-white text-[#8b5e3c] px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#f3e9e1] transition shadow-sm"
              >
                Contactar Soporte
              </Link>
              <Link
                to="/register"
                className="bg-[#754d31] text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#603e26] transition shadow-sm"
              >
                Ir al Registro
              </Link>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}
