import axios from 'axios';

// Runtime-config support: prefer window.__APP_CONFIG__.VITE_API_URL, then build-time VITE, then localhost
const runtimeApiUrl = (typeof window !== 'undefined' && window.__APP_CONFIG__ && window.__APP_CONFIG__.VITE_API_URL)
  || import.meta.env.VITE_API_URL
  || 'http://localhost:8000';

const api = axios.create({
  baseURL: runtimeApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas con error (como 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token es inválido o expiró, cerramos sesión localmente y redirigimos a login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('username');
        localStorage.removeItem('empresa_id');
        localStorage.removeItem('must_change_password');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  changePassword: async (usuario, password) => {
    const response = await api.put(`/usuarios/${usuario.id}`, {
      ...usuario,
      password: password,
    });
    return response.data;
  },

  logout: async () => {
    try {
      if (localStorage.getItem('token')) {
        await api.post('/logout');
      }
    } catch (error) {
      console.error('Error al notificar cierre de sesión al servidor:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      localStorage.removeItem('username');
      localStorage.removeItem('empresa_id');
      localStorage.removeItem('must_change_password');
    }
  },

  getCurrentUser: () => {
    return {
      token: localStorage.getItem('token'),
      rol: localStorage.getItem('rol'),
      username: localStorage.getItem('username'),
      empresa_id: localStorage.getItem('empresa_id'),
      must_change_password: localStorage.getItem('must_change_password') === 'true',
    };
  },

  changePasswordFirstLogin: async (username, oldPassword, newPassword) => {
    const response = await api.post('/usuarios/change-password-first', {
      username: username,
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  },

  getUsuarios: async () => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  createUsuario: async (data) => {
    const response = await api.post('/usuarios', data);
    return response.data;
  },

  updateUsuario: async (id, data) => {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  deleteUsuario: async (id) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },
};

export const bitacoraService = {
  // Empresas / Proveedores
  getEmpresas: async () => {
    const response = await api.get('/empresas');
    return response.data;
  },
  createEmpresa: async (data) => {
    const response = await api.post('/empresas', data);
    return response.data;
  },
  updateEmpresa: async (id, data) => {
    const response = await api.put(`/empresas/${id}`, data);
    return response.data;
  },

  // Aplicaciones
  getAplicaciones: async () => {
    const response = await api.get('/aplicaciones');
    return response.data;
  },
  createAplicacion: async (data) => {
    const response = await api.post('/aplicaciones', data);
    return response.data;
  },
  updateAplicacion: async (id, data) => {
    const response = await api.put(`/aplicaciones/${id}`, data);
    return response.data;
  },

  // Categorías
  getCategorias: async () => {
    const response = await api.get('/categorias');
    return response.data;
  },
  createCategoria: async (data) => {
    const response = await api.post('/categorias', data);
    return response.data;
  },
  updateCategoria: async (id, data) => {
    const response = await api.put(`/categorias/${id}`, data);
    return response.data;
  },

  // Productos
  getProductos: async () => {
    const response = await api.get('/productos');
    return response.data;
  },
  createProducto: async (data) => {
    const response = await api.post('/productos', data);
    return response.data;
  },
  updateProducto: async (id, data) => {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },

  // Incidentes (Bitácora)
  getIncidentes: async (mes = null) => {
    const url = mes ? `/incidentes?mes=${encodeURIComponent(mes)}` : '/incidentes';
    const response = await api.get(url);
    return response.data;
  },
  createIncidente: async (data) => {
    const response = await api.post('/incidentes', data);
    return response.data;
  },
  createIncidentesBulk: async (dataList) => {
    const response = await api.post('/incidentes/bulk', dataList);
    return response.data;
  },
  updateIncidente: async (id, data) => {
    const response = await api.put(`/incidentes/${id}`, data);
    return response.data;
  },
  deleteIncidente: async (id) => {
    const response = await api.delete(`/incidentes/${id}`);
    return response.data;
  },
  
  // AI Agent services
  enviarChatIA: async (messages) => {
    const response = await api.post('/api/ai/chat', { messages });
    return response.data;
  },
  analizarConIA: async (prompt) => {
    const response = await api.post('/api/ai/analizar', { prompt });
    return response.data;
  },
  registrarConIA: async (datosIncidente) => {
    const response = await api.post('/api/ai/registrar', datosIncidente);
    return response.data;
  },
};

export default api;
