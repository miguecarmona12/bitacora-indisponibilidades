import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { bitacoraService, notificacionService } from '../services/api';
import { ToggleLeft, Bell, PlugZap, Sparkles, Mail, Settings2 } from 'lucide-react';

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
    position: relative; transition: background 0.2s; flex-shrink: 0;
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

  .aj-tab {
    display: flex; align-items: center; gap: 7px; padding: 9px 14px;
    font-size: 12px; font-weight: 700; border: none; cursor: pointer;
    background: transparent; color: var(--text-3); border-radius: 10px;
    transition: all 0.15s; white-space: nowrap;
  }
  .aj-tab:hover { color: var(--text-1); background: rgba(124,58,237,0.06); }
  .aj-tab.active { color: white; background: linear-gradient(135deg, #7c3aed, #a21caf); }

  .aj-input {
    width: 100%; padding: '9px 12px'; font-size: 13;
    background: var(--surface); color: var(--text-1);
    border: 1px solid var(--border); border-radius: 10; outline: 'none';
  }
  .aj-input:focus { border-color: #7c3aed; }
`;

const FEATURES = [
  { flag: 'chat_ia', label: 'Chat IA', desc: 'Asistente inteligente para reportar incidentes' },
  { flag: 'onboarding', label: 'Tour de bienvenida', desc: 'Guía interactiva al iniciar sesión' },

];

const CATEGORIAS = [
  { id: 'ia', label: 'Inteligencia Artificial', icon: Sparkles, desc: 'Proveedor y credenciales del asistente de IA' },
  { id: 'glpi', label: 'GLPI', icon: PlugZap, desc: 'Cuando un incidente tenga ticket GLPI y documentación (Causa Raíz, Solución o Acción Correctiva), el caso se cierra en GLPI publicando la documentación como solución. Si el caso ya estaba cerrado, queda como comentario.' },
  { id: 'email', label: 'Email / SMTP', icon: Mail, desc: 'Servidor de correo para notificaciones de incidentes' },
  { id: 'general', label: 'General', icon: Settings2, desc: 'URLs y parámetros del sistema' },
];

const initForm = (items) => {
  const init = {};
  items.forEach(it => {
    if (it.secreto) init[it.clave] = '';
    else if (it.tipo === 'boolean') init[it.clave] = it.valor ?? 'true';
    else init[it.clave] = it.valor ?? '';
  });
  return init;
};

const Ajustes = () => {
  const queryClient = useQueryClient();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefsNotif, setPrefsNotif] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [configItems, setConfigItems] = useState([]);
  const [catActiva, setCatActiva] = useState('ia');
  const [formValues, setFormValues] = useState({});
  const [dirty, setDirty] = useState(() => new Set());
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [probando, setProbando] = useState('');

  useEffect(() => {
    bitacoraService.getFeatureFlags()
      .then(data => { setFlags(data); setLoading(false); })
      .catch(() => { setLoading(false); });
    notificacionService.getPreferencias()
      .then(data => { setPrefsNotif(data); setLoadingPrefs(false); })
      .catch(() => setLoadingPrefs(false));
    bitacoraService.getConfig()
      .then(data => {
        setConfigItems(data.items);
        setFormValues(initForm(data.items));
        setLoadingConfig(false);
      })
      .catch(() => setLoadingConfig(false));
  }, []);

  const marcarDirty = (clave, valor) => {
    setFormValues(f => ({ ...f, [clave]: valor }));
    setDirty(d => { const n = new Set(d); n.add(clave); return n; });
  };

  const valoresDirty = () => {
    const valores = {};
    dirty.forEach(clave => {
      const item = configItems.find(i => i.clave === clave);
      const v = (formValues[clave] ?? '').trim();
      if (item?.secreto && !v) return; // secreto vacío = mantener el actual
      valores[clave] = v;
    });
    return valores;
  };

  const guardarConfig = async () => {
    const valores = valoresDirty();
    if (!Object.keys(valores).length) { toast.info('No hay cambios por guardar'); return; }
    setGuardandoConfig(true);
    try {
      const resp = await bitacoraService.updateConfig(valores);
      setConfigItems(resp.items);
      setFormValues(initForm(resp.items));
      setDirty(new Set());
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar la configuración');
    } finally {
      setGuardandoConfig(false);
    }
  };

  const probar = async (objetivo) => {
    setProbando(objetivo);
    try {
      const valores = {};
      dirty.forEach(clave => {
        const v = (formValues[clave] ?? '').trim();
        if (v) valores[clave] = v;
      });
      const resp = await bitacoraService.probarConfig(objetivo, valores);
      toast.success(resp.mensaje || 'Prueba exitosa');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'La prueba falló');
    } finally {
      setProbando('');
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

  const itemsCategoria = configItems.filter(i => i.categoria === catActiva);
  const hayCambios = dirty.size > 0;

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

        {/* Preferencias de Notificación */}
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

        {/* Configuración del sistema */}
        <div className="aj-card" style={{ marginTop: 24 }}>
          <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <Settings2 size={18} style={{ color: 'var(--violet)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Configuración del sistema</h2>
            {hayCambios && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.12)', color: 'var(--violet)', letterSpacing: '.04em' }}>
                CAMBIOS SIN GUARDAR
              </span>
            )}
          </div>
          {loadingConfig ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Cargando...</div>
          ) : (
            <div>
              {/* Tabs de categoría */}
              <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
                {CATEGORIAS.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCatActiva(cat.id)}
                      className={`aj-tab ${catActiva === cat.id ? 'active' : ''}`}
                    >
                      <Icon size={14} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  {CATEGORIAS.find(c => c.id === catActiva)?.desc}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {itemsCategoria.map(item => (
                    <div key={item.clave}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                          {item.label}
                        </label>
                        {item.origen && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 5,
                            background: item.origen === 'bd' ? 'rgba(124,58,237,0.12)' : 'rgba(113,113,122,0.12)',
                            color: item.origen === 'bd' ? 'var(--violet)' : 'var(--text-3)',
                            letterSpacing: '.04em',
                          }}>
                            {item.origen === 'bd' ? 'BD' : 'ENV'}
                          </span>
                        )}
                      </div>
                      {item.tipo === 'boolean' ? (
                        <div className="flex items-center gap-2" style={{ padding: '2px 0' }}>
                          <button
                            onClick={() => marcarDirty(item.clave, formValues[item.clave] === 'true' ? 'false' : 'true')}
                            className={`aj-toggle ${formValues[item.clave] === 'true' ? 'on' : 'off'}`}
                            title={formValues[item.clave] === 'true' ? 'Desactivar' : 'Activar'}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                            {formValues[item.clave] === 'true' ? 'Activa' : 'Pausada'}
                          </span>
                        </div>
                      ) : (
                        <input
                          type={item.secreto ? 'password' : (item.tipo === 'number' ? 'text' : 'text')}
                          placeholder={item.secreto ? (item.valor || '••••') : (item.valor || item.descripcion || '')}
                          value={formValues[item.clave] ?? ''}
                          onChange={e => marcarDirty(item.clave, e.target.value)}
                          className="aj-input"
                          style={{ width: '100%', padding: '9px 12px', fontSize: 13, background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--border)', borderRadius: 10, outline: 'none' }}
                        />
                      )}
                      {item.descripcion && item.tipo !== 'boolean' && (
                        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.4 }}>{item.descripcion}</p>
                      )}
                      {item.secreto && (
                        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Vacío = mantiene el valor actual</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
                  <button
                    onClick={guardarConfig}
                    disabled={guardandoConfig || !hayCambios}
                    style={{
                      padding: '10px 20px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10,
                      background: 'linear-gradient(135deg, #7c3aed, #a21caf)', color: 'white', cursor: 'pointer',
                      opacity: (guardandoConfig || !hayCambios) ? 0.5 : 1,
                    }}
                  >
                    {guardandoConfig ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  {catActiva === 'glpi' && (
                    <button
                      onClick={() => probar('glpi')}
                      disabled={probando === 'glpi'}
                      style={{
                        padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer',
                        background: 'transparent', color: 'var(--violet)', border: '1px solid var(--violet)',
                        opacity: probando === 'glpi' ? 0.6 : 1,
                      }}
                    >
                      {probando === 'glpi' ? 'Probando...' : 'Probar conexión'}
                    </button>
                  )}
                  {catActiva === 'email' && (
                    <button
                      onClick={() => probar('smtp')}
                      disabled={probando === 'smtp'}
                      style={{
                        padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer',
                        background: 'transparent', color: 'var(--violet)', border: '1px solid var(--violet)',
                        opacity: probando === 'smtp' ? 0.6 : 1,
                      }}
                    >
                      {probando === 'smtp' ? 'Probando...' : 'Probar email'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ajustes;
