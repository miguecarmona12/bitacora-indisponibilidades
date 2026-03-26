import React, { useState, useEffect } from 'react';
import { bitacoraService } from '../services/api';
import {
  PlusCircle, Building2, Server, AppWindow, FolderTree,
  Pencil, X, CheckCircle2, Hash, ChevronRight, Layers
} from 'lucide-react';

/* ─── Estilos — mismo sistema que Bitacora.jsx ─────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');

  :root {
    --violet:      #7c3aed;
    --violet-mid:  #8b5cf6;
    --violet-soft: #f5f3ff;
    --fuchsia:     #a21caf;
    --fuchsia-soft:#fdf4ff;
    --pink:        #be185d;
    --pink-soft:   #fdf2f8;
    --orange:      #c2410c;
    --orange-soft: #fff7ed;
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

  .cfg-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .cfg-mono   { font-family: 'Geist Mono', monospace !important; }
  .cfg-bg     { background: var(--surface); }

  /* ── Cards ── */
  .cfg-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
  }

  /* ── Pulse dot (mismo que Bitácora) ── */
  @keyframes cfg-pulse {
    0%,100% { box-shadow: 0 0 0 0   rgba(124,58,237,.5); }
    50%      { box-shadow: 0 0 0 5px rgba(124,58,237,0);  }
  }
  .cfg-pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--violet);
    animation: cfg-pulse 2.2s ease infinite;
    flex-shrink: 0;
  }

  /* ── Input ── */
  .cfg-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 8px 11px;
    font-size: 13px;
    color: var(--text-1);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    width: 100%;
  }
  .cfg-input::placeholder { color: var(--text-3); }
  .cfg-input:focus {
    border-color: var(--violet-mid);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }

  /* ── Botón primario negro (igual que Bitácora) ── */
  .cfg-btn-primary {
    background: var(--text-1);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600; font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 14px;
  }
  .cfg-btn-primary:hover { opacity: 0.86; transform: translateY(-0.5px); }
  .cfg-btn-primary:active { transform: translateY(0); }

  /* ── Botón add (acento por panel) ── */
  .cfg-btn-add {
    border: none; border-radius: var(--radius-md);
    font-weight: 600; font-size: 12px; cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    display: flex; align-items: center; justify-content: center;
    padding: 8px 12px; color: white; flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.18);
  }
  .cfg-btn-add:hover { opacity: 0.86; transform: translateY(-0.5px); }
  .cfg-btn-add:active { transform: translateY(0); }

  /* ── Botón ghost ── */
  .cfg-btn-ghost {
    background: transparent; border: 1px solid var(--border);
    border-radius: var(--radius-md); color: var(--text-2);
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: background 0.13s, border-color 0.13s;
    padding: 8px 16px;
  }
  .cfg-btn-ghost:hover { background: var(--surface-3); border-color: #d4d4d8; }

  /* ── Label ── */
  .cfg-label {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700;
    letter-spacing: .09em; text-transform: uppercase;
    color: var(--text-3); margin-bottom: 6px;
  }

  /* ── Lista de ítems ── */
  .cfg-list {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: 260px;
    overflow-y: auto;
  }
  .cfg-list-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    transition: background 0.1s ease;
    gap: 8px;
  }
  .cfg-list-item:last-child { border-bottom: none; }
  .cfg-list-item:hover { background: var(--surface-2); }
  .cfg-list-item:hover .cfg-edit-btn { opacity: 1; }

  .cfg-item-name {
    font-size: 13px; font-weight: 500;
    color: var(--text-1); truncate: true;
    flex: 1; overflow: hidden;
    white-space: nowrap; text-overflow: ellipsis;
  }

  /* ── Edit button (igual que acción en tabla Bitácora) ── */
  .cfg-edit-btn {
    width: 28px; height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-3);
    transition: all .13s ease;
    opacity: 0; flex-shrink: 0;
  }
  .cfg-edit-btn:hover { color: var(--violet); background: var(--violet-soft); border-color: #ddd6fe; }

  /* ── Badge (mismo sistema Bitácora) ── */
  .cfg-badge {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 600;
    letter-spacing: .03em;
    padding: 2px 7px; border-radius: 4px;
    white-space: nowrap; flex-shrink: 0;
  }

  /* ── Scrollbar — lista de ítems ── */
  .cfg-list::-webkit-scrollbar       { width: 4px; }
  .cfg-list::-webkit-scrollbar-track { background: #ffffff; border-radius: 9px; }
  .cfg-list::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 9px; }
  .cfg-list::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }

  /* ── Scrollbar — check-list (empresas en modal / form) ── */
  .cfg-check-list::-webkit-scrollbar       { width: 4px; }
  .cfg-check-list::-webkit-scrollbar-track { background: #ffffff; border-radius: 9px; }
  .cfg-check-list::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 9px; }
  .cfg-check-list::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }

  /* ── Vacío ── */
  .cfg-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; padding: 24px 16px;
    color: var(--text-3); font-size: 12px; font-style: italic; text-align: center; gap: 6px;
  }

  /* ── Modal ── */
  @keyframes cfg-modal-in {
    from { opacity: 0; transform: translateY(16px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  .cfg-modal-enter { animation: cfg-modal-in 0.22s cubic-bezier(.4,0,.2,1) forwards; }

  /* ── Checkbox list en modal ── */
  .cfg-check-list {
    border: 1px solid var(--border); border-radius: var(--radius-md);
    overflow: hidden; max-height: 160px; overflow-y: auto;
  }
  .cfg-check-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
    font-size: 13px; color: var(--text-1); font-weight: 500;
  }
  .cfg-check-item:last-child { border-bottom: none; }
  .cfg-check-item:hover { background: var(--surface-2); }
  .cfg-check-item input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 15px; height: 15px;
    border: 1.5px solid #d4d4d8;
    border-radius: 4px;
    background: #ffffff;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s ease;
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .cfg-check-item input[type="checkbox"]:hover {
    border-color: var(--violet-mid);
    background: var(--violet-soft);
  }
  .cfg-check-item input[type="checkbox"]:checked {
    background: var(--violet);
    border-color: var(--violet);
  }
  .cfg-check-item input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    width: 4px; height: 7px;
    border: 1.5px solid white;
    border-top: none; border-left: none;
    transform: rotate(45deg) translateY(-1px);
  }

  /* ── Flash ── */
  @keyframes cfg-flash {
    0%   { opacity: 0; transform: translateY(-4px) scale(.98); }
    12%  { opacity: 1; transform: translateY(0)    scale(1);   }
    78%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .cfg-flash { animation: cfg-flash 2.2s ease forwards; }

  /* ── Panel header accent line ── */
  .cfg-panel-accent {
    height: 3px; border-radius: 99px;
    margin-bottom: 20px;
  }

  /* ── Separador ── */
  .cfg-divider { height: 1px; background: var(--border); margin: 14px 0; }

  /* ── Counter badge ── */
  .cfg-counter {
    min-width: 20px; height: 20px;
    border-radius: 99px;
    font-size: 10px; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 6px;
  }
`;

/* ─── Config de paneles ─────────────────────────────────────────────────────── */
const PANELS = [
  {
    key: 'empresa',
    step: '1',
    title: 'Empresas',
    subtitle: 'Ej: Gana, Claro, EPM',
    Icon: Building2,
    accent: 'linear-gradient(90deg, #7c3aed, #8b5cf6)',
    accentClass: 'bg-violet-600',
    btnBg: '#7c3aed',
    badgeClass: 'cfg-badge',
    badgeStyle: { background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' },
    placeholder: 'Nueva empresa...',
    focusRing: 'focus:ring-violet-500',
    counter: { bg: '#ede9fe', color: '#6d28d9' },
  },
  {
    key: 'aplicacion',
    step: '2',
    title: 'Aplicaciones',
    subtitle: 'Ej: Jade, Invictus, Webs',
    Icon: AppWindow,
    accent: 'linear-gradient(90deg, #a21caf, #c026d3)',
    accentClass: 'bg-fuchsia-700',
    btnBg: '#a21caf',
    badgeClass: 'cfg-badge',
    badgeStyle: { background: '#fdf4ff', color: '#86198f', border: '1px solid #f0abfc' },
    placeholder: 'Nueva aplicación...',
    counter: { bg: '#fdf4ff', color: '#86198f' },
    hasEmpresas: true,
  },
  {
    key: 'categoria',
    step: '3',
    title: 'Categorías',
    subtitle: 'Ej: Apuestas, Recargas',
    Icon: FolderTree,
    accent: 'linear-gradient(90deg, #be185d, #db2777)',
    accentClass: 'bg-pink-700',
    btnBg: '#be185d',
    badgeClass: 'cfg-badge',
    badgeStyle: { background: '#fdf2f8', color: '#9d174d', border: '1px solid #fbcfe8' },
    placeholder: 'Nueva categoría...',
    counter: { bg: '#fdf2f8', color: '#9d174d' },
  },
  {
    key: 'producto',
    step: '4',
    title: 'Productos',
    subtitle: 'Asignados a una Categoría',
    Icon: Server,
    accent: 'linear-gradient(90deg, #c2410c, #ea580c)',
    accentClass: 'bg-orange-700',
    btnBg: '#c2410c',
    badgeClass: 'cfg-badge',
    badgeStyle: { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' },
    placeholder: 'Nuevo producto...',
    counter: { bg: '#fff7ed', color: '#9a3412' },
    hasCategoria: true,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
const Configuracion = () => {
  const [empresas,     setEmpresas]     = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [categorias,   setCategorias]   = useState([]);
  const [productos,    setProductos]    = useState([]);

  const [nuevaEmpresa,      setNuevaEmpresa]      = useState('');
  const [nuevaAplicacion,   setNuevaAplicacion]   = useState('');
  const [nuevaCategoria,    setNuevaCategoria]    = useState('');
  const [nuevoProducto,     setNuevoProducto]     = useState('');
  const [productoCategoria, setProductoCategoria] = useState('');
  const [aplicacionEmpresas,setAplicacionEmpresas]= useState([]);

  const [flash,    setFlash]    = useState(null); // { panel, msg }
  const [editItem, setEditItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  /* ── Fetch ────────────────────────────────────────────────────────────── */
  const fetchData = async () => {
    try {
      const [e, a, c, p] = await Promise.all([
        bitacoraService.getEmpresas(),
        bitacoraService.getAplicaciones(),
        bitacoraService.getCategorias(),
        bitacoraService.getProductos(),
      ]);
      setEmpresas(e); setAplicaciones(a); setCategorias(c); setProductos(p);
    } catch (err) { console.error('Error fetching data', err); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Flash helper ─────────────────────────────────────────────────────── */
  const showFlash = (panel, msg) => {
    setFlash({ panel, msg });
    setTimeout(() => setFlash(null), 2400);
  };

  /* ── Crear ────────────────────────────────────────────────────────────── */
  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    if (!nuevaEmpresa.trim()) return;
    try {
      await bitacoraService.createEmpresa({ nombre: nuevaEmpresa.trim() });
      setNuevaEmpresa('');
      showFlash('empresa', 'Empresa creada');
      fetchData();
    } catch { alert('Error: puede que ya exista.'); }
  };

  const handleCrearAplicacion = async (e) => {
    e.preventDefault();
    if (!nuevaAplicacion.trim()) return;
    try {
      await bitacoraService.createAplicacion({
        nombre: nuevaAplicacion.trim(),
        empresa_ids: aplicacionEmpresas.map(id => parseInt(id)),
      });
      setNuevaAplicacion(''); setAplicacionEmpresas([]);
      showFlash('aplicacion', 'Aplicación creada');
      fetchData();
    } catch { alert('Error: puede que ya exista.'); }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    try {
      await bitacoraService.createCategoria({ nombre: nuevaCategoria.trim() });
      setNuevaCategoria('');
      showFlash('categoria', 'Categoría creada');
      fetchData();
    } catch { alert('Error: puede que ya exista.'); }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProducto.trim() || !productoCategoria) {
      alert('Ingresa el nombre y selecciona una categoría.');
      return;
    }
    try {
      await bitacoraService.createProducto({
        nombre: nuevoProducto.trim(),
        categoria_id: parseInt(productoCategoria),
      });
      setNuevoProducto(''); setProductoCategoria('');
      showFlash('producto', 'Producto creado');
      fetchData();
    } catch { alert('Error: puede que ya exista.'); }
  };

  /* ── Editar ───────────────────────────────────────────────────────────── */
  const handleEditClick = (type, item) => {
    setEditItem({ type, id: item.id });
    if (type === 'empresa' || type === 'categoria') {
      setEditFormData({ nombre: item.nombre });
    } else if (type === 'aplicacion') {
      setEditFormData({
        nombre: item.nombre,
        empresa_ids: item.empresas ? item.empresas.map(e => e.id.toString()) : [],
      });
    } else if (type === 'producto') {
      setEditFormData({ nombre: item.nombre, categoria_id: item.categoria_id?.toString() || '' });
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editFormData.nombre?.trim()) return;
    try {
      if (editItem.type === 'empresa') {
        await bitacoraService.updateEmpresa(editItem.id, { nombre: editFormData.nombre.trim() });
      } else if (editItem.type === 'categoria') {
        await bitacoraService.updateCategoria(editItem.id, { nombre: editFormData.nombre.trim() });
      } else if (editItem.type === 'aplicacion') {
        await bitacoraService.updateAplicacion(editItem.id, {
          nombre: editFormData.nombre.trim(),
          empresa_ids: (editFormData.empresa_ids || []).map(id => parseInt(id)),
        });
      } else if (editItem.type === 'producto') {
        await bitacoraService.updateProducto(editItem.id, {
          nombre: editFormData.nombre.trim(),
          categoria_id: parseInt(editFormData.categoria_id),
        });
      }
      setEditItem(null);
      fetchData();
    } catch { alert('Error al actualizar. Verifique que el nombre no esté repetido.'); }
  };

  /* ── Panel metadata ───────────────────────────────────────────────────── */
  const panelMeta = {
    empresa:    { items: empresas,     count: empresas.length },
    aplicacion: { items: aplicaciones, count: aplicaciones.length },
    categoria:  { items: categorias,   count: categorias.length },
    producto:   { items: productos,    count: productos.length },
  };

  const editPanelConfig = PANELS.find(p => p.key === editItem?.type);

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="cfg-root cfg-bg min-h-screen pt-20 px-4 pb-16">
      <style>{STYLES}</style>

      <div className="max-w-7xl mx-auto">

        {/* ── Encabezado ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="cfg-pulse-dot" />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--violet)' }}>
                Catálogos del sistema
              </span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-.02em' }}>
              Administración
              <span style={{ marginLeft: 12, background: 'linear-gradient(135deg, #7c3aed, #a21caf, #be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                de Catálogos
              </span>
            </h1>
            <p style={{ color: 'var(--text-3)', marginTop: 8, fontSize: 13 }}>
              Gestiona los catálogos independientes que alimentan la bitácora de incidentes
            </p>
          </div>

          {/* KPIs */}
          <div className="flex gap-3 flex-wrap">
            {PANELS.map(panel => {
              const meta = panelMeta[panel.key];
              return (
                <div key={panel.key} className="g-kpi" style={{ padding: '12px 20px', minWidth: 90, textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, background: panel.accent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {meta.count}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>
                    {panel.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Grid 4 columnas ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* ══ Panel EMPRESAS ══ */}
          <div className="cfg-card p-5">
            {/* Accent */}
            <div className="cfg-panel-accent" style={{ background: PANELS[0].accent }} />

            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: PANELS[0].accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={15} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Empresas</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Redes operadoras</p>
                </div>
              </div>
              <span className="cfg-counter" style={{ background: PANELS[0].counter.bg, color: PANELS[0].counter.color }}>
                {empresas.length}
              </span>
            </div>

            <div className="cfg-divider" />

            {/* Flash */}
            {flash?.panel === 'empresa' && (
              <div className="cfg-flash mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                <CheckCircle2 size={13} /> {flash.msg}
              </div>
            )}

            {/* Hint */}
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>Ej: Gana, Claro, EPM</p>

            {/* Form */}
            <form onSubmit={handleCrearEmpresa} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nueva empresa..."
                className="cfg-input"
                value={nuevaEmpresa}
                onChange={e => setNuevaEmpresa(e.target.value)}
              />
              <button type="submit" className="cfg-btn-add" style={{ background: PANELS[0].btnBg }}>
                <PlusCircle size={16} />
              </button>
            </form>

            {/* Lista */}
            <div className="cfg-list">
              {empresas.length === 0
                ? <div className="cfg-empty"><Building2 size={20} /><span>Sin empresas</span></div>
                : empresas.map(emp => (
                  <div key={emp.id} className="cfg-list-item">
                    <span className="cfg-item-name">{emp.nombre}</span>
                    <button className="cfg-edit-btn" onClick={() => handleEditClick('empresa', emp)}>
                      <Pencil size={12} />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ══ Panel APLICACIONES ══ */}
          <div className="cfg-card p-5">
            <div className="cfg-panel-accent" style={{ background: PANELS[1].accent }} />

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: PANELS[1].accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AppWindow size={15} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Aplicaciones</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Sistemas y plataformas</p>
                </div>
              </div>
              <span className="cfg-counter" style={{ background: PANELS[1].counter.bg, color: PANELS[1].counter.color }}>
                {aplicaciones.length}
              </span>
            </div>

            <div className="cfg-divider" />

            {flash?.panel === 'aplicacion' && (
              <div className="cfg-flash mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                <CheckCircle2 size={13} /> {flash.msg}
              </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>Ej: Jade, Invictus, Webs</p>

            <form onSubmit={handleCrearAplicacion} className="flex flex-col gap-2 mb-4">
              {/* Checkboxes de empresas */}
              <div className="cfg-check-list" style={{ maxHeight: 100 }}>
                {empresas.length === 0
                  ? <div className="cfg-check-item" style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: 11 }}>Sin empresas disponibles</div>
                  : empresas.map(emp => (
                    <label key={emp.id} className="cfg-check-item">
                      <input
                        type="checkbox"
                        checked={aplicacionEmpresas.includes(emp.id.toString())}
                        onChange={e => {
                          if (e.target.checked) setAplicacionEmpresas(p => [...p, emp.id.toString()]);
                          else setAplicacionEmpresas(p => p.filter(id => id !== emp.id.toString()));
                        }}
                      />
                      {emp.nombre}
                    </label>
                  ))
                }
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva aplicación..."
                  className="cfg-input"
                  value={nuevaAplicacion}
                  onChange={e => setNuevaAplicacion(e.target.value)}
                />
                <button type="submit" className="cfg-btn-add" style={{ background: PANELS[1].btnBg }}>
                  <PlusCircle size={16} />
                </button>
              </div>
            </form>

            <div className="cfg-list">
              {aplicaciones.length === 0
                ? <div className="cfg-empty"><AppWindow size={20} /><span>Sin aplicaciones</span></div>
                : aplicaciones.map(app => (
                  <div key={app.id} className="cfg-list-item">
                    <span className="cfg-item-name">{app.nombre}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {app.empresas && app.empresas.length > 0
                        ? app.empresas.map(e => (
                          <span key={e.id} className="cfg-badge"
                            style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: 9, padding: '2px 6px' }}>
                            {e.nombre}
                          </span>
                        ))
                        : <span className="cfg-badge" style={{ background: 'var(--surface-3)', color: 'var(--text-3)', border: '1px solid var(--border)', fontSize: 9, padding: '2px 6px' }}>
                            Global
                          </span>
                      }
                      <button className="cfg-edit-btn" onClick={() => handleEditClick('aplicacion', app)}>
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ══ Panel CATEGORÍAS ══ */}
          <div className="cfg-card p-5">
            <div className="cfg-panel-accent" style={{ background: PANELS[2].accent }} />

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: PANELS[2].accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderTree size={15} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Categorías</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Clasificación de fallas</p>
                </div>
              </div>
              <span className="cfg-counter" style={{ background: PANELS[2].counter.bg, color: PANELS[2].counter.color }}>
                {categorias.length}
              </span>
            </div>

            <div className="cfg-divider" />

            {flash?.panel === 'categoria' && (
              <div className="cfg-flash mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                <CheckCircle2 size={13} /> {flash.msg}
              </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>Ej: Apuestas, Recargas, Recaudos</p>

            <form onSubmit={handleCrearCategoria} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nueva categoría..."
                className="cfg-input"
                value={nuevaCategoria}
                onChange={e => setNuevaCategoria(e.target.value)}
              />
              <button type="submit" className="cfg-btn-add" style={{ background: PANELS[2].btnBg }}>
                <PlusCircle size={16} />
              </button>
            </form>

            <div className="cfg-list">
              {categorias.length === 0
                ? <div className="cfg-empty"><FolderTree size={20} /><span>Sin categorías</span></div>
                : categorias.map(cat => (
                  <div key={cat.id} className="cfg-list-item">
                    <span className="cfg-item-name">{cat.nombre}</span>
                    <button className="cfg-edit-btn" onClick={() => handleEditClick('categoria', cat)}>
                      <Pencil size={12} />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ══ Panel PRODUCTOS ══ */}
          <div className="cfg-card p-5">
            <div className="cfg-panel-accent" style={{ background: PANELS[3].accent }} />

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: PANELS[3].accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={15} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Productos</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Asignados a categorías</p>
                </div>
              </div>
              <span className="cfg-counter" style={{ background: PANELS[3].counter.bg, color: PANELS[3].counter.color }}>
                {productos.length}
              </span>
            </div>

            <div className="cfg-divider" />

            {flash?.panel === 'producto' && (
              <div className="cfg-flash mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                <CheckCircle2 size={13} /> {flash.msg}
              </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>Requiere una categoría asignada</p>

            <form onSubmit={handleCrearProducto} className="flex flex-col gap-2 mb-4">
              <select
                className="cfg-input"
                style={{ fontSize: 13 }}
                value={productoCategoria}
                onChange={e => setProductoCategoria(e.target.value)}
                disabled={categorias.length === 0}
              >
                <option value="">— Selecciona categoría —</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nuevo producto..."
                  className="cfg-input"
                  value={nuevoProducto}
                  onChange={e => setNuevoProducto(e.target.value)}
                  disabled={categorias.length === 0}
                  style={{ opacity: categorias.length === 0 ? 0.5 : 1 }}
                />
                <button
                  type="submit"
                  className="cfg-btn-add"
                  style={{ background: PANELS[3].btnBg, opacity: categorias.length === 0 ? 0.4 : 1 }}
                  disabled={categorias.length === 0}
                >
                  <PlusCircle size={16} />
                </button>
              </div>
            </form>

            <div className="cfg-list">
              {productos.length === 0
                ? <div className="cfg-empty"><Server size={20} /><span>Sin productos</span></div>
                : productos.map(prod => {
                    const catName = categorias.find(c => c.id === prod.categoria_id)?.nombre || 'Sin Cat.';
                    return (
                      <div key={prod.id} className="cfg-list-item">
                        <span className="cfg-item-name">{prod.nombre}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="cfg-badge"
                            style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontSize: 9, padding: '2px 6px' }}>
                            {catName}
                          </span>
                          <button className="cfg-edit-btn" onClick={() => handleEditClick('producto', prod)}>
                            <Pencil size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL DE EDICIÓN — mismo estilo que modal de Bitácora
      ═══════════════════════════════════════════════════════════════════════ */}
      {editItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,9,11,0.48)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditItem(null); }}
        >
          <div className="cfg-modal-enter" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%', maxWidth: 460,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
            }}>
              <div className="flex items-center gap-3">
                {editPanelConfig && (
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: editPanelConfig.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <editPanelConfig.Icon size={15} color="white" />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                    Editar {editItem.type}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Geist Mono, monospace' }}>
                    ID #{editItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditItem(null)}
                style={{
                  width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-3)',
                  transition: 'all .13s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <form id="cfgEditForm" onSubmit={handleUpdateItem}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Nombre */}
                <div>
                  <div className="cfg-label">Nombre</div>
                  <input
                    type="text"
                    required
                    className="cfg-input"
                    value={editFormData.nombre || ''}
                    onChange={e => setEditFormData(f => ({ ...f, nombre: e.target.value }))}
                    autoFocus
                  />
                </div>

                {/* Aplicación → Empresas */}
                {editItem.type === 'aplicacion' && (
                  <div>
                    <div className="cfg-label">
                      <Building2 size={11} />
                      Asignar a Redes (vacío = Global)
                    </div>
                    <div className="cfg-check-list">
                      {empresas.map(emp => (
                        <label key={emp.id} className="cfg-check-item">
                          <input
                            type="checkbox"
                            checked={(editFormData.empresa_ids || []).includes(emp.id.toString())}
                            onChange={e => {
                              const cur = editFormData.empresa_ids || [];
                              if (e.target.checked) setEditFormData(f => ({ ...f, empresa_ids: [...cur, emp.id.toString()] }));
                              else setEditFormData(f => ({ ...f, empresa_ids: cur.filter(id => id !== emp.id.toString()) }));
                            }}
                          />
                          {emp.nombre}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Producto → Categoría */}
                {editItem.type === 'producto' && (
                  <div>
                    <div className="cfg-label">
                      <FolderTree size={11} />
                      Categoría
                    </div>
                    <select
                      required
                      className="cfg-input"
                      style={{ fontSize: 13 }}
                      value={editFormData.categoria_id || ''}
                      onChange={e => setEditFormData(f => ({ ...f, categoria_id: e.target.value }))}
                    >
                      <option value="">— Seleccionar —</option>
                      {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                padding: '14px 24px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}>
                <button type="button" onClick={() => setEditItem(null)} className="cfg-btn-ghost" style={{ padding: '8px 18px' }}>
                  Cancelar
                </button>
                <button type="submit" className="cfg-btn-primary" style={{ padding: '8px 20px' }}>
                  <CheckCircle2 size={14} /> Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;
