const API_BASE = import.meta.env.VITE_API_URL || '';

interface ApiOptions {
  method?: string;
  body?: unknown;
}

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api<{ success: boolean; user: { id: string; email: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  logout: () => api<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => api<{ user: { id: string; email: string } }>('/api/auth/me'),
};

// Admin
export interface Stats {
  guests: { total: number; optedIn: number; optedOut: number };
  messages: { total: number; inbound: number; outbound: number };
  broadcasts: { total: number; completed: number };
  lastActivity: string | null;
}

export interface Guest {
  id: string;
  phone_number: string;
  name: string | null;
  opted_in: boolean;
  first_seen_at: string;
  last_inbound_at: string | null;
  tags: string[];
  created_at: string;
}

export interface Broadcast {
  id: string;
  topic: string;
  message: string;
  template_name: string | null;
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed';
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const adminApi = {
  getStats: () => api<Stats>('/api/admin/stats'),

  getGuests: (params: { page?: number; limit?: number; search?: string; opted_in?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.opted_in !== undefined) searchParams.set('opted_in', String(params.opted_in));
    return api<{ guests: Guest[]; pagination: Pagination }>(`/api/admin/guests?${searchParams}`);
  },

  exportGuests: () => `${API_BASE}/api/admin/guests/export`,

  getBroadcasts: (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api<{ broadcasts: Broadcast[]; pagination: Pagination }>(`/api/admin/broadcasts?${searchParams}`);
  },

  getBroadcast: (id: string) => api<{ broadcast: Broadcast }>(`/api/admin/broadcasts/${id}`),

  createBroadcast: (data: { topic: string; message: string }) =>
    api<{ broadcast: Broadcast }>('/api/admin/broadcasts', { method: 'POST', body: data }),

  updateBroadcast: (id: string, data: { topic?: string; message?: string }) =>
    api<{ broadcast: Broadcast }>(`/api/admin/broadcasts/${id}`, { method: 'PATCH', body: data }),

  deleteBroadcast: (id: string) =>
    api<{ success: boolean }>(`/api/admin/broadcasts/${id}`, { method: 'DELETE' }),

  sendBroadcast: (id: string) =>
    api<{ success: boolean; result: { total: number; sent: number; failed: number } }>(
      `/api/admin/broadcasts/${id}/send`,
      { method: 'POST' }
    ),
};
