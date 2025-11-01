import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });
  clients.clear();

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
}

export function broadcastScoreUpdate(entry: {
  id: string;
  name: string;
  category: string;
  targetRank: number;
  finalScore: number;
  totalScore?: number;
  pitchScore?: number;
  triviaScore?: number;
  botBar?: number | null;
  isEligible?: boolean;
}): void {
  if (!wss) {
    return;
  }

  const message = JSON.stringify({
    type: "scoreUpdate",
    data: entry
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastRingEntry(entry: {
  attemptId: string;
  initials: string;
  category: string;
}): void {
  if (!wss) {
    console.warn('[WebSocket] Cannot broadcast ringEntry - WebSocket server not initialized');
    return;
  }

  const message = JSON.stringify({
    type: "ringEntry",
    data: entry
  });

  console.log(`[WebSocket] Broadcasting ringEntry to ${clients.size} clients:`, entry);

  let sentCount = 0;
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  console.log(`[WebSocket] Sent ringEntry to ${sentCount}/${clients.size} connected clients`);
}

export function broadcastRingExit(data: {
  attemptId: string;
  qualified: boolean;
}): void {
  if (!wss) {
    return;
  }

  const message = JSON.stringify({
    type: "ringExit",
    data
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastRaffleQualified(data: {
  category: string;
}): void {
  if (!wss) {
    return;
  }

  const message = JSON.stringify({
    type: "raffleQualified",
    data
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function getClientCount(): number {
  return wss ? clients.size : 0;
}
