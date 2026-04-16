import React, { useState, useEffect } from 'react';
import { bitacoraService, authService } from '../services/api';
import {
  Users, UserPlus, Shield, User, Pencil, Trash2,
  Key, X, Check, AlertTriangle, Eye, EyeOff,
  Search, Building2, Loader2, CheckCircle2,
  Crown, Wrench, UserCheck, Activity, Hash
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ESTILOS
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
    --text-1:      #09090b;
    --text-2:      #52525b;
    --text-3:      #a1a1aa;
    --shadow-md:   0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --shadow-lg:   0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
    --radius-md:   10px;
    --radius-xl:   18px;
  }

  .usr-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; }
  .usr-mono   { font-family: 'Geist Mono', monospace !important; }

  .usr-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }

  .usr-input {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
    padding: 8px 11px; font-size: 13px; color: var(--text-1); outline: none; width: 100%;
  }
  .usr-input:focus { border-color: var(--violet-mid); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }

  .usr-label { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--text-3); margin-bottom: 6px; }

  .usr-btn-primary {
    background: var(--text-1); color: white; border: none; border-radius: var(--radius-md);
    font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 16px; width: 100%;
  }

  .usr-btn-ghost { background: transparent; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-2); font-size: 13px; padding: 8px 16px; cursor: pointer; }

  .usr-role-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid; white-space: nowrap; }

  .usr-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; flex-shrink: 0; }

  .usr-table { width: 100%; border-collapse: collapse; }
  .usr-table th { padding: 10px 16px; font-size: 10px; font-weight: 700; color: var(--text-3); background: var(--surface-2); border-bottom: 1px solid var(--border); text-align: left; }
  .usr-table td { padding: 11px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text-1); }

  .usr-action-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-3); transition: all .13s; }
  .usr-action-btn:hover { opacity: 1; border-color: var(--violet); color: var(--violet); }

  .usr-search-input { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 7px 11px 7px 32px; font-size: 13px; width: 100%; outline: none; }

  @media (min-width: 1024px) {
    .usr-sticky { position: sticky; top: 90px; }
  }

  .usr-row-anim { animation: usr-row-in 0.22s ease both; }
  @keyframes usr-row-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
`;

/* ─── Rol metadata ─────────────────────────────────────────────────────── */
const ROL_META = {
  admin: { label: 'Admin', badgeBg: '#fdf4ff', badgeColor: '#86198f', badgeBorder: '#f0abfc', avatarGrad: 'linear-gradient(135deg, #a21caf, #7c3aed)', Icon: Crown },
  tecnico: { label: 'Técnico', badgeBg: '#f0f9ff', badgeColor: '#0369a1', badgeBorder: '#bae6fd', avatarGrad: 'linear-gradient(135deg, #0284c7, #6366f1)', Icon: Wrench },
  cliente: { label: 'Cliente', badgeBg: '#f0fdf4', badgeColor: '#047857', badgeBorder: '#a7f3d0', avatarGrad: 'linear-gradient(135deg, #059669, #0d9488)', Icon: UserCheck },
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
      <div style={{ height: 3, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${s.pct}%`, background: s.color, height: '100%', transition: '0.3s' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.label}</span>
    </div>
  );
};

const getPwdStrength = (pwd) => {
  if (!pwd) return { pct: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['Muy Débil', 'Débil', 'Regular', 'Fuerte'];
  return { pct: (score + 1) * 25, label: labels[score], color: colors[score] };
};

/* ─── Modales ─────────────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, Icon, accent, children }) => {
  if (!open) return null;
  return (
    <div className="usr-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {Icon && <Icon size={15} color="white" />}
            </div>
            <p className="font-bold text-gray-900">{title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-400"><X size={18}/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('todos');

  const [modalEditar, setModalEditar] = useState({ open: false, usuario: null });
  const [modalPassword, setModalPassword] = useState({ open: false, usuario: null });
  const [modalEliminar, setModalEliminar] = useState({ open: false, usuario: null });

  const [formData, setFormData] = useState({ username: '', email: '', password: '', rol: 'cliente', empresa_id: '' });
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [u, e] = await Promise.all([authService.getUsuarios(), bitacoraService.getEmpresas()]);
      setUsuarios(u); setEmpresas(e);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const p = { ...formData, empresa_id: formData.empresa_id || null };
      await authService.createUsuario(p);
      setFormData({ username: '', email: '', password: '', rol: 'cliente', empresa_id: '' });
      setFlash(true);
      setTimeout(() => setFlash(false), 2400);
      fetchData();
    } catch { alert('Error al crear usuario.'); }
    finally { setCreating(false); }
  };

  const filteredUsuarios = usuarios.filter(u => {
    const match = u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRol = filterRol === 'todos' || u.rol === filterRol;
    return match && matchRol;
  });

  return (
    <div className="usr-root min-h-screen pt-20 px-4 pb-16 bg-white">
      <style>{STYLES}</style>
      
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              <span className="text-[11px] font-extrabold text-violet-600 uppercase tracking-widest">Control de Acceso</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Usuarios</span>
            </h1>
          </div>
        </div>

        {/* Layout Grid Responsivo */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
          
          {/* Panel Lateral: Crear */}
          <aside className="usr-sticky">
            <div className="usr-card p-6">
              <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #a21caf)', borderRadius: 10, marginBottom: 20 }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                  <UserPlus size={18} />
                </div>
                <h2 className="font-bold text-gray-900">Nuevo Usuario</h2>
              </div>

              {flash && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-xs font-bold mb-4 animate-bounce">
                  <CheckCircle2 size={14} /> Creado exitosamente
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Username" icon={User}>
                  <input className="usr-input" required placeholder="admin" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </Field>
                <Field label="Email" icon={Activity}>
                  <input type="email" className="usr-input" required placeholder="user@ux.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </Field>
                <Field label="Password" icon={Key}>
                  <div className="relative">
                    <input type={showCreatePwd ? 'text' : 'password'} className="usr-input pr-10" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="button" onClick={() => setShowCreatePwd(!showCreatePwd)} className="absolute right-3 top-2.5 text-gray-400">
                      {showCreatePwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  <PwdStrengthBar password={formData.password} />
                </Field>
                <Field label="Rol" icon={Shield}>
                  <select className="usr-input" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                    <option value="admin">Admin</option>
                    <option value="tecnico">Técnico</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </Field>
                {(formData.rol !== 'admin') && (
                  <Field label="Empresa" icon={Building2}>
                    <select className="usr-input" value={formData.empresa_id} onChange={e => setFormData({...formData, empresa_id: e.target.value})}>
                      <option value="">Ninguna (Global)</option>
                      {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                    </select>
                  </Field>
                )}
                <button type="submit" disabled={creating} className="usr-btn-primary mt-2">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {creating ? 'Procesando...' : 'Crear Usuario'}
                </button>
              </form>
            </div>
          </aside>

          {/* Panel Principal: Tabla */}
          <section className="usr-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                Usuarios Registrados
                <span className="bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full text-[10px]">{filteredUsuarios.length}</span>
              </h2>
              
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1">
                  {['todos', 'admin', 'tecnico', 'cliente'].map(r => (
                    <button key={r} onClick={() => setFilterRol(r)} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterRol === r ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input className="usr-search-input !w-[180px]" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="usr-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol / Empresa</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="text-center py-20 text-gray-400">Cargando...</td></tr>
                  ) : filteredUsuarios.map(u => (
                    <tr key={u.id} className="usr-row-anim">
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.username} rol={u.rol} />
                          <div>
                            <p className="font-bold text-gray-900 leading-none mb-1">{u.username}</p>
                            <p className="text-[11px] text-gray-400 usr-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <RolBadge rol={u.rol} />
                          {u.empresa_id && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Building2 size={10}/>{empresas.find(e => e.id === u.empresa_id)?.nombre}</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button className="usr-action-btn" onClick={() => setModalEditar({open: true, usuario: u})}><Pencil size={14}/></button>
                          <button className="usr-action-btn" onClick={() => setModalPassword({open: true, usuario: u})}><Key size={14}/></button>
                          <button className="usr-action-btn hover:!text-red-500" onClick={() => setModalEliminar({open: true, usuario: u})}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Aquí irían los modales ModalEditar, ModalPassword, ModalEliminar (puedes reutilizar los que ya tienes) */}
    </div>
  );
};

export default Usuarios;