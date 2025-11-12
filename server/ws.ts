import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

// In-memory cache for the latest raffle winner broadcast
// This ensures manual entries (not in DB) are also available via polling
let latestRaffleWinnerCache: {
  initials: string;
  totalScore: number;
  category: string;
  drawId: string;
  announcedAt: string;
} | null = null;

export function setupWebSocket(server: Server): void {
  console.log('[WebSocket] Initializing WebSocket server...');
  try {
    wss = new WebSocketServer({ server, path: '/ws' });
    clients.clear();

    console.log('[WebSocket] WebSocket server initialized successfully on path /ws');

    wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] New client connected. Total clients:', clients.size + 1);
      clients.add(ws);

      ws.on('close', () => {
        clients.delete(ws);
        console.log('[WebSocket] Client disconnected. Total clients:', clients.size);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
        clients.delete(ws);
      });
    });

    wss.on('error', (error) => {
      console.error('[WebSocket] Server error:', error);
    });
  } catch (error) {
    console.error('[WebSocket] Failed to initialize WebSocket server:', error);
    throw error;
  }
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
    console.warn('[WebSocket] Cannot broadcast ringEntry - WebSocket server not initialized. This may be expected in serverless environments.');
    console.warn('[WebSocket] Entry details:', entry);
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

export function broadcastRaffleWinner(data: {
  initials: string;
  totalScore: number;
  category: string;
  drawId?: string;
  announcedAt?: string;
}): void {
  if (!wss) {
    console.warn('[WebSocket] Cannot broadcast raffleWinner - WebSocket server not initialized');
    return;
  }

  // Store in cache for polling endpoint (important for manual entries)
  if (data.drawId && data.announcedAt) {
    latestRaffleWinnerCache = {
      initials: data.initials,
      totalScore: data.totalScore,
      category: data.category,
      drawId: data.drawId,
      announcedAt: data.announcedAt,
    };
    console.log(`[WebSocket] Cached latest raffle winner: ${data.initials} [${data.drawId}]`);
  }

  const message = JSON.stringify({
    type: "raffleWinner",
    data
  });

  console.log(`[WebSocket] Broadcasting raffleWinner to ${clients.size} clients:`, data);

  let sentCount = 0;
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  console.log(`[WebSocket] Sent raffleWinner to ${sentCount}/${clients.size} connected clients`);
}

export function getLatestRaffleWinnerBroadcast(): {
  initials: string;
  totalScore: number;
  category: string;
  drawId: string;
  announcedAt: string;
} | null {
  return latestRaffleWinnerCache;
}

export function getClientCount(): number {
  return wss ? clients.size : 0;
}
