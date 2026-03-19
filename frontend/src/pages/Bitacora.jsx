import React, { useState, useEffect } from 'react';
import { bitacoraService, authService } from '../services/api';
import { Calendar, Clock, FileText, AlertTriangle, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react';

const Bitacora = () => {
  const currentUser = authService.getCurrentUser();
  const [incidentes, setIncidentes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Edición
  const [editingIncidente, setEditingIncidente] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const [formData, setFormData] = useState({
    empresa_ids: [],
    aplicacion_ids: [],
    categoria_ids: [],
    producto_ids: [],
    fecha_inicio: new Date().toISOString().slice(0, 16),
    duracion_minutos: '',
    motivo: '',
    solucion: '',
    ticket: '',
    mes_reporte: new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  });

  const fetchData = async () => {
    try {
      const i = await bitacoraService.getIncidentes();
      const p = await bitacoraService.getProductos();
      const c = await bitacoraService.getCategorias();
      const a = await bitacoraService.getAplicaciones();
      const e = await bitacoraService.getEmpresas();
      setIncidentes(i);
      setProductos(p);
      setCategorias(c);
      setAplicaciones(a);
      setEmpresas(e);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasAnySelection = formData.empresa_ids.length > 0 || formData.aplicacion_ids.length > 0 || formData.categoria_ids.length > 0 || formData.producto_ids.length > 0;
    
    if (!hasAnySelection || !formData.duracion_minutos || !formData.mes_reporte) {
      alert("Por favor selecciona al menos un elemento afectado (Empresa, App, Categoría o Producto) y la duración.");
      return;
    }

    try {
      const payloads = [];
      const e_ids = formData.empresa_ids.length > 0 ? formData.empresa_ids : [null];
      const a_ids = formData.aplicacion_ids.length > 0 ? formData.aplicacion_ids : [null];
      
      let cp_combinations = [];
      if (formData.producto_ids.length > 0) {
        formData.producto_ids.forEach(prodId => {
          const prod = productos.find(p => p.id === prodId);
          cp_combinations.push({ catId: prod ? prod.categoria_id : null, prodId: prodId });
        });
        
        formData.categoria_ids.forEach(catId => {
          const hasProductInThisCat = formData.producto_ids.some(prodId => {
             const prod = productos.find(p => p.id === prodId);
             return prod && (prod.categoria_id === catId);
          });
          if (!hasProductInThisCat) {
              cp_combinations.push({ catId: catId, prodId: null });
          }
        });
      } else if (formData.categoria_ids.length > 0) {
        formData.categoria_ids.forEach(catId => {
          cp_combinations.push({ catId: catId, prodId: null });
        });
      } else {
        cp_combinations.push({ catId: null, prodId: null });
      }

      e_ids.forEach(empId => {
        a_ids.forEach(appId => {
          cp_combinations.forEach(cp => {
            payloads.push({
              empresa_id: empId,
              aplicacion_id: appId,
              categoria_id: cp.catId,
              producto_id: cp.prodId,
              duracion_minutos: parseFloat(formData.duracion_minutos),
              fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
              motivo: formData.motivo,
              solucion: formData.solucion,
              ticket: formData.ticket,
              mes_reporte: formData.mes_reporte
            });
          });
        });
      });
      
      await bitacoraService.createIncidentesBulk(payloads);
      
      setFormData({
        ...formData,
        duracion_minutos: '',
        motivo: '',
        solucion: '',
        ticket: ''
      });
      setCurrentPage(1); // Volver a la página 1 tras registrar
      fetchData();
    } catch (error) {
      alert("Error al registrar incidencia.");
    }
  };

  const getFullInfo = (empId, appId, prodId, catId) => {
    const emp = empresas.find(e => e.id === empId);
    const app = aplicaciones.find(a => a.id === appId);
    const prod = productos.find(p => p.id === prodId);
    const cat = categorias.find(c => c.id === catId);
    
    return { 
      producto: prod ? prod.nombre : 'Sin Prod.', 
      categoria: cat ? cat.nombre : 'Sin Cat.',
      aplicacion: app ? app.nombre : 'Sin App.',
      empresa: emp ? emp.nombre : 'Sin Red.' 
    };
  };

  const handleEditClick = (inc) => {
    setEditingIncidente(inc);
    setEditFormData({
      empresa_id: inc.empresa_id || '',
      aplicacion_id: inc.aplicacion_id || '',
      categoria_id: inc.categoria_id || '',
      producto_id: inc.producto_id || '',
      duracion_minutos: inc.duracion_minutos,
      motivo: inc.motivo || '',
      solucion: inc.solucion || '',
      ticket: inc.ticket || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            empresa_id: editFormData.empresa_id ? parseInt(editFormData.empresa_id) : null,
            aplicacion_id: editFormData.aplicacion_id ? parseInt(editFormData.aplicacion_id) : null,
            categoria_id: editFormData.categoria_id ? parseInt(editFormData.categoria_id) : null,
            producto_id: editFormData.producto_id ? parseInt(editFormData.producto_id) : null,
            duracion_minutos: parseFloat(editFormData.duracion_minutos),
            motivo: editFormData.motivo,
            solucion: editFormData.solucion,
            ticket: editFormData.ticket
        };
        await bitacoraService.updateIncidente(editingIncidente.id, payload);
        alert("¡Incidente actualizado con éxito!");
        setEditingIncidente(null);
        fetchData();
    } catch (error) {
        alert("Ocurrió un error al actualizar el incidente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas ELIMINAR este incidente? Esta acción no se puede deshacer.")) {
        try {
            await bitacoraService.deleteIncidente(id);
            alert("Incidente eliminado.");
            fetchData();
        } catch (error) {
            alert("Ocurrió un error al eliminar el incidente.");
        }
    }
  };

  const aplicacionesFiltradas = aplicaciones.filter(a => {
    if (formData.empresa_ids.length === 0) return true; // Si no hay redes seleccionadas, todas son visibles
    if (!a.empresas || a.empresas.length === 0) return true; // Si la app es Global, siempre visible
    
    // Si la App tiene redes específicas, validamos si se intersectan con las redes seleccionadas actualemente
    const appEmpresaIds = a.empresas.map(e => e.id);
    return formData.empresa_ids.some(selectedEmpId => appEmpresaIds.includes(selectedEmpId));
  });

  const productosFiltrados = productos.filter(p => formData.categoria_ids.includes(p.categoria_id));

  const toggleSelection = (field, id) => {
    setFormData(prev => {
      const isSelected = prev[field].includes(id);
      let newSelection = isSelected 
        ? prev[field].filter(v => v !== id)
        : [...prev[field], id];
      
      if (field === 'categoria_ids' && isSelected) {
          const removedCatProducts = productos.filter(p => p.categoria_id === id).map(p => p.id);
          return {
              ...prev,
              [field]: newSelection,
              producto_ids: prev.producto_ids.filter(pId => !removedCatProducts.includes(pId))
          };
      }
      return { ...prev, [field]: newSelection };
    });
  };

  const selectAll = (field, items) => {
    setFormData(prev => ({ ...prev, [field]: items.map(i => i.id) }));
  };
  
  const deselectAll = (field) => {
    setFormData(prev => ({ ...prev, [field]: [] }));
  };

  const renderCheckboxGroup = (title, items, field, colorClass) => (
    <div>
      <div className="flex justify-between items-center mb-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">{title}</label>
          <div className="flex gap-2">
              <button type="button" onClick={() => selectAll(field, items)} className="text-[10px] text-violet-600 hover:text-violet-800 underline">Todos</button>
              <button type="button" onClick={() => deselectAll(field)} className="text-[10px] text-gray-500 hover:text-gray-700 underline">Ninguno</button>
          </div>
      </div>
      <div className={`grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200 shadow-inner`}>
        {items.map(item => {
            const isChecked = formData[field].includes(item.id);
            return (
                <label key={item.id} className={`flex items-center p-1.5 rounded cursor-pointer border text-xs transition-colors select-none ${isChecked ? colorClass : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleSelection(field, item.id)} />
                    <span className="truncate">{item.nombre}</span>
                </label>
            )
        })}
        {items.length === 0 && <span className="text-[10px] text-gray-400 italic p-1">Sin elementos</span>}
      </div>
    </div>
  );
  const sortedIncidentes = [...incidentes].sort((a,b)=> new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
  const totalPages = Math.ceil(sortedIncidentes.length / itemsPerPage) || 1;
  const currentIncidentes = sortedIncidentes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const nextPage = () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto mb-10 pb-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Bitácora de Incidentes</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario Registro Nuevo Incidente */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center border-b pb-4">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500"/> Nuevo Registro
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Selectores Independientes */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-2 border border-violet-50">
                {renderCheckboxGroup("Paso 1: Empresa / Red", empresas, 'empresa_ids', 'bg-violet-50 border-violet-400 text-violet-800 font-semibold')}
                {renderCheckboxGroup("Paso 2: Aplicación", aplicacionesFiltradas, 'aplicacion_ids', 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-800 font-semibold')}
                {renderCheckboxGroup("Paso 3: Categoría", categorias, 'categoria_ids', 'bg-pink-50 border-pink-400 text-pink-800 font-semibold')}
                {renderCheckboxGroup("Paso 4: Producto", productosFiltrados, 'producto_ids', 'bg-orange-50 border-orange-400 text-orange-800 font-semibold')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1"/> Fecha y Hora Caída
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-black bg-white select-none"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock className="w-4 h-4 mr-1"/> Duración (Minutos) *
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="Ej. 15.5"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-black bg-white"
                  value={formData.duracion_minutos}
                  onChange={(e) => setFormData({...formData, duracion_minutos: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FileText className="w-4 h-4 mr-1"/> Motivo / Descripción
                </label>
                <textarea 
                  rows="2"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-black bg-white resize-none"
                  placeholder="Razón de la caída..."
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FileText className="w-4 h-4 mr-1"/> Solución
                </label>
                <textarea 
                  rows="2"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-black bg-white resize-none"
                  placeholder="Acciones correctivas aplicadas..."
                  value={formData.solucion}
                  onChange={(e) => setFormData({...formData, solucion: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Ticket / Caso Nº (Opcional)
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-black bg-white"
                  placeholder="Ej. INC-12345"
                  value={formData.ticket}
                  onChange={(e) => setFormData({...formData, ticket: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes de Reporte *</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  value={formData.mes_reporte}
                  onChange={(e) => setFormData({...formData, mes_reporte: e.target.value})}
                  readOnly
                />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-3 rounded-lg font-medium hover:from-violet-700 hover:to-fuchsia-700 shadow-md transition-all mt-4">
                Registrar Falla
              </button>
            </form>
          </div>
        </div>

        {/* Tabla Historial */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Historial de Incidentes</h2>
              <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-full border border-gray-200">
                {incidentes.length} Registros
              </span>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto max-h-[800px] relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                  <tr className="text-gray-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-100">Fecha / Ticket</th>
                    <th className="p-4 font-bold border-b border-gray-100">Falla Identificada</th>
                    <th className="p-4 font-bold border-b border-gray-100 min-w-[300px]">Detalle (Motivo y Solución)</th>
                    <th className="p-4 font-bold border-b border-gray-100">Inactividad</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentIncidentes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 italic">No hay incidentes registrados aún.</td>
                    </tr>
                  ) : (
                    currentIncidentes.map(inc => {
                      const info = getFullInfo(inc.empresa_id, inc.aplicacion_id, inc.producto_id, inc.categoria_id);
                      return (
                        <tr key={inc.id} className="hover:bg-violet-50/30 transition-colors">
                          <td className="p-4 text-xs text-gray-600 whitespace-nowrap align-top">
                            {new Date(inc.fecha_inicio).toLocaleString('es-ES', { 
                              day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                            })}
                            {inc.ticket && (
                                <div className="mt-1 font-semibold text-violet-700 flex items-center gap-1">
                                    <span className="bg-violet-100 px-1.5 py-0.5 rounded border border-violet-200">#{inc.ticket}</span>
                                </div>
                            )}
                          </td>
                          <td className="p-4 align-top">
                            <p className="font-semibold text-gray-900 text-sm">{info.producto}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded border border-pink-200 shadow-sm">
                                {info.categoria}
                              </span>
                              <span className="text-[10px] bg-violet-100 text-violet-800 px-2 py-0.5 rounded border border-violet-200 shadow-sm">
                                {info.empresa}
                              </span>
                              <span className="text-[10px] bg-fuchsia-100 text-fuchsia-800 px-2 py-0.5 rounded border border-fuchsia-200 shadow-sm">
                                {info.aplicacion}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-gray-600 align-top leading-relaxed min-w-[300px]">
                            {inc.motivo && (
                                <div className="mb-2">
                                    <span className="font-bold text-gray-700 uppercase tracking-wide text-[10px]">Motivo:</span><br/>
                                    {inc.motivo}
                                </div>
                            )}
                            {inc.solucion && (
                                <div>
                                    <span className="font-bold text-emerald-600 uppercase tracking-wide text-[10px]">Solución:</span><br/>
                                    {inc.solucion}
                                </div>
                            )}
                            {!inc.motivo && !inc.solucion && <span className="italic text-gray-400">Sin detalles adicionales</span>}
                          </td>
                          <td className="p-4 align-top">
                            <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 shadow-sm">
                              <Clock className="w-3 h-3 mr-1" />
                              {inc.duracion_minutos} min
                            </span>
                          </td>
                          <td className="p-4 align-top text-right">
                             <div className="flex gap-2 justify-end">
                               {(currentUser.rol === 'admin' || currentUser.rol === 'tecnico') && (
                                 <button onClick={() => handleEditClick(inc)} className="p-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors" title="Editar Registro">
                                   <Pencil className="w-4 h-4" />
                                 </button>
                               )}
                               {currentUser.rol === 'admin' && (
                                 <button onClick={() => handleDelete(inc.id)} className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors" title="Eliminar Registro">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               )}
                             </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginador */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                        Mostrando página <span className="font-bold text-gray-900">{currentPage}</span> de <span className="font-bold text-gray-900">{totalPages}</span>
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={prevPage} 
                            disabled={currentPage === 1}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                                currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-violet-600'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1"/> Anterior
                        </button>
                        <button 
                            onClick={nextPage} 
                            disabled={currentPage === totalPages}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                                currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-violet-600'
                            }`}
                        >
                            Siguiente <ChevronRight className="w-4 h-4 ml-1"/>
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición de Incidente */}
      {editingIncidente && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Editar Incidente</h2>
              <button onClick={() => setEditingIncidente(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="editForm" onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Empresa */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Empresa / Red</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editFormData.empresa_id}
                    onChange={(e) => setEditFormData({...editFormData, empresa_id: e.target.value})}
                  >
                    <option value="">Seleccione...</option>
                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                  </select>
                </div>

                {/* Aplicación */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Aplicación</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editFormData.aplicacion_id}
                    onChange={(e) => setEditFormData({...editFormData, aplicacion_id: e.target.value})}
                  >
                    <option value="">Seleccione...</option>
                    {aplicaciones.filter(a => {
                        if (!editFormData.empresa_id) return true;
                        if (!a.empresas || a.empresas.length === 0) return true;
                        const appEmpIds = a.empresas.map(e => e.id);
                        return appEmpIds.includes(parseInt(editFormData.empresa_id));
                    }).map(app => (
                        <option key={app.id} value={app.id}>{app.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Categoría</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editFormData.categoria_id}
                    onChange={(e) => setEditFormData({...editFormData, categoria_id: e.target.value})}
                  >
                    <option value="">Seleccione...</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </select>
                </div>

                {/* Producto */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Producto</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editFormData.producto_id}
                    onChange={(e) => setEditFormData({...editFormData, producto_id: e.target.value})}
                  >
                    <option value="">Seleccione...</option>
                    {productos.filter(p => !editFormData.categoria_id || p.categoria_id === parseInt(editFormData.categoria_id)).map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Inactividad (Minutos)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 font-medium"
                    value={editFormData.duracion_minutos}
                    onChange={(e) => setEditFormData({...editFormData, duracion_minutos: e.target.value})}
                    required
                  />
                </div>

                {/* Ticket */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Ticket / Caso</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.ticket}
                    onChange={(e) => setEditFormData({...editFormData, ticket: e.target.value})}
                  />
                </div>

                {/* Motivo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Motivo / Falla</label>
                  <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={editFormData.motivo}
                    onChange={(e) => setEditFormData({...editFormData, motivo: e.target.value})}
                  />
                </div>

                {/* Solución */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Solución Aplicada</label>
                  <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    value={editFormData.solucion}
                    onChange={(e) => setEditFormData({...editFormData, solucion: e.target.value})}
                  />
                </div>

              </form>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setEditingIncidente(null)} 
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="editForm" 
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
              >
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
