import express from "express";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";

import { connectDatabase } from "./config/database.js";
import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import viewsRouter from "./routes/views.router.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 8080;

// Conexión a MongoDB
try {
  await connectDatabase();
} catch (error) {
  console.error("La aplicación no puede iniciarse sin MongoDB");
  console.error("Motivo:", error.message);
  process.exit(1);
}

// Configuración de Handlebars
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    helpers: {
      formatPrice: (price) => {
        return Number(price).toLocaleString("es-AR");
      },

      multiply: (value1, value2) => {
        return Number(value1) * Number(value2);
      }
    }
  })
);

app.set("view engine", "handlebars");
app.set("views", "src/views");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("src/public"));

// Socket.IO disponible en los controladores
app.set("io", io);

// Rutas visuales
app.use("/", viewsRouter);

// Rutas de la API
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// Estado del servidor
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    project: "CompuAB",
    server: "online",
    database: "connected",
    port: PORT
  });
});

// WebSockets
io.on("connection", (socket) => {
  console.log(`Cliente conectado por WebSocket: ${socket.id}`);

  socket.emit("connectionSuccess", {
    status: "success",
    message: "Conectado al servidor WebSocket de CompuAB"
  });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Ruta inexistente
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Ruta no encontrada",
    path: req.originalUrl
  });
});

// Manejador general de errores
app.use((error, req, res, next) => {
  console.error("Error interno:", error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map(
      (validationError) => validationError.message
    );

    return res.status(400).json({
      status: "error",
      message: "Error de validación",
      errors
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "El ID proporcionado no es válido"
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Ya existe un registro con ese valor único"
    });
  }

  return res.status(error.statusCode || 500).json({
    status: "error",
    message: error.message || "Error interno del servidor"
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log("====================================");
  console.log("CompuAB iniciado correctamente");
  console.log(`Tienda: http://localhost:${PORT}`);
  console.log(`Productos: http://localhost:${PORT}/products`);
  console.log(`API productos: http://localhost:${PORT}/api/products`);
  console.log(`API carritos: http://localhost:${PORT}/api/carts`);
  console.log(`Estado: http://localhost:${PORT}/api/health`);
  console.log("====================================");
});