import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/client';
import type { RegistryItem, RegistryItemFormData, ClaimWithGuest } from '../api/client';

const EMPTY_FORM: RegistryItemFormData = {
  name: '',
  name_hi: '',
  name_pa: '',
  description: '',
  description_hi: '',
  description_pa: '',
  price: null,
  show_price: true,
  image_url: '',
  external_link: '',
  sort_order: 0,
  is_available: true,
};

type TabType = 'items' | 'claims';

export default function Registry() {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [claims, setClaims] = useState<ClaimWithGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RegistryItemFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [itemsRes, claimsRes] = await Promise.all([
        adminApi.getRegistryItems(),
        adminApi.getRegistryClaims(),
      ]);
      setItems(itemsRes.items);
      setClaims(claimsRes.claims);
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
      const submitData: RegistryItemFormData = {
        ...formData,
        price: formData.price || null,
        sort_order: formData.sort_order || 0,
      };

      if (editingId) {
        await adminApi.updateRegistryItem(editingId, submitData);
      } else {
        await adminApi.createRegistryItem(submitData);
      }
      setShowForm(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await adminApi.deleteRegistryItem(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  }

  async function handleReleaseClaim(claimId: string, itemName: string) {
    if (!confirm(`Are you sure you want to release the claim on "${itemName}"? This will make the item available again.`)) return;
    try {
      await adminApi.releaseClaim(claimId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release claim');
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    e.target.value = '';

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setImportStatus({ type: 'error', message: 'Please select a CSV file' });
      return;
    }

    setImporting(true);
    setImportStatus(null);
    setError('');

    try {
      const text = await file.text();
      const result = await adminApi.importRegistryItems(text);
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.imported} item${result.imported !== 1 ? 's' : ''}`,
      });
      loadData();
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to import CSV',
      });
    } finally {
      setImporting(false);
    }
  }

  function startEdit(item: RegistryItem) {
    setFormData({
      name: item.name,
      name_hi: item.name_hi || '',
      name_pa: item.name_pa || '',
      description: item.description || '',
      description_hi: item.description_hi || '',
      description_pa: item.description_pa || '',
      price: item.price,
      show_price: item.show_price,
      image_url: item.image_url || '',
      external_link: item.external_link || '',
      sort_order: item.sort_order,
      is_available: item.is_available,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function cancelEdit() {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="registry-page">
      <div className="page-header">
        <h1>Gift Registry</h1>
        {activeTab === 'items' && !showForm && (
          <div className="header-actions">
            <button onClick={handleImportClick} className="btn-secondary" disabled={importing}>
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              New Item
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {importStatus && (
        <div className={`alert alert-${importStatus.type}`}>
          {importStatus.message}
          <button
            className="alert-dismiss"
            onClick={() => setImportStatus(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="registry-tabs">
        <button
          className={`registry-tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Items ({items.length})
        </button>
        <button
          className={`registry-tab ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          Claims ({claims.length})
        </button>
      </div>

      {activeTab === 'items' && (
        <>
          {showForm && (
            <div className="content-form">
              <h2>{editingId ? 'Edit Item' : 'New Item'}</h2>
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
                    <label>Description (English)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Description (Hindi)</label>
                    <textarea
                      value={formData.description_hi}
                      onChange={(e) => setFormData({ ...formData, description_hi: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (Punjabi)</label>
                    <textarea
                      value={formData.description_pa}
                      onChange={(e) => setFormData({ ...formData, description_pa: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (INR)</label>
                    <input
                      type="number"
                      value={formData.price ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.show_price}
                        onChange={(e) => setFormData({ ...formData, show_price: e.target.checked })}
                      />
                      Show price to guests
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      />
                      Available (visible to guests)
                    </label>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="form-group">
                    <label>Purchase Link</label>
                    <input
                      type="url"
                      value={formData.external_link}
                      onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                      placeholder="https://amazon.in/..."
                    />
                  </div>
                </div>

                {formData.image_url && (
                  <div className="form-group">
                    <label>Image Preview</label>
                    <div className="image-preview">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = 'block';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingId ? 'Update' : 'Create'} Item
                  </button>
                </div>
              </form>
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={!item.is_available ? 'row-disabled' : ''}>
                  <td>{item.sort_order}</td>
                  <td>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="table-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23eee" width="40" height="40"/><text x="50%" y="50%" fill="%23999" font-size="10" text-anchor="middle" dy=".3em">No img</text></svg>';
                        }}
                      />
                    ) : (
                      <span className="no-image">-</span>
                    )}
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.name_hi && <div className="text-small">{item.name_hi}</div>}
                    {item.description && (
                      <div className="text-small text-muted">{item.description.slice(0, 50)}...</div>
                    )}
                  </td>
                  <td>
                    {item.show_price ? (
                      formatPrice(item.price)
                    ) : (
                      <span className="text-muted">Hidden</span>
                    )}
                  </td>
                  <td>
                    {item.is_available ? (
                      <span className="badge badge-success">Available</span>
                    ) : (
                      <span className="badge badge-secondary">Hidden</span>
                    )}
                  </td>
                  <td className="actions">
                    <button onClick={() => startEdit(item)} className="btn-small">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="btn-small btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No items yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {activeTab === 'claims' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Guest Name</th>
              <th>Guest Phone</th>
              <th>Claimed Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td>
                  <strong>{claim.item.name}</strong>
                </td>
                <td>{claim.guest.name || <span className="text-muted">Unknown</span>}</td>
                <td>{claim.guest.phone_number}</td>
                <td>{formatDate(claim.claimed_at)}</td>
                <td className="actions">
                  <button
                    onClick={() => handleReleaseClaim(claim.id, claim.item.name)}
                    className="btn-small btn-danger"
                  >
                    Release
                  </button>
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  No claims yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
