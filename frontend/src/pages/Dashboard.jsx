import React, { useEffect, useState, useMemo } from 'react';
import { bitacoraService, authService } from '../services/api';
import {
  BarChart3, TrendingUp, AlertCircle, Clock,
  AppWindow, Server, Activity, Filter, X,
  Zap, Calendar, ChevronDown, Wifi, FolderTree
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const MINUTOS_MES = 43200;
const PIE_COLORS = ['#7c3aed','#a21caf','#be185d','#c2410c','#b45309','#0e7490','#065f46'];

const getDispColor = (d) => {
  if (d >= 99.5) return '#16a34a';
  if (d >= 98.0) return '#d97706';
  return '#dc2626';
};

const getDispMeta = (d) => {
  if (d >= 99.5) return { label: 'Óptimo',  accent: '#16a34a' };
  if (d >= 98.0) return { label: 'Alerta',  accent: '#d97706' };
  return           { label: 'Crítico', accent: '#dc2626' };
};

/* ─────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────── */
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
    --shadow-lg:   0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;
    --radius-2xl:  24px;
  }

  .d-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .d-mono   { font-family: 'Geist Mono', monospace !important; }
  .d-bg     { background: var(--surface); min-height: 100vh; }

  /* ── Pulse dot ── */
  @keyframes d-pulse {
    0%,100% { box-shadow: 0 0 0 0   rgba(124,58,237,.5); }
    50%      { box-shadow: 0 0 0 5px rgba(124,58,237,0);  }
  }
  .d-pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--violet);
    animation: d-pulse 2.2s ease infinite;
    flex-shrink: 0;
  }

  /* ── Fade up ── */
  @keyframes d-fadeup {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .d-fadeup { animation: d-fadeup 0.4s cubic-bezier(.16,1,.3,1) both; }

  /* ── KPI Card ── */
  .d-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 20px 20px 18px;
    display: flex; align-items: flex-start; gap: 14px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s;
    position: relative; overflow: hidden;
    cursor: default;
  }
  .d-kpi:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
    border-color: #d4d4d8;
  }

  /* shimmer on hover */
  .d-kpi::after {
    content: '';
    position: absolute; top: 0; left: -60%;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: skewX(-12deg);
    transition: none;
    pointer-events: none;
  }
  .d-kpi:hover::after {
    animation: d-shimmer 0.5s ease forwards;
  }
  @keyframes d-shimmer {
    to { left: 130%; }
  }

  .d-kpi-icon {
    width: 40px; height: 40px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.14);
  }
  .d-kpi-label {
    font-size: 9.5px; font-weight: 700;
    letter-spacing: .13em; text-transform: uppercase;
    color: var(--text-3); margin-bottom: 2px;
  }
  .d-kpi-value {
    font-size: 38px; font-weight: 800;
    line-height: 1; letter-spacing: -0.03em;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .d-kpi-sub {
    font-size: 11px; color: var(--text-3); font-weight: 500; margin-top: 4px;
  }

  /* ── Chart card ── */
  .d-chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .d-chart-card:hover { box-shadow: var(--shadow-md); border-color: #d4d4d8; }

  /* ── Section title ── */
  .d-sec-title {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--text-2);
  }
  .d-sec-icon {
    width: 24px; height: 24px; border-radius: 7px;
    background: var(--surface-3); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── Status legend ── */
  .d-status-legend { display: flex; flex-wrap: wrap; gap: 10px; }
  .d-status-item { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: var(--text-3); }
  .d-status-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* ── Tooltip ── */
  .d-tooltip {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 11px 15px;
    box-shadow: var(--shadow-lg);
    min-width: 150px;
  }
  .d-tooltip-title {
    font-size: 12.5px; font-weight: 700; color: var(--text-1);
    margin-bottom: 8px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; max-width: 180px;
  }
  .d-tooltip-row {
    display: flex; justify-content: space-between; gap: 14px;
    font-size: 11px; color: var(--text-3); font-weight: 500; margin-top: 3px;
  }

  /* ── Empty chart ── */
  .d-empty {
    flex: 1; min-height: 200px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    border: 1.5px dashed var(--border); border-radius: var(--radius-lg);
    color: var(--text-3); font-size: 10px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase;
  }

  /* ── Filter toggle btn ── */
  .d-filter-btn {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: 'Geist', sans-serif;
    font-size: 12px; font-weight: 600;
    color: var(--text-2);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 9px 16px;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.18s, border-color 0.18s;
    position: relative; align-self: flex-start;
  }
  .d-filter-btn:hover { box-shadow: var(--shadow-md); border-color: #d4d4d8; }
  .d-filter-active-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--fuchsia);
    position: absolute; top: 6px; right: 6px;
  }

  /* ── Filter panel ── */
  .d-filter-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    margin-bottom: 20px;
    overflow: hidden;
    animation: d-fadeup 0.22s cubic-bezier(.16,1,.3,1) both;
  }
  .d-filter-inner {
    display: flex; flex-wrap: wrap; align-items: flex-end; gap: 18px;
    padding: 18px 22px;
  }
  .d-filter-group { display: flex; flex-direction: column; gap: 5px; }
  .d-filter-label {
    display: flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 800;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-3);
  }
  .d-filter-sep { width: 1px; height: 36px; background: var(--border); flex-shrink: 0; align-self: center; }

  /* ── Date input ── */
  .d-date-input {
    font-family: 'Geist', sans-serif;
    font-size: 12px; font-weight: 500;
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 7px 10px; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .d-date-input:focus { border-color: var(--violet-mid); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }

  /* ── Select ── */
  .d-select-wrap { position: relative; display: flex; align-items: center; }
  .d-select {
    appearance: none;
    font-family: 'Geist', sans-serif;
    font-size: 12px; font-weight: 500;
    color: var(--text-1);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 7px 28px 7px 10px;
    outline: none; cursor: pointer;
    min-width: 138px;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .d-select:hover { background: var(--surface); border-color: #d4d4d8; }
  .d-select:focus { border-color: var(--violet-mid); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); background: var(--surface); }
  .d-select option { background: #fff; color: var(--text-1); }
  .d-select-arrow { position: absolute; right: 8px; color: var(--text-3); pointer-events: none; }

  /* ── Clear btn ── */
  .d-clear-btn {
    display: flex; align-items: center; gap: 5px;
    font-family: 'Geist', sans-serif;
    font-size: 11px; font-weight: 600;
    color: #dc2626; background: #fef2f2;
    border: 1px solid #fecaca; border-radius: var(--radius-md);
    padding: 7px 13px; cursor: pointer;
    transition: background 0.13s, border-color 0.13s;
    align-self: flex-end;
  }
  .d-clear-btn:hover { background: #fee2e2; border-color: #fca5a5; }

  /* ── Table card ── */
  .d-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .d-table-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 22px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
  }
  .d-table-scroll {
    overflow-x: auto; max-height: 400px;
  }
  .d-table-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
  .d-table-scroll::-webkit-scrollbar-track { background: transparent; }
  .d-table-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 9px; }

  .d-table { width: 100%; border-collapse: collapse; }
  .d-table thead th {
    font-size: 9.5px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--text-3);
    padding: 10px 18px;
    text-align: left; white-space: nowrap;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 10;
  }
  .d-table tbody tr {
    border-bottom: 1px solid var(--surface-2);
    transition: background 0.1s ease;
  }
  .d-table tbody tr:last-child { border-bottom: none; }
  .d-table tbody tr:hover { background: var(--surface-2); }
  .d-table td {
    padding: 11px 18px;
    font-size: 12px; font-weight: 500;
    color: var(--text-2); white-space: nowrap;
  }

  /* ── Table chips ── */
  .d-ticket-chip {
    display: inline-block; margin-top: 3px;
    font-family: 'Geist Mono', monospace;
    font-size: 9.5px; font-weight: 600;
    color: var(--violet);
    background: var(--violet-soft);
    border: 1px solid #ddd6fe;
    padding: 2px 7px; border-radius: var(--radius-sm);
  }
  .d-cat-chip {
    font-size: 10px; font-weight: 600;
    color: #be185d; background: #fdf2f8;
    border: 1px solid #fbcfe8;
    padding: 2px 8px; border-radius: var(--radius-sm);
  }
  .d-dur-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'Geist Mono', monospace;
    font-size: 11px; font-weight: 600;
    padding: 3px 9px; border-radius: var(--radius-sm);
  }
  .d-dur-crit { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; }
  .d-dur-norm { color: #d97706; background: #fffbeb; border: 1px solid #fde68a; }

  /* ── Badge ── */
  .d-badge {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 700;
    letter-spacing: .04em;
    padding: 2px 8px; border-radius: 99px;
  }

  /* ── Loading ── */
  .d-loading {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 52vh; gap: 16px;
  }
  .d-spinner {
    width: 38px; height: 38px; border-radius: 50%;
    border: 2.5px solid #ede9fe;
    border-top-color: var(--violet);
    animation: d-spin 0.7s linear infinite;
  }
  @keyframes d-spin { to { transform: rotate(360deg); } }

  /* ── recharts legend ── */
  .recharts-legend-item-text {
    color: var(--text-3) !important;
    font-family: 'Geist', sans-serif !important;
    font-size: 10px !important;
    font-weight: 600 !important;
  }
`;

/* ─────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────── */
const useCountUp = (target, duration = 550) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const n = parseFloat(target) || 0;
    if (n === 0) { setVal(0); return; }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(n * ease * 10) / 10);
      if (p < 1) frame = requestAnimationFrame(tick);
      else setVal(n);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return val;
};

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */
const AnimatedValue = ({ value }) => <>{useCountUp(value)}</>;

const KpiCard = ({ icon: Icon, label, value, sub, gradFrom, gradTo, delay = 0 }) => (
  <div className="d-kpi d-fadeup" style={{ animationDelay: `${delay}ms` }}>
    <div className="d-kpi-icon" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}>
      <Icon size={16} color="#fff" strokeWidth={2.2} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <p className="d-kpi-label">{label}</p>
      <p className="d-kpi-value" style={{ backgroundImage: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}>
        <AnimatedValue value={value} />
      </p>
      {sub && <p className="d-kpi-sub">{sub}</p>}
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, title, iconColor }) => (
  <div className="d-sec-title">
    <div className="d-sec-icon" style={{ color: iconColor }}><Icon size={13} /></div>
    {title}
  </div>
);

const StatusLegend = () => (
  <div className="d-status-legend">
    {[{ color: '#16a34a', label: '≥ 99.5% Óptimo' },
      { color: '#d97706', label: '≥ 98% Alerta'  },
      { color: '#dc2626', label: '< 98% Crítico'  }].map(s => (
      <span key={s.label} className="d-status-item">
        <span className="d-status-dot" style={{ background: s.color }} />
        {s.label}
      </span>
    ))}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const meta = getDispMeta(payload[0].value);
  return (
    <div className="d-tooltip">
      <p className="d-tooltip-title">{label}</p>
      <div className="d-tooltip-row">
        <span>Disponibilidad</span>
        <strong style={{ color: meta.accent }}>{payload[0].value}%</strong>
      </div>
      <div className="d-tooltip-row">
        <span>Caída</span>
        <strong style={{ color: '#dc2626' }}>{payload[0].payload.inactividad} min</strong>
      </div>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="d-tooltip">
      <p className="d-tooltip-title">{payload[0].name}</p>
      <strong style={{ color: '#dc2626', fontSize: 12 }}>{payload[0].value} min caída</strong>
    </div>
  );
};

const EmptyChart = ({ green = false }) => (
  <div className="d-empty" style={green ? { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' } : {}}>
    <TrendingUp size={22} />
    <span>{green ? '100% Disponibilidad' : 'Sin datos suficientes'}</span>
    {green && <span style={{ fontSize: 9, opacity: 0.7 }}>0 minutos de inactividad</span>}
  </div>
);

const FilterSelect = ({ value, onChange, children }) => (
  <div className="d-select-wrap">
    <select value={value} onChange={onChange} className="d-select">{children}</select>
    <ChevronDown size={11} className="d-select-arrow" />
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [incidentes,   setIncidentes]   = useState([]);
  const [empresas,     setEmpresas]     = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [categorias,   setCategorias]   = useState([]);
  const [productos,    setProductos]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtroOpen,   setFiltroOpen]   = useState(false);

  const currentUser   = authService.getCurrentUser();
  const empresaFijada = currentUser.rol === 'cliente' ? parseInt(currentUser.empresa_id) : null;

  const [filtroEmpresa,    setFiltroEmpresa]    = useState('');
  const [filtroAplicacion, setFiltroAplicacion] = useState('');
  const [filtroCategoria,  setFiltroCategoria]  = useState('');
  const [filtroProducto,   setFiltroProducto]   = useState('');
  const [fechaInicio,      setFechaInicio]      = useState('');
  const [fechaFin,         setFechaFin]         = useState('');

  const hayFiltros = filtroEmpresa || filtroAplicacion || filtroCategoria || filtroProducto || fechaInicio || fechaFin;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [i, e, a, c, p] = await Promise.all([
          bitacoraService.getIncidentes(),
          bitacoraService.getEmpresas(),
          bitacoraService.getAplicaciones(),
          bitacoraService.getCategorias(),
          bitacoraService.getProductos(),
        ]);
        setIncidentes(i); setEmpresas(e); setAplicaciones(a); setCategorias(c); setProductos(p);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const { stats, chartDataApps, chartDataCats, chartDataProds, incidentesFiltrados } = useMemo(() => {
    const df = incidentes.filter(inc => {
      const ea = empresaFijada ?? (filtroEmpresa ? parseInt(filtroEmpresa) : null);
      if (ea && inc.empresa_id !== ea) return false;
      if (filtroAplicacion && inc.aplicacion_id !== parseInt(filtroAplicacion)) return false;
      if (filtroCategoria  && inc.categoria_id  !== parseInt(filtroCategoria))  return false;
      if (filtroProducto   && inc.producto_id   !== parseInt(filtroProducto))   return false;
      if (fechaInicio && new Date(inc.fecha_inicio) < new Date(fechaInicio))    return false;
      if (fechaFin) {
        const end = new Date(fechaFin); end.setHours(23, 59, 59, 999);
        if (new Date(inc.fecha_inicio) > end) return false;
      }
      return true;
    });

    const totalTiempo = Math.round(df.reduce((s, i) => s + i.duracion_minutos, 0) * 10) / 10;
    const prodAfect   = new Set(df.filter(i => i.producto_id).map(i => i.producto_id)).size;
    const appAfect    = new Set(df.filter(i => i.aplicacion_id).map(i => i.aplicacion_id)).size;

    const appsG = empresaFijada ? aplicaciones.filter(a => a.empresas?.some(e => e.id === empresaFijada)) : aplicaciones;
    const catsG = empresaFijada ? categorias.filter(c => df.some(i => i.categoria_id === c.id)) : categorias;
    const prodsG = empresaFijada ? productos.filter(p => df.some(i => i.producto_id === p.id)) : productos;

    const mapApp = {}, mapCat = {}, mapProd = {};
    appsG.forEach(a => mapApp[a.id] = 0);
    catsG.forEach(c => mapCat[c.id] = 0);
    prodsG.forEach(p => mapProd[p.id] = 0);
    df.forEach(inc => {
      if (inc.aplicacion_id) mapApp[inc.aplicacion_id] = (mapApp[inc.aplicacion_id] ?? 0) + inc.duracion_minutos;
      if (inc.categoria_id)  mapCat[inc.categoria_id]  = (mapCat[inc.categoria_id]  ?? 0) + inc.duracion_minutos;
      if (inc.producto_id)   mapProd[inc.producto_id]  = (mapProd[inc.producto_id]  ?? 0) + inc.duracion_minutos;
    });

    const fmt = (map, catalog, key) => Object.keys(map).map(id => {
      const info = catalog.find(x => x.id === parseInt(id));
      const down = Math.round(map[id] * 10) / 10;
      const disp = parseFloat(((MINUTOS_MES - down) / MINUTOS_MES * 100).toFixed(3));
      return { nombre: info?.nombre ?? `${key} ${id}`, disponibilidad: disp, inactividad: down };
    });

    return {
      stats: { totalIncidentes: df.length, tiempoInactividad: totalTiempo, productosAfectados: prodAfect, aplicacionesAfectadas: appAfect },
      chartDataApps:  fmt(mapApp,  appsG,  'App').sort((a, b) => a.disponibilidad - b.disponibilidad),
      chartDataCats:  fmt(mapCat,  catsG,  'Cat').sort((a, b) => a.disponibilidad - b.disponibilidad),
      chartDataProds: fmt(mapProd, prodsG, 'Prod').filter(p => p.inactividad > 0).sort((a, b) => b.inactividad - a.inactividad),
      incidentesFiltrados: df,
    };
  }, [incidentes, empresaFijada, filtroEmpresa, filtroAplicacion, filtroCategoria, filtroProducto, fechaInicio, fechaFin, aplicaciones, categorias, productos]);

  const aplicacionesFiltradas = empresaFijada ? aplicaciones.filter(a => a.empresas?.some(e => e.id === empresaFijada)) : aplicaciones;
  const categoriasFiltradas   = empresaFijada ? categorias.filter(c => incidentesFiltrados.some(i => i.categoria_id === c.id)) : categorias;
  const productosFiltrados    = empresaFijada ? productos.filter(p => incidentesFiltrados.some(i => i.producto_id === p.id)) : productos;
  const limpiarFiltros = () => { setFiltroEmpresa(''); setFiltroAplicacion(''); setFiltroCategoria(''); setFiltroProducto(''); setFechaInicio(''); setFechaFin(''); };

  const axisStyle = { fill: '#a1a1aa', fontSize: 9, fontWeight: 700, fontFamily: 'Geist, sans-serif' };

  /* ── RENDER ── */
  return (
    <div className="d-root d-bg pt-20 px-4 pb-16">
      <style>{STYLES}</style>

      <div style={{ maxWidth: 1320, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="d-fadeup" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="d-pulse-dot" />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--violet)' }}>
                Monitoreo en tiempo real
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-.025em' }}>
              Dashboard{' '}
              <span style={{ background: 'linear-gradient(135deg,#7c3aed,#a21caf,#be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                General
              </span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontWeight: 500 }}>
              Disponibilidad · Incidentes · Rendimiento
              {hayFiltros && (
                <span className="d-badge" style={{ background: '#fdf4ff', color: '#a21caf', border: '1px solid #f0abfc', fontSize: 9 }}>
                  <Filter size={8} style={{ marginRight: 3 }} />Filtros activos
                </span>
              )}
            </p>
          </div>

          <button className="d-filter-btn" onClick={() => setFiltroOpen(o => !o)}>
            <Filter size={13} />
            Filtros
            {hayFiltros && <span className="d-filter-active-dot" />}
            <ChevronDown size={11} style={{ transform: filtroOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* ── Filter Panel ── */}
        {filtroOpen && (
          <div className="d-filter-panel">
            <div className="d-filter-inner">
              <div className="d-filter-group">
                <span className="d-filter-label"><Calendar size={9} />Fechas</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="date" className="d-date-input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700 }}>—</span>
                  <input type="date" className="d-date-input" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                </div>
              </div>

              <div className="d-filter-sep" />

              {currentUser.rol !== 'cliente' && (
                <div className="d-filter-group">
                  <span className="d-filter-label"><Wifi size={9} />Red</span>
                  <FilterSelect value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
                    <option value="">Todas las Redes</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </FilterSelect>
                </div>
              )}

              <div className="d-filter-group">
                <span className="d-filter-label"><AppWindow size={9} />App</span>
                <FilterSelect value={filtroAplicacion} onChange={e => setFiltroAplicacion(e.target.value)}>
                  <option value="">Todas las Apps</option>
                  {aplicacionesFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </FilterSelect>
              </div>

              <div className="d-filter-group">
                <span className="d-filter-label"><FolderTree size={9} />Categoría</span>
                <FilterSelect value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                  <option value="">Todas las Cat.</option>
                  {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </FilterSelect>
              </div>

              <div className="d-filter-group">
                <span className="d-filter-label"><Server size={9} />Producto</span>
                <FilterSelect value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}>
                  <option value="">Todos los Prod.</option>
                  {productosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </FilterSelect>
              </div>

              {hayFiltros && (
                <button className="d-clear-btn" onClick={limpiarFiltros}>
                  <X size={10} />Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="d-loading">
            <div className="d-spinner" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Cargando datos
            </span>
          </div>
        ) : (
          <>
            {/* ── KPI Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 20 }}>
              <KpiCard icon={AlertCircle} label="Total Caídas"       value={stats.totalIncidentes}      sub="incidentes registrados"   gradFrom="#dc2626" gradTo="#f87171" delay={0}   />
              <KpiCard icon={Clock}       label="Mins. Inactividad"  value={stats.tiempoInactividad}    sub="tiempo total acumulado"   gradFrom="#d97706" gradTo="#fbbf24" delay={60}  />
              <KpiCard icon={AppWindow}   label="Apps Afectadas"     value={stats.aplicacionesAfectadas} sub="con al menos 1 caída"    gradFrom="#7c3aed" gradTo="#8b5cf6" delay={120} />
              <KpiCard icon={Server}      label="Prods. Afectados"   value={stats.productosAfectados}   sub="con al menos 1 caída"     gradFrom="#a21caf" gradTo="#c026d3" delay={180} />
            </div>

            {/* ── Charts Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>

              {/* Apps */}
              <div className="d-chart-card d-fadeup" style={{ animationDelay: '140ms' }}>
                <SectionTitle icon={BarChart3} title="Disponibilidad · Apps" iconColor="var(--violet)" />
                <StatusLegend />
                {chartDataApps.length === 0 ? <EmptyChart /> : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataApps} margin={{ top: 4, right: 4, left: -20, bottom: 28 }} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ ...axisStyle }} dy={10} angle={-18} textAnchor="end" />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} tickFormatter={v => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)', radius: 6 }} />
                        <Bar dataKey="disponibilidad" radius={[5, 5, 0, 0]}>
                          {chartDataApps.map((e, i) => <Cell key={i} fill={getDispColor(e.disponibilidad)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Categorías */}
              <div className="d-chart-card d-fadeup" style={{ animationDelay: '180ms' }}>
                <SectionTitle icon={BarChart3} title="Disponibilidad · Categorías" iconColor="#be185d" />
                <StatusLegend />
                {chartDataCats.length === 0 ? <EmptyChart /> : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataCats} margin={{ top: 4, right: 4, left: -20, bottom: 28 }} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ ...axisStyle }} dy={10} angle={-18} textAnchor="end" />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} tickFormatter={v => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)', radius: 6 }} />
                        <Bar dataKey="disponibilidad" radius={[5, 5, 0, 0]}>
                          {chartDataCats.map((e, i) => <Cell key={i} fill={getDispColor(e.disponibilidad)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Pie */}
              <div className="d-chart-card d-fadeup" style={{ animationDelay: '220ms' }}>
                <SectionTitle icon={Activity} title="Impacto por Producto" iconColor="var(--fuchsia)" />
                {chartDataProds.length === 0 ? <EmptyChart green /> : (
                  <div style={{ width: '100%', height: 254 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartDataProds} cx="50%" cy="42%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="inactividad" nameKey="nombre">
                          {chartDataProds.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend verticalAlign="bottom" height={32} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* ── Table ── */}
            <div className="d-table-card d-fadeup" style={{ animationDelay: '260ms' }}>
              <div className="d-table-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={13} style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Registro de Incidentes</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Ordenado por fecha más reciente</p>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--surface-3)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 99 }}>
                  {incidentesFiltrados.length} registros
                </span>
              </div>

              <div className="d-table-scroll">
                <table className="d-table">
                  <thead>
                    <tr>
                      {['Fecha / Ticket','Empresa','Aplicación','Categoría','Producto','Inactividad'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incidentesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 12, fontWeight: 600 }}>
                            <BarChart3 size={26} />
                            No hay incidentes para los filtros seleccionados
                          </div>
                        </td>
                      </tr>
                    ) : (
                      [...incidentesFiltrados]
                        .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))
                        .map((inc) => {
                          const empInfo  = empresas.find(e    => e.id === inc.empresa_id)?.nombre       || 'N/A';
                          const appInfo  = aplicaciones.find(a => a.id === inc.aplicacion_id)?.nombre   || 'N/A';
                          const catInfo  = categorias.find(c  => c.id === inc.categoria_id)?.nombre     || '—';
                          const prodInfo = productos.find(p   => p.id === inc.producto_id)?.nombre      || 'N/A';
                          const crit     = inc.duracion_minutos > 60;
                          return (
                            <tr key={inc.id}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                                  {new Date(inc.fecha_inicio).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {inc.ticket && <span className="d-ticket-chip">#{inc.ticket}</span>}
                              </td>
                              <td>{empInfo}</td>
                              <td>{appInfo}</td>
                              <td><span className="d-cat-chip">{catInfo}</span></td>
                              <td style={{ color: 'var(--text-1)', fontWeight: 600 }}>{prodInfo}</td>
                              <td>
                                <span className={`d-dur-chip ${crit ? 'd-dur-crit' : 'd-dur-norm'}`}>
                                  <Clock size={10} />{inc.duracion_minutos} min
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
