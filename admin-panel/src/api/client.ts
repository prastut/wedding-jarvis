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
  guests: {
    total: number;
    optedIn: number;
    optedOut: number;
    onboarded: number;
    onboardedPercent: number;
  };
  rsvp: {
    attending: number;
    notAttending: number;
    pending: number;
    totalHeadcount: number;
  };
  bySide: {
    groom: number;
    bride: number;
    notOnboarded: number;
  };
  byLanguage: {
    english: number;
    hindi: number;
    punjabi: number;
    notSet: number;
  };
  messages: { total: number; inbound: number; outbound: number };
  broadcasts: { total: number; completed: number };
  lastActivity: string | null;
}

export type UserLanguage = 'EN' | 'HI' | 'PA';
export type UserSide = 'GROOM' | 'BRIDE';
export type RsvpStatus = 'YES' | 'NO';

export interface Guest {
  id: string;
  phone_number: string;
  name: string | null;
  opted_in: boolean;
  first_seen_at: string;
  last_inbound_at: string | null;
  tags: string[];
  user_language: UserLanguage | null;
  user_side: UserSide | null;
  rsvp_status: RsvpStatus | null;
  rsvp_guest_count: number | null;
  created_at: string;
}

export interface Broadcast {
  id: string;
  message: string;
  message_hi: string | null;
  message_pa: string | null;
  template_name: string | null;
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed';
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export interface BroadcastFormData {
  message: string;
  message_hi?: string;
  message_pa?: string;
}

export interface BroadcastProgress {
  type: 'start' | 'progress' | 'complete' | 'error';
  total?: number;
  current?: number;
  sent?: number;
  failed?: number;
  guest?: { name: string; phone: string };
  status?: 'sent' | 'failed';
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GuestFilters {
  page?: number;
  limit?: number;
  search?: string;
  opted_in?: boolean;
  language?: UserLanguage | 'not_set';
  side?: UserSide | 'not_set';
  rsvp?: 'YES' | 'NO' | 'pending';
}

// Content Management Types
export type ContentSide = 'GROOM' | 'BRIDE' | 'BOTH';

export interface Event {
  id: string;
  name: string;
  name_hi: string | null;
  name_pa: string | null;
  description: string | null;
  start_time: string;
  venue_id: string | null;
  dress_code: string | null;
  dress_code_hi: string | null;
  dress_code_pa: string | null;
  side: ContentSide;
  sort_order: number;
  created_at: string;
  updated_at: string;
  venues?: { id: string; name: string } | null;
}

export interface EventFormData {
  name: string;
  name_hi?: string;
  name_pa?: string;
  description?: string;
  start_time: string;
  venue_id?: string;
  dress_code?: string;
  dress_code_hi?: string;
  dress_code_pa?: string;
  side: ContentSide;
  sort_order?: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  address_hi: string | null;
  address_pa: string | null;
  google_maps_link: string | null;
  parking_info: string | null;
  parking_info_hi: string | null;
  parking_info_pa: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueFormData {
  name: string;
  address: string;
  address_hi?: string;
  address_pa?: string;
  google_maps_link?: string;
  parking_info?: string;
  parking_info_hi?: string;
  parking_info_pa?: string;
}

export interface FAQ {
  id: string;
  question: string;
  question_hi: string | null;
  question_pa: string | null;
  answer: string;
  answer_hi: string | null;
  answer_pa: string | null;
  category: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FAQFormData {
  question: string;
  question_hi?: string;
  question_pa?: string;
  answer: string;
  answer_hi?: string;
  answer_pa?: string;
  category?: string;
  sort_order?: number;
}

export interface Contact {
  id: string;
  name: string;
  phone_number: string;
  role: string | null;
  side: ContentSide;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  name: string;
  phone_number: string;
  role?: string;
  side: ContentSide;
  is_primary?: boolean;
}

// Registry Types
export interface RegistryItem {
  id: string;
  name: string;
  name_hi: string | null;
  name_pa: string | null;
  description: string | null;
  description_hi: string | null;
  description_pa: string | null;
  price: number | null;
  show_price: boolean;
  image_url: string | null;
  external_link: string | null;
  sort_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistryClaim {
  id: string;
  item_id: string;
  guest_id: string;
  claimed_at: string;
}

export interface ClaimWithGuest extends RegistryClaim {
  guest: {
    id: string;
    name: string | null;
    phone_number: string;
  };
  item: {
    id: string;
    name: string;
  };
}

export interface RegistryItemFormData {
  name: string;
  name_hi?: string;
  name_pa?: string;
  description?: string;
  description_hi?: string;
  description_pa?: string;
  price?: number | null;
  show_price?: boolean;
  image_url?: string;
  external_link?: string;
  sort_order?: number;
  is_available?: boolean;
}

// Message types
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageLog {
  id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  message_text: string;
  raw_payload: Record<string, unknown> | null;
  wamid: string | null;
  status: MessageStatus;
  created_at: string;
}

export interface MessageWithGuest extends MessageLog {
  guest: {
    id: string;
    name: string | null;
    user_language: UserLanguage | null;
    user_side: UserSide | null;
  } | null;
}

export interface ChatHistoryResponse {
  guest: Guest | null;
  messages: MessageLog[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const adminApi = {
  getStats: () => api<Stats>('/api/admin/stats'),

  getGuests: (params: GuestFilters) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.opted_in !== undefined) searchParams.set('opted_in', String(params.opted_in));
    if (params.language) searchParams.set('language', params.language);
    if (params.side) searchParams.set('side', params.side);
    if (params.rsvp) searchParams.set('rsvp', params.rsvp);
    return api<{ guests: Guest[]; pagination: Pagination }>(`/api/admin/guests?${searchParams}`);
  },

  exportGuests: (filters?: Omit<GuestFilters, 'page' | 'limit'>) => {
    const searchParams = new URLSearchParams();
    if (filters?.opted_in !== undefined) searchParams.set('opted_in', String(filters.opted_in));
    if (filters?.language) searchParams.set('language', filters.language);
    if (filters?.side) searchParams.set('side', filters.side);
    if (filters?.rsvp) searchParams.set('rsvp', filters.rsvp);
    const queryString = searchParams.toString();
    return `${API_BASE}/api/admin/guests/export${queryString ? `?${queryString}` : ''}`;
  },

  getBroadcasts: (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return api<{ broadcasts: Broadcast[]; pagination: Pagination }>(
      `/api/admin/broadcasts?${searchParams}`
    );
  },

  getBroadcast: (id: string) => api<{ broadcast: Broadcast }>(`/api/admin/broadcasts/${id}`),

  createBroadcast: (data: BroadcastFormData) =>
    api<{ broadcast: Broadcast }>('/api/admin/broadcasts', { method: 'POST', body: data }),

  updateBroadcast: (id: string, data: Partial<BroadcastFormData>) =>
    api<{ broadcast: Broadcast }>(`/api/admin/broadcasts/${id}`, { method: 'PATCH', body: data }),

  deleteBroadcast: (id: string) =>
    api<{ success: boolean }>(`/api/admin/broadcasts/${id}`, { method: 'DELETE' }),

  sendBroadcast: (id: string) =>
    api<{ success: boolean; result: { total: number; sent: number; failed: number } }>(
      `/api/admin/broadcasts/${id}/send`,
      { method: 'POST' }
    ),

  sendBroadcastStream: async (
    id: string,
    options: {
      includePhones?: string[];
      excludePhones?: string[];
      onProgress: (progress: BroadcastProgress) => void;
      onComplete: () => void;
      onError: (error: string) => void;
    }
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/broadcasts/${id}/send-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          includePhones: options.includePhones,
          excludePhones: options.excludePhones,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        options.onError(error.error || 'Request failed');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        options.onError('Streaming not supported');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              options.onComplete();
              return;
            }
            try {
              const progress = JSON.parse(data) as BroadcastProgress;
              if (progress.type === 'error') {
                options.onError(progress.error || 'Unknown error');
                return;
              }
              options.onProgress(progress);
            } catch {
              console.error('Failed to parse:', data);
            }
          }
        }
      }

      options.onComplete();
    } catch (err) {
      options.onError(err instanceof Error ? err.message : 'Connection failed');
    }
  },

  // Events
  getEvents: () => api<{ events: Event[] }>('/api/admin/events'),

  getEvent: (id: string) => api<{ event: Event }>(`/api/admin/events/${id}`),

  createEvent: (data: EventFormData) =>
    api<{ event: Event }>('/api/admin/events', { method: 'POST', body: data }),

  updateEvent: (id: string, data: Partial<EventFormData>) =>
    api<{ event: Event }>(`/api/admin/events/${id}`, { method: 'PATCH', body: data }),

  deleteEvent: (id: string) =>
    api<{ success: boolean }>(`/api/admin/events/${id}`, { method: 'DELETE' }),

  // Venues
  getVenues: () => api<{ venues: Venue[] }>('/api/admin/venues'),

  getVenue: (id: string) => api<{ venue: Venue }>(`/api/admin/venues/${id}`),

  createVenue: (data: VenueFormData) =>
    api<{ venue: Venue }>('/api/admin/venues', { method: 'POST', body: data }),

  updateVenue: (id: string, data: Partial<VenueFormData>) =>
    api<{ venue: Venue }>(`/api/admin/venues/${id}`, { method: 'PATCH', body: data }),

  deleteVenue: (id: string) =>
    api<{ success: boolean }>(`/api/admin/venues/${id}`, { method: 'DELETE' }),

  // FAQs
  getFaqs: () => api<{ faqs: FAQ[] }>('/api/admin/faqs'),

  getFaq: (id: string) => api<{ faq: FAQ }>(`/api/admin/faqs/${id}`),

  createFaq: (data: FAQFormData) =>
    api<{ faq: FAQ }>('/api/admin/faqs', { method: 'POST', body: data }),

  updateFaq: (id: string, data: Partial<FAQFormData>) =>
    api<{ faq: FAQ }>(`/api/admin/faqs/${id}`, { method: 'PATCH', body: data }),

  deleteFaq: (id: string) => api<{ success: boolean }>(`/api/admin/faqs/${id}`, { method: 'DELETE' }),

  // Contacts
  getContacts: () => api<{ contacts: Contact[] }>('/api/admin/contacts'),

  getContact: (id: string) => api<{ contact: Contact }>(`/api/admin/contacts/${id}`),

  createContact: (data: ContactFormData) =>
    api<{ contact: Contact }>('/api/admin/contacts', { method: 'POST', body: data }),

  updateContact: (id: string, data: Partial<ContactFormData>) =>
    api<{ contact: Contact }>(`/api/admin/contacts/${id}`, { method: 'PATCH', body: data }),

  deleteContact: (id: string) =>
    api<{ success: boolean }>(`/api/admin/contacts/${id}`, { method: 'DELETE' }),

  // Messages
  getRecentMessages: (params: { direction?: 'inbound' | 'outbound'; since?: string; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.direction) searchParams.set('direction', params.direction);
    if (params.since) searchParams.set('since', params.since);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ messages: MessageWithGuest[]; total: number }>(
      `/api/admin/messages/recent${query ? `?${query}` : ''}`
    );
  },

  getChatHistory: (phone: string, params: { limit?: number; offset?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return api<ChatHistoryResponse>(`/api/admin/messages/${encodeURIComponent(phone)}${query ? `?${query}` : ''}`);
  },

  // Registry Items
  getRegistryItems: () => api<{ items: RegistryItem[] }>('/api/admin/registry/items'),

  getRegistryItem: (id: string) => api<{ item: RegistryItem }>(`/api/admin/registry/items/${id}`),

  createRegistryItem: (data: RegistryItemFormData) =>
    api<{ item: RegistryItem }>('/api/admin/registry/items', { method: 'POST', body: data }),

  updateRegistryItem: (id: string, data: Partial<RegistryItemFormData>) =>
    api<{ item: RegistryItem }>(`/api/admin/registry/items/${id}`, { method: 'PATCH', body: data }),

  deleteRegistryItem: (id: string) =>
    api<{ success: boolean }>(`/api/admin/registry/items/${id}`, { method: 'DELETE' }),

  reorderRegistryItems: (orderedIds: string[]) =>
    api<{ success: boolean }>('/api/admin/registry/items/reorder', {
      method: 'POST',
      body: { orderedIds },
    }),

  importRegistryItems: (csv: string) =>
    api<{ imported: number; items: RegistryItem[] }>('/api/admin/registry/items/import', {
      method: 'POST',
      body: { csv },
    }),

  // Registry Claims
  getRegistryClaims: () => api<{ claims: ClaimWithGuest[] }>('/api/admin/registry/claims'),

  releaseClaim: (claimId: string) =>
    api<{ success: boolean }>(`/api/admin/registry/claims/${claimId}`, { method: 'DELETE' }),
};

// Guest-facing Registry Types
export interface GuestRegistryItem {
  id: string;
  name: string;
  name_hi: string | null;
  name_pa: string | null;
  description: string | null;
  description_hi: string | null;
  description_pa: string | null;
  price: number | null;
  show_price: boolean;
  image_url: string | null;
  external_link: string | null;
  is_claimed: boolean;
  claimed_by_me: boolean;
}

export interface GuestInfo {
  id: string;
  name: string | null;
  language: 'EN' | 'HI' | 'PA';
}

export interface RegistrySettings {
  isOpen: boolean;
  upiAddress: string | null;
}

// Guest-facing Registry API (no auth required)
export const guestApi = {
  getRegistryItems: (phone: string) =>
    api<{ items: GuestRegistryItem[]; guest: GuestInfo }>(
      `/api/registry/items?phone=${encodeURIComponent(phone)}`
    ),

  claimItem: (phone: string, itemId: string) =>
    api<{ success: boolean; claim: { id: string; item_id: string; claimed_at: string } }>(
      `/api/registry/claim?phone=${encodeURIComponent(phone)}`,
      { method: 'POST', body: { itemId } }
    ),

  unclaimItem: (phone: string, itemId: string) =>
    api<{ success: boolean }>(
      `/api/registry/claim/${itemId}?phone=${encodeURIComponent(phone)}`,
      { method: 'DELETE' }
    ),

  getSettings: () => api<RegistrySettings>('/api/registry/settings'),
};
