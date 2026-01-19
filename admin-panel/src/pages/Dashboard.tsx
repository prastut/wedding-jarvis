import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

      {/* Overview - The numbers that matter */}
      <section className="dashboard-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Guests Onboarded</h3>
            <div className="stat-value">{stats.guests.optedIn}</div>
            <div className="stat-subtitle">{stats.guests.onboarded} guests basic settings done</div>
          </div>

          <div className="stat-card highlight">
            <h3>RSVP Status</h3>
            <div className="stat-value">{stats.rsvp.attending}</div>
            <div className="stat-subtitle">attending</div>
            <div className="stat-detail">
              <Link to="/guests?rsvp=YES" className="positive">{stats.rsvp.attending} yes</Link>
              <Link to="/guests?rsvp=NO" className="negative">{stats.rsvp.notAttending} no</Link>
              <Link to="/guests?rsvp=pending" className="neutral">{stats.rsvp.pending} pending</Link>
              <span>{stats.rsvp.totalHeadcount} headcount</span>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed - By Side breakdown */}
      <section className="dashboard-section">
        <h2>By Side</h2>
        <div className="stats-grid">
          <Link to="/guests?side=GROOM" className="stat-card stat-card-link">
            <h3>Groom's Side</h3>
            <div className="stat-value">{stats.bySide.groom}</div>
            <div className="stat-subtitle">guests onboarded</div>
          </Link>

          <Link to="/guests?side=BRIDE" className="stat-card stat-card-link">
            <h3>Bride's Side</h3>
            <div className="stat-value">{stats.bySide.bride}</div>
            <div className="stat-subtitle">guests onboarded</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
