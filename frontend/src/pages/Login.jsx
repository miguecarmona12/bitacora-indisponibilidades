import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock, User, Eye, EyeOff, ShieldCheck, Layers, Activity } from 'lucide-react';

/* ─── Estilos ──────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');

  :root {
    --violet:      #7c3aed;
    --violet-mid:  #8b5cf6;
    --violet-soft: #f5f3ff;
    --fuchsia:     #a21caf;
    --surface:     #ffffff;
    --surface-2:   #fafafa;
    --surface-3:   #f4f4f5;
    --border:      #e4e4e7;
    --text-1:      #09090b;
    --text-2:      #52525b;
    --text-3:      #a1a1aa;
    --shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
    --shadow-md:   0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --shadow-xl:   0 24px 48px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.06);
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;
  }

  .lg-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .lg-mono { font-family: 'Geist Mono', monospace !important; }

  /* ── Layout ── */
  .lg-wrap {
    min-height: 100vh;
    display: flex;
    background: var(--surface);
  }

  /* ── Left panel ── */
  .lg-left {
    width: 48%;
    background: var(--text-1);
    position: relative;
    overflow: hidden;
    display: none;
    flex-direction: column;
    justify-content: space-between;
    padding: 52px 52px 44px;
  }
  @media (min-width: 1024px) { .lg-left { display: flex; } }

  /* Subtle noise texture overlay */
  .lg-left::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 10%, rgba(124,58,237,0.28) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 90% 90%, rgba(162,28,175,0.2)  0%, transparent 55%);
    pointer-events: none;
  }

  /* Decorative grid lines */
  .lg-left::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .lg-left-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

  /* Logo area */
  .lg-logo-area { margin-bottom: 0; }
  .lg-logo-img  { height: 52px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
  .lg-logo-sub  {
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.45);
    margin-top: 10px; letter-spacing: .01em;
  }

  /* Feature cards */
  .lg-features { display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: center; }

  .lg-feat-card {
    background: rgba(255,255,255,0.055);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: var(--radius-lg);
    padding: 16px 18px;
    display: flex; align-items: flex-start; gap: 14px;
    transition: background 0.2s, border-color 0.2s;
  }
  .lg-feat-card:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.14);
  }
  .lg-feat-icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .lg-feat-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); margin-bottom: 3px; }
  .lg-feat-desc  { font-size: 11.5px; color: rgba(255,255,255,0.42); font-weight: 400; line-height: 1.5; }

  /* Stats strip */
  .lg-stats {
    display: flex; gap: 0;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding-top: 22px; margin-top: 22px;
  }
  .lg-stat {
    flex: 1; padding-right: 20px;
  }
  .lg-stat + .lg-stat {
    padding-left: 20px; padding-right: 20px;
    border-left: 1px solid rgba(255,255,255,0.08);
  }
  .lg-stat-val {
    font-size: 26px; font-weight: 800;
    color: white; letter-spacing: -0.03em; line-height: 1;
  }
  .lg-stat-label {
    font-size: 10px; color: rgba(255,255,255,0.38); font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase; margin-top: 4px;
  }

  /* ── Right panel (form) ── */
  .lg-right {
    flex: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 24px;
    background: var(--surface);
  }

  .lg-form-box {
    width: 100%; max-width: 400px;
    display: flex; flex-direction: column; gap: 0;
  }

  /* Header */
  .lg-form-header { margin-bottom: 32px; }
  .lg-form-eyebrow {
    font-size: 10px; font-weight: 800;
    letter-spacing: .16em; text-transform: uppercase;
    color: var(--violet); margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
  }
  .lg-form-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--violet);
  }
  .lg-form-title {
    font-size: 28px; font-weight: 800;
    color: var(--text-1); letter-spacing: -0.025em; line-height: 1.1;
  }
  .lg-form-sub {
    font-size: 13px; color: var(--text-3); font-weight: 500; margin-top: 6px;
  }

  /* Error */
  .lg-error {
    display: flex; align-items: center; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    color: #dc2626; font-size: 12px; font-weight: 600;
    padding: 10px 14px; border-radius: var(--radius-md);
    margin-bottom: 20px;
  }

  /* Field */
  .lg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .lg-field-label {
    font-size: 10.5px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--text-3);
  }
  .lg-field-wrap { position: relative; display: flex; align-items: center; }
  .lg-field-icon {
    position: absolute; left: 12px;
    color: var(--text-3); pointer-events: none;
    display: flex; align-items: center;
    transition: color 0.15s;
  }
  .lg-input {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 12px 10px 38px;
    font-family: 'Geist', sans-serif;
    font-size: 13.5px; font-weight: 500;
    color: var(--text-1);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .lg-input::placeholder { color: var(--text-3); }
  .lg-input:focus {
    border-color: var(--violet-mid);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
    background: var(--surface);
  }
  .lg-input:focus + .lg-field-icon,
  .lg-field-wrap:focus-within .lg-field-icon { color: var(--violet-mid); }
  .lg-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .lg-input-pass { padding-right: 42px; }

  .lg-eye-btn {
    position: absolute; right: 10px;
    background: none; border: none; cursor: pointer;
    color: var(--text-3); padding: 4px;
    display: flex; align-items: center;
    transition: color 0.13s;
    border-radius: var(--radius-sm);
  }
  .lg-eye-btn:hover { color: var(--text-2); }

  /* Submit */
  .lg-submit-btn {
    width: 100%;
    background: var(--text-1);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 11px 20px;
    font-family: 'Geist', sans-serif;
    font-size: 14px; font-weight: 700;
    letter-spacing: .01em;
    cursor: pointer;
    margin-top: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07);
    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .lg-submit-btn:hover:not(:disabled) {
    opacity: 0.86; transform: translateY(-0.5px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.24);
  }
  .lg-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .lg-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .lg-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: lg-spin 0.65s linear infinite;
  }
  @keyframes lg-spin { to { transform: rotate(360deg); } }

  /* Footer */
  .lg-footer {
    font-size: 11px; color: var(--text-3);
    text-align: center; margin-top: 28px;
    font-weight: 500;
  }

  /* Divider */
  .lg-divider {
    height: 1px; background: var(--border); margin: 22px 0;
  }

  /* Fade in */
  @keyframes lg-fadein {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lg-fadein { animation: lg-fadein 0.4s cubic-bezier(.16,1,.3,1) both; }
`;

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
const Login = () => {
  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Todos los campos son obligatorios'); return; }
    setLoading(true); setError('');
    try {
      const data = await authService.login(username, password);
      if (!data?.access_token) throw new Error('Token inválido');
      localStorage.setItem('token',    data.access_token);
      localStorage.setItem('rol',      data.rol);
      localStorage.setItem('username', data.username);
      if (data.empresa_id) localStorage.setItem('empresa_id', data.empresa_id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas');
    } finally { setLoading(false); }
  };

  const features = [
    { icon: <Activity size={16} color="white" />, bg: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', title: 'Gestión de Incidentes', desc: 'Control y seguimiento en tiempo real de todas las fallas operativas.' },
    { icon: <Layers   size={16} color="white" />, bg: 'linear-gradient(135deg,#a21caf,#c026d3)', title: 'Multiempresa',          desc: 'Administra múltiples organizaciones desde un solo panel centralizado.' },
    { icon: <ShieldCheck size={15} color="white" />, bg: 'linear-gradient(135deg,#be185d,#db2777)', title: 'Acceso Seguro',      desc: 'Autenticación JWT con roles diferenciados por nivel de acceso.' },
  ];

  return (
    <div className="lg-root lg-wrap">
      <style>{STYLES}</style>

      {/* ── Panel izquierdo ── */}
      <div className="lg-left">
        <div className="lg-left-content">

          {/* Logo */}
          <div className="lg-logo-area">
            <img src="/BITA-Logo.png" alt="Bitácora" className="lg-logo-img" onError={e => { e.target.style.display = 'none'; }} />
            <p className="lg-logo-sub">Plataforma inteligente de gestión operativa</p>
          </div>

          {/* Features */}
          <div className="lg-features">
            {features.map(f => (
              <div key={f.title} className="lg-feat-card">
                <div className="lg-feat-icon" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <div>
                  <p className="lg-feat-title">{f.title}</p>
                  <p className="lg-feat-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="lg-stats">
            {[{ val: '99.9%', label: 'Disponibilidad' }, { val: '+1K', label: 'Incidentes' }, { val: '24/7', label: 'Soporte' }].map(s => (
              <div key={s.label} className="lg-stat">
                <p className="lg-stat-val">{s.val}</p>
                <p className="lg-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="lg-right">
        <div className="lg-form-box lg-fadein">

          {/* Header */}
          <div className="lg-form-header">
            <div className="lg-form-eyebrow">
              <span className="lg-form-eyebrow-dot" />
              Sistema activo
            </div>
            <h1 className="lg-form-title">Bienvenido</h1>
            <p className="lg-form-sub">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Error */}
          {error && (
            <div className="lg-error">
              <Lock size={13} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>

            {/* Usuario */}
            <div className="lg-field">
              <label className="lg-field-label">Usuario</label>
              <div className="lg-field-wrap">
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={loading}
                  placeholder="usuario"
                  className="lg-input"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                />
                <span className="lg-field-icon"><User size={15} /></span>
              </div>
            </div>

            {/* Contraseña */}
            <div className="lg-field">
              <label className="lg-field-label">Contraseña</label>
              <div className="lg-field-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  className="lg-input lg-input-pass"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                />
                <span className="lg-field-icon"><Lock size={15} /></span>
                <button
                  type="button"
                  className="lg-eye-btn"
                  onClick={() => setShowPassword(s => !s)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="lg-divider" />

            {/* Submit */}
            <button type="submit" disabled={loading} className="lg-submit-btn">
              {loading
                ? <><span className="lg-spinner" /> Verificando...</>
                : 'Iniciar Sesión'
              }
            </button>
          </form>

          <p className="lg-footer">© 2026 Bitácora App · Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
