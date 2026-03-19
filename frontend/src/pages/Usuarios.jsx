import React, { useState, useEffect } from 'react';
import { bitacoraService, authService } from '../services/api';
import { Users, UserPlus, Shield, CheckCircle, XCircle, User } from 'lucide-react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rol: 'cliente',
    empresa_id: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const dataUsers = await authService.getUsuarios();
      const dataEmp = await bitacoraService.getEmpresas();
      setUsuarios(dataUsers);
      setEmpresas(dataEmp);
    } catch (error) {
      console.error("Error al cargar datos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const p = { ...formData };
      if (p.empresa_id === '') p.empresa_id = null;
      else p.empresa_id = parseInt(p.empresa_id);

      await authService.createUsuario(p);
      setFormData({ username: '', email: '', password: '', rol: 'cliente', empresa_id: '' });
      fetchData();
    } catch (error) {
      alert("Error al crear usuario. Revisa si el nombre ya existe.");
    }
  };

  const getEmpresaNombre = (id) => {
    if (!id) return '-';
    const e = empresas.find(em => em.id === id);
    return e ? e.nombre : 'Desconocida';
  };

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto mb-10 pb-10">
      <div className="flex items-center mb-8">
        <Users className="w-8 h-8 mr-3 text-violet-600" />
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center border-b pb-4">
              <UserPlus className="w-5 h-5 mr-2 text-violet-500"/> Nuevo Usuario
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                <input 
                  type="email" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input 
                  type="password" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Shield className="w-4 h-4 mr-1"/> Rol *
                </label>
                <select 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none bg-white font-medium"
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  required
                >
                  <option value="admin">Administrador (Acceso Total)</option>
                  <option value="tecnico">Técnico (Bitácora y Dashboard)</option>
                  <option value="cliente">Cliente (Solo Dashboard)</option>
                </select>
              </div>

              {(formData.rol === 'cliente' || formData.rol === 'tecnico') && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Asignar a Empresa (Opcional) </label>
                  <select 
                    className="w-full p-2 border border-orange-200 rounded text-sm outline-none bg-white"
                    value={formData.empresa_id}
                    onChange={(e) => setFormData({...formData, empresa_id: e.target.value})}
                  >
                    <option value="">Ninguna</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-orange-600 mt-1 leading-tight">Si es cliente, solo verá los incidentes de esta empresa en su dashboard.</p>
                </div>
              )}

              <button type="submit" className="w-full bg-violet-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-violet-700 shadow-md transition-all mt-4">
                Crear Usuario
              </button>
            </form>
          </div>
        </div>

        {/* Tabla Lista */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                 Usuarios Registrados
              </h2>
              <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full border border-gray-300">
                {usuarios.length} cuentas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 font-bold">Usuario</th>
                    <th className="p-4 font-bold">Rol</th>
                    <th className="p-4 font-bold">Empresa Asignada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-400 italic">Cargando...</td>
                    </tr>
                  ) : usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-400 italic">No hay usuarios registrados.</td>
                    </tr>
                  ) : (
                    usuarios.map(usr => (
                      <tr key={usr.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm">
                           <div className="font-bold text-gray-800">{usr.username}</div>
                           <div className="text-xs text-gray-500">{usr.email}</div>
                        </td>
                        <td className="p-4 align-middle">
                          <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded border shadow-sm ${
                            usr.rol === 'admin' ? 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' : 
                            usr.rol === 'tecnico' ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {usr.rol === 'admin' ? <Shield className="w-3 h-3 mr-1"/> : <User className="w-3 h-3 mr-1"/>}
                            {usr.rol.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-700">
                          {getEmpresaNombre(usr.empresa_id)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Usuarios;
