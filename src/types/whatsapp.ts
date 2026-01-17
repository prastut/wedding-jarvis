/**
 * WhatsApp Interactive Message Types
 * Provides TypeScript types for WhatsApp Cloud API interactive messages
 */

// ============================================================
// REPLY BUTTON TYPES
// ============================================================

/**
 * A single reply button for interactive messages
 * Max 3 buttons per message
 */
export interface ReplyButton {
  /** Unique button identifier (returned in webhook when pressed) */
  id: string;
  /** Button label text (max 20 characters) */
  title: string;
}

/**
 * Reply button configuration for WhatsApp API
 */
export interface ReplyButtonAction {
  buttons: Array<{
    type: 'reply';
    reply: ReplyButton;
  }>;
}

// ============================================================
// LIST MESSAGE TYPES
// ============================================================

/**
 * A single row in a list message section
 */
export interface ListRow {
  /** Unique row identifier (returned in webhook when selected) */
  id: string;
  /** Row title (max 24 characters) */
  title: string;
  /** Optional row description (max 72 characters) */
  description?: string;
}

/**
 * A section in a list message containing multiple rows
 */
export interface ListSection {
  /** Section header (max 24 characters, optional) */
  title?: string;
  /** Rows in this section (max 10 total across all sections) */
  rows: ListRow[];
}

/**
 * List message action configuration for WhatsApp API
 */
export interface ListAction {
  /** Text for the button that opens the list (max 20 characters) */
  button: string;
  /** Array of sections containing list items */
  sections: ListSection[];
}

// ============================================================
// INTERACTIVE MESSAGE PAYLOAD TYPES
// ============================================================

/**
 * Text header for interactive messages
 */
export interface InteractiveTextHeader {
  type: 'text';
  text: string;
}

/**
 * Image header for interactive messages
 */
export interface InteractiveImageHeader {
  type: 'image';
  image: {
    link: string;
  };
}

/**
 * Header for interactive messages (optional)
 * Can be text or image
 */
export type InteractiveHeader = InteractiveTextHeader | InteractiveImageHeader;

/**
 * Body for interactive messages (required)
 */
export interface InteractiveBody {
  text: string;
}

/**
 * Footer for interactive messages (optional)
 */
export interface InteractiveFooter {
  text: string;
}

/**
 * Interactive message payload for reply buttons
 */
export interface InteractiveButtonPayload {
  type: 'button';
  header?: InteractiveHeader;
  body: InteractiveBody;
  footer?: InteractiveFooter;
  action: ReplyButtonAction;
}

/**
 * Interactive message payload for list messages
 */
export interface InteractiveListPayload {
  type: 'list';
  header?: InteractiveHeader;
  body: InteractiveBody;
  footer?: InteractiveFooter;
  action: ListAction;
}

/**
 * Union type for all interactive message payloads
 */
export type InteractivePayload = InteractiveButtonPayload | InteractiveListPayload;

// ============================================================
// WEBHOOK RESPONSE TYPES (INBOUND)
// ============================================================

/**
 * Button reply from webhook (when user taps a reply button)
 */
export interface ButtonReply {
  /** The button ID that was tapped */
  id: string;
  /** The button title that was displayed */
  title: string;
}

/**
 * List reply from webhook (when user selects a list item)
 */
export interface ListReply {
  /** The list row ID that was selected */
  id: string;
  /** The list row title that was displayed */
  title: string;
  /** The list row description (if present) */
  description?: string;
}

/**
 * Interactive reply from webhook
 */
export interface InteractiveReply {
  type: 'button_reply' | 'list_reply';
  button_reply?: ButtonReply;
  list_reply?: ListReply;
}

/**
 * Parsed interactive message data for bot routing
 */
export interface ParsedInteractiveMessage {
  /** The type of interactive response */
  type: 'button' | 'list';
  /** The ID of the button/list item that was selected */
  id: string;
  /** The title text that was displayed */
  title: string;
  /** The description (list items only) */
  description?: string;
}

// ============================================================
// WHATSAPP API LIMITS
// ============================================================

/**
 * WhatsApp API character limits for interactive messages
 */
export const WHATSAPP_LIMITS = {
  /** Maximum number of reply buttons */
  MAX_REPLY_BUTTONS: 3,
  /** Maximum characters for button title */
  BUTTON_TITLE_MAX: 20,
  /** Maximum items in list message (total across all sections) */
  MAX_LIST_ITEMS: 10,
  /** Maximum characters for list section title */
  LIST_SECTION_TITLE_MAX: 24,
  /** Maximum characters for list row title */
  LIST_ROW_TITLE_MAX: 24,
  /** Maximum characters for list row description */
  LIST_ROW_DESCRIPTION_MAX: 72,
  /** Maximum characters for list button text */
  LIST_BUTTON_MAX: 20,
  /** Maximum characters for message body */
  BODY_MAX: 1024,
  /** Maximum characters for header text */
  HEADER_MAX: 60,
} as const;
