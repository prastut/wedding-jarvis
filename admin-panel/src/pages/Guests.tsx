import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/client';
import type { Guest, Pagination, UserLanguage, UserSide, GuestFilters } from '../api/client';

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Filters
  const [optedInFilter, setOptedInFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const filters: GuestFilters = {
        page,
        limit: 20,
        search: search || undefined,
      };

      // Parse opted_in filter
      if (optedInFilter !== 'all') {
        filters.opted_in = optedInFilter === 'true';
      }

      // Parse language filter
      if (languageFilter !== 'all') {
        filters.language = languageFilter as UserLanguage | 'not_set';
      }

      // Parse side filter
      if (sideFilter !== 'all') {
        filters.side = sideFilter as UserSide | 'not_set';
      }

      // Parse RSVP filter
      if (rsvpFilter !== 'all') {
        filters.rsvp = rsvpFilter as 'YES' | 'NO' | 'pending';
      }

      const data = await adminApi.getGuests(filters);
      setGuests(data.guests);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guests');
    } finally {
      setLoading(false);
    }
  }, [page, optedInFilter, languageFilter, sideFilter, rsvpFilter, search]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  function handleSearch() {
    setPage(1);
    loadGuests();
  }

  function handleExport() {
    const filters: Omit<GuestFilters, 'page' | 'limit'> = {};
    if (optedInFilter !== 'all') {
      filters.opted_in = optedInFilter === 'true';
    }
    if (languageFilter !== 'all') {
      filters.language = languageFilter as UserLanguage | 'not_set';
    }
    if (sideFilter !== 'all') {
      filters.side = sideFilter as UserSide | 'not_set';
    }
    if (rsvpFilter !== 'all') {
      filters.rsvp = rsvpFilter as 'YES' | 'NO' | 'pending';
    }
    window.open(adminApi.exportGuests(filters), '_blank');
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatLanguage = (lang: UserLanguage | null) => {
    switch (lang) {
      case 'EN':
        return 'English';
      case 'HI':
        return 'Hindi';
      case 'PA':
        return 'Punjabi';
      default:
        return '-';
    }
  };

  const formatSide = (side: UserSide | null) => {
    switch (side) {
      case 'GROOM':
        return 'Groom';
      case 'BRIDE':
        return 'Bride';
      default:
        return '-';
    }
  };

  const formatRsvp = (status: string | null, count: number | null) => {
    switch (status) {
      case 'YES':
        return `Attending (${count === 10 ? '10+' : count})`;
      case 'NO':
        return 'Not Attending';
      default:
        return 'Pending';
    }
  };

  const getRsvpBadgeClass = (status: string | null) => {
    switch (status) {
      case 'YES':
        return 'badge-success';
      case 'NO':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div className="guests-page">
      <div className="page-header">
        <h1>Guests</h1>
        <button onClick={handleExport} className="btn-secondary">
          Export CSV
        </button>
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
          <option value="all">All Status</option>
          <option value="true">Opted In</option>
          <option value="false">Opted Out</option>
        </select>
        <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
          <option value="all">All Languages</option>
          <option value="EN">English</option>
          <option value="HI">Hindi</option>
          <option value="PA">Punjabi</option>
          <option value="not_set">Not Set</option>
        </select>
        <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)}>
          <option value="all">All Sides</option>
          <option value="GROOM">Groom</option>
          <option value="BRIDE">Bride</option>
          <option value="not_set">Not Onboarded</option>
        </select>
        <select value={rsvpFilter} onChange={(e) => setRsvpFilter(e.target.value)}>
          <option value="all">All RSVP</option>
          <option value="YES">Attending</option>
          <option value="NO">Not Attending</option>
          <option value="pending">Pending</option>
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
                <th>Language</th>
                <th>Side</th>
                <th>RSVP</th>
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
                  <td>{formatLanguage(guest.user_language)}</td>
                  <td>{formatSide(guest.user_side)}</td>
                  <td>
                    <span className={`badge ${getRsvpBadgeClass(guest.rsvp_status)}`}>
                      {formatRsvp(guest.rsvp_status, guest.rsvp_guest_count)}
                    </span>
                  </td>
                  <td>{formatDate(guest.first_seen_at)}</td>
                  <td>{formatDate(guest.last_inbound_at)}</td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    No guests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                Previous
              </button>
              <span>
                Page {page} of {pagination.totalPages}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === pagination.totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
