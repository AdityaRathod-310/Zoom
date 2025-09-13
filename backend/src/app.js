// Import required modules
import express from "express";
import { createServer } from "node:http";
import { connectToSocket } from "./controllers/socketManager.js";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import dotenv from "dotenv";

dotenv.config();

// Setup Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Create HTTP server and bind it with socket.io
const server = createServer(app);
const io = connectToSocket(server);

// Set port
app.set("port", process.env.PORT || 8000);

app.use("/api/v1/users", userRoutes);

// Start server
const start = async () => {
  const connectionDb = await mongoose.connect(
   process.env.MONGO_URI
  );
  console.log(`MONGO Connected DB Host:${connectionDb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log(`Listening ON PORT ${app.get("port")}.`);
  });
};

start();
