export interface Guest {
  id: string;
  phone_number: string;
  name: string | null;
  opted_in: boolean;
  first_seen_at: string;
  last_inbound_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  start_time: string;
  venue_id: string | null;
  dress_code: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  google_maps_link: string | null;
  parking_info: string | null;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CoordinatorContact {
  id: string;
  name: string;
  phone_number: string;
  role: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Broadcast {
  id: string;
  topic: string;
  message: string;
  template_name: string | null;
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed';
  sent_count: number;
  failed_count: number;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface SendLog {
  id: string;
  broadcast_id: string;
  guest_id: string;
  status: 'pending' | 'sent' | 'failed';
  error_code: string | null;
  whatsapp_message_id: string | null;
  created_at: string;
}

export interface MessageLog {
  id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  message_text: string;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// WhatsApp API types
export interface WhatsAppInteractiveReply {
  button_reply?: {
    id: string;
    title: string;
  };
  list_reply?: {
    id: string;
    title: string;
    description?: string;
  };
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: WhatsAppInteractiveReply;
}

export interface WhatsAppInboundMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppSendResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

// Express session extension
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
  }
}
