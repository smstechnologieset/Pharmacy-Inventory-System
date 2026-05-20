import React, { useEffect, useState } from "react";
import { DollarSign, Package, AlertCircle, CalendarX } from "lucide-react";
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
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getAllMedicines, getAllSales } from "../services/firestoreService";
import { inventoryChartData } from "../data/mockData";

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
  Filler,
);

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState("Week");
  const [sales, setSales] = useState([]);
  const [stockStats, setStockStats] = useState({
    totalRevenue: 0,
    inventoryStock: 0,
    outOfStock: 0,
    expired: 0,
  });
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [recentSales, setRecentSales] = useState([]);

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

  const buildLabels = (filter) => {
    const now = new Date();
    if (filter === "Day") {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        return date.toLocaleDateString("default", { weekday: "short" });
      });
    }
    if (filter === "Week") {
      return Array.from({ length: 4 }, (_, index) => {
        const start = new Date(now);
        start.setDate(now.getDate() - (3 - index) * 7);
        return `Wk ${start.getMonth() + 1}/${start.getDate()}`;
      });
    }
    if (filter === "Month") {
      return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - (5 - index),
          1,
        );
        return date.toLocaleString("default", { month: "short" });
      });
    }
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (11 - index),
        1,
      );
      return date.toLocaleString("default", { month: "short" });
    });
  };

  const getPeriodKey = (date, filter) => {
    const value = new Date(date);
    if (filter === "Day") {
      return value.toISOString().slice(0, 10);
    }
    if (filter === "Week") {
      const sunday = new Date(value);
      sunday.setDate(value.getDate() - value.getDay());
      return sunday.toISOString().slice(0, 10);
    }
    if (filter === "Month") {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
    }
    return String(value.getFullYear());
  };

  const buildTimeSeries = (salesList, filter) => {
    const labels = buildLabels(filter);
    const buckets = {};
    labels.forEach((label) => {
      buckets[label] = 0;
    });

    salesList.forEach((sale) => {
      const date = getSaleDate(sale);
      const key = getPeriodKey(date, filter);
      if (filter === "Day") {
        const label = date.toLocaleDateString("default", { weekday: "short" });
        buckets[label] = (buckets[label] || 0) + Number(sale.amount || 0);
      } else if (filter === "Week") {
        const sunday = new Date(date);
        sunday.setDate(date.getDate() - date.getDay());
        const label = `Wk ${sunday.getMonth() + 1}/${sunday.getDate()}`;
        if (label in buckets) buckets[label] += Number(sale.amount || 0);
      } else if (filter === "Month") {
        const label = date.toLocaleString("default", { month: "short" });
        if (label in buckets) buckets[label] += Number(sale.amount || 0);
      } else {
        const label = date.toLocaleString("default", { month: "short" });
        if (label in buckets) buckets[label] += Number(sale.amount || 0);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Sales (ETB)",
          data: labels.map((label) => buckets[label] || 0),
          borderColor: "#0D9488",
          backgroundColor: "rgba(13, 148, 136, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#0D9488",
          pointBorderWidth: 3,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [medicinesList, salesList] = await Promise.all([
          getAllMedicines(),
          getAllSales(),
        ]);
        setSales(salesList);

        const totalRevenue = salesList.reduce(
          (sum, sale) => sum + Number(sale.amount || 0),
          0,
        );
        const inventoryStock = medicinesList.reduce(
          (sum, med) => sum + Number(med.stock || 0),
          0,
        );
        const outOfStock = medicinesList.filter(
          (med) => Number(med.stock) === 0,
        ).length;
        const expired = medicinesList.filter((med) => {
          const date = new Date(med.expiry);
          return (
            med.expiry && !Number.isNaN(date.getTime()) && date < new Date()
          );
        }).length;

        setStockStats({ totalRevenue, inventoryStock, outOfStock, expired });
        setChartData(buildTimeSeries(salesList, timeFilter));
        setRecentSales(salesList.slice(0, 5));
      } catch (error) {
        console.error("Unable to load dashboard data:", error);
      }
    };

    loadData();
  }, [timeFilter]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      y: { grid: { display: false }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  return (
    <div className="dashboard-page">
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "800",
            letterSpacing: "-0.025em",
            color: "#0F172A",
          }}>
          Dashboard
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            marginTop: "4px",
          }}>
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          {
            label: "Total Revenue",
            value: `ETB ${stockStats.totalRevenue.toLocaleString()}`,
            icon: <DollarSign size={20} />,
            bg: "#F0FDFA",
            color: "#0D9488",
          },
          {
            label: "Inventory Stock",
            value: stockStats.inventoryStock,
            icon: <Package size={20} />,
            bg: "#EFF6FF",
            color: "#3B82F6",
          },
          {
            label: "Out of Stock",
            value: stockStats.outOfStock,
            icon: <AlertCircle size={20} />,
            bg: "#FFF7ED",
            color: "#F59E0B",
          },
          {
            label: "Expired Items",
            value: stockStats.expired,
            icon: <CalendarX size={20} />,
            bg: "#FEF2F2",
            color: "#EF4444",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="card stat-card"
            style={{ padding: "16px 20px !important", height: "90px" }}>
            <div
              className="stat-icon"
              style={{
                background: stat.bg,
                color: stat.color,
                width: "42px",
                height: "42px",
                borderRadius: "12px",
              }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span
                className="label"
                style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                {stat.label}
              </span>
              <div
                className="value"
                style={{ fontSize: "1.1rem", marginTop: "0" }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div
          className="card"
          style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
              Sales Overview
            </h2>
            <div className="tabs">
              {["Day", "Week", "Month", "Year"].map((t) => (
                <div
                  key={t}
                  className={`tab ${timeFilter === t ? "active" : ""}`}
                  onClick={() => setTimeFilter(t)}>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: "300px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              marginBottom: "24px",
            }}>
            Inventory Status
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {inventoryChartData.labels.map((label, idx) => (
              <div key={label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                  }}>
                  <span style={{ fontWeight: "500", color: "#64748B" }}>
                    {label}
                  </span>
                  <span style={{ fontWeight: "700" }}>
                    {idx === 0 ? "75%" : idx === 1 ? "15%" : "10%"}
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "#F1F5F9",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}>
                  <div
                    style={{
                      width: idx === 0 ? "75%" : idx === 1 ? "15%" : "10%",
                      height: "100%",
                      background:
                        idx === 0
                          ? "#10B981"
                          : idx === 1
                            ? "#F59E0B"
                            : "#EF4444",
                      borderRadius: "10px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "32px",
              padding: "20px",
              background: "#F8FAFC",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0D9488",
              }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1rem" }}>
                ETB {stockStats.totalRevenue.toLocaleString()}
              </div>
              <div style={{ color: "#64748B", fontSize: "0.8rem" }}>
                Revenue generated from sales
              </div>
            </div>
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
            Recent Sales Transactions
          </h2>
        </div>
        <div className="table-container">
          <table style={{ margin: "0" }}>
            <thead style={{ background: "#F8FAFC" }}>
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
              {recentSales.map((sale) => (
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
                      Batch: {sale.batch || "N/A"}
                    </div>
                  </td>
                  <td style={{ padding: "20px 32px" }}>{sale.quantity}</td>
                  <td style={{ padding: "20px 32px" }}>
                    <div>
                      {new Date(getSaleDate(sale)).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                      {new Date(getSaleDate(sale)).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
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

export default Dashboard;
