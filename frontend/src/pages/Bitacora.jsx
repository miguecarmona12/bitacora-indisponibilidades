import React, { useState, useEffect } from 'react';
import { bitacoraService, authService } from '../services/api';
import {
  Calendar, Clock, FileText, AlertTriangle,
  ChevronLeft, ChevronRight, Pencil, Trash2, X,
  Plus, Zap, CheckCircle2, Hash
} from 'lucide-react';

/* ─── Estilos globales ─────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  .bita-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
  .bita-mono  { font-family: 'JetBrains Mono', monospace !important; }

.bita-bg {
  background-color: #ffffff;
  background-image: none;
}

  .bita-card {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(139,92,246,0.15);
    box-shadow: 0 4px 28px rgba(109,40,217,0.08), 0 1px 3px rgba(0,0,0,0.04);
    border-radius: 20px;
  }

  .bita-thead th {
    background: linear-gradient(to bottom, #f5f3ff, #ede9fe);
    border-bottom: 2px solid rgba(139,92,246,0.18);
  }

  .bita-tr:hover { background: rgba(139,92,246,0.04); }
  .bita-tr { transition: background 0.13s ease; }

  .bita-pill {
    transition: all 0.14s cubic-bezier(.4,0,.2,1);
    border-radius: 9px;
    cursor: pointer;
    user-select: none;
  }
  .bita-pill:hover { transform: translateY(-1px); }

  .bita-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
    padding: 3px 7px; border-radius: 6px;
  }

  .bita-btn-primary {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%);
    background-size: 200% 200%;
    background-position: 0% 50%;
    transition: all 0.28s ease;
    color: white; border: none; border-radius: 12px;
    font-weight: 700; letter-spacing: .02em;
    box-shadow: 0 4px 14px rgba(124,58,237,0.32);
    cursor: pointer;
  }
  .bita-btn-primary:hover {
    background-position: 100% 50%;
    box-shadow: 0 6px 22px rgba(124,58,237,0.42);
    transform: translateY(-1px);
  }
  .bita-btn-primary:active { transform: translateY(0); }
  .bita-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  .bita-input {
    transition: border-color 0.15s, box-shadow 0.15s;
    color: #1f2937;
    background: white;
  }
  .bita-input:focus {
    outline: none;
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.11);
  }

  @keyframes bita-slide-up {
    from { opacity: 0; transform: translateY(22px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  .bita-modal-enter { animation: bita-slide-up 0.24s cubic-bezier(.4,0,.2,1) forwards; }

  .bita-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .bita-scroll::-webkit-scrollbar-track { background: transparent; }
  .bita-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.28); border-radius: 9px; }

  @keyframes bita-pulse {
    0%,100% { box-shadow: 0 0 0 0   rgba(124,58,237,.45); }
    50%      { box-shadow: 0 0 0 6px rgba(124,58,237,0);   }
  }
  .bita-pulse-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #7c3aed;
    animation: bita-pulse 2s ease infinite;
    flex-shrink: 0;
  }

  .bita-step-label {
    font-size: 10px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase;
    color: #6d28d9; margin-bottom: 7px;
    display: flex; align-items: center; gap: 6px;
  }
  .bita-step-num {
    width: 18px; height: 18px; border-radius: 50%;
    color: white; font-size: 10px; font-weight: 800;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .bita-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(139,92,246,0.22), transparent);
    margin: 14px 0;
  }

  .bita-form-section {
    background: linear-gradient(135deg, rgba(245,243,255,.75), rgba(253,244,255,.55));
    border: 1px solid rgba(139,92,246,0.13);
    border-radius: 14px;
    padding: 16px;
  }

  .bita-ticket {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 600;
    background: linear-gradient(135deg, #ede9fe, #fae8ff);
    color: #6d28d9;
    border: 1px solid rgba(109,40,217,0.18);
    padding: 2px 7px; border-radius: 6px;
    display: inline-flex; align-items: center; gap: 3px;
  }

  .bita-duration {
    background: linear-gradient(135deg, #fef2f2, #fce7f3);
    color: #b91c1c;
    border: 1px solid rgba(185,28,28,0.13);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700; font-size: 12px;
    padding: 4px 10px; border-radius: 8px;
    display: inline-flex; align-items: center; gap: 4px;
    white-space: nowrap;
  }

  .bita-page-btn {
    width: 34px; height: 34px; border-radius: 9px;
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 13px; transition: all .14s;
    border: 1px solid transparent; cursor: pointer; background: transparent;
  }
  .bita-page-btn.active {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    box-shadow: 0 2px 10px rgba(124,58,237,0.32);
  }
  .bita-page-btn:not(.active):not(:disabled) {
    background: white; color: #4b5563;
    border-color: rgba(139,92,246,0.2);
  }
  .bita-page-btn:not(.active):not(:disabled):hover {
    border-color: #7c3aed; color: #7c3aed; background: #f5f3ff;
  }
  .bita-page-btn:disabled { opacity: 0.3; cursor: not-allowed; background: #f9fafb; }

  @keyframes bita-flash {
    0%   { opacity: 0; transform: translateY(-6px); }
    15%  { opacity: 1; transform: translateY(0);    }
    80%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .bita-flash { animation: bita-flash 2.2s ease forwards; }
`;

/* ─── Pill colors per field ─────────────────────────────────────────────────── */
const PILL = {
  empresa_ids:    { on: 'bg-violet-600 text-white border-violet-600',   off: 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700' },
  aplicacion_ids: { on: 'bg-fuchsia-600 text-white border-fuchsia-600', off: 'bg-white text-gray-600 border-gray-200 hover:border-fuchsia-300 hover:text-fuchsia-700' },
  categoria_ids:  { on: 'bg-pink-600 text-white border-pink-600',       off: 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-700' },
  producto_ids:   { on: 'bg-orange-500 text-white border-orange-500',   off: 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-700' },
};
const STEP_BG = {
  empresa_ids: 'bg-violet-600', aplicacion_ids: 'bg-fuchsia-600',
  categoria_ids: 'bg-pink-600', producto_ids: 'bg-orange-500',
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
const Bitacora = () => {
  const currentUser = authService.getCurrentUser();

  const [incidentes,   setIncidentes]   = useState([]);
  const [productos,    setProductos]    = useState([]);
  const [categorias,   setCategorias]   = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [empresas,     setEmpresas]     = useState([]);

  const [currentPage,      setCurrentPage]      = useState(1);
  const [editingIncidente, setEditingIncidente]  = useState(null);
  const [editFormData,     setEditFormData]      = useState({});
  const [submitting,       setSubmitting]        = useState(false);
  const [successFlash,     setSuccessFlash]      = useState(false);

  const itemsPerPage = 15;

  const [formData, setFormData] = useState({
    empresa_ids: [], aplicacion_ids: [], categoria_ids: [], producto_ids: [],
    fecha_inicio:     new Date().toISOString().slice(0, 16),
    duracion_minutos: '',
    motivo: '', solucion: '', ticket: '',
    mes_reporte: new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  });

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const fetchData = async () => {
    try {
      const [i, p, c, a, e] = await Promise.all([
        bitacoraService.getIncidentes(),
        bitacoraService.getProductos(),
        bitacoraService.getCategorias(),
        bitacoraService.getAplicaciones(),
        bitacoraService.getEmpresas(),
      ]);
      setIncidentes(i); setProductos(p); setCategorias(c); setAplicaciones(a); setEmpresas(e);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Submit nuevo ──────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasAny = formData.empresa_ids.length > 0 || formData.aplicacion_ids.length > 0
      || formData.categoria_ids.length > 0 || formData.producto_ids.length > 0;
    if (!hasAny || !formData.duracion_minutos) {
      alert('Selecciona al menos un elemento afectado y la duración.');
      return;
    }
    setSubmitting(true);
    try {
      const payloads = [];
      const e_ids = formData.empresa_ids.length    > 0 ? formData.empresa_ids    : [null];
      const a_ids = formData.aplicacion_ids.length > 0 ? formData.aplicacion_ids : [null];
      let cp = [];
      if (formData.producto_ids.length > 0) {
        formData.producto_ids.forEach(pid => {
          const prod = productos.find(p => p.id === pid);
          cp.push({ catId: prod?.categoria_id ?? null, prodId: pid });
        });
        formData.categoria_ids.forEach(catId => {
          const has = formData.producto_ids.some(pid => {
            const p = productos.find(x => x.id === pid);
            return p && p.categoria_id === catId;
          });
          if (!has) cp.push({ catId, prodId: null });
        });
      } else if (formData.categoria_ids.length > 0) {
        formData.categoria_ids.forEach(catId => cp.push({ catId, prodId: null }));
      } else {
        cp.push({ catId: null, prodId: null });
      }
      e_ids.forEach(empId =>
        a_ids.forEach(appId =>
          cp.forEach(c => payloads.push({
            empresa_id: empId, aplicacion_id: appId,
            categoria_id: c.catId, producto_id: c.prodId,
            duracion_minutos: parseFloat(formData.duracion_minutos),
            fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
            motivo: formData.motivo, solucion: formData.solucion,
            ticket: formData.ticket, mes_reporte: formData.mes_reporte,
          }))
        )
      );
      await bitacoraService.createIncidentesBulk(payloads);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 2400);
      setFormData(f => ({ ...f, duracion_minutos: '', motivo: '', solucion: '', ticket: '' }));
      setCurrentPage(1);
      fetchData();
    } catch { alert('Error al registrar incidencia.'); }
    finally { setSubmitting(false); }
  };

  /* ── Update ────────────────────────────────────────────────────────────── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await bitacoraService.updateIncidente(editingIncidente.id, {
        empresa_id:       editFormData.empresa_id    ? parseInt(editFormData.empresa_id)    : null,
        aplicacion_id:    editFormData.aplicacion_id ? parseInt(editFormData.aplicacion_id) : null,
        categoria_id:     editFormData.categoria_id  ? parseInt(editFormData.categoria_id)  : null,
        producto_id:      editFormData.producto_id   ? parseInt(editFormData.producto_id)   : null,
        duracion_minutos: parseFloat(editFormData.duracion_minutos),
        motivo: editFormData.motivo, solucion: editFormData.solucion, ticket: editFormData.ticket,
      });
      setEditingIncidente(null);
      fetchData();
    } catch { alert('Error al actualizar.'); }
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este incidente? Esta acción no se puede deshacer.')) return;
    try { await bitacoraService.deleteIncidente(id); fetchData(); }
    catch { alert('Error al eliminar.'); }
  };

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const getFullInfo = (empId, appId, prodId, catId) => ({
    producto:   productos.find(p   => p.id  === prodId)?.nombre ?? 'Sin Prod.',
    categoria:  categorias.find(c  => c.id  === catId)?.nombre  ?? 'Sin Cat.',
    aplicacion: aplicaciones.find(a => a.id === appId)?.nombre  ?? 'Sin App.',
    empresa:    empresas.find(e    => e.id  === empId)?.nombre  ?? 'Sin Red.',
  });

  const toggleSelection = (field, id) => {
    setFormData(prev => {
      const on = prev[field].includes(id);
      const next = on ? prev[field].filter(v => v !== id) : [...prev[field], id];
      if (field === 'categoria_ids' && on) {
        const removed = productos.filter(p => p.categoria_id === id).map(p => p.id);
        return { ...prev, [field]: next, producto_ids: prev.producto_ids.filter(i => !removed.includes(i)) };
      }
      return { ...prev, [field]: next };
    });
  };

  const aplicacionesFiltradas = aplicaciones.filter(a => {
    if (!formData.empresa_ids.length) return true;
    if (!a.empresas?.length) return true;
    return formData.empresa_ids.some(id => a.empresas.map(e => e.id).includes(id));
  });
  const productosFiltrados = productos.filter(p => formData.categoria_ids.includes(p.categoria_id));

  /* ── Checkbox Group renderer ───────────────────────────────────────────── */
  const renderCheckboxGroup = (step, title, items, field) => {
    const c = PILL[field];
    return (
      <div>
        <div className="bita-step-label">
          <span className={`bita-step-num ${STEP_BG[field]}`}>{step}</span>
          {title}
          <span className="ml-auto flex gap-2">
            <button type="button"
              onClick={() => setFormData(p => ({ ...p, [field]: items.map(i => i.id) }))}
              className="text-[10px] text-violet-500 hover:text-violet-700 font-semibold underline underline-offset-2">
              Todo
            </button>
            <button type="button"
              onClick={() => setFormData(p => ({ ...p, [field]: [] }))}
              className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold underline underline-offset-2">
              Ninguno
            </button>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto bita-scroll pr-0.5">
          {items.length === 0
            ? <span className="col-span-2 text-[10px] text-gray-400 italic py-1">Sin elementos disponibles</span>
            : items.map(item => {
                const on = formData[field].includes(item.id);
                return (
                  <label key={item.id}
                    className={`bita-pill flex items-center gap-1.5 px-2.5 py-[7px] border text-xs font-medium ${on ? c.on : c.off}`}>
                    <input type="checkbox" className="hidden" checked={on} onChange={() => toggleSelection(field, item.id)} />
                    {on && <CheckCircle2 size={11} className="flex-shrink-0" />}
                    <span className="truncate leading-tight">{item.nombre}</span>
                  </label>
                );
              })
          }
        </div>
      </div>
    );
  };

  /* ── Paginación ────────────────────────────────────────────────────────── */
  const sorted  = [...incidentes].sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
  const total   = Math.ceil(sorted.length / itemsPerPage) || 1;
  const current = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pageNumbers = () => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (currentPage <= 4)          return [1,2,3,4,5,'…',total];
    if (currentPage >= total - 3)  return [1,'…',total-4,total-3,total-2,total-1,total];
    return [1,'…',currentPage-1,currentPage,currentPage+1,'…',total];
  };

  /* ── Estadísticas rápidas ──────────────────────────────────────────────── */
  const totalMin = incidentes.reduce((s, i) => s + (i.duracion_minutos || 0), 0);
  const thisMonth = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const thisMonthCount = incidentes.filter(i => i.mes_reporte === thisMonth).length;

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="bita-root bita-bg min-h-screen pt-20 px-4 pb-16">
      <style>{STYLES}</style>

      <div className="max-w-7xl mx-auto">

        {/* ── Encabezado ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bita-pulse-dot" />
              <span className="text-[11px] font-extrabold text-violet-600 uppercase tracking-[.18em]">Sistema activo</span>
            </div>
            <h1 className="text-[2.6rem] font-extrabold text-gray-900 leading-none tracking-tight">
              Bitácora
              <span className="ml-3 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
                de Incidentes
              </span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Registro y seguimiento de fallas operativas en tiempo real</p>
          </div>

          {/* KPIs */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total registros', value: incidentes.length, color: 'text-violet-700' },
              { label: 'Min. caída total', value: `${totalMin.toFixed(0)}m`, color: 'text-fuchsia-700' },
              { label: 'Este mes', value: thisMonthCount, color: 'text-pink-700' },
            ].map(k => (
              <div key={k.label} className="bita-card px-5 py-3 text-center min-w-[90px]">
                <p className={`text-2xl font-extrabold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-7">

          {/* ══════════════════════════════════════════════════════════════
              FORMULARIO
          ═══════════════════════════════════════════════════════════════ */}
          <aside>
            <div className="bita-card p-6 sticky top-24">
              {/* Header form */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-violet-100/70">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200">
                  <Plus size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Nuevo Registro</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Documenta una falla operativa</p>
                </div>
              </div>

              {/* Flash éxito */}
              {successFlash && (
                <div className="bita-flash mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2.5 rounded-xl">
                  <CheckCircle2 size={15} /> Falla registrada correctamente
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Selectores en pasos */}
                <div className="bita-form-section space-y-4">
                  {renderCheckboxGroup(1, 'Empresa / Red',    empresas,             'empresa_ids')}
                  <div className="bita-divider" />
                  {renderCheckboxGroup(2, 'Aplicación',       aplicacionesFiltradas,'aplicacion_ids')}
                  <div className="bita-divider" />
                  {renderCheckboxGroup(3, 'Categoría',        categorias,           'categoria_ids')}
                  <div className="bita-divider" />
                  {renderCheckboxGroup(4, 'Producto',         productosFiltrados,   'producto_ids')}
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Calendar size={12} className="text-violet-500" /> Fecha y Hora de Caída
                  </label>
                  <input type="datetime-local"
                    className="bita-input w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                    value={formData.fecha_inicio}
                    onChange={e => setFormData(f => ({ ...f, fecha_inicio: e.target.value }))} />
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Clock size={12} className="text-red-500" /> Duración (minutos) *
                  </label>
                  <input type="number" step="0.1" placeholder="Ej: 15.5" required
                    className="bita-input bita-mono w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                    value={formData.duracion_minutos}
                    onChange={e => setFormData(f => ({ ...f, duracion_minutos: e.target.value }))} />
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-500" /> Motivo / Descripción
                  </label>
                  <textarea rows={2} placeholder="Razón de la caída..."
                    className="bita-input w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none"
                    value={formData.motivo}
                    onChange={e => setFormData(f => ({ ...f, motivo: e.target.value }))} />
                </div>

                {/* Solución */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Zap size={12} className="text-emerald-500" /> Solución Aplicada
                  </label>
                  <textarea rows={2} placeholder="Acciones correctivas..."
                    className="bita-input w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none"
                    value={formData.solucion}
                    onChange={e => setFormData(f => ({ ...f, solucion: e.target.value }))} />
                </div>

                {/* Ticket */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Hash size={12} className="text-violet-400" /> Ticket / Caso (Opcional)
                  </label>
                  <input type="text" placeholder="INC-12345"
                    className="bita-input bita-mono w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                    value={formData.ticket}
                    onChange={e => setFormData(f => ({ ...f, ticket: e.target.value }))} />
                </div>

                {/* Mes reporte */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Mes de Reporte</label>
                  <input readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-default"
                    value={formData.mes_reporte} />
                </div>

                <button type="submit" disabled={submitting}
                  className="bita-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Plus size={16} strokeWidth={2.5} /> Registrar Falla</>
                  }
                </button>
              </form>
            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════════════
              TABLA HISTORIAL
          ═══════════════════════════════════════════════════════════════ */}
          <section>
            <div className="bita-card overflow-hidden flex flex-col">

              {/* Header tabla */}
              <div className="px-6 py-5 border-b border-violet-100/60 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Historial de Incidentes</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Ordenado por fecha, más reciente primero</p>
                </div>
                <span className="bita-badge bg-violet-100 text-violet-700 border border-violet-200">
                  {incidentes.length} registros
                </span>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto overflow-y-auto max-h-[680px] bita-scroll">
                <table className="w-full text-left border-collapse">
                  <thead className="bita-thead sticky top-0 z-10">
                    <tr>
                      {['Fecha / Ticket','Falla Identificada','Detalle','Inactividad','Acciones'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {current.length === 0
                      ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-gray-400 text-sm italic">
                            No hay incidentes registrados aún.
                          </td>
                        </tr>
                      )
                      : current.map(inc => {
                          const info = getFullInfo(inc.empresa_id, inc.aplicacion_id, inc.producto_id, inc.categoria_id);
                          return (
                            <tr key={inc.id} className="bita-tr border-b border-gray-50">

                              {/* Fecha / Ticket */}
                              <td className="px-5 py-4 align-top">
                                <p className="bita-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                                  {new Date(inc.fecha_inicio).toLocaleString('es-ES', {
                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                                {inc.ticket && (
                                  <div className="mt-1.5">
                                    <span className="bita-ticket"><Hash size={9} />{inc.ticket}</span>
                                  </div>
                                )}
                              </td>

                              {/* Falla */}
                              <td className="px-5 py-4 align-top min-w-[180px]">
                                <p className="font-bold text-gray-900 text-sm leading-tight mb-2">{info.producto}</p>
                                <div className="flex flex-wrap gap-1">
                                  <span className="bita-badge bg-pink-50    text-pink-700    border border-pink-100">{info.categoria}</span>
                                  <span className="bita-badge bg-violet-50  text-violet-700  border border-violet-100">{info.empresa}</span>
                                  <span className="bita-badge bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100">{info.aplicacion}</span>
                                </div>
                              </td>

                              {/* Detalle */}
                              <td className="px-5 py-4 align-top min-w-[260px] max-w-[340px]">
                                {inc.motivo && (
                                  <div className="mb-2.5">
                                    <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest">Motivo</span>
                                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{inc.motivo}</p>
                                  </div>
                                )}
                                {inc.solucion && (
                                  <div>
                                    <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest">Solución</span>
                                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{inc.solucion}</p>
                                  </div>
                                )}
                                {!inc.motivo && !inc.solucion && (
                                  <span className="text-xs italic text-gray-300">Sin detalles</span>
                                )}
                              </td>

                              {/* Duración */}
                              <td className="px-5 py-4 align-top">
                                <span className="bita-duration">
                                  <Clock size={11} /> {inc.duracion_minutos}m
                                </span>
                              </td>

                              {/* Acciones */}
                              <td className="px-5 py-4 align-top">
                                <div className="flex gap-1.5">
                                  {(currentUser.rol === 'admin' || currentUser.rol === 'tecnico') && (
                                    <button
                                      onClick={() => {
                                        setEditingIncidente(inc);
                                        setEditFormData({
                                          empresa_id: inc.empresa_id || '', aplicacion_id: inc.aplicacion_id || '',
                                          categoria_id: inc.categoria_id || '', producto_id: inc.producto_id || '',
                                          duracion_minutos: inc.duracion_minutos,
                                          motivo: inc.motivo || '', solucion: inc.solucion || '', ticket: inc.ticket || ''
                                        });
                                      }}
                                      className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                                      title="Editar">
                                      <Pencil size={14} />
                                    </button>
                                  )}
                                  {currentUser.rol === 'admin' && (
                                    <button onClick={() => handleDelete(inc.id)}
                                      className="p-2 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors"
                                      title="Eliminar">
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>

              {/* Paginador */}
              {total > 1 && (
                <div className="px-6 py-4 border-t border-violet-100/50 bg-gradient-to-r from-violet-50/50 to-transparent flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-gray-500">
                    Página <strong className="text-gray-800">{currentPage}</strong> de <strong className="text-gray-800">{total}</strong>
                    <span className="text-gray-400 ml-2">· {incidentes.length} registros</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="bita-page-btn" disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={15} />
                    </button>
                    {pageNumbers().map((p, i) =>
                      p === '…'
                        ? <span key={`e${i}`} className="bita-page-btn text-gray-300 cursor-default select-none">…</span>
                        : <button key={p} onClick={() => setCurrentPage(p)}
                            className={`bita-page-btn ${currentPage === p ? 'active' : ''}`}>{p}</button>
                    )}
                    <button className="bita-page-btn" disabled={currentPage === total}
                      onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL EDICIÓN
      ═══════════════════════════════════════════════════════════════════════ */}
      {editingIncidente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(24,8,60,0.52)', backdropFilter: 'blur(8px)' }}>
          <div className="bita-modal-enter bita-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-violet-100/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow">
                  <Pencil size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Editar Incidente</h2>
                  <p className="bita-mono text-[11px] text-gray-400">ID #{editingIncidente.id}</p>
                </div>
              </div>
              <button onClick={() => setEditingIncidente(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bita-scroll px-7 py-6">
              <form id="editForm" onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Empresa */}
                {[
                  { label: 'Empresa / Red',  field: 'empresa_id',    items: empresas },
                  { label: 'Aplicación',     field: 'aplicacion_id',
                    items: aplicaciones.filter(a => {
                      if (!editFormData.empresa_id) return true;
                      if (!a.empresas?.length) return true;
                      return a.empresas.map(e => e.id).includes(parseInt(editFormData.empresa_id));
                    })
                  },
                  { label: 'Categoría',     field: 'categoria_id',  items: categorias },
                  { label: 'Producto',      field: 'producto_id',
                    items: productos.filter(p => !editFormData.categoria_id || p.categoria_id === parseInt(editFormData.categoria_id))
                  },
                ].map(({ label, field, items }) => (
                  <div key={field}>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
                    <select
                      className="bita-input w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                      value={editFormData[field]}
                      onChange={e => setEditFormData(f => ({ ...f, [field]: e.target.value }))}>
                      <option value="">— Sin selección —</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                  </div>
                ))}

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Inactividad (min) *</label>
                  <input type="number" step="0.1" required
                    className="bita-input bita-mono w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                    value={editFormData.duracion_minutos}
                    onChange={e => setEditFormData(f => ({ ...f, duracion_minutos: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Ticket / Caso</label>
                  <input type="text"
                    className="bita-input bita-mono w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                    value={editFormData.ticket}
                    onChange={e => setEditFormData(f => ({ ...f, ticket: e.target.value }))} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold text-amber-500 uppercase tracking-widest mb-1.5">Motivo / Falla</label>
                  <textarea rows={3}
                    className="bita-input w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none"
                    value={editFormData.motivo}
                    onChange={e => setEditFormData(f => ({ ...f, motivo: e.target.value }))} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1.5">Solución Aplicada</label>
                  <textarea rows={3}
                    className="bita-input w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none"
                    value={editFormData.solucion}
                    onChange={e => setEditFormData(f => ({ ...f, solucion: e.target.value }))} />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-violet-100/60 bg-gray-50/70 flex justify-end gap-3">
              <button onClick={() => setEditingIncidente(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="editForm"
                className="bita-btn-primary px-6 py-2.5 text-sm">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bitacora;
