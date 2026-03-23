import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login(username, password);

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('rol', data.rol);
      localStorage.setItem('username', data.username);

      if (data.empresa_id) {
        localStorage.setItem('empresa_id', data.empresa_id);
      }

      setError('');
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas o problema de red.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">

      {/* 🔹 Panel izquierdo */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-12 overflow-hidden">

        {/* fondos decorativos */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-black/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-center text-white max-w-lg space-y-8">

          {/* Branding */}
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight">
              Bitácora
            </h1>
            <p className="text-violet-100 mt-2 text-lg">
              Plataforma inteligente de gestión operativa
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4">
            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20">
              <h3 className="font-semibold text-lg">Gestión de Incidentes</h3>
              <p className="text-sm text-violet-100">
                Control total en tiempo real
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20">
              <h3 className="font-semibold text-lg">Multiempresa</h3>
              <p className="text-sm text-violet-100">
                Administra múltiples organizaciones
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20">
              <h3 className="font-semibold text-lg">Seguridad</h3>
              <p className="text-sm text-violet-100">
                Acceso seguro con JWT
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-4">
            <div>
              <p className="text-3xl font-bold">99.9%</p>
              <p className="text-xs text-violet-200">Disponibilidad</p>
            </div>
            <div>
              <p className="text-3xl font-bold">+1K</p>
              <p className="text-xs text-violet-200">Incidentes</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-xs text-violet-200">Soporte</p>
            </div>
          </div>

        </div>
      </div>

      {/* 🔹 Login */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 transition-all">

          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              Bienvenido
            </h2>
            <p className="text-gray-500 text-sm">
              Ingresa tus credenciales
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            {/* Usuario */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Usuario
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="pl-10 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pl-10 pr-10 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white p-3 rounded-xl font-bold hover:bg-violet-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

          </form>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-6">
            © 2026 Bitácora App
          </p>

        </div>
      </div>

    </div>
  );
};

export default Login;