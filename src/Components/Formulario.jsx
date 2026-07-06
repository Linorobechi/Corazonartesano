import React, { useState } from "react";


export default function Formulario({ onSubmit }) {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    tipo: "Comprador",
    mensaje: "",
  });   

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />

      <input
        type="email"
        name="correo"
        placeholder="Correo Electrónico"
        value={form.correo}
        onChange={handleChange}
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />

      <input
        type="text"
        name="telefono"
        placeholder="Teléfono"
        value={form.telefono}
        onChange={handleChange}
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />

      <select
        name="tipo"
        value={form.tipo}
        onChange={handleChange}
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
        className="w-full p-3 rounded-md bg-[#e9e2db] outline-none"
      />

      <button
        type="submit"
        className="w-full bg-[#8b5e3c] text-white py-3 rounded-md hover:bg-[#754d31] transition"
      >Enviar Mensaje
      </button>
    </form>
  );
}