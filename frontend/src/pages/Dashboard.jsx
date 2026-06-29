import React, { useEffect, useState, useMemo } from "react";
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
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { getSystemSettings } from "../services/settings.js";
import { fetchDashboardStats } from "../services/dashboard.js";

const getSaleDate = (sale) => {
  if (sale.createdAt?.toDate) return sale.createdAt.toDate();
  if (sale.createdAt instanceof Date) return sale.createdAt;
  if (sale.date) {
    const parsed = new Date(sale.date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

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
  const { t } = useSettings();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    expiryWarningDays: 60,
  });
  const [timeFilter, setTimeFilter] = useState("Week");

  const [pharmacyStats, setPharmacyStats] = useState({
    totalRevenue: 0,
    totalSalesCount: 0,
  });
  const [dailyStats, setDailyStats] = useState([]);
  const [stockStats, setStockStats] = useState({
    inventoryStock: 0,
    totalBatches: 0,
    outOfStock: 0,
    lowStock: 0,
    expired: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState( true );
  
  useEffect(() => {
    if (user?.pharmacyId) getSystemSettings(user.pharmacyId).then(setSettings);
  }, [user?.pharmacyId]);

  useEffect(() => {
    if (!user?.pharmacyId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        const response = await fetchDashboardStats(user.pharmacyId, {
          lowStockThreshold: settings?.lowStockThreshold,
          recentSalesLimit: 5,
        });

        setPharmacyStats(
          response.pharmacyStats || { totalRevenue: 0, totalSalesCount: 0 },
        );
        setDailyStats(response.dailySalesStats || []);
        setStockStats(
          response.stockStats || {
            inventoryStock: 0,
            totalBatches: 0,
            outOfStock: 0,
            lowStock: 0,
            expired: 0,
          },
        );
        setRecentSales(response.recentSales || []);
      } catch (error) {
        console.error("Unable to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.pharmacyId, settings]);

  const inventoryBreakdown = useMemo(() => {
    const total = stockStats.totalBatches;
    if (total === 0)
      return [
        { label: t("dashboard.inStock"), percent: 0, color: "#10B981" },
        { label: t("dashboard.lowStock"), percent: 0, color: "#F59E0B" },
        { label: t("dashboard.outOfStock"), percent: 0, color: "#EF4444" },
      ];

    const out = stockStats.outOfStock;
    const low = stockStats.lowStock;

    const outPct = Math.round((out / total) * 100);
    const lowPct = Math.round((low / total) * 100);
    const inPct = 100 - outPct - lowPct;

    return [
      { label: t("dashboard.inStock"), percent: inPct, color: "#10B981" },
      { label: t("dashboard.lowStock"), percent: lowPct, color: "#F59E0B" },
      { label: t("dashboard.outOfStock"), percent: outPct, color: "#EF4444" },
    ];
  }, [stockStats, t]);

  // ── Chart Logic ──
  const buildLabels = (filter) => {
    const now = new Date();
    if (filter === "Day")
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        return {
          key: d.toISOString().slice(0, 10),
          display: d.toLocaleDateString("default", { weekday: "short" }),
        };
      });
    if (filter === "Week") {
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);
      return Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date(thisWeekStart);
        weekStart.setDate(thisWeekStart.getDate() - (7 - i) * 7);
        return {
          key: weekStart.toISOString().slice(0, 10),
          display: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        };
      });
    }
    if (filter === "Month")
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          display: d.toLocaleString("default", { month: "short" }),
        };
      });
    const startYear = 2020;
    const currentYear = now.getFullYear();
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
      const year = startYear + i;
      return { key: String(year), display: String(year) };
    });
  };

  const chartData = useMemo(() => {
    const labels = buildLabels(timeFilter);
    const buckets = Object.fromEntries(labels.map((l) => [l.key, 0]));

    dailyStats.forEach((stat) => {
      if (!stat.date) return;
      const date = new Date(stat.date);
      let key = "";
      if (timeFilter === "Day") key = stat.date;
      else if (timeFilter === "Week") {
        const sunday = new Date(date);
        sunday.setDate(date.getDate() - date.getDay());
        sunday.setHours(0, 0, 0, 0);
        key = sunday.toISOString().slice(0, 10);
      } else if (timeFilter === "Month")
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      else key = String(date.getFullYear());

      if (key in buckets) buckets[key] += Number(stat.revenue || 0);
    });

    return {
      labels: labels.map((l) => l.display),
      datasets: [
        {
          label: "Sales (ETB)",
          data: labels.map((l) => buckets[l.key]),
          borderColor: "#0D9488",
          backgroundColor: "rgba(13, 148, 136, 0.15)",
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
  }, [dailyStats, timeFilter]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      y: { grid: { display: false }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading dashboard...
      </div>
    );

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
          {t("dashboard.overview")}
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            marginTop: "4px",
          }}>
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div
        className="stats-grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}>
        {[
          {
            label: t("dashboard.totalRevenue"),
            value: `${pharmacyStats.totalRevenue?.toLocaleString()} ETB`,
            icon: <DollarSign size={20} />,
            bg: "#F0FDFA",
            color: "#0D9488",
          },
          {
            label: t("dashboard.inventoryStock"),
            value: stockStats.inventoryStock.toLocaleString(),
            icon: <Package size={20} />,
            bg: "#EFF6FF",
            color: "#3B82F6",
          },
          {
            label: t("dashboard.lowStock"),
            value: stockStats.lowStock,
            icon: <AlertCircle size={20} />,
            bg: "#FFFBEB",
            color: "#D97706",
          },
          {
            label: t("dashboard.outOfStock"),
            value: stockStats.outOfStock,
            icon: <AlertCircle size={20} />,
            bg: "#FFF7ED",
            color: "#F59E0B",
          },
          {
            label: t("dashboard.expiredItems"),
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
              {t("dashboard.salesOverview")}
            </h2>
            <div className="tabs">
              {/* Fixed: Changed (t) to (filter) to avoid shadowing the translation function */}
              {["Day", "Week", "Month", "Year"].map((filter) => (
                <div
                  key={filter}
                  className={`tab ${timeFilter === filter ? "active" : ""}`}
                  onClick={() => setTimeFilter(filter)}>
                  {filter}
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
            {t("dashboard.inventoryStatus")}
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {inventoryBreakdown.map(({ label, percent, color }) => (
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
                  <span style={{ fontWeight: "700" }}>{percent}%</span>
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
                      width: `${percent}%`,
                      height: "100%",
                      background: color,
                      borderRadius: "10px",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "32px", padding: "0" }}>
        <div
          style={{ padding: "24px 32px", borderBottom: "1px solid #F1F5F9" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
            {t("dashboard.recentSales")}
          </h2>
        </div>
        <div className="table-container">
          <table style={{ margin: "0" }}>
            <thead style={{ background: "#F8FAFC" }}>
              <tr>
                <th>{t("dashboard.invoice")}</th>
                <th>{t("dashboard.items")}</th>
                <th>{t("dashboard.qty")}</th>
                <th>{t("dashboard.date")}</th>
                <th>{t("dashboard.amount")}</th>
                <th>{t("dashboard.status")}</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "#94A3B8",
                      padding: "40px",
                    }}>
                    {t("dashboard.noRecentSales")}
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td
                      style={{
                        fontWeight: "700",
                        color: "var(--primary)",
                        padding: "20px 32px",
                      }}>
                      #
                      {sale.invoiceNumber ||
                        sale.invoiceId ||
                        sale.id?.slice(0, 6)}
                    </td>
                    <td style={{ padding: "20px 32px" }}>
                      <div style={{ fontWeight: "600" }}>
                        {sale.items
                          ? sale.items.map((i) => i.name).join(", ")
                          : sale.item || "Unknown"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                        {sale.items
                          ? `${sale.items.length} items`
                          : `Batch: ${sale.batch || "N/A"}`}
                      </div>
                    </td>
                    <td style={{ padding: "20px 32px" }}>
                      {sale.items
                        ? sale.items.reduce((s, i) => s + i.quantity, 0)
                        : sale.quantity}
                    </td>
                    <td style={{ padding: "20px 32px" }}>
                      {getSaleDate(sale)?.toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: "800", padding: "20px 32px" }}>
                      ETB{" "}
                      {Number(sale.total || sale.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "20px 32px" }}>
                      <span
                        className="status-badge"
                        style={{
                          background:
                            sale.status === "Completed" ||
                            sale.status === "Delivered"
                              ? "#ECFDF5"
                              : "#FFFBEB",
                          color:
                            sale.status === "Completed" ||
                            sale.status === "Delivered"
                              ? "#059669"
                              : "#D97706",
                        }}>
                        {sale.status || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
