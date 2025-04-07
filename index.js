import express from 'express';
import http from 'http';
import { initSocket } from './socket.js';
import dotenv from "dotenv"
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

app.get('/', (req, res) => {
  res.send('🔋 Socket Server is Running!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
