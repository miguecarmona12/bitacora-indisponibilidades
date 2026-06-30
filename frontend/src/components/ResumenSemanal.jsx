import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { bitacoraService } from '../services/api';

const Stat = ({ icon, label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15`, color }}>{icon}</div>
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>{value}</p>
    </div>
  </div>
);

const ResumenSemanal = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['resumen-semanal'],
    queryFn: bitacoraService.getResumenSemanal,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Cargando resumen...</div>;
  if (!data || !data.total) return null;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 14 }}>Resumen semanal</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <Stat icon={<Calendar size={14} />} label="Incidentes" value={data.total} color="var(--violet)" />
        <Stat icon={<Clock size={14} />} label="Min. caída" value={data.total_minutos} color="var(--amber)" />
        <Stat icon={<BarChart3 size={14} />} label="Peor app" value={data.app_peor} color="var(--red)" />
        <Stat icon={<TrendingUp size={14} />} label="Promedio" value={`${data.promedio_minutos}m`} color="var(--emerald)" />
      </div>
    </div>
  );
};

export default ResumenSemanal;
