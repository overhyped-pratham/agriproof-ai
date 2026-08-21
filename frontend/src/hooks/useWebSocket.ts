import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url: string, autoConnect = true) {
  const [data, setData]               = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws               = useRef<WebSocket | null>(null);
  const shouldReconnect  = useRef(true);   // set to false on deliberate close
  const reconnectTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (ws.current) ws.current.close();
  }, []);

  const connect = useCallback(() => {
    if (!shouldReconnect.current) return;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => setIsConnected(true);

      ws.current.onmessage = (event) => {
        try {
          setData(JSON.parse(event.data));
        } catch {
          setData(event.data);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        // Only attempt reconnect if still desired
        if (shouldReconnect.current) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch (e) {
      console.error('[useWebSocket] Failed to connect:', e);
    }
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    if (autoConnect) connect();
    return () => {
      // Stop reconnecting when component unmounts
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect, autoConnect]);

  return { data, isConnected, connect, disconnect };
}
