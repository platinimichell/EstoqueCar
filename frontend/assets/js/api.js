// frontend/assets/js/api.js
// Camada de comunicação com a API REST do EstoqueCar

/*const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:80/api'
  : '/api';  */

const API_BASE = 'http://localhost:3000/api';

/**
 * Realiza uma requisição à API com token de autenticação.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('ec_token');

  const headers = { 
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = { ...options, headers };

  // Se for FormData (upload de imagem), remove Content-Type para o browser setar o boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
      // Tenta renovar o token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Tenta a requisição original novamente
        headers.Authorization = `Bearer ${localStorage.getItem('ec_token')}`;
        const retry = await fetch(`${API_BASE}${endpoint}`, config);
        return handleResponse(retry);
      } else {
        redirectToLogin();
        return;
      }
    }

    return handleResponse(response);
  } catch (error) {
    console.error('Erro de rede:', error);
    throw new Error('Falha na conexão com o servidor. Verifique sua internet.');
  }
}

export async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  // Resposta binária (PDF/XLS)
  if (contentType.includes('application/pdf') ||
      contentType.includes('application/vnd.openxmlformats')) {
    if (!response.ok) throw new Error('Erro ao gerar relatório.');
    return response.blob();
  }

  /*
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || `Erro ${response.status}`;
    throw new Error(message);
  }
    */
  
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('ERRO API:', data);

    const message =
      data.error ||
      data.message ||
      JSON.stringify(data) ||
      `Erro ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('ec_refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('ec_token', data.token);
    return true;
  } catch {
    return false;
  }
}

export function redirectToLogin() {
  localStorage.removeItem('ec_token');
  localStorage.removeItem('ec_refresh_token');
  localStorage.removeItem('ec_user');
  window.location.href = 'index.html';
}

// ─── API methods ───────────────────────────────────────────────────────────

export const api = {

  get: (endpoint) =>
    apiRequest(endpoint),

  post: (endpoint, data) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  put: (endpoint, data) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (endpoint) =>
    apiRequest(endpoint, {
      method: 'DELETE'
    }),

  postFormData: (endpoint, formData) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: formData
    }),

  putFormData: (endpoint, formData) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: formData
    }),



  // Auth
  login: (email, password) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),

  // Produtos
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/products${q ? '?' + q : ''}`);
  },
  getProduct: (id) => apiRequest(`/products/${id}`),
  createProduct: (formData) => apiRequest('/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => apiRequest(`/products/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),

  // Estoque
  getStockMovements: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/stock/movements${q ? '?' + q : ''}`);
  },
  stockEntry: (data) => apiRequest('/stock/entry', { method: 'POST', body: JSON.stringify(data) }),
  getLowStock: () => apiRequest('/stock/low'),

  // Pedidos
  getOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/orders${q ? '?' + q : ''}`);
  },
  getOrder: (id) => apiRequest(`/orders/${id}`),
  createOrder: (data) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) =>
    apiRequest(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  cancelOrder: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE' }),

  // Clientes
  getClients: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/clients${q ? '?' + q : ''}`);
  },
  createClient: (data) => apiRequest('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => apiRequest(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id) => apiRequest(`/clients/${id}`, { method: 'DELETE' }),

  // Usuários
  getUsers: () => apiRequest('/users'),
  createUser: (data) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),

  // Relatórios
  getStockReport: (format = 'json') => apiRequest(`/reports/stock?format=${format}`),
  getMovementsReport: (params) => apiRequest(`/reports/movements?${new URLSearchParams(params)}`),
  getOrdersReport: (params) => apiRequest(`/reports/orders?${new URLSearchParams(params)}`),
};

//export default api;
