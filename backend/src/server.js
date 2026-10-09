import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { createApp } from './app.js';
import { initDatabase } from './config/database.js';
import { initWebSocketServer } from './websocket/wsManager.js';

// Resolve environment file location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const PORT = process.env.PORT || 8000;

// 1. Initialize SQLite Database Schema
initDatabase();

// 2. Create Express App
const app = createApp();

// 3. Create HTTP Server
const server = http.createServer(app);

// 4. Attach WebSocket Server
initWebSocketServer(server);

// 5. Start Server
server.listen(PORT, () => {
  console.log(`🚀 BSE Trade Dashboard Backend listening on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint ready on ws://localhost:${PORT}/ws/trades`);
});

export { app, server };
