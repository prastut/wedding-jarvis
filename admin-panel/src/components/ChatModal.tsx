import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/client';
import type { MessageLog, Guest, MessageStatus } from '../api/client';

interface ChatModalProps {
  phoneNumber: string;
  onClose: () => void;
}

function StatusTicks({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'read':
      return <span className="status-ticks read" title="Read">✓✓</span>;
    case 'delivered':
      return <span className="status-ticks delivered" title="Delivered">✓✓</span>;
    case 'failed':
      return <span className="status-ticks failed" title="Failed">!</span>;
    case 'sent':
    default:
      return <span className="status-ticks sent" title="Sent">✓</span>;
  }
}

export default function ChatModal({ phoneNumber, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [phoneNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChatHistory() {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getChatHistory(phoneNumber);
      setMessages(data.messages);
      setGuest(data.guest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  function formatLanguage(lang: string | null) {
    switch (lang) {
      case 'EN': return 'English';
      case 'HI': return 'Hindi';
      case 'PA': return 'Punjabi';
      default: return 'Not set';
    }
  }

  function formatSide(side: string | null) {
    switch (side) {
      case 'GROOM': return 'Groom';
      case 'BRIDE': return 'Bride';
      default: return 'Not set';
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>{guest?.name || phoneNumber}</h3>
            {guest && (
              <div className="chat-guest-details">
                <span>{phoneNumber}</span>
                <span className="separator">|</span>
                <span>{formatLanguage(guest.user_language)}</span>
                <span className="separator">|</span>
                <span>{formatSide(guest.user_side)}</span>
                {guest.rsvp_status && (
                  <>
                    <span className="separator">|</span>
                    <span className={`rsvp-status ${guest.rsvp_status === 'YES' ? 'attending' : 'not-attending'}`}>
                      {guest.rsvp_status === 'YES' ? `Attending (${guest.rsvp_guest_count})` : 'Not Attending'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading chat history...</div>
        ) : (
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">No messages yet</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.direction}`}>
                  <div className="message-bubble">
                    <div className="message-text">{msg.message_text}</div>
                    <div className="message-meta">
                      <span className="message-time">{formatTime(msg.created_at)}</span>
                      {msg.direction === 'outbound' && <StatusTicks status={msg.status} />}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
