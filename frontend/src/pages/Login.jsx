import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.login(username, password);
      // Guardar token y rol en localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('rol', data.rol);
      localStorage.setItem('username', data.username);
      if (data.empresa_id) {
          localStorage.setItem('empresa_id', data.empresa_id);
      }
      
      // Limpiar estados y redirigir
      setError('');
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas o problema de red.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-2">Bienvenido</h2>
          <p className="text-violet-100 text-sm font-medium">Sistema de Bitácora Integrada</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="pl-10 w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-800 transition-all bg-gray-50 focus:bg-white"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="pl-10 w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-800 transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white p-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 mt-2"
            >
              Iniciar Sesión
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
