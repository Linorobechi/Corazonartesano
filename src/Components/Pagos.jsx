import { Link } from "react-router-dom";

export default function PagosSeguros() {
  return (
    <section className="bg-[#8B5E3C] text-white py-12 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        
        {/* Título */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
          Pagos 100% Seguros
        </h2>

        {/* Descripción */}
        <p className="text-sm md:text-base opacity-90 mb-6">
          Aceptamos métodos de pago nacionales e internacionales. Compra con confianza y recibe tus productos artesanales directamente desde Sincelejo.
        </p>

        {/* Botones con links */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/checkout"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm font-semibold"
          >
            Débito PSE
          </Link>

          <Link
            to="/checkout"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm font-semibold"
          >
            Tarjeta de Crédito / Débito
          </Link>

          <Link
            to="/checkout"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm font-semibold"
          >
            Nequi / Daviplata
          </Link>

          <Link
            to="/checkout"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm font-semibold"
          >
            Transferencias Bancarias
          </Link>
        </div>
      </div>
    </section>
  );
}