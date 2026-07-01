import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { bitacoraService } from '../services/api';
import { History, Search, Clock, User, Tag, FileText, Loader2, AlertCircle } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');

  .aud-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; }
  .aud-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
  .aud-table { width: 100%; border-collapse: collapse; }
  .aud-table th { padding: 10px 16px; font-size: 10px; font-weight: 700; color: var(--text-3); background: var(--surface-2); border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
  .aud-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--text-1); }
  .aud-table tr:hover td { background: var(--surface-2); }
  .aud-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid; white-space: nowrap; }
  .aud-input { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 7px 11px 7px 32px; font-size: 13px; width: 100%; outline: none; }
  .aud-input:focus { border-color: var(--violet-mid); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
  .aud-code { font-family: 'Geist Mono', monospace; font-size: 10px; color: var(--text-2); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
  .aud-code:hover { white-space: normal; overflow: visible; }
`;

const ACCION_STYLES = {
  crear: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  actualizar: { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  eliminar: { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' },
};

export default function Auditoria() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await bitacoraService.getAuditoria({ limit: 200 });
        setRows(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar auditoría');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtrados = rows.filter(r =>
    !search || r.entidad.toLowerCase().includes(search.toLowerCase()) ||
    r.accion.toLowerCase().includes(search.toLowerCase()) ||
    (r.usuario_nombre && r.usuario_nombre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="aud-root d-bg pt-20 px-4 pb-16">
      <style>{STYLES}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--violet)', boxShadow: '0 0 0 3px rgba(139,92,246,0.2)' }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--violet)' }}>Auditoría</span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.1, letterSpacing: '-.025em', marginBottom: 4 }}>
          Historial de{' '}
          <span style={{ background: 'linear-gradient(135deg,#7c3aed,#a21caf,#be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cambios</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} />{rows.length} registros — todas las acciones sobre incidentes
        </p>

        <div style={{ position: 'relative', maxWidth: 320, marginBottom: 20 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="aud-input" placeholder="Buscar por entidad, acción o usuario..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: 'var(--violet)' }} /></div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 }}>
            <AlertCircle size={28} style={{ color: 'var(--red)' }} />
            <p style={{ fontWeight: 700, color: 'var(--text-1)' }}>{error}</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="aud-card" style={{ padding: 60, textAlign: 'center' }}>
            <History size={32} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-2)' }}>Sin registros de auditoría</p>
          </div>
        ) : (
          <div className="aud-card" style={{ overflowX: 'auto' }}>
            <table className="aud-table">
              <thead>
                <tr>
                  <th><Clock size={10} /> Fecha</th>
                  <th><Tag size={10} /> Entidad</th>
                  <th>ID</th>
                  <th>Acción</th>
                  <th><User size={10} /> Usuario</th>
                  <th><FileText size={10} /> Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(r => {
                  const s = ACCION_STYLES[r.accion] || { bg: '#f4f4f5', color: '#52525b', border: '#e4e4e7' };
                  let detalle = r.detalle;
                  try { detalle = JSON.stringify(JSON.parse(r.detalle), null, 1); } catch {}
                  return (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap', fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>
                        {new Date(r.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td><span className="aud-badge" style={{ background: '#f4f4f5', color: '#52525b', borderColor: '#e4e4e7' }}>{r.entidad}</span></td>
                      <td style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{r.entidad_id || '—'}</td>
                      <td><span className="aud-badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>{r.accion}</span></td>
                      <td style={{ fontWeight: 600 }}>{r.usuario_nombre || '—'}</td>
                      <td><span className="aud-code" title={detalle}>{detalle || '—'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
