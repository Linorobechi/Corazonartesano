import "dotenv/config";
import cors from "cors";
import express from "express";
import { ensureDatabase } from "./config/db.js";
import { uploadDir } from "./middlewares/upload.middleware.js";
import apiRoutes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globales
app.use(cors());
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