import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Bitacora from './pages/Bitacora';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import ForceChangePassword from './pages/ForceChangePassword';
import { authService } from './services/api';

const PrivateRoute = ({ children, requireRole = null }) => {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Restricción de cambio de contraseña
  if (user.must_change_password && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />;
  }

  // Restricciones de Rol
  if (requireRole === 'admin' && user.rol !== 'admin') {
     return <Navigate to="/" replace />;
  }
  if (requireRole === 'tecnico' && user.rol === 'cliente') {
     return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
        <Navbar />
        <main className="flex-1 w-full relative">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/force-change-password" element={<PrivateRoute><ForceChangePassword /></PrivateRoute>} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/bitacora" element={<PrivateRoute requireRole="tecnico"><Bitacora /></PrivateRoute>} />
            <Route path="/configuracion" element={<PrivateRoute requireRole="admin"><Configuracion /></PrivateRoute>} />
            <Route path="/usuarios" element={<PrivateRoute requireRole="admin"><Usuarios /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
