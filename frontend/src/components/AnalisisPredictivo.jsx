import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { bitacoraService } from '../services/api';

const LEVEL_COLORS = { alto: '#dc2626', medio: '#d97706', bajo: '#059669' };
const LEVEL_BG = { alto: '#fef2f2', medio: '#fffbeb', bajo: '#f0fdf4' };

const AnalisisPredictivo = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analisis-predictivo'],
    queryFn: bitacoraService.getAnalisisPredictivo,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Analizando riesgos...</div>;
  if (!data?.length) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <AlertTriangle size={15} style={{ color: 'var(--amber)' }} />
        <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', margin: 0 }}>Riesgo estimado</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.slice(0, 6).map(item => (
          <div key={item.producto_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: LEVEL_BG[item.nivel] || '#f9fafb' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: LEVEL_COLORS[item.nivel] || '#9ca3af', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.producto}</p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', margin: 0 }}>{item.frecuencia} incidentes · {item.duracion_promedio}m prom.</p>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: LEVEL_COLORS[item.nivel] || '#9ca3af', flexShrink: 0 }}>{item.riesgo}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalisisPredictivo;
