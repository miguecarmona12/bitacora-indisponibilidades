import React, { useState, useEffect } from 'react';
import { bitacoraService, authService } from '../services/api';
import {
  Users, UserPlus, Shield, User, Pencil, Trash2,
  Key, X, Check, AlertTriangle, Eye, EyeOff,
  Search, Building2, Loader2
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   HELPERS & SUB-COMPONENTS
───────────────────────────────────────────────────────── */

const ROL_META = {
  admin:   {
    label: 'Admin',
    gradient: 'from-fuchsia-500 to-purple-600',
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    dot: 'bg-fuchsia-500',
  },
  tecnico: {
    label: 'Técnico',
    gradient: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  cliente: {
    label: 'Cliente',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

const RolBadge = ({ rol }) => {
  const m = ROL_META[rol] || ROL_META.cliente;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border ${m.bg} ${m.text} ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label.toUpperCase()}
    </span>
  );
};

const Avatar = ({ name, rol }) => {
  const m = ROL_META[rol] || ROL_META.cliente;
  const initials = name ? name.slice(0, 2).toUpperCase() : '??';
  return (
    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white text-sm font-black shadow-md flex-shrink-0`}>
      {initials}
    </div>
  );
};

/* ─── Field wrapper ───────────────────────────────────── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent focus:bg-white transition-all placeholder:text-gray-300";

/* ─── Modal base ──────────────────────────────────────── */
const Modal = ({ open, onClose, title, icon: Icon, accentClass = 'from-violet-500 to-purple-600', children }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'modalIn 0.2s ease-out' }}>
        <div className={`bg-gradient-to-r ${accentClass} p-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-black text-lg tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MODAL: EDITAR USUARIO
───────────────────────────────────────────────────────── */
const ModalEditar = ({ open, onClose, usuario, empresas, onSaved }) => {
  const [form, setForm] = useState({ username: '', email: '', rol: 'cliente', empresa_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm({
        username: usuario.username || '',
        email: usuario.email || '',
        rol: usuario.rol || 'cliente',
        empresa_id: usuario.empresa_id ?? '',
      });
    }
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.empresa_id = payload.empresa_id === '' ? null : parseInt(payload.empresa_id);
      await authService.updateUsuario(usuario.id, payload);
      onSaved();
      onClose();
    } catch {
      alert('Error al actualizar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar Usuario" icon={Pencil} accentClass="from-violet-500 to-purple-600">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre de Usuario">
          <input
            className={inputCls}
            required
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="username"
          />
        </Field>

        <Field label="Correo Electrónico">
          <input
            type="email"
            className={inputCls}
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="correo@ejemplo.com"
          />
        </Field>

        <Field label="Rol">
          <select
            className={inputCls}
            value={form.rol}
            onChange={e => setForm({ ...form, rol: e.target.value })}
            required
          >
            <option value="admin">Administrador — Acceso Total</option>
            <option value="tecnico">Técnico — Bitácora y Dashboard</option>
            <option value="cliente">Cliente — Solo Dashboard</option>
          </select>
        </Field>

        {(form.rol === 'cliente' || form.rol === 'tecnico') && (
          <Field label="Empresa Asignada">
            <select
              className={inputCls}
              value={form.empresa_id}
              onChange={e => setForm({ ...form, empresa_id: e.target.value })}
            >
              <option value="">— Ninguna —</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-black shadow-md hover:shadow-lg hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────
   MODAL: CAMBIAR CONTRASEÑA
───────────────────────────────────────────────────────── */
const ModalPassword = ({ open, onClose, usuario, onSaved }) => {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setForm({ password: '', confirm: '' }); setError(''); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (form.password.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    setSaving(true);
    try {
      await authService.updateUsuario(usuario.id, { password: form.password });
      onSaved();
      onClose();
    } catch {
      setError('Error al cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cambiar Contraseña" icon={Key} accentClass="from-amber-400 to-orange-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Cambiando contraseña para <span className="font-bold text-gray-700">{usuario?.username}</span>
        </p>

        <Field label="Nueva Contraseña">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              className={inputCls + ' pr-10'}
              required
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirmar Contraseña">
          <input
            type={showPwd ? 'text' : 'password'}
            className={inputCls}
            required
            value={form.confirm}
            onChange={e => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Actualizar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────
   MODAL: ELIMINAR USUARIO
───────────────────────────────────────────────────────── */
const ModalEliminar = ({ open, onClose, usuario, onDeleted }) => {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (!open) setConfirm(''); }, [open]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authService.deleteUsuario(usuario.id);
      onDeleted();
      onClose();
    } catch {
      alert('Error al eliminar el usuario.');
    } finally {
      setDeleting(false);
    }
  };

  const isConfirmed = confirm === usuario?.username;

  return (
    <Modal open={open} onClose={onClose} title="Eliminar Usuario" icon={Trash2} accentClass="from-red-500 to-rose-600">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 mb-1">Esta acción no se puede deshacer</p>
            <p className="text-xs text-red-500 leading-relaxed">
              Eliminarás permanentemente la cuenta de <span className="font-black">{usuario?.username}</span> y todos sus datos asociados.
            </p>
          </div>
        </div>

        <Field label={`Escribe "${usuario?.username}" para confirmar`}>
          <input
            className={inputCls}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={usuario?.username}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalEditar, setModalEditar] = useState({ open: false, usuario: null });
  const [modalPassword, setModalPassword] = useState({ open: false, usuario: null });
  const [modalEliminar, setModalEliminar] = useState({ open: false, usuario: null });

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', rol: 'cliente', empresa_id: ''
  });
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [creating, setCreating] = useState(false);

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
    } catch (error) {
      console.error('Error al cargar datos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Crear usuario ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const p = { ...formData };
      p.empresa_id = p.empresa_id === '' ? null : parseInt(p.empresa_id);
      await authService.createUsuario(p);
      setFormData({ username: '', email: '', password: '', rol: 'cliente', empresa_id: '' });
      fetchData();
    } catch {
      alert('Error al crear usuario. Revisa si el nombre ya existe.');
    } finally {
      setCreating(false);
    }
  };

  /* ── Helpers ── */
  const getEmpresaNombre = (id) => {
    if (!id) return null;
    const e = empresas.find(em => em.id === id);
    return e ? e.nombre : 'Desconocida';
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.rol?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: usuarios.length,
    admin: usuarios.filter(u => u.rol === 'admin').length,
    tecnico: usuarios.filter(u => u.rol === 'tecnico').length,
    cliente: usuarios.filter(u => u.rol === 'cliente').length,
  };

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .row-anim { animation: fadeUp 0.25s ease both; }
      `}</style>

      <div className="pt-24 px-4 max-w-7xl mx-auto mb-10 pb-10">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de Usuarios</h1>
              <p className="text-sm text-gray-400 font-medium">{stats.total} cuentas registradas</p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { label: 'Admins',   count: stats.admin,   color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
              { label: 'Técnicos', count: stats.tecnico, color: 'bg-sky-50 text-sky-700 border-sky-200' },
              { label: 'Clientes', count: stats.cliente, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map(s => (
              <span key={s.label} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${s.color}`}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─────────────────────────────────────────
              FORMULARIO CREAR USUARIO
          ────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-white font-black text-base tracking-tight">Nuevo Usuario</h2>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <Field label="Nombre de Usuario">
                  <input
                    type="text"
                    required
                    className={inputCls}
                    placeholder="username"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </Field>

                <Field label="Correo Electrónico">
                  <input
                    type="email"
                    required
                    className={inputCls}
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </Field>

                <Field label="Contraseña">
                  <div className="relative">
                    <input
                      type={showCreatePwd ? 'text' : 'password'}
                      required
                      className={inputCls + ' pr-10'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowCreatePwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showCreatePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>

                <Field label="Rol">
                  <select
                    className={inputCls}
                    value={formData.rol}
                    onChange={e => setFormData({ ...formData, rol: e.target.value })}
                    required
                  >
                    <option value="admin">Administrador — Acceso Total</option>
                    <option value="tecnico">Técnico — Bitácora y Dashboard</option>
                    <option value="cliente">Cliente — Solo Dashboard</option>
                  </select>
                </Field>

                {(formData.rol === 'cliente' || formData.rol === 'tecnico') && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3.5 space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-orange-700 uppercase tracking-widest">
                      <Building2 className="w-3.5 h-3.5" /> Empresa
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                      value={formData.empresa_id}
                      onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                    >
                      <option value="">— Ninguna —</option>
                      {empresas.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-orange-500 leading-tight">
                      El cliente solo verá los incidentes de esta empresa en su dashboard.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-black shadow-lg shadow-violet-200 hover:shadow-xl hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
                    : <><UserPlus className="w-4 h-4" /> Crear Usuario</>}
                </button>
              </form>
            </div>
          </div>

          {/* ─────────────────────────────────────────
              TABLA DE USUARIOS
          ────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Toolbar */}
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <h2 className="text-base font-black text-gray-900 tracking-tight">Usuarios Registrados</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Empresa</th>
                      <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading && filteredUsuarios.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-300">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-sm font-medium">Cargando usuarios...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsuarios.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-300">
                            <Users className="w-10 h-10" />
                            <span className="text-sm font-medium">No se encontraron usuarios</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsuarios.map((usr, i) => (
                        <tr
                          key={usr.id}
                          className="row-anim hover:bg-gray-50/60 transition-colors"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          {/* Usuario */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={usr.username} rol={usr.rol} />
                              <div>
                                <div className="text-sm font-bold text-gray-800">{usr.username}</div>
                                <div className="text-xs text-gray-400">{usr.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Rol */}
                          <td className="px-5 py-3.5">
                            <RolBadge rol={usr.rol} />
                          </td>

                          {/* Empresa */}
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            {getEmpresaNombre(usr.empresa_id) ? (
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                {getEmpresaNombre(usr.empresa_id)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300 font-medium">—</span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setModalEditar({ open: true, usuario: usr })}
                                title="Editar usuario"
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setModalPassword({ open: true, usuario: usr })}
                                title="Cambiar contraseña"
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setModalEliminar({ open: true, usuario: usr })}
                                title="Eliminar usuario"
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
              {filteredUsuarios.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">
                    {filteredUsuarios.length} de {usuarios.length} usuarios
                  </span>
                  {search && (
                    <button onClick={() => setSearch('')} className="text-xs text-violet-600 font-bold hover:underline">
                      Limpiar filtro
                    </button>
                  )}
                </div>
              )}
            </div>
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
    </>
  );
};

export default Usuarios;