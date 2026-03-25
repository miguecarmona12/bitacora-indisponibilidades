import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
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

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    localStorage.removeItem('empresa_id');
  },

  getCurrentUser: () => {
    return {
      token: localStorage.getItem('token'),
      rol: localStorage.getItem('rol'),
      username: localStorage.getItem('username'),
      empresa_id: localStorage.getItem('empresa_id'),
    };
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
};

export default api;