const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('preppulse_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.details && data.details.join(', ')) || `Request failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  demoLogin: () => request('/auth/demo-login', {
    method: 'POST'
  }),
  getMe: () => request('/auth/me'),

  // Interviews
  setupInterview: (payload) => request('/interviews/setup', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getInterview: (id) => request(`/interviews/${id}`),
  saveAnswer: (interviewId, payload) => request(`/interviews/${interviewId}/answer`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  evaluateInterview: (interviewId, payload) => request(`/interviews/${interviewId}/evaluate`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getHistory: () => request('/interviews/history'),
  getAnalytics: () => request('/interviews/analytics')
};
