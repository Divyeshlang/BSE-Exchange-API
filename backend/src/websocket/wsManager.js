import { WebSocketServer } from 'ws';

// Set to keep track of active client WebSocket connections
const wsClients = new Set();
let wss = null;

/**
 * Attach WebSocket server to the existing HTTP server instance
 * @param {import('http').Server} server 
 */
export function initWebSocketServer(server) {
  wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    wsClients.add(ws);

    ws.on('close', () => wsClients.delete(ws));
    ws.on('error', () => wsClients.delete(ws));
  });

  // Handle HTTP upgrade requests on /ws/trades endpoint
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    if (pathname === '/ws/trades') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
}

/**
 * Broadcast real-time events to all connected web dashboard clients
 * @param {Object} event Payload containing event type and data
 */
export function broadcast(event) {
  const payload = JSON.stringify(event);
  for (const client of wsClients) {
    if (client.readyState === 1) { // 1 = OPEN state
      try {
        client.send(payload);
      } catch {
        wsClients.delete(client);
      }
    }
  }
}
