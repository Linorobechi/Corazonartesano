import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";


export default function Formulario({ onSubmit }) {
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    tipo: "Comprador",
    mensaje: "",
  });   

  const handleChange = (e) => {
    setError("");
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ["nombre", "correo", "telefono", "tipo", "mensaje"];
    const hasEmptyField = requiredFields.some((field) => !String(form[field]).trim());

    if (hasEmptyField) {
      setError("Completa todos los campos antes de enviar el mensaje.");
      return;
    }

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="nombre"
        placeholder="Nombre Completo"
        value={form.nombre}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />

      <input
        type="email"
        name="correo"
        placeholder="Correo Electrónico"
        value={form.correo}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />

      <input
        type="text"
        name="telefono"
        placeholder="Teléfono"
        value={form.telefono}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />

      <select
        name="tipo"
        value={form.tipo}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      >
        <option>Comprador</option>
        <option>Proveedor</option>
        <option>Otro</option>
      </select>

      <textarea
        name="mensaje"
        placeholder="Mensaje"
        rows="4"
        value={form.mensaje}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] py-3 font-semibold text-white transition hover:bg-[#1ebe5d]"
      >
        Contactarnos por WhatsApp
        <FaWhatsapp className="text-lg" />
      </button>
    </form>
  );
}