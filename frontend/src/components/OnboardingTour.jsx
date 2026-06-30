import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  { title: 'Dashboard', desc: 'Aquí ves estadísticas clave: total de caídas, minutos de inactividad, apps afectadas y gráficos por producto.', selector: '[class*="d-chart-card"]' },
  { title: 'Bitácora', desc: 'Registra incidentes nuevos con todos los detalles: empresa, aplicación, fechas, motivo y solución.', selector: '[class*="bita-root"]' },
  { title: 'Filtros', desc: 'Usa los filtros para buscar incidentes por empresa, aplicación, rango de fechas y más.', selector: '[class*="d-filters"]' },
  { title: 'Chat IA', desc: 'Reporta incidentes en lenguaje natural. Ej: "Caída de Claro por 40 min en Banca Móvil"', selector: '[class*="chat-"]' },
];

const OnboardingTour = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const done = localStorage.getItem('onboarding_done');

  useEffect(() => {
    if (!done) { const t = setTimeout(() => setVisible(true), 800); return () => clearTimeout(t); }
  }, [done]);

  if (!visible) return null;

  const s = STEPS[step];
  const handleFinish = () => { localStorage.setItem('onboarding_done', 'true'); setVisible(false); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, maxWidth: 420, width: '90%', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
        <button onClick={handleFinish} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--violet)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>{s.title}</h3>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 24 }}>{s.desc}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handleFinish} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Saltar</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: 'var(--text-1)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
                <ChevronLeft size={14} /> Atrás
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--violet)', color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleFinish} style={{ padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--violet)', color: 'white', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                ¡Listo!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
