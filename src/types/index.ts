// Language codes supported by the bot
export type UserLanguage = 'EN' | 'HI' | 'PA';

// Side selection (Groom or Bride family)
export type UserSide = 'GROOM' | 'BRIDE';

// Side for events and contacts (includes BOTH for shared items)
export type ContentSide = 'GROOM' | 'BRIDE' | 'BOTH';

// RSVP status
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
  updated_at: string;
}

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

export interface CoordinatorContact {
  id: string;
  name: string;
  phone_number: string;
  role: string | null;
  side: ContentSide;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Broadcast {
  id: string;
  topic: string;
  message: string;
  message_hi: string | null;
  message_pa: string | null;
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

// Registry types
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

export interface RegistryItemInput {
  name: string;
  name_hi?: string | null;
  name_pa?: string | null;
  description?: string | null;
  description_hi?: string | null;
  description_pa?: string | null;
  price?: number | null;
  show_price?: boolean;
  image_url?: string | null;
  external_link?: string | null;
  sort_order?: number;
  is_available?: boolean;
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
