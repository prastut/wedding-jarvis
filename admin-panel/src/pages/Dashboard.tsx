import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import type { Stats } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Guests</h3>
          <div className="stat-value">{stats.guests.total}</div>
          <div className="stat-detail">
            <span className="positive">{stats.guests.optedIn} opted in</span>
            <span className="negative">{stats.guests.optedOut} opted out</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Messages</h3>
          <div className="stat-value">{stats.messages.total}</div>
          <div className="stat-detail">
            <span>{stats.messages.inbound} inbound</span>
            <span>{stats.messages.outbound} outbound</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Broadcasts</h3>
          <div className="stat-value">{stats.broadcasts.total}</div>
          <div className="stat-detail">
            <span>{stats.broadcasts.completed} completed</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Last Activity</h3>
          <div className="stat-value small">{formatDate(stats.lastActivity)}</div>
        </div>
      </div>
    </div>
  );
}
