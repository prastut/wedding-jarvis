import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { FAQ, FAQFormData } from '../api/client';

const EMPTY_FORM: FAQFormData = {
  question: '',
  question_hi: '',
  question_pa: '',
  answer: '',
  answer_hi: '',
  answer_pa: '',
  category: '',
  sort_order: 0,
};

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FAQFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    try {
      const data = await adminApi.getFaqs();
      setFaqs(data.faqs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
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
        sort_order: formData.sort_order || 0,
      };

      if (editingId) {
        await adminApi.updateFaq(editingId, submitData);
      } else {
        await adminApi.createFaq(submitData);
      }
      setShowForm(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
      loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save FAQ');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await adminApi.deleteFaq(id);
      loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete FAQ');
    }
  }

  function startEdit(faq: FAQ) {
    setFormData({
      question: faq.question,
      question_hi: faq.question_hi || '',
      question_pa: faq.question_pa || '',
      answer: faq.answer,
      answer_hi: faq.answer_hi || '',
      answer_pa: faq.answer_pa || '',
      category: faq.category || '',
      sort_order: faq.sort_order,
    });
    setEditingId(faq.id);
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
    <div className="faqs-page">
      <div className="page-header">
        <h1>FAQs</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            New FAQ
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="content-form">
          <h2>{editingId ? 'Edit FAQ' : 'New FAQ'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Question (English) *</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  rows={2}
                  required
                />
              </div>
              <div className="form-group">
                <label>Question (Hindi)</label>
                <textarea
                  value={formData.question_hi}
                  onChange={(e) => setFormData({ ...formData, question_hi: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Question (Punjabi)</label>
                <textarea
                  value={formData.question_pa}
                  onChange={(e) => setFormData({ ...formData, question_pa: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Answer (English) *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="form-group">
                <label>Answer (Hindi)</label>
                <textarea
                  value={formData.answer_hi}
                  onChange={(e) => setFormData({ ...formData, answer_hi: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Answer (Punjabi)</label>
                <textarea
                  value={formData.answer_pa}
                  onChange={(e) => setFormData({ ...formData, answer_pa: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., General, Dress Code, Travel"
                />
              </div>
              <div className="form-group" style={{ maxWidth: '150px' }}>
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

            <div className="form-actions">
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Create'} FAQ
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Question</th>
            <th>Answer</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {faqs.map((faq) => (
            <tr key={faq.id}>
              <td>{faq.sort_order}</td>
              <td>
                <strong>{faq.question}</strong>
                {faq.question_hi && <div className="text-small">{faq.question_hi}</div>}
              </td>
              <td className="message-cell">{faq.answer}</td>
              <td>{faq.category || '-'}</td>
              <td className="actions">
                <button onClick={() => startEdit(faq)} className="btn-small">
                  Edit
                </button>
                <button onClick={() => handleDelete(faq.id)} className="btn-small btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {faqs.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                No FAQs yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
