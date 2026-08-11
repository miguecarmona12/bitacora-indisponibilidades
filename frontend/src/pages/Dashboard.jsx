import React, { useEffect, useState, useMemo } from 'react';
import { bitacoraService, authService } from '../services/api';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import {
  BarChart3, TrendingUp, AlertCircle, Clock,
  AppWindow, Server, Activity, Filter, X,
  Zap, Calendar, ChevronDown, Wifi, FolderTree, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, LabelList
} from 'recharts';

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const PIE_COLORS = ['#7c3aed','#a21caf','#be185d','#c2410c','#b45309','#0e7490','#065f46'];
const RED_COLORS = ['#7c3aed', '#a21caf', '#be185d', '#c2410c', '#0e7490', '#065f46', '#2563eb', '#b45309'];

const getRedColor = (id) => RED_COLORS[Math.abs(Number(id) || 0) % RED_COLORS.length];

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

const getPeriodoMinutos = (selectedMonth, fechaInicio, fechaFin) => {
  const monthValue = selectedMonth || new Date().toISOString().slice(0, 7);
  const [year, month] = monthValue.split('-').map(Number);
  const now = new Date();
  const isCurrentMonth = monthValue === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = (isCurrentMonth && !fechaFin)
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    : new Date(year, month, 0, 23, 59, 59, 999);
  const start = fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : monthStart;
  const end = fechaFin ? new Date(`${fechaFin}T23:59:59.999`) : monthEnd;
  const minutes = Math.max(1, Math.round((end - start + 1) / 60000));
  return minutes;
};

/* ─────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');

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

  @media print {
    :root, .d-root {
      --surface: #ffffff !important;
      --surface-2: #fafafa !important;
      --surface-3: #f4f4f5 !important;
      --border: #d4d4d8 !important;
      --text-1: #09090b !important;
      --text-2: #52525b !important;
      --text-3: #71717a !important;
    }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-shadow: none !important; }
    body { background: white !important; }
    .d-filter-btn, .d-filter-panel, .d-clear-btn, nav, .navbar, .nav-root { display: none !important; }
    .print-hidden { display: none !important; }
    .d-root { padding-top: 16px !important; }
    .d-fadeup { animation: none !important; }
    .d-kpi, .d-chart-card { break-inside: avoid; box-shadow: none !important; }
    .d-table-card { box-shadow: none !important; overflow: visible !important; }
    .d-table-card tr { break-inside: avoid; }
    .d-table-scroll { overflow: visible !important; max-height: none !important; }
    .d-table thead th { position: static !important; }
    .d-table td { white-space: normal !important; }
    .d-kpi-value { background: none !important; -webkit-text-fill-color: var(--text-1) !important; }
    .charts-grid { grid-template-columns: repeat(2, 1fr); }
    .recharts-responsive-container > div { width: 100% !important; display: flex; }
    .d-tooltip { display: none; }
  }
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

  .dark .d-select option { background: #1a1a2e; color: var(--text-1); }
  .dark .d-clear-btn { color: #fca5a5; background: #2e0e0e; border-color: #450a0a; }
  .dark .d-clear-btn:hover { background: #3f0f0f; border-color: #7f1d1d; }
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
const AnimatedValue = ({ value, formatter }) => {
  const v = useCountUp(value);
  return <>{formatter ? formatter(v) : v}</>;
};

const KpiCard = ({ icon: Icon, label, value, sub, gradFrom, gradTo, delay = 0, formatter }) => (
  <div className="d-kpi d-fadeup" style={{ animationDelay: `${delay}ms` }}>
    <div className="d-kpi-icon" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}>
      <Icon size={16} color="#fff" strokeWidth={2.2} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <p className="d-kpi-label">{label}</p>
      <p className="d-kpi-value" style={{ backgroundImage: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}>
        <AnimatedValue value={value} formatter={formatter} />
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
        <strong style={{ color: meta.accent }}>{Number(payload[0].value).toFixed(2)}%</strong>
      </div>
      <div className="d-tooltip-row">
        <span>Caída</span>
        <strong style={{ color: '#dc2626' }}>{payload[0].payload.inactividad} min</strong>
      </div>
      {payload[0].payload.minutosHabiles && (
        <div className="d-tooltip-row">
          <span>Periodo</span>
          <strong style={{ color: 'var(--text-2)' }}>{payload[0].payload.minutosHabiles} min</strong>
        </div>
      )}
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

const LineTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="d-tooltip">
      <p className="d-tooltip-title">{label}</p>
      <div className="d-tooltip-row">
        <span>{payload[0].name || 'Valor'}</span>
        <strong style={{ color: 'var(--violet)' }}>{payload[0].value}{unit}</strong>
      </div>
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
  const [error,        setError]        = useState(null);
  const [filtroOpen,   setFiltroOpen]   = useState(false);

  const currentUser   = authService.getCurrentUser();
  const empresaFijada = currentUser.rol === 'cliente' ? parseInt(currentUser.empresa_id) : null;
  const flags = useFeatureFlags();

  const [filtroEmpresa,    setFiltroEmpresa]    = useState('');
  const [filtroAplicacion, setFiltroAplicacion] = useState('');
  const [filtroCategoria,  setFiltroCategoria]  = useState('');
  const [filtroProducto,   setFiltroProducto]   = useState('');
  const [filtroAfectacion, setFiltroAfectacion] = useState('');
  const [fechaInicio, setFechaInicio]      = useState('');
  const [fechaFin,    setFechaFin]         = useState('');
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const hayFiltros = filtroEmpresa || filtroAplicacion || filtroCategoria || filtroProducto || filtroAfectacion || fechaInicio || fechaFin || selectedMonth !== getCurrentMonth();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const empresaId = empresaFijada ?? (filtroEmpresa ? parseInt(filtroEmpresa) : null);
        const [i, e, a, c, p] = await Promise.all([
          bitacoraService.getIncidentes(),
          bitacoraService.getEmpresas(),
          bitacoraService.getAplicaciones(empresaId),
          bitacoraService.getCategorias(),
          bitacoraService.getProductos(),
        ]);
        setIncidentes(i); setEmpresas(e); setAplicaciones(a); setCategorias(c); setProductos(p);
      } catch (err) { setError(err.response?.data?.detail || 'Error al cargar datos'); }
      finally { setLoading(false); }
    })();
  }, [empresaFijada, filtroEmpresa]);

  const { stats, chartDataApps, chartDataCats, chartDataProds, monthlyTrend, topEmpresas, mttrTrend, disponibilidadRedes, incidentesFiltrados } = useMemo(() => {
    const df = incidentes.filter(inc => {
      const ea = empresaFijada ?? (filtroEmpresa ? parseInt(filtroEmpresa) : null);
      if (ea && inc.empresa_id !== ea) return false;
      if (filtroAplicacion && inc.aplicacion_id !== parseInt(filtroAplicacion)) return false;
      if (filtroCategoria  && inc.categoria_id  !== parseInt(filtroCategoria))  return false;
      if (filtroProducto   && inc.producto_id   !== parseInt(filtroProducto))   return false;
      if (filtroAfectacion && inc.tipo_afectacion !== filtroAfectacion)         return false;
      if (fechaInicio && new Date(inc.fecha_inicio) < new Date(fechaInicio))    return false;
      if (fechaFin) {
        const end = new Date(fechaFin); end.setHours(23, 59, 59, 999);
        if (new Date(inc.fecha_inicio) > end) return false;
      }
      if (!fechaInicio && !fechaFin && selectedMonth && inc.fecha_inicio?.slice(0, 7) !== selectedMonth) return false;
      return true;
    });

    const totalTiempo = Math.round(df.reduce((s, i) => s + i.duracion_minutos, 0) * 10) / 10;
    const tiempoApps = Math.round(df.filter(i => i.aplicacion_id).reduce((s, i) => s + i.duracion_minutos, 0) * 10) / 10;
    const tiempoProds = Math.round(df.filter(i => i.producto_id).reduce((s, i) => s + i.duracion_minutos, 0) * 10) / 10;
    const minutosHabilesPeriodo = getPeriodoMinutos(selectedMonth, fechaInicio, fechaFin);
    const prodAfect   = new Set(df.filter(i => i.producto_id).map(i => i.producto_id)).size;
    const appAfect    = new Set(df.filter(i => i.aplicacion_id).map(i => i.aplicacion_id)).size;
    const empAfect    = new Set(df.filter(i => i.empresa_id).map(i => i.empresa_id)).size;

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
      const disp = Math.max(0, parseFloat(((minutosHabilesPeriodo - down) / minutosHabilesPeriodo * 100).toFixed(2)));
      return { nombre: info?.nombre ?? `${key} ${id}`, disponibilidad: disp, inactividad: down, minutosHabiles: minutosHabilesPeriodo };
    });

    const monthsMap = {};
    df.forEach(inc => {
      const m = inc.fecha_inicio?.slice(0, 7);
      if (m) monthsMap[m] = (monthsMap[m] || 0) + 1;
    });
    const monthlyTrend = Object.entries(monthsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, count]) => ({ mes, incidentes: count }));

    const empMap = {};
    df.forEach(inc => {
      if (inc.empresa_id) {
        empMap[inc.empresa_id] = (empMap[inc.empresa_id] || 0) + inc.duracion_minutos;
      }
    });
    const topEmpresas = Object.entries(empMap)
      .map(([id, minutos]) => ({ id: parseInt(id), nombre: empresas.find(e => e.id === parseInt(id))?.nombre || `Red ${id}`, minutos: Math.round(minutos * 10) / 10 }))
      .sort((a, b) => b.minutos - a.minutos)
      .slice(0, 5);

    const redesBase = empresaFijada
      ? empresas.filter(e => e.id === empresaFijada)
      : filtroEmpresa
        ? empresas.filter(e => e.id === parseInt(filtroEmpresa))
        : empresas;
    const minutosAppsPorRed = {};
    redesBase.forEach(e => { minutosAppsPorRed[e.id] = 0; });
    df.forEach(inc => {
      if (inc.empresa_id) {
        minutosAppsPorRed[inc.empresa_id] = (minutosAppsPorRed[inc.empresa_id] ?? 0) + inc.duracion_minutos;
      }
    });
    const disponibilidadRedes = Object.entries(minutosAppsPorRed)
      .map(([id, minutos]) => {
        const inactividad = Math.round(minutos * 10) / 10;
        const disponibilidad = Math.max(0, parseFloat((((minutosHabilesPeriodo - inactividad) / minutosHabilesPeriodo) * 100).toFixed(2)));
        return {
          id: parseInt(id),
          nombre: empresas.find(e => e.id === parseInt(id))?.nombre || `Red ${id}`,
          disponibilidad,
          inactividad,
          minutosHabiles: minutosHabilesPeriodo,
          color: getRedColor(id),
        };
      })
      .sort((a, b) => a.disponibilidad - b.disponibilidad);

    const mttrMap = {};
    df.forEach(inc => {
      const m = inc.fecha_inicio?.slice(0, 7);
      if (m && inc.duracion_minutos) {
        if (!mttrMap[m]) mttrMap[m] = { total: 0, count: 0 };
        mttrMap[m].total += inc.duracion_minutos;
        mttrMap[m].count += 1;
      }
    });
    const mttrTrend = Object.entries(mttrMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, data]) => ({ mes, mttr: Math.round((data.total / data.count) * 10) / 10 }));

    return {
      stats: { totalIncidentes: df.length, tiempoInactividad: totalTiempo, tiempoApps, tiempoProds, productosAfectados: prodAfect, aplicacionesAfectadas: appAfect, redesAfectadas: empAfect },
      chartDataApps:  fmt(mapApp,  appsG,  'App').sort((a, b) => a.disponibilidad - b.disponibilidad),
      chartDataCats:  fmt(mapCat,  catsG,  'Cat').sort((a, b) => a.disponibilidad - b.disponibilidad),
      chartDataProds: fmt(mapProd, prodsG, 'Prod').filter(p => p.inactividad > 0).sort((a, b) => b.inactividad - a.inactividad),
      monthlyTrend, topEmpresas, mttrTrend, disponibilidadRedes,
      incidentesFiltrados: df,
    };
  }, [incidentes, empresaFijada, filtroEmpresa, filtroAplicacion, filtroCategoria, filtroProducto, filtroAfectacion, fechaInicio, fechaFin, selectedMonth, aplicaciones, categorias, productos, empresas]);

  const aplicacionesFiltradas = empresaFijada ? aplicaciones.filter(a => a.empresas?.some(e => e.id === empresaFijada)) : 
    (filtroEmpresa ? aplicaciones.filter(a => a.empresas?.some(e => e.id === parseInt(filtroEmpresa))) : aplicaciones);
  const categoriasFiltradas   = empresaFijada ? categorias.filter(c => incidentesFiltrados.some(i => i.categoria_id === c.id)) : categorias;
  const productosFiltrados    = empresaFijada ? productos.filter(p => incidentesFiltrados.some(i => i.producto_id === p.id)) : productos;
  const limpiarFiltros = () => { setFiltroEmpresa(''); setFiltroAplicacion(''); setFiltroCategoria(''); setFiltroProducto(''); setFiltroAfectacion(''); setFechaInicio(''); setFechaFin(''); setSelectedMonth(getCurrentMonth()); };

  const [selectedDashboards, setSelectedDashboards] = useState([
    'disponibilidadGeneral',
    'disponibilidadPorRed',
    'incidentesPorCategoria',
    'incidentesPorProducto',
    'registroIncidentes'
  ]);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);

  const allDashboards = [
    { id: 'disponibilidadGeneral', name: 'Disponibilidad General' },
    { id: 'disponibilidadPorRed', name: 'Disponibilidad por Red' },
    { id: 'incidentesPorCategoria', name: 'Incidentes por Categoría' },
    { id: 'incidentesPorProducto', name: 'Incidentes por Producto' },
    { id: 'tendenciaMensual', name: 'Tendencia Mensual · Incidentes' },
    { id: 'top5Redes', name: 'Top 5 · Redes con más caídas' },
    { id: 'mttr', name: 'MTTR · Tiempo Promedio de Resolución' },
    { id: 'registroIncidentes', name: 'Registro de Incidentes' }
  ];

  const exportPDF = () => {
    setShowDashboardSelector(true);
  };

  const handlePrint = () => {
    setShowDashboardSelector(false);
    
    // Apply print styles for selected dashboards
    const dashboardElements = document.querySelectorAll('[data-dashboard-id]');
    dashboardElements.forEach(el => {
      const dashboardId = el.getAttribute('data-dashboard-id');
      if (selectedDashboards.includes(dashboardId)) {
        el.classList.add('print-visible');
        el.classList.remove('print-hidden');
      } else {
        el.classList.add('print-hidden');
        el.classList.remove('print-visible');
      }
    });

    setTimeout(() => window.print(), 100);
    
    // Restore original state after printing
    setTimeout(() => {
      dashboardElements.forEach(el => {
        el.classList.remove('print-visible', 'print-hidden');
      });
    }, 500);
  };

  const handleDashboardToggle = (dashboardId) => {
    setSelectedDashboards(prev => 
      prev.includes(dashboardId)
        ? prev.filter(id => id !== dashboardId)
        : [...prev, dashboardId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDashboards(allDashboards.map(d => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedDashboards([]);
  };

  const axisStyle = { fill: '#a1a1aa', fontSize: 9, fontWeight: 700, fontFamily: 'Geist, sans-serif' };

  /* ── RENDER ── */
  return (
    <div className="d-root d-bg pt-20 px-4 pb-16" id="dashboard-root">
      <style>{STYLES}</style>

      {/* Dashboard Selection Modal */}
      {showDashboardSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Seleccionar Dashboards para PDF</h3>
              <button
                onClick={() => setShowDashboardSelector(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3f3f46',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Seleccionar todos
                </button>
                <button
                  onClick={handleDeselectAll}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3f3f46',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Deseleccionar todos
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {allDashboards.map(dashboard => (
                  <div key={dashboard.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#27272a',
                    borderRadius: '8px'
                  }}>
                    <input
                      type="checkbox"
                      id={`dashboard-${dashboard.id}`}
                      checked={selectedDashboards.includes(dashboard.id)}
                      onChange={() => handleDashboardToggle(dashboard.id)}
                      style={{
                        marginRight: '12px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <label
                      htmlFor={`dashboard-${dashboard.id}`}
                      style={{
                        color: '#fff',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      {dashboard.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDashboardSelector(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePrint}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

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

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="d-filter-btn" onClick={exportPDF}>
              <FileText size={13} />
              PDF
            </button>
            <button className="d-filter-btn" onClick={() => setFiltroOpen(o => !o)}>
              <Filter size={13} />
              Filtros
              {hayFiltros && <span className="d-filter-active-dot" />}
              <ChevronDown size={11} style={{ transform: filtroOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>
        </div>

        {/* ── Filter Panel ── */}
        {filtroOpen && (
          <div className="d-filter-panel">
            <div className="d-filter-inner">
              <div className="d-filter-group">
                <span className="d-filter-label"><Calendar size={9} />Mes</span>
                <input type="month" className="d-date-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div className="d-filter-sep" />
              <div className="d-filter-group">
                <span className="d-filter-label"><Calendar size={9} />Rango fechas</span>
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

              <div className="d-filter-group">
                <span className="d-filter-label"><Zap size={9} />Afectación</span>
                <FilterSelect value={filtroAfectacion} onChange={e => setFiltroAfectacion(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="Caída Total">Caída Total</option>
                  <option value="Intermitencia">Intermitencia</option>
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

        {error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <AlertCircle size={32} style={{ color: 'var(--red)', marginBottom: 12 }} />
            <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Error al cargar</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 20px', background: 'var(--violet)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="d-loading">
            <div className="d-spinner" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Cargando datos
            </span>
          </div>
        ) : (
          <>
            {/* ── KPI Grid ── */}
            <div data-dashboard-id="disponibilidadGeneral" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
              <KpiCard icon={AlertCircle} label="Total Caídas"        value={stats.totalIncidentes}        sub="incidentes registrados"    gradFrom="#dc2626" gradTo="#f87171" delay={0}   />
              <KpiCard icon={AppWindow}   label="Apps Afectadas"      value={stats.aplicacionesAfectadas}  sub="con al menos 1 caída"     gradFrom="#7c3aed" gradTo="#8b5cf6" delay={60}  />
              <KpiCard icon={AppWindow}   label="Inactividad · Apps"  value={Math.round(stats.tiempoApps)} sub="min en aplicaciones"      gradFrom="#d97706" gradTo="#fbbf24" delay={90}  formatter={v => Math.round(v).toLocaleString('es-CO')} />
              <KpiCard icon={Server}      label="Prods. Afectados"    value={stats.productosAfectados}     sub="con al menos 1 caída"     gradFrom="#be185d" gradTo="#f43f5e" delay={120} />
              <KpiCard icon={Server}      label="Inactividad · Prods" value={Math.round(stats.tiempoProds)} sub="min en productos"         gradFrom="#a21caf" gradTo="#c026d3" delay={180} formatter={v => Math.round(v).toLocaleString('es-CO')} />
              <KpiCard icon={Wifi}        label="Redes Afectadas"     value={stats.redesAfectadas}         sub="con al menos 1 caída"     gradFrom="#047857" gradTo="#34d399" delay={240} />
            </div>

            {/* ── Disponibilidad General por Red ── */}
            <div data-dashboard-id="disponibilidadPorRed" className="d-chart-card d-fadeup" style={{ animationDelay: '110ms', marginBottom: 20 }}>
              <SectionTitle icon={Wifi} title="Disponibilidad General · Redes" iconColor="#0e7490" />
              <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginTop: -6 }}>
                Disponibilidad por red según el total de minutos de caída de sus incidentes. Cada red conserva su color en las gráficas.
              </p>
              {disponibilidadRedes.length === 0 ? <EmptyChart green /> : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={disponibilidadRedes} margin={{ top: 20, right: 14, left: -20, bottom: 42 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} tickFormatter={v => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                      <Bar isAnimationActive={false} dataKey="disponibilidad" radius={[5, 5, 0, 0]} barSize={26}>
                        {disponibilidadRedes.map((e) => <Cell key={e.id} fill={e.color} />)}
                        <LabelList dataKey="disponibilidad" position="top" fill="#52525b" fontSize={10} fontWeight="bold" formatter={(value) => `${Number(value).toFixed(2)}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Charts Grid ── */}
            <div className="charts-grid">

              {/* Card 1: Apps */}
              <div className="d-chart-card d-fadeup" style={{ animationDelay: '140ms' }}>
                <SectionTitle icon={BarChart3} title="Disponibilidad · Apps" iconColor="var(--violet)" />
                <StatusLegend />
                {chartDataApps.length === 0 ? <EmptyChart /> : (
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataApps} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis 
                          dataKey="nombre" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ ...axisStyle, fontSize: 10 }} 
                          angle={-30} 
                          textAnchor="end" 
                          interval={0} // Asegura que se vean todos los nombres
                        />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} tickFormatter={v => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)', radius: 6 }} />
                        <Bar isAnimationActive={false} dataKey="disponibilidad" radius={[5, 5, 0, 0]} barSize={20}>
                          {chartDataApps.map((e, i) => <Cell key={i} fill={getDispColor(e.disponibilidad)} />)}
                          <LabelList dataKey="disponibilidad" position="top" fill="#52525b" fontSize={10} fontWeight="bold" formatter={(value) => `${Number(value).toFixed(2)}%`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Card 2: Categorías (Igual que la anterior) */}
              <div data-dashboard-id="incidentesPorCategoria" className="d-chart-card d-fadeup" style={{ animationDelay: '180ms' }}>
                <SectionTitle icon={BarChart3} title="Disponibilidad · Categorías" iconColor="#be185d" />
                <StatusLegend />
                {chartDataCats.length === 0 ? <EmptyChart /> : (
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataCats} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} tickFormatter={v => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)', radius: 6 }} />
                        <Bar isAnimationActive={false} dataKey="disponibilidad" radius={[5, 5, 0, 0]} barSize={20}>
                          {chartDataCats.map((e, i) => <Cell key={i} fill={getDispColor(e.disponibilidad)} />)}
                          <LabelList dataKey="disponibilidad" position="top" fill="#52525b" fontSize={10} fontWeight="bold" formatter={(value) => `${Number(value).toFixed(2)}%`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Card 3: Pie Chart */}
              <div data-dashboard-id="incidentesPorProducto" className="d-chart-card d-fadeup" style={{ animationDelay: '220ms' }}>
                <SectionTitle icon={Activity} title="Impacto por Producto" iconColor="var(--fuchsia)" />
                {chartDataProds.length === 0 ? <EmptyChart green /> : (
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          isAnimationActive={false}
                          data={chartDataProds} 
                          cx="50%" 
                          cy="50%" // Centrado mejorado
                          innerRadius="50%" 
                          outerRadius="80%" 
                          paddingAngle={4} 
                          dataKey="inactividad" 
                          nameKey="nombre"
                        >
                          {chartDataProds.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* ── New Charts Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginTop: 20, marginBottom: 20 }}>
              {/* Card 4: Monthly Trend */}
              <div data-dashboard-id="tendenciaMensual" className="d-chart-card d-fadeup" style={{ animationDelay: '260ms' }}>
                <SectionTitle icon={TrendingUp} title="Tendencia Mensual · Incidentes" iconColor="#0e7490" />
                {monthlyTrend.length < 2 ? <EmptyChart /> : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} allowDecimals={false} />
                        <Tooltip content={<LineTooltip unit=" incidentes" />} cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="incidentes" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6 }} name="Incidentes" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Card 5: Top 5 Empresas */}
              <div data-dashboard-id="top5Redes" className="d-chart-card d-fadeup" style={{ animationDelay: '300ms' }}>
                <SectionTitle icon={Wifi} title="Top 5 · Redes con más caídas" iconColor="#c2410c" />
                {topEmpresas.length === 0 ? <EmptyChart green /> : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topEmpresas} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} />
                        <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 9 }} width={110} />
                        <Tooltip content={<LineTooltip unit=" min" />} cursor={{ fill: 'var(--surface-2)' }} />
                        <Bar isAnimationActive={false} dataKey="minutos" radius={[0, 5, 5, 0]} barSize={16}>
                          {topEmpresas.map((e) => <Cell key={e.id} fill={getRedColor(e.id)} />)}
                          <LabelList dataKey="minutos" position="right" fill="#52525b" fontSize={10} fontWeight="bold" formatter={(value) => `${value} min`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Card 6: MTTR Trend */}
              <div data-dashboard-id="mttr" className="d-chart-card d-fadeup" style={{ animationDelay: '340ms' }}>
                <SectionTitle icon={Clock} title="MTTR · Tiempo Promedio de Resolución" iconColor="#065f46" />
                {mttrTrend.length < 2 ? <EmptyChart /> : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mttrTrend} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ ...axisStyle, fill: '#d4d4d8' }} />
                        <Tooltip content={<LineTooltip unit=" min" />} cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="mttr" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} name="MTTR" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* ── Table ── */}
            <div data-dashboard-id="registroIncidentes" className="d-table-card d-fadeup" style={{ animationDelay: '260ms' }}>
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
