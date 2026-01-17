import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { Venue, VenueFormData } from '../api/client';

const EMPTY_FORM: VenueFormData = {
  name: '',
  address: '',
  address_hi: '',
  address_pa: '',
  google_maps_link: '',
  parking_info: '',
  parking_info_hi: '',
  parking_info_pa: '',
};

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<VenueFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  async function loadVenues() {
    try {
      const data = await adminApi.getVenues();
      setVenues(data.venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await adminApi.updateVenue(editingId, formData);
      } else {
        await adminApi.createVenue(formData);
      }
      setShowForm(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
      loadVenues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save venue');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this venue?')) return;
    try {
      await adminApi.deleteVenue(id);
      loadVenues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete venue');
    }
  }

  function startEdit(venue: Venue) {
    setFormData({
      name: venue.name,
      address: venue.address,
      address_hi: venue.address_hi || '',
      address_pa: venue.address_pa || '',
      google_maps_link: venue.google_maps_link || '',
      parking_info: venue.parking_info || '',
      parking_info_hi: venue.parking_info_hi || '',
      parking_info_pa: venue.parking_info_pa || '',
    });
    setEditingId(venue.id);
    setShowForm(true);
  }

  function cancelEdit() {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="venues-page">
      <div className="page-header">
        <h1>Venues</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            New Venue
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="content-form">
          <h2>{editingId ? 'Edit Venue' : 'New Venue'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Grand Ballroom"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Address (English) *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address (Hindi)</label>
                <textarea
                  value={formData.address_hi}
                  onChange={(e) => setFormData({ ...formData, address_hi: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Address (Punjabi)</label>
                <textarea
                  value={formData.address_pa}
                  onChange={(e) => setFormData({ ...formData, address_pa: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Google Maps Link</label>
              <input
                type="url"
                value={formData.google_maps_link}
                onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Parking Info (English)</label>
                <textarea
                  value={formData.parking_info}
                  onChange={(e) => setFormData({ ...formData, parking_info: e.target.value })}
                  rows={2}
                  placeholder="Valet parking available..."
                />
              </div>
              <div className="form-group">
                <label>Parking Info (Hindi)</label>
                <textarea
                  value={formData.parking_info_hi}
                  onChange={(e) => setFormData({ ...formData, parking_info_hi: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Parking Info (Punjabi)</label>
                <textarea
                  value={formData.parking_info_pa}
                  onChange={(e) => setFormData({ ...formData, parking_info_pa: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Create'} Venue
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Maps Link</th>
            <th>Parking</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {venues.map((venue) => (
            <tr key={venue.id}>
              <td>
                <strong>{venue.name}</strong>
              </td>
              <td className="message-cell">{venue.address}</td>
              <td>
                {venue.google_maps_link ? (
                  <a href={venue.google_maps_link} target="_blank" rel="noopener noreferrer">
                    View Map
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="message-cell">{venue.parking_info || '-'}</td>
              <td className="actions">
                <button onClick={() => startEdit(venue)} className="btn-small">
                  Edit
                </button>
                <button onClick={() => handleDelete(venue.id)} className="btn-small btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {venues.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                No venues yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
