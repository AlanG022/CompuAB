import mongoose from "mongoose";

export const connectDatabase = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error("La variable MONGO_URL no está definida en el archivo .env");
  }

  try {
    await mongoose.connect(mongoUrl);

    console.log("MongoDB conectado correctamente");
    console.log(`Base de datos: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("No se pudo conectar con MongoDB:", error.message);
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB se desconectó");
});

mongoose.connection.on("error", (error) => {
  console.error("Error de MongoDB:", error.message);
});