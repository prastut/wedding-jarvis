import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { Event, Venue, EventFormData, ContentSide } from '../api/client';

const EMPTY_FORM: EventFormData = {
  name: '',
  name_hi: '',
  name_pa: '',
  description: '',
  start_time: '',
  venue_id: '',
  dress_code: '',
  dress_code_hi: '',
  dress_code_pa: '',
  side: 'BOTH',
  sort_order: 0,
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eventsRes, venuesRes] = await Promise.all([
        adminApi.getEvents(),
        adminApi.getVenues(),
      ]);
      setEvents(eventsRes.events);
      setVenues(venuesRes.venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const submitData = {
        ...formData,
        venue_id: formData.venue_id || undefined,
        sort_order: formData.sort_order || 0,
      };

      if (editingId) {
        await adminApi.updateEvent(editingId, submitData);
      } else {
        await adminApi.createEvent(submitData);
      }
      setShowForm(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await adminApi.deleteEvent(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  }

  function startEdit(event: Event) {
    setFormData({
      name: event.name,
      name_hi: event.name_hi || '',
      name_pa: event.name_pa || '',
      description: event.description || '',
      start_time: event.start_time ? event.start_time.slice(0, 16) : '',
      venue_id: event.venue_id || '',
      dress_code: event.dress_code || '',
      dress_code_hi: event.dress_code_hi || '',
      dress_code_pa: event.dress_code_pa || '',
      side: event.side,
      sort_order: event.sort_order,
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  function cancelEdit() {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getSideBadge = (side: ContentSide) => {
    switch (side) {
      case 'GROOM':
        return <span className="badge badge-info">Groom</span>;
      case 'BRIDE':
        return <span className="badge badge-warning">Bride</span>;
      default:
        return <span className="badge badge-secondary">Both</span>;
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Events</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            New Event
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="content-form">
          <h2>{editingId ? 'Edit Event' : 'New Event'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name (English) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Name (Hindi)</label>
                <input
                  type="text"
                  value={formData.name_hi}
                  onChange={(e) => setFormData({ ...formData, name_hi: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Name (Punjabi)</label>
                <input
                  type="text"
                  value={formData.name_pa}
                  onChange={(e) => setFormData({ ...formData, name_pa: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time *</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Venue</label>
                <select
                  value={formData.venue_id}
                  onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                >
                  <option value="">Select venue...</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Side *</label>
                <select
                  value={formData.side}
                  onChange={(e) =>
                    setFormData({ ...formData, side: e.target.value as ContentSide })
                  }
                  required
                >
                  <option value="BOTH">Both</option>
                  <option value="GROOM">Groom</option>
                  <option value="BRIDE">Bride</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dress Code (English)</label>
                <input
                  type="text"
                  value={formData.dress_code}
                  onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                  placeholder="e.g., Traditional, Semi-formal"
                />
              </div>
              <div className="form-group">
                <label>Dress Code (Hindi)</label>
                <input
                  type="text"
                  value={formData.dress_code_hi}
                  onChange={(e) => setFormData({ ...formData, dress_code_hi: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dress Code (Punjabi)</label>
                <input
                  type="text"
                  value={formData.dress_code_pa}
                  onChange={(e) => setFormData({ ...formData, dress_code_pa: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '200px' }}>
              <label>Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Create'} Event
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Name</th>
            <th>Date/Time</th>
            <th>Venue</th>
            <th>Side</th>
            <th>Dress Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.sort_order}</td>
              <td>
                <strong>{event.name}</strong>
                {event.name_hi && <div className="text-small">{event.name_hi}</div>}
              </td>
              <td>{formatDate(event.start_time)}</td>
              <td>{event.venues?.name || '-'}</td>
              <td>{getSideBadge(event.side)}</td>
              <td>{event.dress_code || '-'}</td>
              <td className="actions">
                <button onClick={() => startEdit(event)} className="btn-small">
                  Edit
                </button>
                <button onClick={() => handleDelete(event.id)} className="btn-small btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">
                No events yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
