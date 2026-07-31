import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, X, Clock } from 'lucide-react';
import { notificacionService } from '../services/api';
import { authService } from '../services/api';

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const user = authService.getCurrentUser();
  const isAdmin = user?.rol === 'admin';

  const cargar = useCallback(async () => {
    try {
      const [lista, count] = await Promise.all([
        notificacionService.getNotificaciones(),
        notificacionService.getNoLeidas(),
      ]);
      setNotificaciones(lista);
      setNoLeidas(count.count);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [isAdmin, cargar]);

  const handleLeerTodas = async () => {
    await notificacionService.marcarTodasLeidas();
    setNoLeidas(0);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const handleLimpiar = async () => {
    await notificacionService.limpiarLeidas();
    setNotificaciones(prev => prev.filter(n => !n.leida));
  };

  const handleLeer = async (id) => {
    await notificacionService.marcarLeida(id);
    setNoLeidas(prev => Math.max(0, prev - 1));
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  if (!isAdmin) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-lg transition-colors relative"
        style={{ color: 'var(--text-2)' }}
        title="Notificaciones"
      >
        <Bell size={18} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: 'var(--shadow-lg)', width: 360,
              maxHeight: 420, zIndex: 50, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Notificaciones</span>
              <div className="flex items-center gap-2">
                {noLeidas > 0 && (
                  <button onClick={handleLeerTodas} className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1">
                    <CheckCheck size={14} /> Leer todas
                  </button>
                )}
                {notificaciones.some(n => n.leida) && (
                  <button onClick={handleLimpiar} className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1">
                    <X size={14} /> Limpiar
                  </button>
                )}
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-xs" style={{ color: 'var(--text-3)' }}>
                  <Bell size={24} className="mb-2 opacity-40" />
                  Sin notificaciones
                </div>
              ) : (
                notificaciones.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.leida && handleLeer(n.id)}
                    className="px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 flex items-start gap-3"
                    style={{ opacity: n.leida ? 0.6 : 1 }}
                  >
                    <div className="mt-0.5">
                      {n.leida ? (
                        <CheckCheck size={14} style={{ color: 'var(--text-3)' }} />
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', marginTop: 3 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>{n.titulo}</div>
                      {n.mensaje && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-2)' }}>{n.mensaje}</div>}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={10} style={{ color: 'var(--text-3)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                          {new Date(n.created_at).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleLeer(n.id); }} className="p-1 opacity-50 hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
