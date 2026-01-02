import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { Broadcast } from '../api/client';

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ topic: '', message: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  async function loadBroadcasts() {
    try {
      const data = await adminApi.getBroadcasts();
      setBroadcasts(data.broadcasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updateBroadcast(editingId, formData);
      } else {
        await adminApi.createBroadcast(formData);
      }
      setShowForm(false);
      setFormData({ topic: '', message: '' });
      setEditingId(null);
      loadBroadcasts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save broadcast');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await adminApi.deleteBroadcast(id);
      loadBroadcasts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete broadcast');
    }
  }

  async function handleSend(broadcast: Broadcast) {
    const guestCount = await getGuestCount();
    if (!confirm(`Send this broadcast to ${guestCount} opted-in guests?`)) return;

    setSending(broadcast.id);
    try {
      const result = await adminApi.sendBroadcast(broadcast.id);
      alert(`Broadcast sent! ${result.result.sent} sent, ${result.result.failed} failed`);
      loadBroadcasts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast');
    } finally {
      setSending(null);
    }
  }

  async function getGuestCount() {
    const stats = await adminApi.getStats();
    return stats.guests.optedIn;
  }

  function startEdit(broadcast: Broadcast) {
    setFormData({ topic: broadcast.topic, message: broadcast.message });
    setEditingId(broadcast.id);
    setShowForm(true);
  }

  function cancelEdit() {
    setFormData({ topic: '', message: '' });
    setEditingId(null);
    setShowForm(false);
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const statusColors: Record<string, string> = {
    draft: 'badge-secondary',
    pending: 'badge-warning',
    sending: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-danger',
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="broadcasts-page">
      <div className="page-header">
        <h1>Broadcasts</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            New Broadcast
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="broadcast-form">
          <h2>{editingId ? 'Edit Broadcast' : 'New Broadcast'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Venue Update"
                required
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your broadcast message..."
                rows={4}
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Create'} Broadcast
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Topic</th>
            <th>Message</th>
            <th>Status</th>
            <th>Sent/Failed</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {broadcasts.map((broadcast) => (
            <tr key={broadcast.id}>
              <td>{broadcast.topic}</td>
              <td className="message-cell">{broadcast.message}</td>
              <td>
                <span className={`badge ${statusColors[broadcast.status]}`}>
                  {broadcast.status}
                </span>
              </td>
              <td>
                {broadcast.sent_count}/{broadcast.failed_count}
              </td>
              <td>{formatDate(broadcast.created_at)}</td>
              <td className="actions">
                {broadcast.status === 'draft' && (
                  <>
                    <button onClick={() => startEdit(broadcast)} className="btn-small">
                      Edit
                    </button>
                    <button
                      onClick={() => handleSend(broadcast)}
                      className="btn-small btn-primary"
                      disabled={sending === broadcast.id}
                    >
                      {sending === broadcast.id ? 'Sending...' : 'Send'}
                    </button>
                    <button onClick={() => handleDelete(broadcast.id)} className="btn-small btn-danger">
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {broadcasts.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">No broadcasts yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
