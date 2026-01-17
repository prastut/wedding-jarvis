import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { Contact, ContactFormData, ContentSide } from '../api/client';

const EMPTY_FORM: ContactFormData = {
  name: '',
  phone_number: '',
  role: '',
  side: 'BOTH',
  is_primary: false,
};

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const data = await adminApi.getContacts();
      setContacts(data.contacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await adminApi.updateContact(editingId, formData);
      } else {
        await adminApi.createContact(formData);
      }
      setShowForm(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
      loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await adminApi.deleteContact(id);
      loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  }

  function startEdit(contact: Contact) {
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      role: contact.role || '',
      side: contact.side,
      is_primary: contact.is_primary,
    });
    setEditingId(contact.id);
    setShowForm(true);
  }

  function cancelEdit() {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

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
    <div className="contacts-page">
      <div className="page-header">
        <h1>Emergency Contacts</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            New Contact
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="content-form">
          <h2>{editingId ? 'Edit Contact' : 'New Contact'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contact name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Family Coordinator, Venue Manager"
                />
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
              <div className="form-group">
                <label>Primary Contact</label>
                <div style={{ paddingTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    Mark as primary contact
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Create'} Contact
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Side</th>
            <th>Primary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>
                <strong>{contact.name}</strong>
              </td>
              <td>{contact.phone_number}</td>
              <td>{contact.role || '-'}</td>
              <td>{getSideBadge(contact.side)}</td>
              <td>
                {contact.is_primary ? (
                  <span className="badge badge-success">Primary</span>
                ) : (
                  '-'
                )}
              </td>
              <td className="actions">
                <button onClick={() => startEdit(contact)} className="btn-small">
                  Edit
                </button>
                <button onClick={() => handleDelete(contact.id)} className="btn-small btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">
                No contacts yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
