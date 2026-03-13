import React, { useState } from 'react';
import { 
  DollarSign, 
  Package, 
  AlertCircle, 
  CalendarX, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingBag
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { dashboardStats, salesData, inventoryChartData } from '../data/mockData';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState('Week');

  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales (ETB)',
        data: timeFilter === 'Week' ? [12000, 19000, 15000, 22000, 18000, 24000, 21000] : [55000, 62000, 58000, 75000, 68000, 82000, 78000],
        borderColor: '#0D9488',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(13, 148, 136, 0.2)');
          gradient.addColorStop(1, 'rgba(13, 148, 136, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#0D9488',
        pointBorderWidth: 3,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 12,
        displayColors: false
      }
    },
    scales: {
      y: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    },
  };

  return (
    <div className="dashboard-page">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#0F172A' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
            <DollarSign size={28} />
          </div>
          <div className="stat-info">
            <span className="label">Total Profit</span>
            <div className="value">{dashboardStats.totalProfit}</div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            <Package size={28} />
          </div>
          <div className="stat-info">
            <span className="label">Inventory Stock</span>
            <div className="value">{dashboardStats.inventoryStock}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#FFF7ED', color: '#F59E0B' }}>
            <AlertCircle size={28} />
          </div>
          <div className="stat-info">
            <span className="label">Out of Stock</span>
            <div className="value">{dashboardStats.outOfStock}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
            <CalendarX size={28} />
          </div>
          <div className="stat-info">
            <span className="label">Expired Items</span>
            <div className="value">{dashboardStats.expired}</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="dashboard-grid">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Sales Overview</h2>
            <div className="tabs">
              {['Day', 'Week', 'Month', 'Year'].map(t => (
                <div 
                  key={t} 
                  className={`tab ${timeFilter === t ? 'active' : ''}`}
                  onClick={() => setTimeFilter(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '300px' }}>
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px' }}>Inventory Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {inventoryChartData.labels.map((label, idx) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: '500', color: '#64748B' }}>{label}</span>
                  <span style={{ fontWeight: '700' }}>{idx === 0 ? '75%' : idx === 1 ? '15%' : '10%'}</span>
                </div>
                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: idx === 0 ? '75%' : idx === 1 ? '15%' : '10%', 
                    height: '100%', 
                    background: idx === 0 ? '#10B981' : idx === 1 ? '#F59E0B' : '#EF4444',
                    borderRadius: '10px'
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '32px', padding: '20px', background: '#F8FAFC', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488' }}>
              <ArrowUpRight size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem' }}>+12% Increase</div>
              <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Compared to last month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Orders */}
      <div className="card" style={{ marginTop: '32px', padding: '0' }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Sales Transactions</h2>
          <button className="btn" style={{ background: 'white', border: '1px solid #E2E8F0', padding: '8px 16px', fontSize: '0.85rem' }}>
            View All
          </button>
        </div>
        <div className="table-container">
          <table style={{ margin: '0' }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                <th>Invoice</th>
                <th>Medicine / Product</th>
                <th>Qty</th>
                <th>Date / Time</th>
                <th>Amount (ETB)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {salesData.slice(0, 5).map(sale => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: '700', color: 'var(--primary)', padding: '20px 32px' }}>#{sale.id}</td>
                  <td style={{ padding: '20px 32px' }}>
                    <div style={{ fontWeight: '600' }}>{sale.item}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Batch: {sale.batch}</div>
                  </td>
                  <td style={{ padding: '20px 32px' }}>{sale.quantity}</td>
                  <td style={{ padding: '20px 32px' }}>
                    <div>{sale.date}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>10:45 AM</div>
                  </td>
                  <td style={{ fontWeight: '800', padding: '20px 32px' }}>ETB {sale.amount.toLocaleString()}</td>
                  <td style={{ padding: '20px 32px' }}>
                    <span className="status-badge" style={{ 
                      background: sale.status === 'Delivered' ? '#ECFDF5' : '#FFFBEB',
                      color: sale.status === 'Delivered' ? '#059669' : '#D97706'
                    }}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
