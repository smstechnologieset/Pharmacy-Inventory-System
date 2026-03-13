import React, { useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Download, Calendar } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('Sales');

  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue',
      data: [12000, 19000, 15000, 22000, 18000, 25000, 14000],
      backgroundColor: '#4A6CF7',
      borderRadius: 6,
    }]
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Profit',
        data: [30000, 45000, 35000, 50000, 40000, 55000],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const doughnutData = {
    labels: ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Others'],
    datasets: [{
      data: [45, 25, 15, 10, 5],
      backgroundColor: ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
      borderWidth: 0,
    }]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <div className="reports-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Reports & Analytics</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" style={{ background: 'white', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Select Range
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export Data
          </button>
        </div>
      </div>

      <div className="tabs">
        {['Sales', 'Inventory', 'Profit', 'Expiration'].map(tab => (
          <div 
            key={tab} 
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        <div className="card">
          <h2>{activeTab} Overview</h2>
          <div style={{ height: '350px' }}>
            {activeTab === 'Sales' && <Bar data={barData} options={commonOptions} />}
            {activeTab === 'Profit' && <Line data={lineData} options={commonOptions} />}
            {activeTab === 'Inventory' && <Doughnut data={doughnutData} options={commonOptions} />}
            {activeTab === 'Expiration' && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#6B7280' }}>Expiration timeline analytics will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Summary Stats</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Total Revenue', value: 'ETB 2,45,000', trend: '+12.5%' },
              { label: 'Average Order', value: 'ETB 1,200', trend: '+3.2%' },
              { label: 'Total Sales', value: '184', trend: '+8.1%' },
              { label: 'Gross Margin', value: '32.4%', trend: '-1.5%' },
            ].map(stat => (
              <div key={stat.label} style={{ padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
                <div style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stat.value}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: stat.trend.startsWith('+') ? '#10B981' : '#EF4444' }}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
