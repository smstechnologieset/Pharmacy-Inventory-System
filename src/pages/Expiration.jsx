import React, { useState } from 'react';
import { AlertTriangle, Clock, CalendarX, CheckCircle, Trash2 } from 'lucide-react';
import { medicines } from '../data/mockData';

const Expiration = () => {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState(medicines);

  const handleAction = (id, action) => {
    if (window.confirm(`Delete this entry from inventory (${action})?`)) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(now.getDate() + 30);
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(now.getDate() + 90);

  const getExpirationStatus = (date) => {
    const expiryDate = new Date(date);
    if (expiryDate < now) return 'expired';
    if (expiryDate < thirtyDaysLater) return 'soon';
    if (expiryDate < ninetyDaysLater) return 'warning';
    return 'safe';
  };

  const expiringMeds = items.map(med => ({
    ...med,
    expirationStatus: getExpirationStatus(med.expiry)
  })).filter(med => {
    if (filter === 'all') return med.expirationStatus !== 'safe' || med.stock < 10;
    return med.expirationStatus === filter;
  }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  const stats = {
    expired: items.filter(m => new Date(m.expiry) < now).length,
    soon: items.filter(m => {
      const d = new Date(m.expiry);
      return d >= now && d < thirtyDaysLater;
    }).length,
    warning: items.filter(m => {
      const d = new Date(m.expiry);
      return d >= thirtyDaysLater && d < ninetyDaysLater;
    }).length
  };

  return (
    <div className="expiration-page">
      <h1>Expiration Tracking</h1>
      
      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div className="card stat-card" onClick={() => setFilter('expired')} style={{ cursor: 'pointer', border: filter === 'expired' ? '2px solid #EF4444' : '1px solid var(--border)' }}>
          <div className="stat-icon" style={{ background: '#FEE2E2' }}>
            <CalendarX color="#EF4444" />
          </div>
          <div className="stat-info">
            <span className="label">Expired</span>
            <div className="value">{stats.expired}</div>
          </div>
        </div>
        
        <div className="card stat-card" onClick={() => setFilter('soon')} style={{ cursor: 'pointer', border: filter === 'soon' ? '2px solid #F59E0B' : '1px solid var(--border)' }}>
          <div className="stat-icon" style={{ background: '#FEF3C7' }}>
            <AlertTriangle color="#F59E0B" />
          </div>
          <div className="stat-info">
            <span className="label">Expiring within 30 days</span>
            <div className="value">{stats.soon}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setFilter('warning')} style={{ cursor: 'pointer', border: filter === 'warning' ? '2px solid #3B82F6' : '1px solid var(--border)' }}>
          <div className="stat-icon" style={{ background: '#DBEAFE' }}>
            <Clock color="#3B82F6" />
          </div>
          <div className="stat-info">
            <span className="label">Expiring within 90 days</span>
            <div className="value">{stats.warning}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Expiring Medicines</h2>
          <button className="btn" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }} onClick={() => setFilter('all')}>
            Show All Critical
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Batch No</th>
                <th>Supplier</th>
                <th>Expiry Date</th>
                <th>Stock Left</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expiringMeds.map((med) => (
                <tr key={med.id}>
                  <td style={{ fontWeight: '600' }}>{med.name}</td>
                  <td>{med.batch}</td>
                  <td>{med.supplier}</td>
                  <td style={{ fontWeight: '600', color: med.expirationStatus === 'expired' ? '#EF4444' : med.expirationStatus === 'soon' ? '#F59E0B' : 'inherit' }}>
                    {med.expiry}
                  </td>
                  <td>{med.stock}</td>
                  <td>
                    <span className="status-badge" style={{ 
                      background: med.expirationStatus === 'expired' ? '#FEE2E2' : med.expirationStatus === 'soon' ? '#FEF3C7' : '#DBEAFE',
                      color: med.expirationStatus === 'expired' ? '#B91C1C' : med.expirationStatus === 'soon' ? '#92400E' : '#1E40AF'
                    }}>
                      {med.expirationStatus === 'expired' ? 'Expired' : med.expirationStatus === 'soon' ? 'Critically Soon' : 'Expiring Soon'}
                    </span>
                  </td>
                   <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn" onClick={() => handleAction(med.id, 'Removal')} style={{ padding: '6px', background: '#F3F4F6' }} title="Remove from Inventory">
                        <Trash2 size={16} color="#EF4444" />
                      </button>
                      <button className="btn" onClick={() => handleAction(med.id, 'Disposal')} style={{ padding: '6px', background: '#F3F4F6' }} title="Mark as Disposed">
                        <CheckCircle size={16} color="#10B981" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expiringMeds.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            <p>No medicines found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expiration;
