import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Settings, LayoutDashboard, Users, LogOut, Menu, X, Sun, Moon, HelpCircle, Sliders, History } from 'lucide-react';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { theme, toggleTheme } = useTheme();
  
  if ((!user.token && location.pathname === '/login') || user.must_change_password) return null;

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'tecnico', 'cliente'] },
    { path: '/bitacora', name: 'Bitácora', icon: <Activity size={20} />, roles: ['admin', 'tecnico'] },
    { path: '/configuracion', name: 'Catálogos', icon: <Settings size={20} />, roles: ['admin'] },
    { path: '/usuarios', name: 'Usuarios', icon: <Users size={20} />, roles: ['admin'] },
    { path: '/ajustes', name: 'Ajustes', icon: <Sliders size={20} />, roles: ['admin'] },
    { path: '/auditoria', name: 'Auditoría', icon: <History size={20} />, roles: ['admin'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(user.rol));

  return (
    <nav className="fixed w-full z-50 top-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src="/logo.png" alt="UX Logo" className="h-9 w-auto mr-3" />
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500">Bitácora GDO</span>
            </div>
            <div className="hidden lg:ml-8 lg:flex lg:space-x-8">
              {visibleItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'border-fuchsia-500 text-fuchsia-600'
                      : 'border-transparent hover:border-gray-300 hover:text-fuchsia-500'
                  }`}
                  style={{ color: location.pathname === item.path ? '' : 'var(--text-2)' }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3">
              <button onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-2)' }} title="Ayuda">
                <HelpCircle size={18} />
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-2)' }} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
             <div className="flex flex-col items-end mr-4 border-r pr-4" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{user.username}</span>
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
      {isOpen && (
        <div className="lg:hidden" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="pt-2 pb-3 space-y-1">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium border-l-4 ${
                  location.pathname === item.path
                    ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700'
                    : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                }`}
                style={{ color: location.pathname === item.path ? '' : 'var(--text-2)' }}
              >
                <span className="mr-3" style={{ color: 'var(--text-3)' }}>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center px-4">
              <button onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))} className="mr-1 p-2 rounded-lg transition-colors" style={{ color: 'var(--text-2)' }} title="Ayuda">
                <HelpCircle size={18} />
              </button>
              <button onClick={toggleTheme} className="mr-3 p-2 rounded-lg transition-colors" style={{ color: 'var(--text-2)' }} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-bold opacity-90">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium" style={{ color: 'var(--text-1)' }}>{user.username}</div>
                <div className="text-sm font-medium text-violet-600 uppercase">Rol: {user.rol}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium rounded-md"
                style={{ color: '#ef4444' }}
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