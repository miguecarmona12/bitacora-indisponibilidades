import React, { useEffect, useState, useMemo } from 'react';
import { bitacoraService, authService } from '../services/api';
import { BarChart3, TrendingUp, AlertCircle, Clock, AppWindow, Server, Activity, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const Dashboard = () => {
  const [incidentes, setIncidentes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);

  // Estados de Filtros
  const currentUser = authService.getCurrentUser();
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroAplicacion, setFiltroAplicacion] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataInc = await bitacoraService.getIncidentes();
        const dataEmp = await bitacoraService.getEmpresas();
        const dataApp = await bitacoraService.getAplicaciones();
        const dataCat = await bitacoraService.getCategorias();
        const dataProd = await bitacoraService.getProductos();
        
        setIncidentes(dataInc);
        setEmpresas(dataEmp);
        setAplicaciones(dataApp);
        setCategorias(dataCat);
        setProductos(dataProd);
      } catch (error) {
        console.error("Error al cargar datos del dashboard", error);
      }
    };
    fetchData();
  }, []);

  // Calcular métricas y gráficos basados en filtros
  const { stats, chartDataApps, chartDataCats, chartDataProds, incidentesFiltrados } = useMemo(() => {
    // 1. Filtrar los incidentes según los selectores
    const dataFiltrada = incidentes.filter(inc => {
        let pasaFiltro = true;
        if (filtroEmpresa && inc.empresa_id !== parseInt(filtroEmpresa)) pasaFiltro = false;
        if (filtroAplicacion && inc.aplicacion_id !== parseInt(filtroAplicacion)) pasaFiltro = false;
        if (filtroCategoria && inc.categoria_id !== parseInt(filtroCategoria)) pasaFiltro = false;
        if (filtroProducto && inc.producto_id !== parseInt(filtroProducto)) pasaFiltro = false;
        
        // Filtro por Fechas
        if (fechaInicio) {
          const incDate = new Date(inc.fecha_inicio);
          const filterStartDate = new Date(fechaInicio);
          if (incDate < filterStartDate) pasaFiltro = false;
        }
        if (fechaFin) {
          const incDate = new Date(inc.fecha_inicio);
          const filterEndDate = new Date(fechaFin);
          // Ajustamos para incluir todo el día de fin
          filterEndDate.setHours(23, 59, 59, 999);
          if (incDate > filterEndDate) pasaFiltro = false;
        }

        return pasaFiltro;
    });

    // 2. Calcular KPIs (Stats)
    const total = dataFiltrada.length;
    let totalTiempo = dataFiltrada.reduce((acc, inc) => acc + inc.duracion_minutos, 0);
    // Limpiar precisión flotante de Javascript
    totalTiempo = Math.round(totalTiempo * 10) / 10;
    
    const prodAfectadosSet = new Set(dataFiltrada.filter(i => i.producto_id).map(inc => inc.producto_id));
    const appAfectadasSet = new Set(dataFiltrada.filter(i => i.aplicacion_id).map(inc => inc.aplicacion_id));
    
    const newStats = {
      totalIncidentes: total,
      tiempoInactividad: totalTiempo,
      productosAfectados: prodAfectadosSet.size,
      aplicacionesAfectadas: appAfectadasSet.size
    };

    // 3. Preparar datos de gráficos
    const MINUTOS_MES = 43200; // Asumiendo mes 30 días = 43200 min
    const downtimePorApp = {};
    const downtimePorCat = {};
    const downtimePorProd = {};

    // Inicializar todos los catálogos en 0 minutos de inactividad (100% disponibilidad)
    aplicaciones.forEach(app => downtimePorApp[app.id] = 0);
    categorias.forEach(cat => downtimePorCat[cat.id] = 0);
    productos.forEach(prod => downtimePorProd[prod.id] = 0);

    // Sumar el tiempo de inactividad según los incidentes filtrados
    dataFiltrada.forEach(inc => {
        if (inc.aplicacion_id) {
            if (downtimePorApp[inc.aplicacion_id] !== undefined) downtimePorApp[inc.aplicacion_id] += inc.duracion_minutos;
            else downtimePorApp[inc.aplicacion_id] = inc.duracion_minutos;
        }

        if (inc.categoria_id) { 
            if (downtimePorCat[inc.categoria_id] !== undefined) downtimePorCat[inc.categoria_id] += inc.duracion_minutos;
            else downtimePorCat[inc.categoria_id] = inc.duracion_minutos;
        }

        if (inc.producto_id) {
            if (downtimePorProd[inc.producto_id] !== undefined) downtimePorProd[inc.producto_id] += inc.duracion_minutos;
            else downtimePorProd[inc.producto_id] = inc.duracion_minutos;
        }
    });

    const appsFormatted = Object.keys(downtimePorApp).map(appId => {
        const appInfo = aplicaciones.find(a => a.id === parseInt(appId));
        let downtime = downtimePorApp[appId];
        downtime = Math.round(downtime * 10) / 10;
        const disp = ((MINUTOS_MES - downtime) / MINUTOS_MES) * 100;
        return {
            nombre: appInfo ? appInfo.nombre : `App ${appId}`,
            disponibilidad: parseFloat(disp.toFixed(3)),
            inactividad: downtime
        };
    }).sort((a, b) => a.disponibilidad - b.disponibilidad); // Peores primero

    const prodsFormatted = Object.keys(downtimePorProd).map(prodId => {
        const prodInfo = productos.find(p => p.id === parseInt(prodId));
        let downtime = downtimePorProd[prodId];
        downtime = Math.round(downtime * 10) / 10;
        const disp = ((MINUTOS_MES - downtime) / MINUTOS_MES) * 100;
        return {
            nombre: prodInfo ? prodInfo.nombre : `Prod ${prodId}`,
            disponibilidad: parseFloat(disp.toFixed(3)),
            inactividad: downtime
        };
    }).filter(p => p.inactividad > 0).sort((a, b) => b.inactividad - a.inactividad); // Ocultar los que no tienen inactividad en la torta

    const catsFormatted = Object.keys(downtimePorCat).map(catId => {
        const catInfo = categorias.find(c => c.id === parseInt(catId));
        let downtime = downtimePorCat[catId];
        downtime = Math.round(downtime * 10) / 10;
        const disp = ((MINUTOS_MES - downtime) / MINUTOS_MES) * 100;
        return {
            nombre: catInfo ? catInfo.nombre : `Cat ${catId}`,
            disponibilidad: parseFloat(disp.toFixed(3)),
            inactividad: downtime
        };
    }).sort((a, b) => a.disponibilidad - b.disponibilidad); // Peores primero

    return { stats: newStats, chartDataApps: appsFormatted, chartDataCats: catsFormatted, chartDataProds: prodsFormatted, incidentesFiltrados: dataFiltrada };

  }, [incidentes, filtroEmpresa, filtroAplicacion, filtroCategoria, filtroProducto, fechaInicio, fechaFin, empresas, aplicaciones, categorias, productos]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 shadow-xl rounded-lg border border-gray-700">
          <p className="font-bold text-sm mb-1">{label}</p>
          <p className="text-emerald-400 text-xs font-semibold">
            Disp: {payload[0].value}%
          </p>
          <p className="text-red-400 text-xs mt-1">
            Caída: {payload[0].payload.inactividad} min
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 shadow-xl rounded-lg border border-gray-700">
          <p className="font-bold text-sm mb-1">{payload[0].name}</p>
          <p className="text-red-400 text-xs mt-1 font-semibold">
            {payload[0].value} minutos de caída
          </p>
        </div>
      );
    }
    return null;
  };

  const getColor = (disp) => {
    if (disp >= 99.5) return '#10B981';
    if (disp >= 98.0) return '#F59E0B';
    return '#EF4444'; 
  };

  const limpiarFiltros = () => {
    setFiltroEmpresa('');
    setFiltroAplicacion('');
    setFiltroCategoria('');
    setFiltroProducto('');
    setFechaInicio('');
    setFechaFin('');
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto mb-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Dashboard General</h1>
        
        {/* Barra de Filtros */}
        <div className="flex flex-col xl:flex-row items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center text-gray-500 mr-2">
                <Filter className="w-5 h-5 mr-1" />
                <span className="text-sm font-semibold uppercase tracking-wider">Filtros:</span>
            </div>

            {/* Fechas */}
            <div className="flex items-center space-x-2">
              <input 
                  type="date"
                  className="p-2 border border-blue-200 rounded-lg text-sm bg-blue-50/30 outline-none focus:ring-1 focus:ring-violet-500"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  title="Fecha Inicial"
              />
              <span className="text-gray-400 text-sm">-</span>
              <input 
                  type="date"
                  className="p-2 border border-blue-200 rounded-lg text-sm bg-blue-50/30 outline-none focus:ring-1 focus:ring-fuchsia-500"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  title="Fecha Final"
              />
            </div>
            
            <div className="h-6 w-px bg-gray-200 hidden xl:block mx-1"></div>

            {currentUser.rol !== 'cliente' && (
              <select 
                  className="p-2 border border-violet-200 rounded-lg text-sm bg-violet-50/50 outline-none focus:ring-1 focus:ring-violet-500 min-w-[120px] transition-colors"
                  value={filtroEmpresa}
                  onChange={(e) => setFiltroEmpresa(e.target.value)}
              >
                  <option value="">Todas las Redes</option>
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
              </select>
            )}

            <select 
                className="p-2 border border-fuchsia-200 rounded-lg text-sm bg-fuchsia-50/50 outline-none focus:ring-1 focus:ring-fuchsia-500 min-w-[120px] transition-colors"
                value={filtroAplicacion}
                onChange={(e) => setFiltroAplicacion(e.target.value)}
            >
                <option value="">Todas las Apps</option>
                {aplicaciones.map(app => <option key={app.id} value={app.id}>{app.nombre}</option>)}
            </select>
            
            <select 
                className="p-2 border border-pink-200 rounded-lg text-sm bg-pink-50/50 outline-none focus:ring-1 focus:ring-pink-500 min-w-[120px] transition-colors"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
            >
                <option value="">Todas las Cat.</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>

            <select 
                className="p-2 border border-orange-200 rounded-lg text-sm bg-orange-50/50 outline-none focus:ring-1 focus:ring-orange-500 min-w-[120px] transition-colors"
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
            >
                <option value="">Todos los Prod.</option>
                {productos.map(prod => <option key={prod.id} value={prod.id}>{prod.nombre}</option>)}
            </select>

            {(filtroEmpresa || filtroAplicacion || filtroCategoria || filtroProducto || fechaInicio || fechaFin) && (
                <button 
                  onClick={limpiarFiltros}
                  className="text-xs text-red-500 hover:text-red-700 underline font-medium ml-2"
                >
                  Limpiar
                </button>
            )}
        </div>
      </div>
      
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center transition hover:shadow-md">
          <div className="rounded-full bg-red-100 p-3 mr-4"><AlertCircle className="w-6 h-6 text-red-500" /></div>
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Caídas</p><p className="text-2xl font-bold text-gray-900">{stats.totalIncidentes}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center transition hover:shadow-md">
          <div className="rounded-full bg-orange-100 p-3 mr-4"><Clock className="w-6 h-6 text-orange-500" /></div>
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mins. Inactividad</p><p className="text-2xl font-bold text-gray-900">{stats.tiempoInactividad}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center transition hover:shadow-md">
          <div className="rounded-full bg-violet-100 p-3 mr-4"><AppWindow className="w-6 h-6 text-violet-500" /></div>
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Apps Afectadas</p><p className="text-2xl font-bold text-gray-900">{stats.aplicacionesAfectadas}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center transition hover:shadow-md">
          <div className="rounded-full bg-fuchsia-100 p-3 mr-4"><Server className="w-6 h-6 text-fuchsia-500" /></div>
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prods. Afectados</p><p className="text-2xl font-bold text-gray-900">{stats.productosAfectados}</p></div>
        </div>
      </div>

      {/* Sección Gráficos - 3 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Aplicaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-violet-500" />
                Disponibilidad por Aplicación (%)
            </h2>
            
            {chartDataApps.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-xs font-medium uppercase tracking-widest">Sin datos suficientes</p>
                </div>
            ) : (
                <div className="w-full h-72 pb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataApps} margin={{ top: 10, right: 10, left: 0, bottom: 25 }} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} dy={15} angle={-25} textAnchor="end"/>
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(val) => `${val}%`}/>
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
                            <Bar dataKey="disponibilidad" radius={[4, 4, 0, 0]}>
                                {chartDataApps.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColor(entry.disponibilidad)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* Gráfico 2: Categorías */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-pink-500" />
                Disponibilidad por Categoría (%)
            </h2>
            
            {chartDataCats.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-xs font-medium uppercase tracking-widest">Sin datos suficientes</p>
                </div>
            ) : (
                <div className="w-full h-72 pb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataCats} margin={{ top: 10, right: 10, left: 0, bottom: 25 }} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} dy={15} angle={-25} textAnchor="end"/>
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(val) => `${val}%`}/>
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
                            <Bar dataKey="disponibilidad" radius={[4, 4, 0, 0]}>
                                {chartDataCats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColor(entry.disponibilidad)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* Gráfico 3: Productos Locales (Torta de Inactividad) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-fuchsia-500" />
                Impacto de Caídas por Producto
            </h2>
            
            {chartDataProds.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-emerald-500 bg-emerald-50 rounded-lg border border-dashed border-emerald-200">
                    <TrendingUp className="w-12 h-12 mb-3 text-emerald-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">100% Eficiencia</p>
                    <p className="text-[10px] text-emerald-500 font-medium">0 minutos de inactividad</p>
                </div>
            ) : (
                <div className="w-full h-72 pb-4 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartDataProds}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="inactividad"
                                nameKey="nombre"
                            >
                                {chartDataProds.map((entry, index) => {
                                    const COLORS = ['#D946EF', '#EC4899', '#8B5CF6', '#F43F5E', '#F59E0B', '#3B82F6', '#10B981'];
                                    return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                                })}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '10px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

      </div>

      {/* Tabla Listado Filtrado */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
                Listado Detallado de Incidentes
            </h2>
            <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                Mostrando {incidentesFiltrados.length} Registros
            </span>
        </div>
        
        <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="text-gray-500 text-[11px] uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-gray-100">Fecha / Ticket</th>
                <th className="p-4 font-bold border-b border-gray-100">Empresa</th>
                <th className="p-4 font-bold border-b border-gray-100">Aplicación</th>
                <th className="p-4 font-bold border-b border-gray-100">Categoría</th>
                <th className="p-4 font-bold border-b border-gray-100">Producto</th>
                <th className="p-4 font-bold border-b border-gray-100 text-center">Inactividad</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {incidentesFiltrados.length === 0 ? (
                <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400 italic">No hay incidentes para los filtros seleccionados.</td>
                </tr>
                ) : (
                incidentesFiltrados.sort((a,b)=> new Date(b.fecha_inicio) - new Date(a.fecha_inicio)).map(inc => {
                    const empInfo = empresas.find(e => e.id === inc.empresa_id)?.nombre || 'N/A';
                    const appInfo = aplicaciones.find(a => a.id === inc.aplicacion_id)?.nombre || 'N/A';
                    const catInfo = categorias.find(c => c.id === inc.categoria_id)?.nombre || 'Sin Cat.';
                    const prodInfo = productos.find(p => p.id === inc.producto_id)?.nombre || 'N/A';

                    return (
                    <tr key={inc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(inc.fecha_inicio).toLocaleString('es-ES', { 
                                day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                            })}
                            {inc.ticket && (
                                <span className="ml-2 bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded border border-violet-200 font-semibold">#{inc.ticket}</span>
                            )}
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-800">{empInfo}</td>
                        <td className="p-4 text-sm font-medium text-gray-800">{appInfo}</td>
                        <td className="p-4 text-sm font-medium text-pink-600">{catInfo}</td>
                        <td className="p-4 text-sm font-medium text-gray-800">{prodInfo}</td>
                        <td className="p-4 text-center">
                            <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-100">
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
    </div>
  );
};

export default Dashboard;
