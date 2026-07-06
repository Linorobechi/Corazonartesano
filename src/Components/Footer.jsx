import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#8B5E3C] text-[#f5e6d3] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Grid principal */}
        <div className="grid md:grid-cols-3 gap-10 text-sm">
          
          {/* Columna 1 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 fill-[#f5e6d3]" />
              <h2 className="font-semibold text-lg">
                Corazón Artesano
              </h2>
            </div>
            <p className="text-[#f5e6d3]/80 leading-relaxed">
              Conectando artesanos de Sincelejo, Sucre con el mundo digital.
            </p>
          </div>

          {/* Columna 2 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces</h3>
            <ul className="space-y-2 text-[#f5e6d3]/80">
              <li className="hover:text-white cursor-pointer">Productos</li>
              <li className="hover:text-white cursor-pointer">Galería</li>
              <li className="hover:text-white cursor-pointer">Capacitaciones</li>
              <li className="hover:text-white cursor-pointer">Nosotros</li>
              <li className="hover:text-white cursor-pointer">Contacto</li>
            </ul>
          </div>

          {/* Columna 3 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Ubicación</h3>
            <p className="text-[#f5e6d3]/80 leading-relaxed">
              Sincelejo, Sucre <br />
              Colombia
            </p>
          </div>
        </div>

        {/* Línea divisora */}
        <div className="border-t border-[#f5e6d3]/30 my-8"></div>

        {/* Copyright */}
        <p className="text-center text-sm text-[#f5e6d3]/70">
          © 2026 Corazón Artesano. Todos los derechos reservados.
        </p>

      </div>
    </footer>
  );
}