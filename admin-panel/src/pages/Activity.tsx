import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../api/client';
import type { MessageWithGuest } from '../api/client';
import ChatModal from '../components/ChatModal';

export default function Activity() {
  const [messages, setMessages] = useState<MessageWithGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const latestTimestampRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const loadMessages = useCallback(async (checkForNew = false) => {
    try {
      const params: { direction?: 'inbound'; since?: string; limit?: number } = {
        limit: 50,
      };

      // Only check for new messages if we have a latest timestamp and this isn't the initial load
      if (checkForNew && latestTimestampRef.current) {
        params.since = latestTimestampRef.current;
      }

      const data = await adminApi.getRecentMessages(params);

      if (checkForNew && latestTimestampRef.current && data.messages.length > 0) {
        // We have new messages
        setNewMessagesCount((prev) => prev + data.messages.length);
        setMessages((prev) => [...data.messages, ...prev]);
      } else if (!checkForNew) {
        // Full refresh
        setMessages(data.messages);
        setNewMessagesCount(0);
      }

      // Update latest timestamp
      if (data.messages.length > 0) {
        latestTimestampRef.current = data.messages[0].created_at;
      }

      isInitialLoadRef.current = false;
    } catch (err) {
      if (!checkForNew) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMessages(false);
  }, [loadMessages]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!isInitialLoadRef.current) {
        loadMessages(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadMessages]);

  function handleMessageClick(phone: string) {
    setSelectedPhone(phone);
  }

  function handleCloseModal() {
    setSelectedPhone(null);
  }

  function handleShowNewMessages() {
    setNewMessagesCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  }

  function getDisplayName(msg: MessageWithGuest) {
    if (msg.guest?.name) return msg.guest.name;
    return msg.phone_number;
  }

  return (
    <div className="activity-page">
      <div className="page-header">
        <h1>Live Activity</h1>
        <label className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </label>
      </div>

      {error && <div className="error">{error}</div>}

      {newMessagesCount > 0 && (
        <div className="new-messages-indicator" onClick={handleShowNewMessages}>
          {newMessagesCount} new message{newMessagesCount > 1 ? 's' : ''} - Click to view
        </div>
      )}

      {loading ? (
        <div className="loading">Loading messages...</div>
      ) : (
        <div className="activity-list">
          {messages.length === 0 ? (
            <div className="activity-empty">No messages yet</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="activity-item"
                onClick={() => handleMessageClick(msg.phone_number)}
              >
                <div className={`activity-direction ${msg.direction}`}>
                  {msg.direction === 'inbound' ? '↑' : '↓'}
                </div>
                <div className="activity-content">
                  <span className="activity-name">{getDisplayName(msg)}</span>
                  <span className="activity-message">{msg.message_text}</span>
                </div>
                <div className="activity-time">{formatTime(msg.created_at)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedPhone && (
        <ChatModal phoneNumber={selectedPhone} onClose={handleCloseModal} />
      )}
    </div>
  );
}
