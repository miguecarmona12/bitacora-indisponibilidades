import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { bitacoraService, notificacionService } from '../services/api';
import { ToggleLeft, Bell, PlugZap } from 'lucide-react';

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
  const [prefsNotif, setPrefsNotif] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [glpi, setGlpi] = useState(null);
  const [glpiForm, setGlpiForm] = useState({
    base_url: '', client_id: '', client_secret: '', username: '', password: '', profile_id: '',
  });
  const [glpiActivo, setGlpiActivo] = useState(true);
  const [loadingGlpi, setLoadingGlpi] = useState(true);
  const [guardandoGlpi, setGuardandoGlpi] = useState(false);
  const [probandoGlpi, setProbandoGlpi] = useState(false);

  useEffect(() => {
    bitacoraService.getFeatureFlags()
      .then(data => { setFlags(data); setLoading(false); })
      .catch(() => { setLoading(false); });
    notificacionService.getPreferencias()
      .then(data => { setPrefsNotif(data); setLoadingPrefs(false); })
      .catch(() => setLoadingPrefs(false));
    bitacoraService.getConfigGlpi()
      .then(data => {
        setGlpi(data);
        setGlpiActivo(data.activo);
        setLoadingGlpi(false);
      })
      .catch(() => setLoadingGlpi(false));
  }, []);

  const guardarGlpi = async () => {
    setGuardandoGlpi(true);
    try {
      const resp = await bitacoraService.updateConfigGlpi({ ...glpiForm, activo: glpiActivo });
      setGlpi(resp);
      setGlpiForm(f => ({ ...f, client_secret: '', password: '' }));
      toast.success('Configuración GLPI guardada');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar la configuración');
    } finally {
      setGuardandoGlpi(false);
    }
  };

  const probarGlpi = async () => {
    setProbandoGlpi(true);
    try {
      const resp = await bitacoraService.probarConfigGlpi({ ...glpiForm, activo: glpiActivo });
      toast.success(resp.mensaje || 'Conexión exitosa con GLPI');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'No se pudo conectar con GLPI');
    } finally {
      setProbandoGlpi(false);
    }
  };

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

  const togglePrefNotif = async (tipo, activa) => {
    try {
      await notificacionService.updatePreferencia(tipo, !activa);
      setPrefsNotif(prev => prev.map(p => p.tipo === tipo ? { ...p, activa: !activa } : p));
      toast.success(`Notificación ${!activa ? 'activada' : 'desactivada'}`);
    } catch {
      toast.error('Error al actualizar preferencia');
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

        <div className="aj-card" style={{ marginBottom: 24 }}>
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

        {/* Preferencias de Notificaci�n */}
        <div className="aj-card" style={{ marginTop: 24 }}>
          <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <Bell size={18} style={{ color: 'var(--violet)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Notificaciones por Tipo</h2>
          </div>
          {loadingPrefs ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Cargando...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { tipo: 'incidente_creado', label: 'Incidente Creado', desc: 'Cuando alguien registra un nuevo incidente' },
                { tipo: 'incidente_actualizado', label: 'Incidente Actualizado', desc: 'Cuando se edita un incidente existente' },
                { tipo: 'incidente_eliminado', label: 'Incidente Eliminado', desc: 'Cuando se elimina un incidente' },
              ].map(item => {
                const pref = prefsNotif.find(p => p.tipo === item.tipo);
                const activa = pref ? pref.activa : true;
                return (
                  <div key={item.tipo} className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>{item.label}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => togglePrefNotif(item.tipo, activa)}
                      className={`aj-toggle ${activa ? 'on' : 'off'}`}
                      title={activa ? 'Desactivar' : 'Activar'}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Integración GLPI */}
        <div className="aj-card" style={{ marginTop: 24 }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <PlugZap size={18} style={{ color: 'var(--violet)' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Integración GLPI</h2>
              {glpi?.origen && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: glpi.origen === 'bd' ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)',
                  color: 'var(--violet)', letterSpacing: '.04em',
                }}>
                  {glpi.origen === 'bd' ? 'CONFIGURADA AQUÍ' : 'VARIABLES DE ENTORNO'}
                </span>
              )}
            </div>
            <button
              onClick={() => setGlpiActivo(a => !a)}
              className={`aj-toggle ${glpiActivo ? 'on' : 'off'}`}
              title={glpiActivo ? 'Desactivar integración' : 'Activar integración'}
            />
          </div>
          {loadingGlpi ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Cargando...</div>
          ) : (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Cuando un incidente tenga número de ticket GLPI y documentación (Causa Raíz, Solución o Acción Correctiva),
                se publica automáticamente como comentario en el caso original de GLPI.
                {!glpi?.configurado && ' Configura los datos de conexión para activarla.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { key: 'base_url', label: 'URL de GLPI', ph: 'https://sos.ux.technology', type: 'text' },
                  { key: 'client_id', label: 'Client ID (OAuth)', ph: glpi?.client_id || 'Client ID', type: 'text' },
                  { key: 'client_secret', label: 'Client Secret', ph: glpi?.client_secret || '••••', type: 'password' },
                  { key: 'username', label: 'Usuario GLPI', ph: glpi?.username || 'usuario de servicio', type: 'text' },
                  { key: 'password', label: 'Contraseña GLPI', ph: glpi?.password || '••••', type: 'password' },
                  { key: 'profile_id', label: 'ID de Perfil (opcional)', ph: glpi?.profile_id || 'ej: 12', type: 'text' },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>
                      {campo.label}
                    </label>
                    <input
                      type={campo.type}
                      placeholder={campo.ph}
                      value={glpiForm[campo.key]}
                      onChange={e => setGlpiForm(f => ({ ...f, [campo.key]: e.target.value }))}
                      style={{
                        width: '100%', padding: '9px 12px', fontSize: 13,
                        background: 'var(--surface)', color: 'var(--text-1)',
                        border: '1px solid var(--border)', borderRadius: 10, outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                Los secretos vacíos mantienen el valor actual. En GLPI: Configuración &gt; Clientes OAuth (grant "Password", scope "api").
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={guardarGlpi}
                  disabled={guardandoGlpi}
                  style={{
                    padding: '10px 20px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed, #a21caf)', color: 'white', cursor: 'pointer',
                    opacity: guardandoGlpi ? 0.6 : 1,
                  }}
                >
                  {guardandoGlpi ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={probarGlpi}
                  disabled={probandoGlpi}
                  style={{
                    padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer',
                    background: 'transparent', color: 'var(--violet)', border: '1px solid var(--violet)',
                    opacity: probandoGlpi ? 0.6 : 1,
                  }}
                >
                  {probandoGlpi ? 'Probando...' : 'Probar conexión'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ajustes;
