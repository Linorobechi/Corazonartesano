export default function PagosSeguros() {
  return (
    <section className="bg-[#8B5E3C] text-white py-12 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        
        {/* Título */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
          Pagos Seguros
        </h2>

        {/* Descripción */}
        <p className="text-sm md:text-base opacity-90 mb-6">
          Aceptamos métodos de pago nacionales e internacionales. Compra con confianza y recibe tus productos artesanales directamente desde Sincelejo.
        </p>

        {/* Botones con links */}
        <div className="flex flex-wrap justify-center gap-3">
          
          <a
            href="https://TU-LINK-PSE.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm"
          >
            PSE
          </a>

          <a
            href="https://TU-LINK-TARJETA.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm"
          >
            Tarjeta de Crédito
          </a>

          <a
            href="https://TU-LINK-PAYPAL.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm"
          >
            PayPal
          </a>

          <a
            href="https://TU-LINK-TRANSFERENCIA.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#A97450] hover:bg-[#c18a65] transition px-4 py-2 rounded-md text-sm"
          >
            Transferencias
          </a>

        </div>
      </div>
    </section>
  );
}