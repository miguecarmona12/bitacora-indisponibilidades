import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { bitacoraService } from '../services/api';
import { ToggleLeft } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');

  .aj-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; -webkit-font-smoothing: antialiased; }

  .aj-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }

  .aj-toggle {
    width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer;
    position: relative; transition: background 0.2s;
  }
  .aj-toggle::after {
    content: ''; position: absolute; top: 2px; width: 20px; height: 20px;
    border-radius: 50%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: left 0.2s;
  }
  .aj-toggle.on { background: #7c3aed; }
  .aj-toggle.on::after { left: 22px; }
  .aj-toggle.off { background: #d4d4d8; }
  .aj-toggle.off::after { left: 2px; }

  .dark .aj-toggle.off { background: #555; }

  .aj-bg { background: var(--surface); }
`;

const FEATURES = [
  { flag: 'chat_ia', label: 'Chat IA', desc: 'Asistente inteligente para reportar incidentes' },
  { flag: 'onboarding', label: 'Tour de bienvenida', desc: 'Guía interactiva al iniciar sesión' },

];

const Ajustes = () => {
  const queryClient = useQueryClient();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bitacoraService.getFeatureFlags()
      .then(data => { setFlags(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const toggle = async (flag, activo) => {
    const nuevo = !activo;
    try {
      await bitacoraService.updateFeatureFlag(flag, nuevo);
      setFlags(prev => prev.map(f => f.flag === flag ? { ...f, activo: nuevo } : f));
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success(nuevo ? 'Funcionalidad activada' : 'Funcionalidad desactivada');
    } catch {
      toast.error('Error al actualizar. ¿Eres administrador?');
    }
  };

  return (
    <div className="aj-root aj-bg min-h-screen pt-20 px-4 pb-16">
      <style>{STYLES}</style>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="d-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--violet)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--violet)' }}>
                Configuración de la aplicación
              </span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-.02em' }}>
              Ajustes{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c3aed, #a21caf, #be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                y Preferencias
              </span>
            </h1>
            <p style={{ color: 'var(--text-3)', marginTop: 8, fontSize: 13 }}>
              Activa o desactiva funcionalidades de la aplicación
            </p>
          </div>
        </div>

        <div className="aj-card">
          <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <ToggleLeft size={18} style={{ color: 'var(--violet)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Funcionalidades</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading && (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Cargando...</div>
            )}
            {!loading && flags.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                No hay funcionalidades disponibles
              </div>
            )}
            {flags
              .filter(f => FEATURES.some(x => x.flag === f.flag))
              .map(ff => {
                const meta = FEATURES.find(x => x.flag === ff.flag);
                return (
                  <div key={ff.flag} className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>{meta?.label}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{meta?.desc}</p>
                    </div>
                    <button
                      onClick={() => toggle(ff.flag, ff.activo)}
                      className={`aj-toggle ${ff.activo ? 'on' : 'off'}`}
                      title={ff.activo ? 'Desactivar' : 'Activar'}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ajustes;
