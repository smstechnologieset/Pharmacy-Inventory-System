import React, { useEffect, useState } from "react";
import { Download, Calendar } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { getAllSales } from "../services/firestoreService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState("Sales");
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrder: 0,
    deliveredRate: 0,
  });
  const [salesChartData, setSalesChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [pieData, setPieData] = useState({ labels: [], datasets: [] });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { family: "Lexend", size: 12 },
        },
      },
      tooltip: { cornerRadius: 12, padding: 12 },
    },
    scales: {
      y: {
        grid: { borderDash: [5, 5], drawBorder: false },
        ticks: { font: { family: "Lexend" } },
      },
      x: { grid: { display: false }, ticks: { font: { family: "Lexend" } } },
    },
  };

  const getSaleDate = (sale) => {
    if (sale.createdAt && typeof sale.createdAt.toDate === "function") {
      return sale.createdAt.toDate();
    }
    if (sale.date) {
      const parsed = new Date(sale.date);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const buildMonthLabels = () => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return month.toLocaleString("default", { month: "short" });
    });
  };

  const buildMonthlyRevenue = (salesList) => {
    const labels = buildMonthLabels();
    const totals = labels.map((_, index) => {
      const month = new Date();
      month.setMonth(month.getMonth() - 5 + index);
      return salesList
        .filter((sale) => {
          const saleDate = getSaleDate(sale);
          return (
            saleDate.getMonth() === month.getMonth() &&
            saleDate.getFullYear() === month.getFullYear()
          );
        })
        .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
    });
    return { labels, totals };
  };

  const buildStatusPie = (salesList) => {
    const statusCounts = salesList.reduce((acc, sale) => {
      const status = sale.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(statusCounts);
    const values = labels.map((status) => statusCounts[status]);
    const colors = ["#10B981", "#F59E0B", "#EF4444", "#0D9488"];

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map(
            (_, index) => colors[index % colors.length],
          ),
          borderWidth: 0,
          hoverOffset: 15,
        },
      ],
    };
  };

  useEffect(() => {
    const loadSales = async () => {
      try {
        const salesList = await getAllSales();
        setSales(salesList);

        const totalRevenue = salesList.reduce(
          (sum, sale) => sum + Number(sale.amount || 0),
          0,
        );
        const totalTransactions = salesList.length;
        const deliveredCount = salesList.filter(
          (sale) => sale.status === "Delivered",
        ).length;
        const averageOrder =
          totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        setStats({
          totalRevenue,
          totalTransactions,
          averageOrder,
          deliveredRate:
            totalTransactions > 0
              ? Math.round((deliveredCount / totalTransactions) * 100)
              : 0,
        });

        const monthlyRevenue = buildMonthlyRevenue(salesList);
        setSalesChartData({
          labels: monthlyRevenue.labels,
          datasets: [
            {
              label: "Revenue",
              data: monthlyRevenue.totals,
              backgroundColor: "#0D9488",
              borderRadius: 12,
              barThickness: 28,
            },
          ],
        });

        setPieData(buildStatusPie(salesList));
      } catch (error) {
        console.error("Failed to load sales report data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  return (
    <div className="reports-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}>
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: "800",
              letterSpacing: "-0.025em",
            }}>
            Analytics & Reports
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            Deep insights into your pharmacy's performance.
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: "12px 24px" }}>
          <Download size={20} /> Export PDF
        </button>
      </div>

      <div className="card" style={{ marginBottom: "32px", padding: "16px" }}>
        <div className="tabs" style={{ background: "#F8FAFC" }}>
          {["Sales", "Inventory", "Profit", "Expiration"].map((tab) => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              style={{ minWidth: "150px", textAlign: "center" }}>
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "32px",
            }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              Performance Overview
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#64748B",
                fontSize: "0.9rem",
              }}>
              <Calendar size={18} /> Last 6 Months
            </div>
          </div>
          <div style={{ height: "350px" }}>
            <Bar data={salesChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "700",
              marginBottom: "24px",
            }}>
            Sales Summary
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}>
            <div
              style={{
                padding: "20px",
                background: "#F0FDFA",
                borderRadius: "20px",
                border: "1px solid rgba(13, 148, 136, 0.1)",
              }}>
              <div style={{ fontWeight: "600", color: "#0D9488" }}>
                Total Revenue
              </div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "1.5rem",
                  marginTop: "12px",
                }}>
                ETB {stats.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                padding: "20px",
                background: "#EFF6FF",
                borderRadius: "20px",
              }}>
              <div style={{ fontWeight: "600", color: "#2563EB" }}>
                Transactions
              </div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "1.5rem",
                  marginTop: "12px",
                }}>
                {stats.totalTransactions}
              </div>
            </div>
            <div
              style={{
                padding: "20px",
                background: "#F8FAFC",
                borderRadius: "20px",
              }}>
              <div style={{ fontWeight: "600", color: "#0F172A" }}>
                Average Order
              </div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "1.5rem",
                  marginTop: "12px",
                }}>
                ETB {stats.averageOrder.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                padding: "20px",
                background: "#FFFBEB",
                borderRadius: "20px",
              }}>
              <div style={{ fontWeight: "600", color: "#B45309" }}>
                Delivered Rate
              </div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "1.5rem",
                  marginTop: "12px",
                }}>
                {stats.deliveredRate}%
              </div>
            </div>
          </div>
          <div style={{ marginTop: "24px", height: "280px" }}>
            <Pie data={pieData} options={{ ...chartOptions, scales: {} }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "32px", padding: "0" }}>
        <div
          style={{
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #F1F5F9",
          }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
            Historical Sales
          </h2>
          <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
            {loading ? "Loading sales..." : `${sales.length} records`}
          </span>
        </div>
        <div className="table-container">
          <table style={{ margin: "0" }}>
            <thead style={{ background: "#F8FAFC" }}>
              <tr>
                <th>Invoice</th>
                <th>Medicine / Product</th>
                <th>Qty</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 8).map((sale) => (
                <tr key={sale.id}>
                  <td
                    style={{
                      fontWeight: "700",
                      color: "var(--primary)",
                      padding: "20px 32px",
                    }}>
                    #{sale.invoiceId || sale.id}
                  </td>
                  <td style={{ padding: "20px 32px" }}>
                    <div style={{ fontWeight: "600" }}>
                      {sale.item || sale.product || "Unknown"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                      {sale.batch || "N/A"}
                    </div>
                  </td>
                  <td style={{ padding: "20px 32px" }}>{sale.quantity}</td>
                  <td style={{ padding: "20px 32px" }}>
                    {new Date(getSaleDate(sale)).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: "800", padding: "20px 32px" }}>
                    ETB {Number(sale.amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "20px 32px" }}>
                    <span
                      className="status-badge"
                      style={{
                        background:
                          sale.status === "Delivered" ? "#ECFDF5" : "#FFFBEB",
                        color:
                          sale.status === "Delivered" ? "#059669" : "#D97706",
                      }}>
                      {sale.status || "N/A"}
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

export default Reports;
