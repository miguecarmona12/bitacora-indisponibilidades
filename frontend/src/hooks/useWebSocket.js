import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/ws`;

export default function useWebSocket(onMessage, enabled = true) {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const connect = () => {
      ws.current = new WebSocket(WS_URL);
      ws.current.onopen = () => { if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; } };
      ws.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'incidente_creado') {
            toast.info(`Nuevo incidente registrado por ${msg.usuario}`);
          } else if (msg.type === 'incidente_actualizado') {
            toast.info(`Incidente #${msg.id} actualizado por ${msg.usuario}`);
          } else if (msg.type === 'incidente_eliminado') {
            toast.info(`Incidente #${msg.id} eliminado por ${msg.usuario}`);
          }
          if (onMessage) onMessage(msg);
        } catch { /* ignore */ }
      };
      ws.current.onclose = () => {
        reconnectTimer.current = setTimeout(connect, 3000);
      };
      ws.current.onerror = () => { ws.current?.close(); };
    };
    connect();
    return () => { if (reconnectTimer.current) clearTimeout(reconnectTimer.current); ws.current?.close(); };
  }, [onMessage, enabled]);
}
