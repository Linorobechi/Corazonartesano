import dns from "node:dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

import cors from "cors";
import express from "express";
import { ensureDatabase } from "./config/db.js";
import { uploadDir } from "./middlewares/upload.middleware.js";
import apiRoutes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globales y CORS para producción (Vercel / Render)
app.use(
  cors({
    origin: true, // Permite peticiones desde Vercel, localhost y cualquier origen autorizado
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  })
);
app.options("*", cors()); // Manejo explícito de preflight OPTIONS
app.use(express.json());

// Servir archivos estáticos subidos
app.use("/uploads", express.static(uploadDir));

// Rutas de la API
app.use("/api", apiRoutes);

// Inicialización del servidor y base de datos
const startServer = async () => {
  try {
    await ensureDatabase();
    app.listen(PORT, () => {
      console.log(`✨ Servidor Corazón Artesano activo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
  }
};

startServer();

export default app;