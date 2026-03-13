import React, { useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Filler, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  CircleDollarSign, 
  Package, 
  ShoppingCart, 
  CalendarOff,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { dashboardStats, chartData, salesData } from '../data/mockData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState('Day');

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f1f1' },
        ticks: { color: '#9ca3af', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 10 } }
      }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 3, hoverRadius: 5 }
    }
  };

  // Mock dynamic data based on filter
  const getMockValues = () => {
    switch(timeFilter) {
      case 'Week': return chartData.values.map(v => v * 1.2);
      case 'Month': return chartData.values.map(v => v * 0.8);
      case 'Year': return chartData.values.map(v => v * 1.5);
      default: return chartData.values;
    }
  };

  const chartPayload = {
    labels: chartData.labels,
    datasets: [
      {
        fill: true,
        label: 'Sales',
        data: getMockValues(),
        borderColor: '#4A6CF7',
        backgroundColor: 'rgba(74, 108, 247, 0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#4A6CF7',
        pointBorderWidth: 2,
      },
    ],
  };

  return (
    <div className="dashboard">
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Dashboard</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Pharmacy Inventory System Ethiopia</p>
        </div>
        <div className="tabs">
          {['Day', 'Week', 'Month', 'Year'].map(tab => (
            <div 
              key={tab} 
              className={`tab ${timeFilter === tab ? 'active' : ''}`}
              onClick={() => setTimeFilter(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="stats-grid">
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-icon" style={{ background: '#DEF7EC', width: '44px', height: '44px' }}>
            <CircleDollarSign size={20} color="#03543F" />
          </div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem' }}>Total Profit</span>
            <div className="value" style={{ fontSize: '1rem' }}>{dashboardStats.totalProfit}</div>
          </div>
        </div>
        
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-icon" style={{ background: '#FEF3C7', width: '44px', height: '44px' }}>
            <Package size={20} color="#92400E" />
          </div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem' }}>Inventory Stock</span>
            <div className="value" style={{ fontSize: '1rem' }}>{dashboardStats.inventoryStock}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-icon" style={{ background: '#E0E7FF', width: '44px', height: '44px' }}>
            <ShoppingCart size={20} color="#4338CA" />
          </div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem' }}>Out of Stock</span>
            <div className="value" style={{ fontSize: '1rem' }}>{dashboardStats.outOfStock}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '20px' }}>
          <div className="stat-icon" style={{ background: '#FDE2E2', width: '44px', height: '44px' }}>
            <CalendarOff size={20} color="#9B1C1C" />
          </div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem' }}>Expired</span>
            <div className="value" style={{ fontSize: '1rem' }}>{dashboardStats.expired}</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts & Reports */}
      <div className="dashboard-grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', marginBottom: '2px' }}>Sales Overview</h2>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Revenue: <strong>ETB 10,85,356</strong></span>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <Line options={chartOptions} data={chartPayload} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>Purchase Report</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
              <div className="icon-button" style={{ background: 'white', width: '32px', height: '32px' }}><ShoppingCart size={16} /></div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#6B7280' }}>Items Ordered</span>
                <span style={{ fontSize: '1rem', fontWeight: '700' }}>{dashboardStats.purchaseReport.totalItems}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
              <div className="icon-button" style={{ background: 'white', width: '32px', height: '32px' }}><CircleDollarSign size={16} /></div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#6B7280' }}>Amount paid</span>
                <span style={{ fontSize: '1rem', fontWeight: '700' }}>{dashboardStats.purchaseReport.amountPaid}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
              <div className="icon-button" style={{ background: 'white', width: '32px', height: '32px' }}><CalendarOff size={16} /></div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#6B7280' }}>Pending</span>
                <span style={{ fontSize: '1rem', fontWeight: '700', color: '#EF4444' }}>{dashboardStats.purchaseReport.amountPending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Orders */}
      <div className="card" style={{ marginTop: '24px', padding: '0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: '0', fontSize: '1rem' }}>Recent Orders</h2>
          <button style={{ color: '#4A6CF7', background: 'none', border: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>View All</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>File number</th>
                <th>Item name</th>
                <th>Date</th>
                <th>Quantity</th>
                <th>Batch</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td style={{ fontWeight: '600' }}>{order.item}</td>
                  <td>{order.date}</td>
                  <td>{order.quantity}</td>
                  <td>{order.batch}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.payment}</td>
                  <td style={{ fontWeight: '700' }}>ETB {order.amount.toFixed(2)}</td>
                  <td><ChevronRight size={16} color="#9ca3af" /></td>
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
