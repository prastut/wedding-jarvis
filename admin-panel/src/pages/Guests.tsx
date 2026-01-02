import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { Guest, Pagination } from '../api/client';

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [optedInFilter, setOptedInFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadGuests();
  }, [page, optedInFilter]);

  async function loadGuests() {
    setLoading(true);
    try {
      const opted_in = optedInFilter === 'all' ? undefined : optedInFilter === 'true';
      const data = await adminApi.getGuests({ page, limit: 20, search: search || undefined, opted_in });
      setGuests(data.guests);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guests');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setPage(1);
    loadGuests();
  }

  function handleExport() {
    window.open(adminApi.exportGuests(), '_blank');
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="guests-page">
      <div className="page-header">
        <h1>Guests</h1>
        <button onClick={handleExport} className="btn-secondary">Export CSV</button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select value={optedInFilter} onChange={(e) => setOptedInFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="true">Opted In</option>
          <option value="false">Opted Out</option>
        </select>
        <button onClick={handleSearch}>Search</button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>Name</th>
                <th>Status</th>
                <th>First Seen</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id}>
                  <td>{guest.phone_number}</td>
                  <td>{guest.name || '-'}</td>
                  <td>
                    <span className={`badge ${guest.opted_in ? 'badge-success' : 'badge-danger'}`}>
                      {guest.opted_in ? 'Opted In' : 'Opted Out'}
                    </span>
                  </td>
                  <td>{formatDate(guest.first_seen_at)}</td>
                  <td>{formatDate(guest.last_inbound_at)}</td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">No guests found</td>
                </tr>
              )}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
