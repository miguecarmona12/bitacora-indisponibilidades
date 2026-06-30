import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#7c3aed', '#a21caf', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#ca8a04'];

const TimelineVisual = ({ incidentes, productos }) => {
  if (!incidentes?.length) return <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 13 }}>Sin datos para mostrar</p>;

  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(hoy);
  fin.setHours(23, 59, 59, 0);

  const hoyIncidentes = incidentes.filter(i => {
    const f = new Date(i.fecha_inicio);
    return f >= inicio && f <= fin;
  });

  const data = hoyIncidentes.map(i => {
    const start = new Date(i.fecha_inicio);
    const end = i.fecha_fin ? new Date(i.fecha_fin) : new Date(start.getTime() + (i.duracion_minutos || 30) * 60000);
    const startMin = (start.getHours() * 60 + start.getMinutes());
    const durMin = Math.max((end - start) / 60000, 5);
    const prod = productos?.find(p => p.id === i.producto_id);
    return { name: prod?.nombre || `ID:${i.producto_id}`, startMin, durMin, id: i.id };
  }).filter(d => d.durMin > 0);

  if (!data.length) return <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 13 }}>Sin incidentes hoy</p>;

  return (
    <div style={{ width: '100%', height: Math.max(200, data.length * 40 + 60) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 100 }}>
          <XAxis type="number" domain={[0, 1440]} tickFormatter={m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`} stroke="var(--text-3)" fontSize={10} />
          <YAxis type="category" dataKey="name" stroke="var(--text-3)" fontSize={10} width={90} />
          <Tooltip
            formatter={(value, name) => [name === 'startMin' ? '' : `${Math.round(value)} min`, name === 'startMin' ? 'Inicio' : 'Duración']}
            labelFormatter={(label) => `Producto: ${label}`}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="durMin" stackId="a" minPointSize={5} radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineVisual;
