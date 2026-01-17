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
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [nameFilter, setNameFilter] = useState('');
  const latestTimestampRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const loadMessages = useCallback(async (checkForNew = false) => {
    try {
      // For polling, only get messages newer than latest; otherwise get last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since = checkForNew && latestTimestampRef.current
        ? latestTimestampRef.current
        : twentyFourHoursAgo;

      const data = await adminApi.getRecentMessages({ limit: 200, since });

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

  // Filter messages based on current filters
  const filteredMessages = messages.filter((msg) => {
    // Direction filter
    if (directionFilter !== 'all' && msg.direction !== directionFilter) {
      return false;
    }
    // Name filter
    if (nameFilter) {
      const name = msg.guest?.name?.toLowerCase() || '';
      const phone = msg.phone_number.toLowerCase();
      const search = nameFilter.toLowerCase();
      if (!name.includes(search) && !phone.includes(search)) {
        return false;
      }
    }
    return true;
  });

  // Get unique names for datalist suggestions
  const uniqueNames = [...new Set(
    messages
      .map((m) => m.guest?.name)
      .filter((name): name is string => !!name)
  )].sort();

  return (
    <div className="activity-page">
      <div className="page-header">
        <h1>Live Activity <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>(Last 24h)</span></h1>
        <label className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </label>
      </div>

      <div className="activity-filters">
        <input
          type="text"
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          list="name-suggestions"
        />
        <datalist id="name-suggestions">
          {uniqueNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value as 'all' | 'inbound' | 'outbound')}
        >
          <option value="all">All</option>
          <option value="inbound">Inbound only</option>
          <option value="outbound">Outbound only</option>
        </select>
        {(nameFilter || directionFilter !== 'all') && (
          <button
            className="btn-secondary btn-small"
            onClick={() => { setNameFilter(''); setDirectionFilter('all'); }}
          >
            Clear
          </button>
        )}
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
          {filteredMessages.length === 0 ? (
            <div className="activity-empty">
              {messages.length === 0 ? 'No messages in the last 24 hours' : 'No messages match your filters'}
            </div>
          ) : (
            filteredMessages.map((msg) => (
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
