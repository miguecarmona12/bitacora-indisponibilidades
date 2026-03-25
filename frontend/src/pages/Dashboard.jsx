import React, { useEffect, useState, useMemo } from 'react';
import { bitacoraService, authService } from '../services/api';
import {
  BarChart3, TrendingUp, AlertCircle, Clock,
  AppWindow, Server, Activity, Filter, X,
  Zap, Calendar, ChevronDown, Wifi
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const MINUTOS_MES = 43200;

const PIE_COLORS = ['#8B5CF6', '#D946EF', '#EC4899', '#F43F5E', '#F59E0B', '#3B82F6', '#10B981'];

const getDispColor = (d) => {
  if (d >= 99.5) return '#10B981';
  if (d >= 98.0) return '#F59E0B';
  return '#F43F5E';
};

const getDispMeta = (d) => {
  if (d >= 99.5) return { label: 'Óptimo',  accent: '#10B981', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
  if (d >= 98.0) return { label: 'Alerta',  accent: '#F59E0B', pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   };
  return           { label: 'Crítico', accent: '#F43F5E', pill: 'bg-red-50 text-red-700 border-red-200',               dot: 'bg-red-500'     };
};

/* ─────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────── */
const useCountUp = (target, duration = 600) => {
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

/* KPI Card */
const KpiCard = ({ icon: Icon, label, value, sub, colorClass, gradFrom, gradTo, delay = 0 }) => (
  <div
    className="kpi-card"
    style={{ '--grad-from': gradFrom, '--grad-to': gradTo, animationDelay: `${delay}ms` }}
  >
    <div className="kpi-icon" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}>
      <Icon size={17} color="#fff" />
    </div>
    <div className="kpi-content">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value" style={{ backgroundImage: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}>
        <AnimatedValue value={value} />
      </p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
    <div className="kpi-shimmer" />
  </div>
);

/* FilterSelect */
const FilterSelect = ({ value, onChange, children, gradFrom, gradTo }) => (
  <div className="fsel-wrap" style={{ '--gf': gradFrom, '--gt': gradTo }}>
    <select value={value} onChange={onChange} className="fsel">{children}</select>
    <ChevronDown size={11} className="fsel-arrow" />
  </div>
);

/* Chart Tooltips */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const meta = getDispMeta(payload[0].value);
  return (
    <div className="c-tooltip">
      <p className="c-tooltip-title">{label}</p>
      <div className="c-tooltip-row">
        <span>Disponibilidad</span>
        <strong style={{ color: meta.accent }}>{payload[0].value}%</strong>
      </div>
      <div className="c-tooltip-row">
        <span>Caída</span>
        <strong style={{ color: '#F43F5E' }}>{payload[0].payload.inactividad} min</strong>
      </div>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="c-tooltip">
      <p className="c-tooltip-title">{payload[0].name}</p>
      <strong style={{ color: '#F43F5E', fontSize: '12px' }}>{payload[0].value} min caída</strong>
    </div>
  );
};

/* Section title */
const SectionTitle = ({ icon: Icon, title, iconColor }) => (
  <div className="sec-title">
    <div className="sec-title-icon" style={{ color: iconColor }}><Icon size={14} /></div>
    <span>{title}</span>
  </div>
);

/* Status legend */
const StatusLegend = () => (
  <div className="status-legend">
    {[{ color: '#10B981', label: '≥ 99.5% Óptimo' }, { color: '#F59E0B', label: '≥ 98% Alerta' }, { color: '#F43F5E', label: '< 98% Crítico' }].map(s => (
      <span key={s.label} className="status-item">
        <span className="status-dot" style={{ background: s.color }} />
        {s.label}
      </span>
    ))}
  </div>
);

/* Empty states */
const EmptyChart = () => (
  <div className="empty-chart">
    <TrendingUp size={26} />
    <span>Sin datos suficientes</span>
  </div>
);
const EmptyChartGreen = () => (
  <div className="empty-chart" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A' }}>
    <TrendingUp size={26} style={{ color: '#22C55E' }} />
    <span style={{ color: '#16A34A' }}>100% Disponibilidad</span>
    <span style={{ fontSize: '10px', color: '#4ADE80' }}>0 minutos de inactividad</span>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────── */
const Dashboard = () => {
  const [incidentes, setIncidentes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();

  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroAplicacion, setFiltroAplicacion] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const hayFiltros = filtroEmpresa || filtroAplicacion || filtroCategoria || filtroProducto || fechaInicio || fechaFin;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dataInc, dataEmp, dataApp, dataCat, dataProd] = await Promise.all([
          bitacoraService.getIncidentes(),
          bitacoraService.getEmpresas(),
          bitacoraService.getAplicaciones(),
          bitacoraService.getCategorias(),
          bitacoraService.getProductos(),
        ]);
        setIncidentes(dataInc); setEmpresas(dataEmp); setAplicaciones(dataApp);
        setCategorias(dataCat); setProductos(dataProd);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const { stats, chartDataApps, chartDataCats, chartDataProds, incidentesFiltrados } = useMemo(() => {
    const dataFiltrada = incidentes.filter(inc => {
      if (filtroEmpresa    && inc.empresa_id    !== parseInt(filtroEmpresa))    return false;
      if (filtroAplicacion && inc.aplicacion_id !== parseInt(filtroAplicacion)) return false;
      if (filtroCategoria  && inc.categoria_id  !== parseInt(filtroCategoria))  return false;
      if (filtroProducto   && inc.producto_id   !== parseInt(filtroProducto))   return false;
      if (fechaInicio && new Date(inc.fecha_inicio) < new Date(fechaInicio))    return false;
      if (fechaFin) {
        const end = new Date(fechaFin); end.setHours(23,59,59,999);
        if (new Date(inc.fecha_inicio) > end) return false;
      }
      return true;
    });

    const totalTiempo = Math.round(dataFiltrada.reduce((s, i) => s + i.duracion_minutos, 0) * 10) / 10;
    const prodAfect   = new Set(dataFiltrada.filter(i => i.producto_id).map(i => i.producto_id)).size;
    const appAfect    = new Set(dataFiltrada.filter(i => i.aplicacion_id).map(i => i.aplicacion_id)).size;

    const mapApp = {}, mapCat = {}, mapProd = {};
    aplicaciones.forEach(a => mapApp[a.id] = 0);
    categorias.forEach(c   => mapCat[c.id] = 0);
    productos.forEach(p    => mapProd[p.id] = 0);

    dataFiltrada.forEach(inc => {
      if (inc.aplicacion_id) mapApp[inc.aplicacion_id]  = (mapApp[inc.aplicacion_id]  ?? 0) + inc.duracion_minutos;
      if (inc.categoria_id)  mapCat[inc.categoria_id]   = (mapCat[inc.categoria_id]   ?? 0) + inc.duracion_minutos;
      if (inc.producto_id)   mapProd[inc.producto_id]   = (mapProd[inc.producto_id]   ?? 0) + inc.duracion_minutos;
    });

    const fmt = (map, catalog, key) => Object.keys(map).map(id => {
      const info = catalog.find(x => x.id === parseInt(id));
      const downtime = Math.round(map[id] * 10) / 10;
      const disp = parseFloat(((MINUTOS_MES - downtime) / MINUTOS_MES * 100).toFixed(3));
      return { nombre: info?.nombre ?? `${key} ${id}`, disponibilidad: disp, inactividad: downtime };
    });

    return {
      stats: { totalIncidentes: dataFiltrada.length, tiempoInactividad: totalTiempo, productosAfectados: prodAfect, aplicacionesAfectadas: appAfect },
      chartDataApps:  fmt(mapApp,  aplicaciones, 'App').sort((a,b)  => a.disponibilidad - b.disponibilidad),
      chartDataCats:  fmt(mapCat,  categorias,   'Cat').sort((a,b)  => a.disponibilidad - b.disponibilidad),
      chartDataProds: fmt(mapProd, productos,    'Prod').filter(p => p.inactividad > 0).sort((a,b) => b.inactividad - a.inactividad),
      incidentesFiltrados: dataFiltrada,
    };
  }, [incidentes, filtroEmpresa, filtroAplicacion, filtroCategoria, filtroProducto, fechaInicio, fechaFin, aplicaciones, categorias, productos]);

  const limpiarFiltros = () => {
    setFiltroEmpresa(''); setFiltroAplicacion(''); setFiltroCategoria('');
    setFiltroProducto(''); setFechaInicio(''); setFechaFin('');
  };

  /* ── RENDER ── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ── TOKENS ── */
        :root {
          --violet:   #8B5CF6;
          --violet-l: #EDE9FE;
          --violet-m: #DDD6FE;
          --fuchsia:  #D946EF;
          --pink:     #EC4899;
          --rose:     #F43F5E;
          --amber:    #F59E0B;
          --emerald:  #10B981;
          --gray-50:  #F9FAFB;
          --gray-100: #F3F4F6;
          --gray-200: #E5E7EB;
          --gray-300: #D1D5DB;
          --gray-400: #9CA3AF;
          --gray-500: #6B7280;
          --gray-700: #374151;
          --gray-900: #111827;
          --white:    #FFFFFF;
          --font-sans: 'Plus Jakarta Sans', sans-serif;
          --font-disp: 'Bricolage Grotesque', sans-serif;
          --radius-xl: 20px;
          --radius-2xl: 28px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
          --shadow-lg: 0 12px 40px rgba(139,92,246,0.12), 0 4px 16px rgba(0,0,0,0.06);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── LAYOUT ── */
        .dash {
          min-height: 100vh;
          background: #FAFAFA;
          font-family: var(--font-sans);
          color: var(--gray-900);
          padding: 84px 24px 72px;
          position: relative;
        }

        /* Subtle mesh background */
        .dash::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 5% 0%, rgba(139,92,246,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 100%, rgba(217,70,239,0.05) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
        }

        .dash-inner {
          max-width: 1320px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* ── KEYFRAMES ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(250%)  skewX(-12deg); }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }

        /* ── PAGE HEADER ── */
        .page-header {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 40px;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @media (min-width: 860px) {
          .page-header { flex-direction: row; justify-content: space-between; align-items: flex-start; }
        }

        .header-left { display: flex; flex-direction: column; gap: 8px; }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--violet);
          background: var(--violet-l);
          border: 1px solid var(--violet-m);
          padding: 4px 12px 4px 8px;
          border-radius: 99px;
          width: fit-content;
        }
        .header-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--violet);
          animation: dot-pulse 2s ease-in-out infinite;
        }

        .page-title {
          font-family: var(--font-disp);
          font-size: clamp(28px, 4.5vw, 46px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.025em;
          color: var(--gray-900);
        }
        .page-title-accent {
          background: linear-gradient(135deg, var(--violet) 0%, var(--fuchsia) 60%, var(--pink) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-sub {
          font-size: 13px;
          color: var(--gray-400);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--fuchsia);
          background: #FDF4FF;
          border: 1px solid #F5D0FE;
          padding: 2px 8px;
          border-radius: 99px;
        }

        /* ── FILTER BAR ── */
        .filter-bar {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-2xl);
          padding: 14px 18px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          box-shadow: var(--shadow-sm);
          align-self: flex-start;
          max-width: 100%;
        }

        .filter-bar-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gray-400);
          padding-right: 8px;
          border-right: 1px solid var(--gray-200);
        }

        .filter-sep { width: 1px; height: 20px; background: var(--gray-200); flex-shrink: 0; }

        /* date input */
        .date-input {
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-700);
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 10px;
          padding: 7px 11px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .date-input:focus { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
        .date-sep { font-size: 12px; color: var(--gray-300); font-weight: 700; }

        /* filter select */
        .fsel-wrap { position: relative; display: flex; align-items: center; }
        .fsel {
          appearance: none;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-700);
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 10px;
          padding: 7px 28px 7px 11px;
          outline: none;
          cursor: pointer;
          min-width: 136px;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .fsel:hover { background: var(--white); border-color: var(--gray-300); }
        .fsel:focus {
          border-color: var(--gf, var(--violet));
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
          background: var(--white);
        }
        .fsel option { background: #fff; color: var(--gray-900); }
        .fsel-arrow {
          position: absolute; right: 9px;
          color: var(--gray-400); pointer-events: none;
        }

        /* clear btn */
        .clear-btn {
          display: flex; align-items: center; gap: 5px;
          font-family: var(--font-sans);
          font-size: 11px; font-weight: 700;
          color: var(--rose);
          background: #FFF1F2;
          border: 1px solid #FECDD3;
          border-radius: 10px;
          padding: 7px 13px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .clear-btn:hover { background: #FFE4E6; border-color: #FDA4AF; }

        /* ── KPI GRID ── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .kpi-card {
          background: var(--white);
          border: 1px solid var(--gray-100);
          border-radius: var(--radius-2xl);
          padding: 24px 22px 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.25s, transform 0.2s, border-color 0.25s;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
          cursor: default;
        }
        .kpi-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-3px);
          border-color: var(--gray-200);
        }

        .kpi-icon {
          width: 44px; height: 44px; flex-shrink: 0;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(139,92,246,0.25);
        }

        .kpi-content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .kpi-label {
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gray-400);
        }
        .kpi-value {
          font-family: var(--font-disp);
          font-size: 40px; font-weight: 800;
          line-height: 1; letter-spacing: -0.03em;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .kpi-sub { font-size: 11px; color: var(--gray-400); font-weight: 500; margin-top: 3px; }

        /* shimmer highlight on hover */
        .kpi-shimmer {
          position: absolute;
          top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          transform: translateX(-100%) skewX(-12deg);
          pointer-events: none;
        }
        .kpi-card:hover .kpi-shimmer {
          animation: shimmer 0.55s ease forwards;
        }

        /* ── CHARTS ── */
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 28px;
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 160ms;
        }
        @media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px)  { .charts-grid { grid-template-columns: 1fr; } }

        .chart-card {
          background: var(--white);
          border: 1px solid var(--gray-100);
          border-radius: var(--radius-2xl);
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.25s, border-color 0.25s;
        }
        .chart-card:hover { box-shadow: var(--shadow-md); border-color: var(--gray-200); }

        .sec-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gray-500);
        }
        .sec-title-icon {
          width: 24px; height: 24px;
          border-radius: 7px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          display: flex; align-items: center; justify-content: center;
        }

        .status-legend {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-top: -4px;
        }
        .status-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 600; color: var(--gray-500);
        }
        .status-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }

        /* Recharts overrides */
        .recharts-legend-item-text { color: var(--gray-500) !important; font-family: var(--font-sans) !important; font-size: 10px !important; font-weight: 600 !important; }

        /* Tooltip */
        .c-tooltip {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 14px;
          padding: 12px 16px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.12);
          min-width: 160px;
        }
        .c-tooltip-title {
          font-family: var(--font-disp);
          font-size: 13px; font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        .c-tooltip-row {
          display: flex; justify-content: space-between; gap: 16px;
          font-size: 11px; color: var(--gray-400); font-weight: 500;
          margin-top: 4px;
        }

        /* Empty */
        .empty-chart {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          min-height: 200px;
          border: 1.5px dashed var(--gray-200);
          border-radius: 16px;
          color: var(--gray-300);
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        /* ── TABLE ── */
        .table-card {
          background: var(--white);
          border: 1px solid var(--gray-100);
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 260ms;
        }

        .table-head-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--gray-100);
          background: var(--gray-50);
        }

        .table-head-left {
          display: flex; align-items: center; gap: 10px;
        }
        .table-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #FEF3C7, #FDE68A);
          border: 1px solid #FDE68A;
          display: flex; align-items: center; justify-content: center;
        }
        .table-title {
          font-family: var(--font-disp);
          font-size: 14px; font-weight: 800;
          color: var(--gray-900); letter-spacing: -0.01em;
        }

        .records-pill {
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gray-400);
          background: var(--white);
          border: 1px solid var(--gray-200);
          padding: 4px 12px; border-radius: 99px;
        }

        .table-scroll { overflow-x: auto; max-height: 420px; }
        table { width: 100%; border-collapse: collapse; }

        thead th {
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gray-400);
          padding: 11px 20px;
          text-align: left; white-space: nowrap;
          background: var(--white);
          border-bottom: 1px solid var(--gray-100);
          position: sticky; top: 0; z-index: 10;
        }

        tbody tr {
          border-bottom: 1px solid #F9FAFB;
          transition: background 0.12s;
          animation: fadeIn 0.3s ease both;
        }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: #FAFAF9; }

        td {
          padding: 12px 20px;
          font-size: 12px; font-weight: 500;
          color: var(--gray-500); white-space: nowrap;
        }

        .td-date { font-weight: 700; color: var(--gray-700); font-size: 12px; }
        .ticket-chip {
          display: inline-block; margin-top: 3px;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--violet);
          background: var(--violet-l);
          border: 1px solid var(--violet-m);
          padding: 2px 7px; border-radius: 6px;
        }

        .cat-chip {
          font-size: 10px; font-weight: 700;
          color: var(--pink);
          background: #FDF2F8;
          border: 1px solid #FBCFE8;
          padding: 3px 9px; border-radius: 6px;
        }

        .dur-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 8px;
        }
        .dur-crit { color: var(--rose);  background: #FFF1F2; border: 1px solid #FECDD3; }
        .dur-norm { color: var(--amber); background: #FFFBEB; border: 1px solid #FDE68A; }

        .empty-table-cell {
          padding: 60px 20px;
          text-align: center;
        }
        .empty-table-inner {
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          color: var(--gray-300);
          font-size: 12px; font-weight: 600;
        }

        /* ── LOADING ── */
        .loading-wrap {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 55vh; gap: 20px;
        }
        .loading-spinner {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 3px solid var(--violet-m);
          border-top-color: var(--violet);
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-txt {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--gray-300);
        }

        /* ── SCROLL CUSTOM ── */
        .table-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .table-scroll::-webkit-scrollbar-track { background: transparent; }
        .table-scroll::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 99px; }
      `}</style>

      <div className="dash">
        <div className="dash-inner">

          {/* ── HEADER ── */}
          <div className="page-header">
            <div className="header-left">
              <div className="header-badge">
                <span className="header-badge-dot" />
                Monitoreo en tiempo real
              </div>
              <h1 className="page-title">
                Dashboard{' '}
                <span className="page-title-accent">General</span>
              </h1>
              <p className="page-sub">
                Disponibilidad · Incidentes · Rendimiento
                {hayFiltros && (
                  <span className="filter-badge">
                    <Filter size={8} /> Filtros activos
                  </span>
                )}
              </p>
            </div>

            {/* ── FILTER BAR ── */}
            <div className="filter-bar">
              <div className="filter-bar-label">
                <Filter size={11} />
                Filtrar
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="date" className="date-input"
                  value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                  title="Fecha inicio"
                />
                <span className="date-sep">—</span>
                <input
                  type="date" className="date-input"
                  value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                  title="Fecha fin"
                />
              </div>

              <div className="filter-sep" />

              {currentUser.rol !== 'cliente' && (
                <FilterSelect value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} gradFrom="#8B5CF6" gradTo="#D946EF">
                  <option value="">Todas las Redes</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </FilterSelect>
              )}

              <FilterSelect value={filtroAplicacion} onChange={e => setFiltroAplicacion(e.target.value)} gradFrom="#D946EF" gradTo="#EC4899">
                <option value="">Todas las Apps</option>
                {aplicaciones.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </FilterSelect>

              <FilterSelect value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} gradFrom="#EC4899" gradTo="#F43F5E">
                <option value="">Todas las Cat.</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </FilterSelect>

              <FilterSelect value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)} gradFrom="#F59E0B" gradTo="#F97316">
                <option value="">Todos los Prod.</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </FilterSelect>

              {hayFiltros && (
                <button className="clear-btn" onClick={limpiarFiltros}>
                  <X size={10} /> Limpiar
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-wrap">
              <div className="loading-spinner" />
              <p className="loading-txt">Cargando datos</p>
            </div>
          ) : (
            <>
              {/* ── KPI CARDS ── */}
              <div className="kpi-grid">
                <KpiCard
                  icon={AlertCircle} label="Total Caídas" value={stats.totalIncidentes}
                  sub="incidentes registrados"
                  gradFrom="#F43F5E" gradTo="#FB7185" delay={0}
                />
                <KpiCard
                  icon={Clock} label="Mins. Inactividad" value={stats.tiempoInactividad}
                  sub="tiempo total acumulado"
                  gradFrom="#F59E0B" gradTo="#FBBF24" delay={80}
                />
                <KpiCard
                  icon={AppWindow} label="Apps Afectadas" value={stats.aplicacionesAfectadas}
                  sub="con al menos 1 caída"
                  gradFrom="#8B5CF6" gradTo="#A78BFA" delay={160}
                />
                <KpiCard
                  icon={Server} label="Prods. Afectados" value={stats.productosAfectados}
                  sub="con al menos 1 caída"
                  gradFrom="#D946EF" gradTo="#E879F9" delay={240}
                />
              </div>

              {/* ── CHARTS ── */}
              <div className="charts-grid">

                {/* Apps */}
                <div className="chart-card">
                  <SectionTitle icon={BarChart3} title="Disponibilidad · Apps" iconColor="#8B5CF6" />
                  <StatusLegend />
                  {chartDataApps.length === 0 ? <EmptyChart /> : (
                    <div style={{ width: '100%', height: 230 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataApps} margin={{ top: 4, right: 4, left: -18, bottom: 30 }} barSize={26}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 9, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }} dy={12} angle={-18} textAnchor="end" />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#D1D5DB', fontSize: 9, fontFamily: 'Plus Jakarta Sans, sans-serif' }} tickFormatter={v => `${v}%`} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', radius: 6 }} />
                          <Bar dataKey="disponibilidad" radius={[6, 6, 0, 0]}>
                            {chartDataApps.map((e, i) => <Cell key={i} fill={getDispColor(e.disponibilidad)} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Categorías */}
                <div className="chart-card">
                  <SectionTitle icon={BarChart3} title="Disponibilidad · Categorías" iconColor="#EC4899" />
                  <StatusLegend />
                  {chartDataCats.length === 0 ? <EmptyChart /> : (
                    <div style={{ width: '100%', height: 230 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataCats} margin={{ top: 4, right: 4, left: -18, bottom: 30 }} barSize={26}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 9, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }} dy={12} angle={-18} textAnchor="end" />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#D1D5DB', fontSize: 9, fontFamily: 'Plus Jakarta Sans, sans-serif' }} tickFormatter={v => `${v}%`} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', radius: 6 }} />
                          <Bar dataKey="disponibilidad" radius={[6, 6, 0, 0]}>
                            {chartDataCats.map((e, i) => <Cell key={i} fill={getDispColor(e.disponibilidad)} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Pie */}
                <div className="chart-card">
                  <SectionTitle icon={Activity} title="Impacto por Producto" iconColor="#D946EF" />
                  {chartDataProds.length === 0 ? <EmptyChartGreen /> : (
                    <div style={{ width: '100%', height: 262 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartDataProds} cx="50%" cy="44%" innerRadius={54} outerRadius={84} paddingAngle={4} dataKey="inactividad" nameKey="nombre">
                            {chartDataProds.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend verticalAlign="bottom" height={34} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* ── TABLE ── */}
              <div className="table-card">
                <div className="table-head-bar">
                  <div className="table-head-left">
                    <div className="table-icon-wrap">
                      <Zap size={14} style={{ color: '#D97706' }} />
                    </div>
                    <span className="table-title">Registro de Incidentes</span>
                  </div>
                  <span className="records-pill">{incidentesFiltrados.length} registros</span>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {['Fecha / Ticket', 'Empresa', 'Aplicación', 'Categoría', 'Producto', 'Inactividad'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {incidentesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-table-cell">
                            <div className="empty-table-inner">
                              <BarChart3 size={28} />
                              <span>No hay incidentes para los filtros seleccionados</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        [...incidentesFiltrados]
                          .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))
                          .map((inc, i) => {
                            const empInfo  = empresas.find(e => e.id === inc.empresa_id)?.nombre       || 'N/A';
                            const appInfo  = aplicaciones.find(a => a.id === inc.aplicacion_id)?.nombre || 'N/A';
                            const catInfo  = categorias.find(c => c.id === inc.categoria_id)?.nombre    || '—';
                            const prodInfo = productos.find(p => p.id === inc.producto_id)?.nombre      || 'N/A';
                            const crit     = inc.duracion_minutos > 60;

                            return (
                              <tr key={inc.id} style={{ animationDelay: `${i * 22}ms` }}>
                                <td>
                                  <div className="td-date">
                                    {new Date(inc.fecha_inicio).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {inc.ticket && <span className="ticket-chip">#{inc.ticket}</span>}
                                </td>
                                <td>{empInfo}</td>
                                <td>{appInfo}</td>
                                <td><span className="cat-chip">{catInfo}</span></td>
                                <td>{prodInfo}</td>
                                <td>
                                  <span className={`dur-chip ${crit ? 'dur-crit' : 'dur-norm'}`}>
                                    <Clock size={10} />
                                    {inc.duracion_minutos} min
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
    </>
  );
};

export default Dashboard;
