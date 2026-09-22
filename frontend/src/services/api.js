const API_BASE_URL = 'http://127.0.0.1:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const fetchAPI = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  // If body is FormData, do NOT set Content-Type to application/json
  // The browser will automatically set it to multipart/form-data with the correct boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API Request Failed');
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const facultyService = {
  // Generic CRUD
  getAll: (resource) => fetchAPI(`/faculty/${resource}/`),
  create: (resource, data) => fetchAPI(`/faculty/${resource}/`, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  update: (resource, id, data) => fetchAPI(`/faculty/${resource}/${id}/`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  delete: (resource, id) => fetchAPI(`/faculty/${resource}/${id}/`, {
    method: 'DELETE',
  }),
  verify: (resource, id, status) => fetchAPI(`/faculty/${resource}/${id}/verify/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Advanced Academic & Automation Helpers
  fetchDOI: (doi) => fetchAPI('/faculty/fetch-doi/', {
    method: 'POST',
    body: JSON.stringify({ doi }),
  }),
  parseCertificateAI: (text) => fetchAPI('/faculty/ai/parse-certificate/', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),
  getNAACCriterion3: (dept) => fetchAPI(`/faculty/reports/naac-ssr-criterion3/${dept ? `?department=${dept}` : ''}`),
  getPBASScore: (year = '2025-26') => fetchAPI(`/faculty/pbas-score/?year=${year}`),
  getAuditLogs: () => fetchAPI('/faculty/audit-logs/'),
  getDepartmentComparison: () => fetchAPI('/faculty/department-comparison/'),
  getCollaborationNetwork: () => fetchAPI('/faculty/analytics/network/'),
  bulkImport: (type, count = 5) => fetchAPI('/faculty/bulk-import/', {
    method: 'POST',
    body: JSON.stringify({ type, count }),
  }),
  getHealth: () => fetchAPI('/health/'),
};

const api = {
  get: (endpoint, options) => fetchAPI(endpoint, options),
  post: (endpoint, data, options) => fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data), ...options }),
  put: (endpoint, data, options) => fetchAPI(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options }),
  delete: (endpoint, options) => fetchAPI(endpoint, { method: 'DELETE', ...options }),
};

export default api;

