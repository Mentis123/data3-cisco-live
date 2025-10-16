import { useEffect, useState, useRef } from "react";

export interface WebSocketHook {
  lastMessage: MessageEvent | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (data: string) => void;
}

export function useWebSocket(onMessage?: (message: any) => void): WebSocketHook {
  const url = '/ws';
  const isBrowser = typeof window !== 'undefined';
  const isEnabled = isBrowser && import.meta.env.VITE_ENABLE_WEBSOCKETS !== 'false';
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
    isEnabled ? 'connecting' : 'disconnected'
  );
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!isEnabled) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}${url}`;
      
      ws.current = new WebSocket(wsUrl);
      setConnectionState('connecting');

      ws.current.onopen = () => {
        setConnectionState('connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        setLastMessage(event);
        if (onMessage) {
          try {
            const message = JSON.parse(event.data);
            onMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        }
      };

      ws.current.onclose = (event) => {
        setConnectionState('disconnected');
        
        // Attempt to reconnect if not a manual close
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = () => {
        setConnectionState('error');
      };
    } catch (error) {
      setConnectionState('error');
      console.error('WebSocket connection error:', error);
    }
  };

  const sendMessage = (data: string) => {
    if (!isEnabled) {
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(data);
    }
  };

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isEnabled]);

  return {
    lastMessage,
    connectionState,
    sendMessage,
  };
}
