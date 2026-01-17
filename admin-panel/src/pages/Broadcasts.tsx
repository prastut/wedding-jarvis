import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { Broadcast, BroadcastFormData, Stats } from '../api/client';

type LanguageTab = 'en' | 'hi' | 'pa';

const languageLabels: Record<LanguageTab, string> = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
};

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BroadcastFormData>({
    topic: '',
    message: '',
    message_hi: '',
    message_pa: '',
  });
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [previewBroadcast, setPreviewBroadcast] = useState<Broadcast | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadBroadcasts();
    loadStats();
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

  async function loadStats() {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
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
      setFormData({ topic: '', message: '', message_hi: '', message_pa: '' });
      setEditingId(null);
      setActiveTab('en');
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
    const langBreakdown = stats
      ? `English: ${stats.byLanguage.english + stats.byLanguage.notSet}, Hindi: ${stats.byLanguage.hindi}, Punjabi: ${stats.byLanguage.punjabi}`
      : '';

    const missingTranslations: string[] = [];
    if (!broadcast.message_hi && stats && stats.byLanguage.hindi > 0) {
      missingTranslations.push('Hindi');
    }
    if (!broadcast.message_pa && stats && stats.byLanguage.punjabi > 0) {
      missingTranslations.push('Punjabi');
    }

    let confirmMsg = `Send this broadcast to ${guestCount} opted-in guests?\n\n${langBreakdown}`;
    if (missingTranslations.length > 0) {
      confirmMsg += `\n\nNote: ${missingTranslations.join(' and ')} translation(s) missing - those guests will receive English.`;
    }

    if (!confirm(confirmMsg)) return;

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
    const statsData = await adminApi.getStats();
    return statsData.guests.optedIn;
  }

  function startEdit(broadcast: Broadcast) {
    setFormData({
      topic: broadcast.topic,
      message: broadcast.message,
      message_hi: broadcast.message_hi || '',
      message_pa: broadcast.message_pa || '',
    });
    setEditingId(broadcast.id);
    setActiveTab('en');
    setShowForm(true);
  }

  function cancelEdit() {
    setFormData({ topic: '', message: '', message_hi: '', message_pa: '' });
    setEditingId(null);
    setActiveTab('en');
    setShowForm(false);
  }

  function getMessageByTab(tab: LanguageTab): string {
    switch (tab) {
      case 'en':
        return formData.message;
      case 'hi':
        return formData.message_hi || '';
      case 'pa':
        return formData.message_pa || '';
    }
  }

  function setMessageByTab(tab: LanguageTab, value: string) {
    switch (tab) {
      case 'en':
        setFormData({ ...formData, message: value });
        break;
      case 'hi':
        setFormData({ ...formData, message_hi: value });
        break;
      case 'pa':
        setFormData({ ...formData, message_pa: value });
        break;
    }
  }

  function getLanguageStatus(broadcast: Broadcast): string {
    const langs: string[] = ['EN'];
    if (broadcast.message_hi) langs.push('HI');
    if (broadcast.message_pa) langs.push('PA');
    return langs.join(', ');
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
              <p className="form-hint">
                Enter messages in each language. Guests receive the message in their preferred language.
                If a translation is missing, they receive English.
              </p>

              <div className="language-tabs">
                {(['en', 'hi', 'pa'] as LanguageTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`tab ${activeTab === tab ? 'active' : ''} ${
                      tab !== 'en' && !getMessageByTab(tab) ? 'empty' : ''
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {languageLabels[tab]}
                    {tab === 'en' && ' *'}
                    {tab !== 'en' && getMessageByTab(tab) && ' ✓'}
                  </button>
                ))}
              </div>

              <textarea
                value={getMessageByTab(activeTab)}
                onChange={(e) => setMessageByTab(activeTab, e.target.value)}
                placeholder={
                  activeTab === 'en'
                    ? 'Enter your broadcast message in English...'
                    : `Enter ${languageLabels[activeTab]} translation (optional)...`
                }
                rows={4}
                required={activeTab === 'en'}
              />

              {stats && (
                <p className="form-hint language-stats">
                  Recipients by language: English {stats.byLanguage.english + stats.byLanguage.notSet} |
                  Hindi {stats.byLanguage.hindi} | Punjabi {stats.byLanguage.punjabi}
                </p>
              )}
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

      {previewBroadcast && (
        <div className="preview-modal" onClick={() => setPreviewBroadcast(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <h3>Preview: {previewBroadcast.topic}</h3>
            <div className="preview-languages">
              <div className="preview-language">
                <h4>English</h4>
                <pre>{previewBroadcast.message}</pre>
              </div>
              <div className="preview-language">
                <h4>Hindi (हिंदी)</h4>
                <pre>{previewBroadcast.message_hi || '(Will use English)'}</pre>
              </div>
              <div className="preview-language">
                <h4>Punjabi (ਪੰਜਾਬੀ)</h4>
                <pre>{previewBroadcast.message_pa || '(Will use English)'}</pre>
              </div>
            </div>
            <button onClick={() => setPreviewBroadcast(null)} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Topic</th>
            <th>Message</th>
            <th>Languages</th>
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
                <span className="badge badge-info">{getLanguageStatus(broadcast)}</span>
              </td>
              <td>
                <span className={`badge ${statusColors[broadcast.status]}`}>{broadcast.status}</span>
              </td>
              <td>
                {broadcast.sent_count}/{broadcast.failed_count}
              </td>
              <td>{formatDate(broadcast.created_at)}</td>
              <td className="actions">
                <button onClick={() => setPreviewBroadcast(broadcast)} className="btn-small">
                  Preview
                </button>
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
              <td colSpan={7} className="empty">
                No broadcasts yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
