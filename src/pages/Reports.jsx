// src/pages/Reports.jsx
import React, { useEffect, useState } from "react";
import { Download, Calendar, Package, TrendingUp, Clock } from "lucide-react";
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
import { getAllSales, getAllMedicines } from "../services/firestoreService";

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

const PROFIT_MARGIN = 0.3; // 30% estimated — no cost price in data

const Reports = () => {
  const [activeTab, setActiveTab] = useState("Sales");
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const pieOptions = { ...chartOptions, scales: {} };

  // ── Helpers ──
  const getSaleDate = (sale) => {
    if (sale.createdAt && typeof sale.createdAt.toDate === "function")
      return sale.createdAt.toDate();
    if (sale.date) {
      const parsed = new Date(sale.date);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const getMedicineExpiryDate = (medicine) => {
    if (!medicine.expiry) return null;
    const parsed = new Date(medicine.expiry);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const buildMonthLabels = () => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return month.toLocaleString("default", { month: "short" });
    });
  };

  const buildMonthlyRevenue = (salesList) => {
    const labels = buildMonthLabels();
    const totals = labels.map((_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - 5 + i);
      return salesList
        .filter((sale) => {
          const d = getSaleDate(sale);
          return (
            d.getMonth() === month.getMonth() &&
            d.getFullYear() === month.getFullYear()
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
    const colors = ["#10B981", "#F59E0B", "#EF4444", "#0D9488"];
    return {
      labels,
      datasets: [
        {
          data: labels.map((s) => statusCounts[s]),
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
          hoverOffset: 15,
        },
      ],
    };
  };

  const getTopSellingProducts = (salesList) => {
    const counts = salesList.reduce((acc, sale) => {
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        sale.items.forEach((item) => {
          const name = item.name || "Unknown";
          acc[name] = (acc[name] || 0) + Number(item.quantity || 0);
        });
      } else {
        const name = sale.item || sale.product || "Unknown";
        acc[name] = (acc[name] || 0) + Number(sale.quantity || 0);
      }
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  // ── Load Data ──
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const [salesList, medicinesList] = await Promise.all([
          getAllSales(),
          getAllMedicines(),
        ]);
        setSales(salesList);
        setMedicines(medicinesList);

        const totalRevenue = salesList.reduce(
          (sum, sale) => sum + Number(sale.amount || 0),
          0,
        );
        const totalTransactions = salesList.length;
        const deliveredCount = salesList.filter(
          (s) => s.status === "Delivered",
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

        const { labels, totals } = buildMonthlyRevenue(salesList);
        setSalesChartData({
          labels,
          datasets: [
            {
              label: "Revenue",
              data: totals,
              backgroundColor: "#0D9488",
              borderRadius: 12,
              barThickness: 28,
            },
          ],
        });
        setPieData(buildStatusPie(salesList));
      } catch (err) {
        console.error("Failed to load report data:", err);
        setError("Unable to fetch report data from Firestore.");
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  // ── Inventory Derived ──
  const totalStock = medicines.reduce(
    (sum, med) => sum + Number(med.stock || 0),
    0,
  );
  const lowStockCount = medicines.filter(
    (med) => Number(med.stock || 0) > 0 && Number(med.stock || 0) <= 10,
  ).length;
  const outOfStockCount = medicines.filter(
    (med) => Number(med.stock || 0) === 0,
  ).length;
  const inStockCount = medicines.length - lowStockCount - outOfStockCount;
  const categories = [
    ...new Set(medicines.map((med) => med.category || "Uncategorized")),
  ];

  const inventoryCategoryChartData = (() => {
    const totals = medicines.reduce((acc, med) => {
      const cat = med.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + Number(med.stock || 0);
      return acc;
    }, {});
    const labels = Object.keys(totals);
    const colors = [
      "#0D9488",
      "#2563EB",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
    ];
    return {
      labels,
      datasets: [
        {
          label: "Stock Units",
          data: labels.map((l) => totals[l]),
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderRadius: 12,
          barThickness: 28,
        },
      ],
    };
  })();

  const inventoryStatusPie = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [inStockCount, lowStockCount, outOfStockCount],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderWidth: 0,
        hoverOffset: 12,
      },
    ],
  };

  // ── Expiration Derived ──
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiredMeds = medicines.filter((med) => {
    const exp = getMedicineExpiryDate(med);
    return exp && exp < now;
  });
  const expiringSoonMeds = medicines.filter((med) => {
    const exp = getMedicineExpiryDate(med);
    return exp && exp >= now && exp <= in30Days;
  });
  const freshMeds = medicines.filter((med) => {
    const exp = getMedicineExpiryDate(med);
    return !exp || exp > in30Days;
  });

  const expirationPieData = {
    labels: ["Expired", "Expiring Soon", "Fresh"],
    datasets: [
      {
        data: [expiredMeds.length, expiringSoonMeds.length, freshMeds.length],
        backgroundColor: ["#EF4444", "#F59E0B", "#0D9488"],
        borderWidth: 0,
        hoverOffset: 12,
      },
    ],
  };

  const expirationTimelineData = (() => {
    const months = {};
    medicines.forEach((med) => {
      const exp = getMedicineExpiryDate(med);
      if (exp) {
        const key = exp.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        months[key] = (months[key] || 0) + 1;
      }
    });
    const sorted = Object.entries(months)
      .sort((a, b) => new Date("1 " + a[0]) - new Date("1 " + b[0]))
      .slice(0, 8);
    return {
      labels: sorted.map((e) => e[0]),
      datasets: [
        {
          label: "Medicines Expiring",
          data: sorted.map((e) => e[1]),
          backgroundColor: sorted.map((_, i) =>
            i === 0 ? "#EF4444" : "#F59E0B",
          ),
          borderRadius: 12,
          barThickness: 28,
        },
      ],
    };
  })();

  const medicinesSortedByExpiry = [...medicines]
    .filter((med) => getMedicineExpiryDate(med))
    .sort((a, b) => getMedicineExpiryDate(a) - getMedicineExpiryDate(b));

  const getExpiryStatusLabel = (med) => {
    const exp = getMedicineExpiryDate(med);
    if (!exp) return { label: "No Date", color: "#94A3B8", bg: "#F8FAFC" };
    if (exp < now) return { label: "Expired", color: "#DC2626", bg: "#FEF2F2" };
    if (exp <= in30Days)
      return { label: "Expiring Soon", color: "#D97706", bg: "#FFFBEB" };
    return { label: "Fresh", color: "#059669", bg: "#ECFDF5" };
  };

  // ── Profit Derived ──
  const totalEstimatedProfit = Math.round(stats.totalRevenue * PROFIT_MARGIN);
  const topSelling = getTopSellingProducts(sales);

  const monthlyProfitChartData = (() => {
    const labels = buildMonthLabels();
    const totals = labels.map((_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - 5 + i);
      const revenue = sales
        .filter((sale) => {
          const d = getSaleDate(sale);
          return (
            d.getMonth() === month.getMonth() &&
            d.getFullYear() === month.getFullYear()
          );
        })
        .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
      return Math.round(revenue * PROFIT_MARGIN);
    });
    return {
      labels,
      datasets: [
        {
          label: "Est. Profit (ETB)",
          data: totals,
          backgroundColor: "#8B5CF6",
          borderRadius: 12,
          barThickness: 28,
        },
      ],
    };
  })();

  const profitByProductData = (() => {
    const top = topSelling.slice(0, 5);
    const colors = ["#0D9488", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6"];
    return {
      labels: top.map(([name]) => name),
      datasets: [
        {
          data: top.map(([name, qty]) => {
            const med = medicines.find((m) => m.name === name);
            const price = med ? Number(med.price || 0) : 0;
            return Math.round(qty * price * PROFIT_MARGIN);
          }),
          backgroundColor: top.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
          hoverOffset: 12,
        },
      ],
    };
  })();

  // ── Render ──
  return (
    <div className="reports-page">
      {/* Header */}
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

      {/* Tabs */}
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

      {/* ── SALES TAB ── */}
      {activeTab === "Sales" && (
        <>
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
                <Pie data={pieData} options={pieOptions} />
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
                              sale.status === "Delivered"
                                ? "#ECFDF5"
                                : "#FFFBEB",
                            color:
                              sale.status === "Delivered"
                                ? "#059669"
                                : "#D97706",
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
        </>
      )}

      {/* ── INVENTORY TAB ── */}
      {activeTab === "Inventory" && (
        <>
          <div className="stats-grid" style={{ marginBottom: "32px" }}>
            {[
              {
                label: "Total Stock",
                value: `${totalStock.toLocaleString()} units`,
                bg: "#F0FDFA",
                color: "#0D9488",
              },
              {
                label: "Low Stock Items",
                value: lowStockCount,
                bg: "#FFFBEB",
                color: "#B45309",
              },
              {
                label: "Out of Stock",
                value: outOfStockCount,
                bg: "#FEF2F2",
                color: "#DC2626",
              },
              {
                label: "Categories",
                value: categories.length,
                bg: "#EFF6FF",
                color: "#2563EB",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="card"
                style={{
                  padding: "24px",
                  background: item.bg,
                  border: "none",
                }}>
                <div
                  style={{
                    fontWeight: "600",
                    color: item.color,
                    fontSize: "0.85rem",
                  }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "1.8rem",
                    marginTop: "8px",
                    color: "#0F172A",
                  }}>
                  {item.value}
                </div>
              </div>
            ))}
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
                  Stock by Category
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#64748B",
                    fontSize: "0.9rem",
                  }}>
                  <Package size={18} /> All Categories
                </div>
              </div>
              <div style={{ height: "350px" }}>
                <Bar data={inventoryCategoryChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  marginBottom: "24px",
                }}>
                Stock Status
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  marginBottom: "24px",
                }}>
                {[
                  {
                    label: "In Stock",
                    value: inStockCount,
                    bg: "#ECFDF5",
                    color: "#059669",
                  },
                  {
                    label: "Low Stock",
                    value: lowStockCount,
                    bg: "#FFFBEB",
                    color: "#D97706",
                  },
                  {
                    label: "Out of Stock",
                    value: outOfStockCount,
                    bg: "#FEF2F2",
                    color: "#DC2626",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "16px",
                      background: item.bg,
                      borderRadius: "16px",
                      textAlign: "center",
                    }}>
                    <div
                      style={{
                        fontWeight: "600",
                        color: item.color,
                        fontSize: "0.8rem",
                      }}>
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: "1.4rem",
                        marginTop: "8px",
                      }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ height: "300px" }}>
                <Pie data={inventoryStatusPie} options={pieOptions} />
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
                Medicine Inventory
              </h2>
              <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
                {medicines.length} products
              </span>
            </div>
            <div className="table-container">
              <table style={{ margin: "0" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price (ETB)</th>
                    <th>Supplier</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.slice(0, 10).map((med) => {
                    const stock = Number(med.stock || 0);
                    const isOut = stock === 0;
                    const isLow = stock > 0 && stock <= 10;
                    return (
                      <tr key={med.id}>
                        <td style={{ padding: "20px 32px" }}>
                          <div style={{ fontWeight: "600" }}>{med.name}</div>
                          <div
                            style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                            {med.dosage || "N/A"}
                          </div>
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          {med.category || "—"}
                        </td>
                        <td style={{ padding: "20px 32px", fontWeight: "700" }}>
                          {stock}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          ETB {Number(med.price || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          {med.supplier || "—"}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          <span
                            className="status-badge"
                            style={{
                              background: isOut
                                ? "#FEF2F2"
                                : isLow
                                  ? "#FFFBEB"
                                  : "#ECFDF5",
                              color: isOut
                                ? "#DC2626"
                                : isLow
                                  ? "#D97706"
                                  : "#059669",
                            }}>
                            {isOut
                              ? "Out of Stock"
                              : isLow
                                ? "Low Stock"
                                : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── PROFIT TAB ── */}
      {activeTab === "Profit" && (
        <>
          <div
            style={{
              padding: "12px 20px",
              background: "#EFF6FF",
              borderRadius: "12px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.85rem",
              color: "#1D4ED8",
            }}>
            <TrendingUp size={16} />
            Profit is estimated at a 30% margin on revenue — purchase cost data
            is not available in the current dataset.
          </div>

          <div className="stats-grid" style={{ marginBottom: "32px" }}>
            {[
              {
                label: "Estimated Profit",
                value: `ETB ${totalEstimatedProfit.toLocaleString()}`,
                bg: "#F5F3FF",
                color: "#7C3AED",
              },
              {
                label: "Total Revenue",
                value: `ETB ${stats.totalRevenue.toLocaleString()}`,
                bg: "#F0FDFA",
                color: "#0D9488",
              },
              {
                label: "Profit Margin",
                value: "30%",
                bg: "#EFF6FF",
                color: "#2563EB",
              },
              {
                label: "Avg Monthly Profit",
                value: `ETB ${Math.round(totalEstimatedProfit / 6).toLocaleString()}`,
                bg: "#FFFBEB",
                color: "#B45309",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="card"
                style={{
                  padding: "24px",
                  background: item.bg,
                  border: "none",
                }}>
                <div
                  style={{
                    fontWeight: "600",
                    color: item.color,
                    fontSize: "0.85rem",
                  }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "1.8rem",
                    marginTop: "8px",
                    color: "#0F172A",
                  }}>
                  {item.value}
                </div>
              </div>
            ))}
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
                  Monthly Estimated Profit
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
                <Bar data={monthlyProfitChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  marginBottom: "24px",
                }}>
                Est. Profit by Product
              </h2>
              <div style={{ height: "380px" }}>
                <Pie data={profitByProductData} options={pieOptions} />
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
                Top Products by Est. Profit
              </h2>
              <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
                Top {topSelling.length} products
              </span>
            </div>
            <div className="table-container">
              <table style={{ margin: "0" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Unit Price (ETB)</th>
                    <th>Est. Revenue (ETB)</th>
                    <th>Est. Profit (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  {topSelling.map(([name, qty], index) => {
                    const med = medicines.find((m) => m.name === name);
                    const price = med ? Number(med.price || 0) : 0;
                    const revenue = qty * price;
                    const profit = Math.round(revenue * PROFIT_MARGIN);
                    return (
                      <tr key={name}>
                        <td
                          style={{
                            padding: "20px 32px",
                            fontWeight: "700",
                            color: "var(--primary)",
                          }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: "20px 32px", fontWeight: "600" }}>
                          {name}
                        </td>
                        <td style={{ padding: "20px 32px" }}>{qty}</td>
                        <td style={{ padding: "20px 32px" }}>
                          {price > 0 ? `ETB ${price}` : "—"}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          {price > 0 ? `ETB ${revenue.toLocaleString()}` : "—"}
                        </td>
                        <td
                          style={{
                            padding: "20px 32px",
                            fontWeight: "800",
                            color: "#7C3AED",
                          }}>
                          {price > 0 ? `ETB ${profit.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── EXPIRATION TAB ── */}
      {activeTab === "Expiration" && (
        <>
          <div className="stats-grid" style={{ marginBottom: "32px" }}>
            {[
              {
                label: "Expired",
                value: expiredMeds.length,
                bg: "#FEF2F2",
                color: "#DC2626",
              },
              {
                label: "Expiring in 30 Days",
                value: expiringSoonMeds.length,
                bg: "#FFFBEB",
                color: "#D97706",
              },
              {
                label: "Fresh Stock",
                value: freshMeds.length,
                bg: "#ECFDF5",
                color: "#059669",
              },
              {
                label: "Total Tracked",
                value: medicines.length,
                bg: "#EFF6FF",
                color: "#2563EB",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="card"
                style={{
                  padding: "24px",
                  background: item.bg,
                  border: "none",
                }}>
                <div
                  style={{
                    fontWeight: "600",
                    color: item.color,
                    fontSize: "0.85rem",
                  }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "1.8rem",
                    marginTop: "8px",
                    color: "#0F172A",
                  }}>
                  {item.value}
                </div>
              </div>
            ))}
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
                  Expiration Timeline
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#64748B",
                    fontSize: "0.9rem",
                  }}>
                  <Clock size={18} /> By Month
                </div>
              </div>
              <div style={{ height: "350px" }}>
                <Bar data={expirationTimelineData} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  marginBottom: "24px",
                }}>
                Expiration Status
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  marginBottom: "24px",
                }}>
                {[
                  {
                    label: "Expired",
                    value: expiredMeds.length,
                    bg: "#FEF2F2",
                    color: "#DC2626",
                  },
                  {
                    label: "Expiring Soon",
                    value: expiringSoonMeds.length,
                    bg: "#FFFBEB",
                    color: "#D97706",
                  },
                  {
                    label: "Fresh",
                    value: freshMeds.length,
                    bg: "#ECFDF5",
                    color: "#059669",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "16px",
                      background: item.bg,
                      borderRadius: "16px",
                      textAlign: "center",
                    }}>
                    <div
                      style={{
                        fontWeight: "600",
                        color: item.color,
                        fontSize: "0.8rem",
                      }}>
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: "1.4rem",
                        marginTop: "8px",
                      }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ height: "300px" }}>
                <Pie data={expirationPieData} options={pieOptions} />
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
                Medicine Expiry Details
              </h2>
              <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
                {medicinesSortedByExpiry.length} medicines tracked
              </span>
            </div>
            <div className="table-container">
              <table style={{ margin: "0" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Batch</th>
                    <th>Stock</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medicinesSortedByExpiry.slice(0, 10).map((med) => {
                    const { label, color, bg } = getExpiryStatusLabel(med);
                    const exp = getMedicineExpiryDate(med);
                    return (
                      <tr key={med.id}>
                        <td style={{ padding: "20px 32px" }}>
                          <div style={{ fontWeight: "600" }}>{med.name}</div>
                          <div
                            style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                            {med.dosage || "N/A"}
                          </div>
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          {med.category || "—"}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          {med.batch || "—"}
                        </td>
                        <td style={{ padding: "20px 32px", fontWeight: "700" }}>
                          {med.stock}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          {exp ? exp.toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "20px 32px" }}>
                          <span
                            className="status-badge"
                            style={{ background: bg, color }}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
