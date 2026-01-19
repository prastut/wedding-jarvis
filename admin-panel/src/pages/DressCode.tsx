import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';
import type { Event } from '../api/client';

export default function DressCode() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const { events } = await adminApi.getEvents();
      // Filter to only events with dress codes and sort by sort_order
      const eventsWithDressCode = events
        .filter((e) => e.dress_code)
        .sort((a, b) => a.sort_order - b.sort_order);
      setEvents(eventsWithDressCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dress-code-page">
      <div className="page-header">
        <h1>Dress Code</h1>
        <p className="page-subtitle">
          This is what guests see when they tap "Dress Code" in the bot.
          <br />
          Edit dress codes in the <Link to="/events">Events</Link> page.
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No dress codes configured yet.</p>
          <p>
            Add dress codes to your events in the <Link to="/events">Events</Link> page.
          </p>
        </div>
      ) : (
        <div className="dress-code-preview">
          <div className="preview-header">
            <h2>Guest Preview</h2>
            <span className="preview-badge">What guests see at /dress-code</span>
          </div>

          <div className="events-list">
            {events.map((event) => (
              <div key={event.id} className="event-dress-code-card">
                <div className="event-header">
                  <div className="event-name">
                    <h3>{event.name}</h3>
                    {event.name_hi && <span className="translation">{event.name_hi}</span>}
                    {event.name_pa && <span className="translation">{event.name_pa}</span>}
                  </div>
                  <span className="event-date">{formatDate(event.start_time)}</span>
                </div>

                <div className="dress-code-content">
                  <div className="language-row">
                    <span className="lang-label">EN</span>
                    <span className="dress-code-text">{event.dress_code}</span>
                  </div>
                  {event.dress_code_hi && (
                    <div className="language-row">
                      <span className="lang-label">HI</span>
                      <span className="dress-code-text">{event.dress_code_hi}</span>
                    </div>
                  )}
                  {event.dress_code_pa && (
                    <div className="language-row">
                      <span className="lang-label">PA</span>
                      <span className="dress-code-text">{event.dress_code_pa}</span>
                    </div>
                  )}
                </div>

                <Link to="/events" className="edit-link">
                  Edit in Events →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
