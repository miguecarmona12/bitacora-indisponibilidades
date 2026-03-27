import React, { useState, useEffect } from 'react';
import { bitacoraService, authService } from '../services/api';
import {
  Users, UserPlus, Shield, User, Pencil, Trash2,
  Key, X, Check, AlertTriangle, Eye, EyeOff,
  Search, Building2, Loader2, CheckCircle2,
  Crown, Wrench, UserCheck, Activity, Hash
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ESTILOS — mismo sistema de variables que Configuracion.jsx
═══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');

  :root {
    --violet:      #7c3aed;
    --violet-mid:  #8b5cf6;
    --violet-soft: #f5f3ff;
    --fuchsia:     #a21caf;
    --fuchsia-soft:#fdf4ff;
    --sky:         #0284c7;
    --sky-soft:    #f0f9ff;
    --emerald:     #059669;
    --emerald-soft:#f0fdf4;
    --amber:       #d97706;
    --amber-soft:  #fffbeb;
    --red:         #dc2626;
    --red-soft:    #fef2f2;
    --surface:     #ffffff;
    --surface-2:   #fafafa;
    --surface-3:   #f4f4f5;
    --border:      #e4e4e7;
    --border-2:    rgba(124,58,237,0.13);
    --text-1:      #09090b;
    --text-2:      #52525b;
    --text-3:      #a1a1aa;
    --shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
    --shadow-md:   0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --shadow-lg:   0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;
  }

  .usr-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .usr-mono   { font-family: 'Geist Mono', monospace !important; }

  /* ── Pulse dot ── */
  @keyframes usr-pulse {
    0%,100% { box-shadow: 0 0 0 0   rgba(124,58,237,.5); }
    50%      { box-shadow: 0 0 0 5px rgba(124,58,237,0);  }
  }
  .usr-pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--violet);
    animation: usr-pulse 2.2s ease infinite;
    flex-shrink: 0;
  }

  /* ── Card ── */
  .usr-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }

  /* ── Input ── */
  .usr-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 8px 11px;
    font-size: 13px;
    color: var(--text-1);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    width: 100%;
    font-family: 'Geist', sans-serif;
  }
  .usr-input::placeholder { color: var(--text-3); }
  .usr-input:focus {
    border-color: var(--violet-mid);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }
  .usr-input:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Label ── */
  .usr-label {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700;
    letter-spacing: .09em; text-transform: uppercase;
    color: var(--text-3); margin-bottom: 6px;
  }

  /* ── Botón primario negro ── */
  .usr-btn-primary {
    background: var(--text-1);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600; font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s, background 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 16px; width: 100%;
    font-family: 'Geist', sans-serif;
  }
  .usr-btn-primary:hover  { opacity: 0.86; transform: translateY(-0.5px); }
  .usr-btn-primary:active { transform: translateY(0); }
  .usr-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── Botón ghost ── */
  .usr-btn-ghost {
    background: transparent; border: 1px solid var(--border);
    border-radius: var(--radius-md); color: var(--text-2);
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: background 0.13s, border-color 0.13s;
    padding: 8px 16px; font-family: 'Geist', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .usr-btn-ghost:hover { background: var(--surface-3); border-color: #d4d4d8; }

  /* ── Divider ── */
  .usr-divider { height: 1px; background: var(--border); margin: 14px 0; }

  /* ── Badge rol ── */
  .usr-role-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700;
    letter-spacing: .06em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 6px;
    border: 1px solid; white-space: nowrap;
  }

  /* ── Avatar ── */
  .usr-avatar {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: white; flex-shrink: 0;
    letter-spacing: -.01em;
  }

  /* ── Tabla ── */
  .usr-table { width: 100%; border-collapse: collapse; }
  .usr-table th {
    padding: 10px 16px;
    font-size: 10px; font-weight: 700;
    letter-spacing: .09em; text-transform: uppercase;
    color: var(--text-3);
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    text-align: left;
  }
  .usr-table td {
    padding: 11px 16px;
    border-bottom: 1px solid var(--border);
    font-size: 13px; color: var(--text-1);
    vertical-align: middle;
  }
  .usr-table tr:last-child td { border-bottom: none; }
  .usr-table tbody tr { transition: background 0.1s ease; }
  .usr-table tbody tr:hover { background: var(--surface-2); }
  .usr-table tbody tr:hover .usr-action-btn { opacity: 1; }

  /* ── Action buttons ── */
  .usr-action-btn {
    width: 28px; height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-3);
    transition: all .13s ease;
    opacity: 0;
  }

  /* ── Search ── */
  .usr-search-wrap { position: relative; }
  .usr-search-wrap .usr-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
  .usr-search-input {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 7px 11px 7px 32px;
    font-size: 13px; color: var(--text-1);
    outline: none; width: 200px;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s, width 0.2s;
    font-family: 'Geist', sans-serif;
  }
  .usr-search-input::placeholder { color: var(--text-3); }
  .usr-search-input:focus {
    background: var(--surface);
    border-color: var(--violet-mid);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
    width: 240px;
  }

  /* ── Counter badge ── */
  .usr-counter {
    min-width: 20px; height: 20px;
    border-radius: 99px;
    font-size: 10px; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 6px;
  }

  /* ── Panel accent line ── */
  .usr-panel-accent { height: 3px; border-radius: 99px; margin-bottom: 20px; }

  /* ── KPI card ── */
  .usr-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 14px 20px;
    display: flex; flex-direction: column; gap: 2px;
    min-width: 80px; text-align: center;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.15s;
  }
  .usr-kpi:hover { box-shadow: var(--shadow-md); }

  /* ── Flash ── */
  @keyframes usr-flash {
    0%   { opacity: 0; transform: translateY(-4px) scale(.98); }
    12%  { opacity: 1; transform: translateY(0) scale(1); }
    78%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .usr-flash { animation: usr-flash 2.2s ease forwards; }

  /* ── Row animation ── */
  @keyframes usr-row-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .usr-row-anim { animation: usr-row-in 0.22s ease both; }

  /* ── Modal ── */
  @keyframes usr-modal-in {
    from { opacity: 0; transform: translateY(16px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .usr-modal-enter { animation: usr-modal-in 0.22s cubic-bezier(.4,0,.2,1) forwards; }

  /* ── Scrollbar ── */
  .usr-scroll::-webkit-scrollbar       { width: 4px; }
  .usr-scroll::-webkit-scrollbar-track { background: #ffffff; border-radius: 9px; }
  .usr-scroll::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 9px; }
  .usr-scroll::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }

  /* ── Password strength bar ── */
  .pwd-bar-track { height: 3px; border-radius: 99px; background: var(--border); overflow: hidden; }
  .pwd-bar-fill  { height: 100%; border-radius: 99px; transition: width 0.3s ease, background 0.3s ease; }

  /* ── Empty state ── */
  .usr-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 48px 24px; color: var(--text-3); text-align: center; gap: 8px;
  }

  /* ── Sticky form panel ── */
  @media (min-width: 1024px) { .usr-sticky { position: sticky; top: 88px; } }

  /* ── Filter pills ── */
  .usr-filter-pill {
    padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;
    border: 1px solid; cursor: pointer; transition: all .13s;
    font-family: 'Geist', sans-serif;
    text-transform: capitalize;
  }
`;

/* ─── Rol metadata ─────────────────────────────────────────────────────── */
const ROL_META = {
  admin: {
    label: 'Admin',
    gradient: 'linear-gradient(135deg, #a21caf, #7c3aed)',
    badgeBg: '#fdf4ff', badgeColor: '#86198f', badgeBorder: '#f0abfc',
    avatarGrad: 'linear-gradient(135deg, #a21caf, #7c3aed)',
    Icon: Crown,
  },
  tecnico: {
    label: 'Técnico',
    gradient: 'linear-gradient(135deg, #0284c7, #6366f1)',
    badgeBg: '#f0f9ff', badgeColor: '#0369a1', badgeBorder: '#bae6fd',
    avatarGrad: 'linear-gradient(135deg, #0284c7, #6366f1)',
    Icon: Wrench,
  },
  cliente: {
    label: 'Cliente',
    gradient: 'linear-gradient(135deg, #059669, #0d9488)',
    badgeBg: '#f0fdf4', badgeColor: '#047857', badgeBorder: '#a7f3d0',
    avatarGrad: 'linear-gradient(135deg, #059669, #0d9488)',
    Icon: UserCheck,
  },
};

/* ─── Password strength ─────────────────────────────────────────────────── */
const getPwdStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '', pct: 0 };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Débil',    color: '#ef4444', pct: 20  };
  if (score <= 2) return { score, label: 'Regular',  color: '#f97316', pct: 45  };
  if (score <= 3) return { score, label: 'Buena',    color: '#eab308', pct: 65  };
  if (score <= 4) return { score, label: 'Fuerte',   color: '#22c55e', pct: 85  };
  return               { score, label: 'Excelente', color: '#059669', pct: 100 };
};

/* ─── Sub-components ────────────────────────────────────────────────────── */
const RolBadge = ({ rol }) => {
  const m = ROL_META[rol] || ROL_META.cliente;
  const Ic = m.Icon;
  return (
    <span className="usr-role-badge" style={{ background: m.badgeBg, color: m.badgeColor, borderColor: m.badgeBorder }}>
      <Ic size={9} /> {m.label}
    </span>
  );
};

const Avatar = ({ name, rol }) => {
  const m = ROL_META[rol] || ROL_META.cliente;
  return (
    <div className="usr-avatar" style={{ background: m.avatarGrad }}>
      {name ? name.slice(0, 2).toUpperCase() : '??'}
    </div>
  );
};

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <div className="usr-label">{Icon && <Icon size={10} />}{label}</div>
    {children}
  </div>
);

const PwdStrengthBar = ({ password }) => {
  const s = getPwdStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div className="pwd-bar-track">
        <div className="pwd-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: '.04em' }}>{s.label}</span>
    </div>
  );
};

/* ─── Modal base ─────────────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, Icon, accent, children }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="usr-root"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(9,9,11,0.48)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="usr-modal-enter" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 460, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {Icon && <Icon size={15} color="white" />}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{title}</p>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', transition: 'all .13s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '22px 24px' }}>{children}</div>
      </div>
    </div>
  );
};

/* ─── Modal Editar ────────────────────────────────────────────────────────── */
const ModalEditar = ({ open, onClose, usuario, empresas, onSaved }) => {
  const [form, setForm] = useState({ username: '', email: '', rol: 'cliente', empresa_id: '' });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (usuario) setForm({ username: usuario.username || '', email: usuario.email || '', rol: usuario.rol || 'cliente', empresa_id: usuario.empresa_id ?? '' });
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, empresa_id: form.empresa_id === '' ? null : parseInt(form.empresa_id) };
      await authService.updateUsuario(usuario.id, payload);
      setFlash(true);
      setTimeout(() => { setFlash(false); onSaved(); onClose(); }, 900);
    } catch { alert('Error al actualizar el usuario.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar Usuario" Icon={Pencil} accent="linear-gradient(135deg, #7c3aed, #8b5cf6)">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Nombre de Usuario" icon={User}>
          <input className="usr-input" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username" />
        </Field>
        <Field label="Correo Electrónico" icon={Activity}>
          <input type="email" className="usr-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
        </Field>
        <Field label="Rol" icon={Shield}>
          <select className="usr-input" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} required>
            <option value="admin">Administrador — Acceso Total</option>
            <option value="tecnico">Técnico — Bitácora y Dashboard</option>
            <option value="cliente">Cliente — Solo Dashboard</option>
          </select>
        </Field>
        {(form.rol === 'cliente' || form.rol === 'tecnico') && (
          <Field label="Empresa Asignada" icon={Building2}>
            <select className="usr-input" value={form.empresa_id} onChange={e => setForm({ ...form, empresa_id: e.target.value })}>
              <option value="">— Ninguna —</option>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
            </select>
          </Field>
        )}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
          <button type="button" onClick={onClose} className="usr-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
          <button type="submit" disabled={saving} className="usr-btn-primary" style={{ flex: 1, background: flash ? '#059669' : 'var(--text-1)' }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : flash ? <CheckCircle2 size={14} /> : <Check size={14} />}
            {saving ? 'Guardando...' : flash ? '¡Guardado!' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── Modal Contraseña ────────────────────────────────────────────────────── */
const ModalPassword = ({ open, onClose, usuario, onSaved }) => {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!open) { setForm({ password: '', confirm: '' }); setError(''); } }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (form.password.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    setSaving(true);
    try {
      await authService.updateUsuario(usuario.id, { password: form.password });
      onSaved(); onClose();
    } catch { setError('Error al cambiar la contraseña.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cambiar Contraseña" Icon={Key} accent="linear-gradient(135deg, #d97706, #f59e0b)">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)', padding: '8px 12px', background: 'var(--amber-soft)', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
          Cambiando contraseña de <strong style={{ color: 'var(--text-1)' }}>{usuario?.username}</strong>
        </div>
        <Field label="Nueva Contraseña" icon={Key}>
          <div style={{ position: 'relative' }}>
            <input type={showPwd ? 'text' : 'password'} className="usr-input" required style={{ paddingRight: 36 }} value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
              {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <PwdStrengthBar password={form.password} />
        </Field>
        <Field label="Confirmar Contraseña" icon={Check}>
          <input type={showPwd ? 'text' : 'password'} className="usr-input" required value={form.confirm} onChange={e => { setForm({ ...form, confirm: e.target.value }); setError(''); }} placeholder="••••••••" />
          {form.confirm && form.password !== form.confirm && (
            <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Las contraseñas no coinciden</p>
          )}
        </Field>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--red)', background: 'var(--red-soft)', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
            <AlertTriangle size={13} /> {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} className="usr-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
          <button type="submit" disabled={saving} className="usr-btn-primary" style={{ flex: 1, background: '#d97706' }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={14} />}
            {saving ? 'Guardando...' : 'Actualizar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── Modal Eliminar ─────────────────────────────────────────────────────── */
const ModalEliminar = ({ open, onClose, usuario, onDeleted }) => {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { if (!open) setConfirm(''); }, [open]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authService.deleteUsuario(usuario.id);
      onDeleted(); onClose();
    } catch { alert('Error al eliminar el usuario.'); }
    finally { setDeleting(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Eliminar Usuario" Icon={Trash2} accent="linear-gradient(135deg, #dc2626, #e11d48)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--red-soft)', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)' }}>
          <AlertTriangle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 3 }}>Esta acción no se puede deshacer</p>
            <p style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>
              Se eliminará permanentemente la cuenta de <strong>{usuario?.username}</strong>.
            </p>
          </div>
        </div>
        <Field label={`Escribe "${usuario?.username}" para confirmar`} icon={Hash}>
          <input className="usr-input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={usuario?.username} />
        </Field>
        <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} className="usr-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={handleDelete} disabled={confirm !== usuario?.username || deleting} className="usr-btn-primary" style={{ flex: 1, background: '#dc2626' }}>
            {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
const Usuarios = () => {
  const [usuarios,    setUsuarios]    = useState([]);
  const [empresas,    setEmpresas]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterRol,   setFilterRol]   = useState('todos');

  const [modalEditar,   setModalEditar]   = useState({ open: false, usuario: null });
  const [modalPassword, setModalPassword] = useState({ open: false, usuario: null });
  const [modalEliminar, setModalEliminar] = useState({ open: false, usuario: null });

  const [formData, setFormData] = useState({ username: '', email: '', password: '', rol: 'cliente', empresa_id: '' });
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState(false);

  /* ── Fetch ── */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [dataUsers, dataEmp] = await Promise.all([
        authService.getUsuarios(),
        bitacoraService.getEmpresas(),
      ]);
      setUsuarios(dataUsers);
      setEmpresas(dataEmp);
    } catch (err) { console.error('Error al cargar datos', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Crear usuario ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const p = { ...formData, empresa_id: formData.empresa_id === '' ? null : parseInt(formData.empresa_id) };
      await authService.createUsuario(p);
      setFormData({ username: '', email: '', password: '', rol: 'cliente', empresa_id: '' });
      setFlash(true);
      setTimeout(() => setFlash(false), 2400);
      fetchData();
    } catch { alert('Error al crear usuario. Revisa si el nombre ya existe.'); }
    finally { setCreating(false); }
  };

  const getEmpresaNombre = (id) => {
    if (!id) return null;
    return empresas.find(e => e.id === id)?.nombre || 'Desconocida';
  };

  const filteredUsuarios = usuarios.filter(u => {
    const matchSearch = (
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
    const matchRol = filterRol === 'todos' || u.rol === filterRol;
    return matchSearch && matchRol;
  });

  const stats = {
    total:   usuarios.length,
    admin:   usuarios.filter(u => u.rol === 'admin').length,
    tecnico: usuarios.filter(u => u.rol === 'tecnico').length,
    cliente: usuarios.filter(u => u.rol === 'cliente').length,
  };

  /* ── Render ── */
  return (
    <div className="usr-root" style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 80, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 }}>
      <style>{STYLES}</style>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="usr-pulse-dot" />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--violet)' }}>
                Control de acceso
              </span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-.02em', margin: 0 }}>
              Gestión de
              <span style={{ marginLeft: 12, background: 'linear-gradient(135deg, #7c3aed, #a21caf, #be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Usuarios
              </span>
            </h1>
            <p style={{ color: 'var(--text-3)', marginTop: 8, fontSize: 13 }}>
              Administra cuentas, roles y permisos del sistema
            </p>
          </div>

          {/* KPIs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Total',    count: stats.total,   accent: 'linear-gradient(135deg, #7c3aed, #a21caf)' },
              { label: 'Admins',   count: stats.admin,   accent: ROL_META.admin.gradient },
              { label: 'Técnicos', count: stats.tecnico, accent: ROL_META.tecnico.gradient },
              { label: 'Clientes', count: stats.cliente, accent: ROL_META.cliente.gradient },
            ].map(k => (
              <div key={k.label} className="usr-kpi">
                <p style={{ fontSize: 22, fontWeight: 800, background: k.accent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>{k.count}</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Layout grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ══ Panel CREAR USUARIO ══ */}
          <div className="usr-card usr-sticky" style={{ padding: 20 }}>
            <div className="usr-panel-accent" style={{ background: 'linear-gradient(90deg, #7c3aed, #a21caf)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #a21caf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={14} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Nuevo Usuario</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', margin: 0 }}>Crear cuenta de acceso</p>
              </div>
            </div>

            <div className="usr-divider" />

            {flash && (
              <div className="usr-flash" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                <CheckCircle2 size={13} /> Usuario creado exitosamente
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nombre de Usuario" icon={User}>
                <input className="usr-input" required placeholder="username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              </Field>

              <Field label="Correo Electrónico" icon={Activity}>
                <input type="email" className="usr-input" required placeholder="correo@ejemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </Field>

              <Field label="Contraseña" icon={Key}>
                <div style={{ position: 'relative' }}>
                  <input type={showCreatePwd ? 'text' : 'password'} className="usr-input" required style={{ paddingRight: 36 }} placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                  <button type="button" onClick={() => setShowCreatePwd(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                    {showCreatePwd ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <PwdStrengthBar password={formData.password} />
              </Field>

              <Field label="Rol" icon={Shield}>
                <select className="usr-input" value={formData.rol} onChange={e => setFormData({ ...formData, rol: e.target.value })} required>
                  <option value="admin">Administrador — Acceso Total</option>
                  <option value="tecnico">Técnico — Bitácora y Dashboard</option>
                  <option value="cliente">Cliente — Solo Dashboard</option>
                </select>
              </Field>

              {(formData.rol === 'cliente' || formData.rol === 'tecnico') && (
                <Field label="Empresa Asignada" icon={Building2}>
                  <select className="usr-input" value={formData.empresa_id} onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}>
                    <option value="">— Ninguna (Global) —</option>
                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                  </select>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Solo verá incidentes de esta empresa.</p>
                </Field>
              )}

              <button type="submit" disabled={creating} className="usr-btn-primary" style={{ marginTop: 4 }}>
                {creating
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creando...</>
                  : <><UserPlus size={14} /> Crear Usuario</>}
              </button>
            </form>
          </div>

          {/* ══ Panel TABLA USUARIOS ══ */}
          <div className="usr-card" style={{ overflow: 'hidden' }}>
            {/* Accent top */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #a21caf, #be185d)' }} />

            {/* Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Usuarios Registrados</p>
                <span className="usr-counter" style={{ background: '#f5f3ff', color: '#6d28d9' }}>{filteredUsuarios.length}</span>
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Filter pills */}
                {['todos', 'admin', 'tecnico', 'cliente'].map(r => (
                  <button
                    key={r}
                    className="usr-filter-pill"
                    onClick={() => setFilterRol(r)}
                    style={{
                      background: filterRol === r ? 'var(--text-1)' : 'var(--surface)',
                      color: filterRol === r ? 'white' : 'var(--text-3)',
                      borderColor: filterRol === r ? 'var(--text-1)' : 'var(--border)',
                    }}
                  >
                    {r === 'todos' ? 'Todos' : ROL_META[r]?.label}
                  </button>
                ))}

                {/* Search */}
                <div className="usr-search-wrap">
                  <Search size={13} className="usr-search-icon" />
                  <input type="text" className="usr-search-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="usr-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Empresa</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 10, color: 'var(--text-3)' }}>
                          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: 12 }}>Cargando usuarios...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsuarios.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        <div className="usr-empty">
                          <Users size={28} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>No se encontraron usuarios</span>
                          {(search || filterRol !== 'todos') && (
                            <button onClick={() => { setSearch(''); setFilterRol('todos'); }} style={{ fontSize: 12, color: 'var(--violet)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsuarios.map((usr, i) => (
                      <tr key={usr.id} className="usr-row-anim" style={{ animationDelay: `${i * 35}ms` }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={usr.username} rol={usr.rol} />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{usr.username}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, fontFamily: 'Geist Mono, monospace' }}>{usr.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><RolBadge rol={usr.rol} /></td>
                        <td>
                          {getEmpresaNombre(usr.empresa_id)
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                                <Building2 size={11} color="var(--text-3)" />{getEmpresaNombre(usr.empresa_id)}
                              </span>
                            : <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>—</span>
                          }
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="usr-action-btn" title="Editar" onClick={() => setModalEditar({ open: true, usuario: usr })}
                              onMouseOver={e => { e.currentTarget.style.color = 'var(--violet)'; e.currentTarget.style.background = 'var(--violet-soft)'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
                              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                              <Pencil size={12} />
                            </button>
                            <button className="usr-action-btn" title="Contraseña" onClick={() => setModalPassword({ open: true, usuario: usr })}
                              onMouseOver={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-soft)'; e.currentTarget.style.borderColor = '#fde68a'; }}
                              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                              <Key size={12} />
                            </button>
                            <button className="usr-action-btn" title="Eliminar" onClick={() => setModalEliminar({ open: true, usuario: usr })}
                              onMouseOver={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.borderColor = '#fecaca'; }}
                              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!loading && filteredUsuarios.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Geist Mono, monospace' }}>
                  {filteredUsuarios.length} / {usuarios.length} usuarios
                </span>
                {(search || filterRol !== 'todos') && (
                  <button onClick={() => { setSearch(''); setFilterRol('todos'); }} style={{ fontSize: 11, color: 'var(--violet)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Modales ── */}
      <ModalEditar
        open={modalEditar.open}
        onClose={() => setModalEditar({ open: false, usuario: null })}
        usuario={modalEditar.usuario}
        empresas={empresas}
        onSaved={fetchData}
      />
      <ModalPassword
        open={modalPassword.open}
        onClose={() => setModalPassword({ open: false, usuario: null })}
        usuario={modalPassword.usuario}
        onSaved={fetchData}
      />
      <ModalEliminar
        open={modalEliminar.open}
        onClose={() => setModalEliminar({ open: false, usuario: null })}
        usuario={modalEliminar.usuario}
        onDeleted={fetchData}
      />
    </div>
  );
};

export default Usuarios;
