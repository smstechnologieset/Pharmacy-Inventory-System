import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  Download,
  Calendar
} from 'lucide-react';
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
import { Bar, Line, Pie } from 'react-chartjs-2';
import { inventoryChartData } from '../data/mockData';

ChartJS.register(
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
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('Sales');

  const salesReportData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [65000, 59000, 80000, 81000, 56000, 85000],
        backgroundColor: '#0D9488',
        borderRadius: 12,
        barThickness: 28,
      },
      {
        label: 'Profit',
        data: [28000, 22000, 35000, 32000, 20000, 42000],
        backgroundColor: '#14B8A6',
        borderRadius: 12,
        barThickness: 28,
      }
    ],
  };

  const pieData = {
    labels: inventoryChartData.labels,
    datasets: [
      {
        data: [300, 50, 100],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
        hoverOffset: 15
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 25, font: { family: 'Lexend', size: 12 } } },
      tooltip: { cornerRadius: 12, padding: 12 }
    },
    scales: {
      y: { grid: { borderDash: [5, 5], drawBorder: false }, ticks: { font: { family: 'Lexend' } } },
      x: { grid: { display: false }, ticks: { font: { family: 'Lexend' } } }
    }
  };

  return (
    <div className="reports-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Deep insights into your pharmacy's performance.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '12px 24px' }}>
          <Download size={20} /> Export PDF
        </button>
      </div>

      <div className="card" style={{ marginBottom: '32px', padding: '16px' }}>
        <div className="tabs" style={{ background: '#F8FAFC' }}>
          {['Sales', 'Inventory', 'Profit', 'Expiration'].map(tab => (
            <div 
              key={tab} 
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ minWidth: '150px', textAlign: 'center' }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Performance Overview</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.9rem' }}>
              <Calendar size={18} /> Last 6 Months
            </div>
          </div>
          <div style={{ height: '350px' }}>
            <Bar data={salesReportData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '32px' }}>Stock Distribution</h2>
          <div style={{ height: '300px', position: 'relative' }}>
            <Pie data={pieData} options={{ ...chartOptions, scales: {} }} />
          </div>
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#F0FDFA', borderRadius: '20px', border: '1px solid rgba(13, 148, 136, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: '#0D9488' }}>Inventory Value</span>
                <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>ETB 248,500</span>
              </div>
            </div>
            <div style={{ padding: '16px', background: '#F1F5F9', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Total SKUs</span>
                <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>156 Items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
