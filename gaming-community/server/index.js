import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { initializeSocket } from './socket.js';

const PORT = process.env.SOCKET_PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is required');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), users: 0 });
});

const server = http.createServer(app);

const io = initializeSocket(server);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Socket server connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`NEXUS Socket.IO server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export { app, server, io };
