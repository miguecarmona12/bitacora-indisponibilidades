import React, { useState, useEffect } from 'react';
import { bitacoraService } from '../services/api';
import { PlusCircle, Building2, Server, AppWindow, FolderTree, Pencil, X } from 'lucide-react';

const Configuracion = () => {
  const [empresas, setEmpresas] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  
  const [nuevaEmpresa, setNuevaEmpresa] = useState('');
  const [nuevaAplicacion, setNuevaAplicacion] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevoProducto, setNuevoProducto] = useState('');
  const [productoCategoria, setProductoCategoria] = useState('');
  const [aplicacionEmpresas, setAplicacionEmpresas] = useState([]);

  // Edición
  const [editItem, setEditItem] = useState(null); // { type: 'empresa' | 'categoria' | 'aplicacion' | 'producto', id }
  const [editFormData, setEditFormData] = useState({});

  const fetchData = async () => {
    try {
      const e = await bitacoraService.getEmpresas();
      const a = await bitacoraService.getAplicaciones();
      const c = await bitacoraService.getCategorias();
      const p = await bitacoraService.getProductos();
      setEmpresas(e);
      setAplicaciones(a);
      setCategorias(c);
      setProductos(p);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    if (!nuevaEmpresa) return;
    try {
      await bitacoraService.createEmpresa({ nombre: nuevaEmpresa });
      setNuevaEmpresa('');
      fetchData();
    } catch (error) {
      alert("Error creando empresa. Puede que ya exista.");
    }
  };

  const handleCrearAplicacion = async (e) => {
    e.preventDefault();
    if (!nuevaAplicacion) return;
    try {
      await bitacoraService.createAplicacion({ 
          nombre: nuevaAplicacion,
          empresa_ids: aplicacionEmpresas.map(id => parseInt(id))
      });
      setNuevaAplicacion('');
      setAplicacionEmpresas([]);
      fetchData();
    } catch (error) {
      alert("Error creando aplicación. Puede que ya exista.");
    }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria) return;
    try {
      await bitacoraService.createCategoria({ nombre: nuevaCategoria });
      setNuevaCategoria('');
      fetchData();
    } catch (error) {
      alert("Error creando categoría. Puede que ya exista.");
    }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProducto || !productoCategoria) {
        alert("Debes ingresar el nombre del producto y seleccionar una categoría.");
        return;
    }
    try {
      await bitacoraService.createProducto({ 
          nombre: nuevoProducto, 
          categoria_id: parseInt(productoCategoria)
      });
      setNuevoProducto('');
      setProductoCategoria('');
      fetchData();
    } catch (error) {
      alert("Error creando producto. Puede que ya exista.");
    }
  };

  const handleEditClick = (type, item) => {
    setEditItem({ type, id: item.id });
    if (type === 'empresa' || type === 'categoria') {
        setEditFormData({ nombre: item.nombre });
    } else if (type === 'aplicacion') {
        setEditFormData({ 
            nombre: item.nombre, 
            empresa_ids: item.empresas ? item.empresas.map(e => e.id.toString()) : [] 
        });
    } else if (type === 'producto') {
        setEditFormData({ nombre: item.nombre, categoria_id: item.categoria_id || '' });
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editFormData.nombre) return;
    try {
        if (editItem.type === 'empresa') {
            await bitacoraService.updateEmpresa(editItem.id, { nombre: editFormData.nombre });
        } else if (editItem.type === 'categoria') {
            await bitacoraService.updateCategoria(editItem.id, { nombre: editFormData.nombre });
        } else if (editItem.type === 'aplicacion') {
            await bitacoraService.updateAplicacion(editItem.id, { 
                nombre: editFormData.nombre,
                empresa_ids: editFormData.empresa_ids.map(id => parseInt(id))
            });
        } else if (editItem.type === 'producto') {
            await bitacoraService.updateProducto(editItem.id, { 
                nombre: editFormData.nombre,
                categoria_id: parseInt(editFormData.categoria_id)
            });
        }
        setEditItem(null);
        fetchData();
    } catch (error) {
        alert("Error al actualizar. Verifique que el nombre no esté repetido.");
    }
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto mb-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Administración de Catálogos Independientes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        
        {/* Panel Empresas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <Building2 className="w-6 h-6 text-violet-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">1. Empresas</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 block">Ej: Gana, Claro, EPM</p>

          <form onSubmit={handleCrearEmpresa} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Nueva empresa..."
              className="flex-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-black bg-white"
              value={nuevaEmpresa}
              onChange={(e) => setNuevaEmpresa(e.target.value)}
            />
            <button type="submit" className="bg-violet-600 text-white px-3 py-2 rounded-lg hover:bg-violet-700 font-medium">
              <PlusCircle size={20} />
            </button>
          </form>

          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden h-64 overflow-y-auto">
            {empresas.map(emp => (
              <li key={emp.id} className="p-3 bg-gray-50 text-gray-700 text-sm font-medium flex justify-between items-center group">
                <span className="truncate">{emp.nombre}</span>
                <button onClick={() => handleEditClick('empresa', emp)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-50 rounded">
                  <Pencil size={14} />
                </button>
              </li>
            ))}
            {empresas.length === 0 && <li className="p-3 text-gray-400 italic text-center text-sm">Sin empresas</li>}
          </ul>
        </div>

        {/* Panel Aplicaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <AppWindow className="w-6 h-6 text-fuchsia-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">2. Aplicaciones</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 block">Ej: Jade, Invictus, Webs</p>

          <form onSubmit={handleCrearAplicacion} className="flex flex-col gap-2 mb-6">
            <div className="border border-gray-300 rounded-lg bg-white overflow-hidden max-h-32 overflow-y-auto">
                {empresas.map(emp => (
                    <label key={emp.id} className="flex items-center p-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer text-sm text-gray-700">
                        <input 
                            type="checkbox" 
                            className="mr-2 text-fuchsia-600 focus:ring-fuchsia-500 rounded"
                            checked={aplicacionEmpresas.includes(emp.id.toString())}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setAplicacionEmpresas([...aplicacionEmpresas, emp.id.toString()]);
                                } else {
                                    setAplicacionEmpresas(aplicacionEmpresas.filter(id => id !== emp.id.toString()));
                                }
                            }}
                        />
                        {emp.nombre}
                    </label>
                ))}
                {empresas.length === 0 && <div className="p-2 text-xs text-gray-400">Sin empresas disponibles</div>}
            </div>
            <div className="flex gap-2">
                <input
                type="text"
                placeholder="Nueva aplicación..."
                className="flex-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none text-black bg-white"
                value={nuevaAplicacion}
                onChange={(e) => setNuevaAplicacion(e.target.value)}
                />
                <button type="submit" className="bg-fuchsia-600 text-white px-3 py-2 rounded-lg hover:bg-fuchsia-700 font-medium">
                <PlusCircle size={20} />
                </button>
            </div>
          </form>

          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden h-64 overflow-y-auto">
            {aplicaciones.map(app => {
              return (
                <li key={app.id} className="p-3 bg-gray-50 text-gray-700 text-sm font-medium flex justify-between items-center group">
                    <span className="truncate mr-2 pointer-events-none">{app.nombre}</span>
                    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                        {app.empresas && app.empresas.length > 0 ? (
                            app.empresas.map(e => (
                                <span key={e.id} className="text-[10px] text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">{e.nombre}</span>
                            ))
                        ) : (
                            <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full border border-gray-300">Global</span>
                        )}
                        <button onClick={() => handleEditClick('aplicacion', app)} className="ml-1 text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-50 rounded">
                          <Pencil size={14} />
                        </button>
                    </div>
                </li>
            )})}
            {aplicaciones.length === 0 && <li className="p-3 text-gray-400 italic text-center text-sm">Sin apps</li>}
          </ul>
        </div>

        {/* Panel Categorías */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <FolderTree className="w-6 h-6 text-pink-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">3. Categorías</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 block">Ej: Apuestas, Recargas, Recaudos</p>

          <form onSubmit={handleCrearCategoria} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Nueva categoría..."
              className="flex-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-black bg-white"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
            />
            <button type="submit" className="bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600 font-medium">
              <PlusCircle size={20} />
            </button>
          </form>

          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden h-64 overflow-y-auto">
            {categorias.map(cat => (
              <li key={cat.id} className="p-3 bg-gray-50 text-gray-700 text-sm font-medium flex justify-between items-center group">
                <span className="truncate">{cat.nombre}</span>
                <button onClick={() => handleEditClick('categoria', cat)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-50 rounded">
                  <Pencil size={14} />
                </button>
              </li>
            ))}
            {categorias.length === 0 && <li className="p-3 text-gray-400 italic text-center text-sm">Sin categorías</li>}
          </ul>
        </div>

        {/* Panel Productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <Server className="w-6 h-6 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">4. Productos</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 block">Asignados a una Categoría</p>

          <form onSubmit={handleCrearProducto} className="flex flex-col gap-2 mb-6">
            <select 
                className="w-full pl-2 p-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                value={productoCategoria}
                onChange={(e) => setProductoCategoria(e.target.value)}
                disabled={categorias.length === 0}
            >
                <option value="">-- Asigna a Categoría --</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>
            <div className="flex gap-2">
                <input
                type="text"
                placeholder="Nuevo producto..."
                className="flex-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-black bg-white disabled:bg-gray-100"
                value={nuevoProducto}
                onChange={(e) => setNuevoProducto(e.target.value)}
                disabled={categorias.length === 0}
                />
                <button type="submit" className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={categorias.length === 0}>
                <PlusCircle size={20} />
                </button>
            </div>
          </form>

          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden h-64 overflow-y-auto">
            {productos.map(prod => {
              const catName = categorias.find(c => c.id === prod.categoria_id)?.nombre || "Sin Cat.";
              return (
                <li key={prod.id} className="p-3 bg-gray-50 text-gray-700 text-sm font-medium flex justify-between items-center group">
                    <span className="truncate mr-2 pointer-events-none">{prod.nombre}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200">{catName}</span>
                        <button onClick={() => handleEditClick('producto', prod)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-50 rounded">
                          <Pencil size={14} />
                        </button>
                    </div>
                </li>
            )})}
            {productos.length === 0 && <li className="p-3 text-gray-400 italic text-center text-sm">Sin productos</li>}
          </ul>
        </div>

      </div>

      {/* Modal de Edición de Catálogo */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 capitalize">Editar {editItem.type}</h2>
              <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateItem}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
                        <input
                            type="text"
                            required
                           className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none !bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                            value={editFormData.nombre}
                            onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})}
                        />
                    </div>
                    
                    {editItem.type === 'aplicacion' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Asignar a Redes (Desmarcar todo para Global)</label>
                        <div className="border border-gray-300 rounded-lg bg-white overflow-hidden max-h-40 overflow-y-auto">
                            {empresas.map(emp => (
                                <label key={emp.id} className="flex items-center p-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer text-sm text-gray-700">
                                    <input 
                                        type="checkbox" 
                                        className="mr-2 text-blue-600 focus:ring-blue-500 rounded"
                                        checked={(editFormData.empresa_ids || []).includes(emp.id.toString())}
                                        onChange={(e) => {
                                            const currentIds = editFormData.empresa_ids || [];
                                            if (e.target.checked) {
                                                setEditFormData({...editFormData, empresa_ids: [...currentIds, emp.id.toString()]});
                                            } else {
                                                setEditFormData({...editFormData, empresa_ids: currentIds.filter(id => id !== emp.id.toString())});
                                            }
                                        }}
                                    />
                                    {emp.nombre}
                                </label>
                            ))}
                        </div>
                    </div>
                    )}

                    {editItem.type === 'producto' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Asignar a Categoría</label>
                        <select 
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editFormData.categoria_id}
                            onChange={(e) => setEditFormData({...editFormData, categoria_id: e.target.value})}
                            required
                        >
                            <option value="">-- Seleccionar --</option>
                            {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                        </select>
                    </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={() => setEditItem(null)} 
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
                    >
                        Actualizar
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
