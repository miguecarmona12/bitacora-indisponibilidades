import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Settings, LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react';
import { authService } from '../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  if ((!user.token && location.pathname === '/login') || user.must_change_password) return null;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'tecnico', 'cliente'] },
    { path: '/bitacora', name: 'Bitácora', icon: <Activity size={20} />, roles: ['admin', 'tecnico'] },
    { path: '/configuracion', name: 'Catálogos', icon: <Settings size={20} />, roles: ['admin'] },
    { path: '/usuarios', name: 'Usuarios', icon: <Users size={20} />, roles: ['admin'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(user.rol));

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full z-50 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src="/logo.png" alt="UX Logo" className="h-9 w-auto mr-3" />
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500">Bitácora GDO</span>
            </div>
            {/* CAMBIO: sm:flex -> lg:flex (Oculto en tablets) */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-8">
              {visibleItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'border-fuchsia-500 text-fuchsia-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-fuchsia-500'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* CAMBIO: sm:flex -> lg:flex (Oculto en tablets) */}
          <div className="hidden lg:flex items-center">
             <div className="flex flex-col items-end mr-4 border-r border-gray-100 pr-4">
                <span className="text-sm font-semibold text-gray-800">{user.username}</span>
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">
                    Rol: {user.rol}
                </span>
             </div>
             <button onClick={handleLogout} className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 transition">
                <LogOut size={18} className="mr-1" /> Salir
             </button>
          </div>

          {/* Botón menú tipo hamburguesa */}
          {/* CAMBIO: sm:hidden -> lg:hidden (Visible en tablets) */}
          <div className="flex items-center lg:hidden">
             <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-gray-500 hover:text-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-fuchsia-500 p-2 rounded-md transition-colors"
                aria-expanded={isOpen}
             >
                <span className="sr-only">Abrir menú principal</span>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
          </div>
        </div>
      </div>

      {/* Panel Móvil/Tablet Desplegable */}
      {/* CAMBIO: sm:hidden -> lg:hidden */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="pt-2 pb-3 space-y-1">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium border-l-4 ${
                  location.pathname === item.path
                    ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <span className="mr-3 text-gray-500">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-bold opacity-90">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.username}</div>
                <div className="text-sm font-medium text-violet-600 uppercase">Rol: {user.rol}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
              >
                <LogOut size={20} className="mr-3" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;