import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Settings, LayoutDashboard, Users, LogOut } from 'lucide-react';
import { authService } from '../services/api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  // Si no hay token en el navbar no renderizamos menús (estamos en login o fuera)
  if (!user.token && location.pathname === '/login') return null;

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
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
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
          
          <div className="flex items-center">
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
