import React, { useEffect, useState, useMemo } from "react";
import {
  Download,
  Calendar,
  Package,
  TrendingUp,
  Clock,
  FileText,
  ChevronDown,
} from "lucide-react";
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
import { useAuth } from "../context/AuthContext";

import {
  getSystemSettings,
  getAllSales,
  getAllMedicines,
  getAllStockBatches,
} from "../services/firestoreService";

import { exportToPDF } from "../utils/exportToPdf.js";

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


const PAYMENT_METHODS = ["Cash", "CBE Birr", "Telebirr", "Bank Transfer"];

const getSaleDate = (sale) => {
  if (sale.createdAt?.toDate) return sale.createdAt.toDate();
  if (sale.createdAt instanceof Date) return sale.createdAt;
  if (sale.date) {
    const parsed = new Date(sale.date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const getBatchExpiryDate = (batch) => {
  if (!batch.expiry) return null;
  const parsed = batch.expiry?.toDate
    ? batch.expiry.toDate()
    : new Date(batch.expiry);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getPeriodRange = (period, customStart, customEnd) => {
  const now = new Date();
  if (period === "Custom")
    return {
      start: customStart ? new Date(customStart) : new Date(),
      end: customEnd
        ? new Date(new Date(customEnd).setHours(23, 59, 59, 999))
        : new Date(),
    };
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "Daily")
    return { start, end: new Date(new Date().setHours(23, 59, 59, 999)) };
  if (period === "Weekly") {
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "Monthly") {
    start.setDate(1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { start, end };
  }
  if (period === "Yearly") {
    start.setMonth(0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
  return { start: new Date(0), end: new Date() };
};

const filterSalesByPeriod = (sales, period, customStart, customEnd) => {
  if (period === "All Time") return sales;
  const { start, end } = getPeriodRange(period, customStart, customEnd);
  return sales.filter((sale) => {
    const d = getSaleDate(sale);
    return d && d >= start && d <= end;
  });
};

// Real Profit Calculator
const calculateRealProfit = (salesList) => {
  return salesList.reduce((totalProfit, sale) => {
    if (sale.items && Array.isArray(sale.items)) {
      return (
        totalProfit +
        sale.items.reduce(
          (p, item) =>
            p +
            Number(item.quantity || 0) *
              (Number(item.price || 0) - Number(item.costPrice || 0)),
          0,
        )
      );
    }
    return totalProfit + Number(sale.total || sale.amount || 0) * 0.3; // Fallback for old flat data
  }, 0);
};

const buildChartLabels = (period) => {
  const now = new Date();
  if (period === "Daily")
    return Array.from({ length: 24 }, (_, i) => ({
      key: i,
      display: `${String(i).padStart(2, "0")}:00`,
    }));
  if (period === "Weekly")
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => ({
      key: i,
      display: d,
    }));
  if (period === "Monthly") {
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      key: i + 1,
      display: String(i + 1),
    }));
  }
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), i, 1);
    return { key: i, display: d.toLocaleString("default", { month: "short" }) };
  });
};

const buildChartData = (
  salesList,
  period,
  color = "#0D9488",
  label = "Revenue (ETB)",
  getValue = (s) => Number(s.total || s.amount || 0),
) => {
  if (period === "All Time") {
    const years = {};
    salesList.forEach((s) => {
      const d = getSaleDate(s);
      if (!d) return;
      const y = String(d.getFullYear());
      years[y] = (years[y] || 0) + getValue(s);
    });
    const sorted = Object.entries(years).sort((a, b) => a[0] - b[0]);
    return {
      labels: sorted.map(([y]) => y),
      datasets: [
        {
          label,
          data: sorted.map(([, v]) => Math.round(v)),
          backgroundColor: color,
          borderRadius: 10,
          barThickness: 28,
        },
      ],
    };
  }
  if (period === "Custom") {
    const days = {};
    salesList.forEach((s) => {
      const d = getSaleDate(s);
      if (!d) return;
      const key = d.toLocaleDateString();
      days[key] = (days[key] || 0) + getValue(s);
    });
    const sorted = Object.entries(days).sort(
      (a, b) => new Date(a[0]) - new Date(b[0]),
    );
    return {
      labels: sorted.map(([k]) => k),
      datasets: [
        {
          label,
          data: sorted.map(([, v]) => Math.round(v)),
          backgroundColor: color,
          borderRadius: 10,
          barThickness: 28,
        },
      ],
    };
  }
  const chartLabels = buildChartLabels(period);
  const buckets = Object.fromEntries(chartLabels.map((l) => [l.key, 0]));
  salesList.forEach((s) => {
    const d = getSaleDate(s);
    if (!d) return;
    let key;
    if (period === "Daily") key = d.getHours();
    else if (period === "Weekly") key = d.getDay();
    else if (period === "Monthly") key = d.getDate();
    else key = d.getMonth();
    if (key in buckets) buckets[key] += getValue(s);
  });
  return {
    labels: chartLabels.map((l) => l.display),
    datasets: [
      {
        label,
        data: chartLabels.map((l) => Math.round(buckets[l.key])),
        backgroundColor: color,
        borderRadius: 10,
        barThickness: 28,
      },
    ],
  };
};
// Real Profit Calculator


const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Sales");
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    expiryWarningDays: 60,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("Monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const PERIODS = [
    "Daily",
    "Weekly",
    "Monthly",
    "Yearly",
    "All Time",
    "Custom",
  ];
  useEffect(() => {
    if (user?.pharmacyId) getSystemSettings(user.pharmacyId).then(setSettings);
  }, [user?.pharmacyId]);
  // Fetch all data including batches
  useEffect(() => {
    if (!user?.pharmacyId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [salesList, medicinesList, batchesList] = await Promise.all([
          getAllSales(user.pharmacyId),
          getAllMedicines(user.pharmacyId),
          getAllStockBatches(user.pharmacyId),
        ]);
        setSales(salesList);
        setMedicines(medicinesList);
        setBatches(batchesList);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch report data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredSales = useMemo(
    () => filterSalesByPeriod(sales, reportPeriod, customStart, customEnd),
    [sales, reportPeriod, customStart, customEnd],
  );

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce(
      (s, sale) => s + Number(sale.total || sale.amount || 0),
      0,
    );
    const totalTransactions = filteredSales.length;
    const deliveredCount = filteredSales.filter(
      (s) => s.status === "Delivered" || s.status === "Completed",
    ).length;
    return {
      totalRevenue,
      totalTransactions,
      averageOrder:
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      deliveredRate:
        totalTransactions > 0
          ? Math.round((deliveredCount / totalTransactions) * 100)
          : 0,
    };
  }, [filteredSales]);

  // Calculate Real Profit
  const totalRealProfit = useMemo(
    () => calculateRealProfit(filteredSales),
    [filteredSales],
  );

  const paymentBreakdown = useMemo(() => {
    return PAYMENT_METHODS.map((method) => {
      const methodSales = filteredSales.filter(
        (s) => (s.paymentMethod || s.payment || "Cash") === method,
      );
      return {
        method,
        count: methodSales.length,
        total: methodSales.reduce(
          (sum, s) => sum + Number(s.total || s.amount || 0),
          0,
        ),
      };
    });
  }, [filteredSales]);

  const salesChartData = useMemo(
    () => buildChartData(filteredSales, reportPeriod),
    [filteredSales, reportPeriod],
  );
  const profitChartData = useMemo(
    () =>
      buildChartData(
        filteredSales,
        reportPeriod,
        "#8B5CF6",
        "Real Profit (ETB)",
        (s) => calculateRealProfit([s]),
      ),
    [filteredSales, reportPeriod],
  );

  const pieData = useMemo(() => {
    const statusCounts = filteredSales.reduce((acc, sale) => {
      const s = sale.status || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const labels = Object.keys(statusCounts);
    return {
      labels,
      datasets: [
        {
          data: labels.map((s) => statusCounts[s]),
          backgroundColor: ["#10B981", "#F59E0B", "#EF4444", "#0D9488"],
          borderWidth: 0,
        },
      ],
    };
  }, [filteredSales]);

  const paymentPieData = useMemo(
    () => ({
      labels: paymentBreakdown.map((p) => p.method),
      datasets: [
        {
          data: paymentBreakdown.map((p) => p.total),
          backgroundColor: ["#0D9488", "#2563EB", "#8B5CF6", "#F59E0B"],
          borderWidth: 0,
        },
      ],
    }),
    [paymentBreakdown],
  );

  // Map batches to medicines (Split Data Model)
  const medMap = useMemo(
    () =>
      medicines.reduce((acc, m) => {
        acc[m.id] = m;
        return acc;
      }, {}),
    [medicines],
  );
  const enrichedBatches = useMemo(
    () =>
      batches.map((b) => ({
        ...b,
        name: medMap[b.medicineId]?.name || "Unknown",
        category: medMap[b.medicineId]?.category || "Uncategorized",
        supplier: medMap[b.medicineId]?.supplierName || "N/A",
        price: b.sellingPrice || medMap[b.medicineId]?.price || 0,
        costPrice: b.costPrice || 0,
        batch: b.batchNo,
        stock: b.quantity,
      })),
    [batches, medMap],
  );

  const totalStock = enrichedBatches.reduce(
    (s, b) => s + Number(b.stock || 0),
    0,
  );
  // const lowStockCount = enrichedBatches.filter(
  //   (b) => Number(b.stock) > 0 && Number(b.stock) <= 10,
  // ).length;
    const lowStockCount = batches.filter(
      (b) =>
        Number(b.quantity) > 0 &&
        Number(b.quantity) <= settings.lowStockThreshold,
    ).length;
  const outOfStockCount = enrichedBatches.filter(
    (b) => Number(b.stock) === 0,
  ).length;
  const inStockCount = enrichedBatches.length - lowStockCount - outOfStockCount;
  const categories = [...new Set(enrichedBatches.map((b) => b.category))];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiredBatches = enrichedBatches.filter((b) => {
    const e = getBatchExpiryDate(b);
    return e && e < now;
  });
  const expiringSoonBatches = enrichedBatches.filter((b) => {
    const e = getBatchExpiryDate(b);
    return e && e >= now && e <= in30Days;
  });
  const freshBatches = enrichedBatches.filter((b) => {
    const e = getBatchExpiryDate(b);
    return !e || e > in30Days;
  });

  const batchesSortedByExpiry = useMemo(
    () =>
      [...enrichedBatches]
        .filter((b) => getBatchExpiryDate(b))
        .sort((a, b) => getBatchExpiryDate(a) - getBatchExpiryDate(b)),
    [enrichedBatches],
  );

  // Top selling with real profit calculation
  const topSelling = useMemo(() => {
    const counts = {};
    filteredSales.forEach((sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const name = item.name || "Unknown";
          if (!counts[name])
            counts[name] = {
              qty: 0,
              revenue: 0,
              profit: 0,
              price: item.price || 0,
            };
          counts[name].qty += Number(item.quantity || 0);
          counts[name].revenue += Number(
            item.total || item.price * item.quantity || 0,
          );
          counts[name].profit +=
            Number(item.quantity || 0) *
            (Number(item.price || 0) - Number(item.costPrice || 0));
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5);
  }, [filteredSales]);

  const profitByProductData = useMemo(() => {
    const colors = ["#0D9488", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6"];
    return {
      labels: topSelling.map(([name]) => name),
      datasets: [
        {
          data: topSelling.map(([, data]) => data.profit),
          backgroundColor: topSelling.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [topSelling]);

  const handleExport = async () => {
    if (reportPeriod === "Custom" && (!customStart || !customEnd)) {
      alert("Please select both a start and end date for the custom range.");
      return;
    }
    setExporting(true);
    try {
      exportToPDF(
        activeTab,
        reportPeriod,
        filteredSales,
        stats,
        medicines,
        customStart,
        customEnd,
        {
          paymentBreakdown,
          topSelling,
          totalStock,
          lowStockCount,
          outOfStockCount,
          inStockCount,
          categories: categories.length,
          medicines: enrichedBatches,
          expiredBatches,
          expiringSoonBatches,
          freshBatches,
          batchesSortedByExpiry,
          totalBatches: enrichedBatches.length,
        },
        getPeriodRange,
        getSaleDate,
        calculateRealProfit,
        getBatchExpiryDate,
      );
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, padding: 16, font: { size: 12 } },
      },
      tooltip: {
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed?.y !== undefined ? ctx.parsed.y : ctx.raw;
            return ` ${ctx.label || ctx.dataset.label}: ETB ${Number(value).toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        grid: { borderDash: [5, 5], drawBorder: false },
        beginAtZero: true,
        ticks: { callback: (v) => `ETB ${Number(v).toLocaleString()}` },
      },
      x: { grid: { display: false } },
    },
  };

  const pieOptions = {
    ...chartOptions,
    scales: {},
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const value = ctx.raw;
            const label = ctx.label;
            // Detect if this pie chart represents money or counts
            const isMonetary =
              ["Cash", "CBE Birr", "Telebirr", "Bank Transfer"].includes(
                label,
              ) || ctx.dataset.label?.includes("Profit");
            if (isMonetary)
              return ` ${label}: ETB ${Number(value).toLocaleString()}`;
            return ` ${label}: ${Number(value).toLocaleString()} items`;
          },
        },
      },
    },
  };

  const periodDisplayLabel = (() => {
    if (reportPeriod === "All Time") return "All Time";
    if (reportPeriod === "Custom")
      return customStart && customEnd
        ? `${new Date(customStart).toLocaleDateString()} – ${new Date(customEnd).toLocaleDateString()}`
        : "Select date range";
    const { start, end } = getPeriodRange(reportPeriod);
    return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  })();

  const tabStats = {
    Sales: [
      {
        label: "Revenue",
        value: `ETB ${stats.totalRevenue.toLocaleString()}`,
        bg: "#F0FDFA",
        color: "#0D9488",
      },
      {
        label: "Transactions",
        value: stats.totalTransactions,
        bg: "#EFF6FF",
        color: "#2563EB",
      },
      {
        label: "Avg Order",
        value: `ETB ${stats.averageOrder.toFixed(0)}`,
        bg: "#F5F3FF",
        color: "#7C3AED",
      },
      {
        label: "Real Profit",
        value: `ETB ${totalRealProfit.toLocaleString()}`,
        bg: "#ECFDF5",
        color: "#059669",
      },
    ],
    Inventory: [
      {
        label: "Total Stock",
        value: `${totalStock.toLocaleString()} units`,
        bg: "#F0FDFA",
        color: "#0D9488",
      },
      {
        label: "Low Stock Batches",
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
    ],
    Profit: [
      {
        label: "Real Profit",
        value: `ETB ${totalRealProfit.toLocaleString()}`,
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
        label: "Margin",
        value:
          stats.totalRevenue > 0
            ? `${((totalRealProfit / stats.totalRevenue) * 100).toFixed(1)}%`
            : "0%",
        bg: "#EFF6FF",
        color: "#2563EB",
      },
      {
        label: "Transactions",
        value: stats.totalTransactions,
        bg: "#FFFBEB",
        color: "#B45309",
      },
    ],
    Expiration: [
      {
        label: "Expired Batches",
        value: expiredBatches.length,
        bg: "#FEF2F2",
        color: "#DC2626",
      },
      {
        label: "Expiring in 30 Days",
        value: expiringSoonBatches.length,
        bg: "#FFFBEB",
        color: "#D97706",
      },
      {
        label: "Fresh Stock",
        value: freshBatches.length,
        bg: "#ECFDF5",
        color: "#059669",
      },
      {
        label: "Total Batches",
        value: enrichedBatches.length,
        bg: "#EFF6FF",
        color: "#2563EB",
      },
    ],
  };

  const countBarOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed?.y !== undefined ? ctx.parsed.y : ctx.raw;
            return ` ${ctx.label}: ${Number(value).toLocaleString()} units`;
          },
        },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: { callback: (v) => `${Number(v).toLocaleString()}` },
      },
    },
  };

  const countBarOptionsBatches = {
    ...countBarOptions,
    plugins: {
      ...countBarOptions.plugins,
      tooltip: {
        ...countBarOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed?.y !== undefined ? ctx.parsed.y : ctx.raw;
            return ` ${ctx.label}: ${Number(value).toLocaleString()} batches`;
          },
        },
      },
    },
  };

  const inventoryStatusPieData = useMemo(() => {
    return {
      labels: ["In Stock", "Low Stock", "Out of Stock"],
      datasets: [
        {
          data: [inStockCount, lowStockCount, outOfStockCount],
          backgroundColor: ["#059669", "#D97706", "#DC2626"],
          borderWidth: 0,
        },
      ],
    };
  }, [inStockCount, lowStockCount, outOfStockCount]);

  const inventoryCategoryBarData = useMemo(() => {
    const catCounts = {};
    enrichedBatches.forEach((b) => {
      const cat = b.category || "Uncategorized";
      catCounts[cat] = (catCounts[cat] || 0) + Number(b.stock || 0);
    });
    const sortedCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return {
      labels: sortedCats.map(([cat]) => cat),
      datasets: [
        {
          label: "Total Stock Units",
          data: sortedCats.map(([, count]) => count),
          backgroundColor: "#2563EB",
          borderRadius: 10,
          barThickness: 28,
        },
      ],
    };
  }, [enrichedBatches]);

  const expirationStatusPieData = useMemo(() => {
    return {
      labels: ["Expired", "Expiring Soon (30 Days)", "Fresh Stock"],
      datasets: [
        {
          data: [
            expiredBatches.length,
            expiringSoonBatches.length,
            freshBatches.length,
          ],
          backgroundColor: ["#DC2626", "#D97706", "#059669"],
          borderWidth: 0,
        },
      ],
    };
  }, [expiredBatches, expiringSoonBatches, freshBatches]);

  const expirationBarData = useMemo(() => {
    return {
      labels: ["Expired", "Expiring Soon", "Fresh Stock"],
      datasets: [
        {
          label: "Number of Batches",
          data: [
            expiredBatches.length,
            expiringSoonBatches.length,
            freshBatches.length,
          ],
          backgroundColor: ["#DC2626", "#D97706", "#059669"],
          borderRadius: 10,
          barThickness: 40,
        },
      ],
    };
  }, [expiredBatches, expiringSoonBatches, freshBatches]);

  return (
    <div
      className="reports-page"
      onClick={() => showPeriodMenu && setShowPeriodMenu(false)}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
        }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPeriodMenu((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                border: "2px solid #E2E8F0",
                background: "white",
                fontWeight: "700",
                cursor: "pointer",
              }}>
              <FileText size={16} style={{ color: "#0D9488" }} /> {reportPeriod}{" "}
              Report <ChevronDown size={14} />
            </button>
            {showPeriodMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "white",
                  borderRadius: "14px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  zIndex: 100,
                  minWidth: "160px",
                }}>
                {PERIODS.map((p) => (
                  <div
                    key={p}
                    onClick={() => {
                      setReportPeriod(p);
                      setShowPeriodMenu(false);
                    }}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      background: reportPeriod === p ? "#F0FDFA" : "white",
                    }}>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
          {reportPeriod === "Custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "2px solid #E2E8F0",
                }}
              />
              <span>–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "2px solid #E2E8F0",
                }}
              />
            </div>
          )}
          {reportPeriod !== "Custom" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 14px",
                background: "#F8FAFC",
                borderRadius: "12px",
              }}>
              <Calendar size={14} /> {periodDisplayLabel}
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting || loading}
            style={{
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
            <Download size={18} /> {exporting ? "Generating..." : `Export PDF`}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
          marginBottom: "24px",
        }}>
        {(tabStats[activeTab] || tabStats.Sales).map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              borderRadius: "16px",
              padding: "18px 20px",
            }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: "700",
                color: s.color,
                textTransform: "uppercase",
                marginBottom: "6px",
              }}>
              {s.label}
            </div>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: "800",
                color: "#0F172A",
              }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "28px", padding: "14px" }}>
        <div className="tabs" style={{ background: "#F8FAFC" }}>
          {["Sales", "Inventory", "Profit", "Expiration"].map((tab) => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              style={{ minWidth: "140px", textAlign: "center" }}>
              {tab}
            </div>
          ))}
        </div>
      </div>

      {error && <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>}

      {activeTab === "Sales" && (
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                    Revenue Overview
                  </h2>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "#94A3B8",
                      marginTop: "2px",
                    }}>
                    {filteredSales.length} transactions · {reportPeriod}
                  </p>
                </div>
              </div>
              <div style={{ height: "320px" }}>
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#94A3B8",
                    }}>
                    Loading...
                  </div>
                ) : (
                  <Bar data={salesChartData} options={chartOptions} />
                )}
              </div>
            </div>

            <div className="card">
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  marginBottom: "20px",
                }}>
                Sales Status
              </h2>
              <div style={{ height: "200px", marginBottom: "24px" }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  marginBottom: "16px",
                }}>
                Revenue by Payment Method
              </h2>
              <div style={{ height: "180px" }}>
                <Pie data={paymentPieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Payment breakdown cards */}
          <div className="card" style={{ marginTop: "28px" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "20px",
              }}>
              Payment Methods · {reportPeriod}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}>
              {paymentBreakdown.map((p, i) => {
                const colors = ["#0D9488", "#2563EB", "#8B5CF6"];
                const bgs = ["#F0FDFA", "#EFF6FF", "#F5F3FF"];
                const share =
                  stats.totalRevenue > 0
                    ? ((p.total / stats.totalRevenue) * 100).toFixed(1)
                    : "0.0";
                return (
                  <div
                    key={p.method}
                    style={{
                      padding: "20px",
                      background: bgs[i],
                      borderRadius: "16px",
                    }}>
                    <div
                      style={{
                        fontWeight: "700",
                        color: colors[i],
                        fontSize: "0.9rem",
                        marginBottom: "12px",
                      }}>
                      {p.method}
                    </div>
                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: "1.4rem",
                        color: "#0F172A",
                      }}>
                      ETB {p.total.toLocaleString()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                      }}>
                      <span style={{ color: "#64748B", fontSize: "0.8rem" }}>
                        {p.count} transaction{p.count !== 1 ? "s" : ""}
                      </span>
                      <span
                        style={{
                          color: colors[i],
                          fontWeight: "700",
                          fontSize: "0.8rem",
                        }}>
                        {share}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sales table */}
          <div className="card" style={{ marginTop: "28px", padding: "0" }}>
            <div
              style={{
                padding: "20px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #F1F5F9",
              }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                Transactions · {reportPeriod}
              </h2>
              <span style={{ color: "#64748B", fontSize: "0.85rem" }}>
                {filteredSales.length} records
              </span>
            </div>
            <div className="table-container">
              <table style={{ margin: "0" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th>Invoice</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          color: "#94A3B8",
                          padding: "40px",
                        }}>
                        No transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const d = getSaleDate(sale);
                      const method =
                        sale.paymentMethod || sale.payment || "Cash";

                      // Parse items array if it exists
                      const items =
                        sale.items && Array.isArray(sale.items)
                          ? sale.items
                          : [];
                      const totalQty =
                        items.length > 0
                          ? items.reduce(
                              (sum, i) => sum + Number(i.quantity || 0),
                              0,
                            )
                          : Number(sale.quantity || 0);

                      const primaryItem = items.length > 0 ? items[0] : sale;
                      const productName =
                        primaryItem.name ||
                        primaryItem.item ||
                        primaryItem.product ||
                        "Unknown";
                      const productDisplay =
                        items.length > 1
                          ? `${productName} +${items.length - 1} more`
                          : productName;

                      const batchDisplay =
                        primaryItem.batch ||
                        primaryItem.batchNo ||
                        sale.batch ||
                        "—";
                      const amount = Number(sale.total || sale.amount || 0);

                      const methodColors = {
                        Cash: { bg: "#F0FDFA", color: "#0D9488" },
                        "CBE Birr": { bg: "#EFF6FF", color: "#2563EB" },
                        CBE: { bg: "#EFF6FF", color: "#2563EB" },
                        Telebirr: { bg: "#F5F3FF", color: "#7C3AED" },
                        "Bank Transfer": { bg: "#FFFBEB", color: "#D97706" },
                      };
                      const mc = methodColors[method] || {
                        bg: "#F8FAFC",
                        color: "#64748B",
                      };

                      return (
                        <tr key={sale.id}>
                          <td
                            style={{
                              fontWeight: "700",
                              color: "var(--primary)",
                              padding: "16px 28px",
                            }}>
                            #{sale.invoiceId || sale.id?.slice(0, 8) || "—"}
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <div style={{ fontWeight: "600" }}>
                              {productDisplay}
                            </div>
                            <div
                              style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                              {batchDisplay}
                            </div>
                          </td>
                          <td style={{ padding: "16px 28px" }}>{totalQty}</td>
                          <td style={{ padding: "16px 28px" }}>
                            {d ? d.toLocaleDateString() : "—"}
                          </td>
                          <td
                            style={{ fontWeight: "800", padding: "16px 28px" }}>
                            ETB {amount.toLocaleString()}
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontWeight: "600",
                                fontSize: "0.78rem",
                                background: mc.bg,
                                color: mc.color,
                              }}>
                              {method}
                            </span>
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <span
                              className="status-badge"
                              style={{
                                background:
                                  sale.status === "Delivered" ||
                                  sale.status === "Completed"
                                    ? "#ECFDF5"
                                    : sale.status === "Cancelled"
                                      ? "#FEF2F2"
                                      : "#FFFBEB",
                                color:
                                  sale.status === "Delivered" ||
                                  sale.status === "Completed"
                                    ? "#059669"
                                    : sale.status === "Cancelled"
                                      ? "#DC2626"
                                      : "#D97706",
                              }}>
                              {sale.status || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "Inventory" && (
        <>
          <div className="dashboard-grid" style={{ marginBottom: "28px" }}>
            <div className="card">
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  marginBottom: "20px",
                }}>
                Stock Status Distribution
              </h2>
              <div style={{ height: "300px" }}>
                <Pie data={inventoryStatusPieData} options={pieOptions} />
              </div>
            </div>
            <div className="card">
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  marginBottom: "20px",
                }}>
                Top Categories by Stock
              </h2>
              <div style={{ height: "300px" }}>
                <Bar
                  data={inventoryCategoryBarData}
                  options={countBarOptions}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "0" }}>
            <div
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid #F1F5F9",
              }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                Stock Batches Inventory
              </h2>
            </div>
            <div className="table-container">
              <table style={{ margin: "0" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th>Medicine</th>
                    <th>Batch</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Supplier</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedBatches.map((b) => {
                    const stock = Number(b.stock || 0);
                    const isOut = stock === 0;
                    const isLow = stock > 0 && stock <= 10;
                    return (
                      <tr key={b.id}>
                        <td style={{ padding: "16px 28px" }}>
                          <div style={{ fontWeight: "600" }}>{b.name}</div>
                        </td>
                        <td style={{ padding: "16px 28px" }}>{b.batch}</td>
                        <td style={{ padding: "16px 28px" }}>{b.category}</td>
                        <td style={{ padding: "16px 28px", fontWeight: "700" }}>
                          {stock}
                        </td>
                        <td style={{ padding: "16px 28px" }}>{b.supplier}</td>
                        <td style={{ padding: "16px 28px" }}>
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

      {activeTab === "Profit" && (
        <div className="dashboard-grid">
          <div className="card">
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "20px",
              }}>
              Real Profit Overview
            </h2>
            <div style={{ height: "340px" }}>
              <Bar data={profitChartData} options={chartOptions} />
            </div>
          </div>
          <div className="card">
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "20px",
              }}>
              Profit by Product
            </h2>
            <div style={{ height: "340px" }}>
              <Pie data={profitByProductData} options={pieOptions} />
            </div>
          </div>
        </div>
      )}
      {activeTab === "Expiration" && (
        <>
          <div className="dashboard-grid" style={{ marginBottom: "28px" }}>
            <div className="card">
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  marginBottom: "20px",
                }}>
                Expiration Status Breakdown
              </h2>
              <div style={{ height: "300px" }}>
                <Pie data={expirationStatusPieData} options={pieOptions} />
              </div>
            </div>
            <div className="card">
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  marginBottom: "20px",
                }}>
                Batches by Expiration Category
              </h2>
              <div style={{ height: "300px" }}>
                <Bar
                  data={expirationBarData}
                  options={countBarOptionsBatches}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "0" }}>
            <div
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid #F1F5F9",
              }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                Batch Expiry Details
              </h2>
            </div>
            <div className="table-container">
              <table style={{ margin: "0" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th>Medicine</th>
                    <th>Batch</th>
                    <th>Stock</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batchesSortedByExpiry.map((b) => {
                    const exp = getBatchExpiryDate(b);
                    const isExpired = exp < now;
                    const isSoon = exp >= now && exp <= in30Days;
                    return (
                      <tr key={b.id}>
                        <td style={{ padding: "16px 28px", fontWeight: "600" }}>
                          {b.name}
                        </td>
                        <td style={{ padding: "16px 28px" }}>{b.batch}</td>
                        <td style={{ padding: "16px 28px", fontWeight: "700" }}>
                          {b.stock}
                        </td>
                        <td style={{ padding: "16px 28px" }}>
                          {exp ? exp.toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "16px 28px" }}>
                          <span
                            className="status-badge"
                            style={{
                              background: isExpired
                                ? "#FEF2F2"
                                : isSoon
                                  ? "#FFFBEB"
                                  : "#ECFDF5",
                              color: isExpired
                                ? "#DC2626"
                                : isSoon
                                  ? "#D97706"
                                  : "#059669",
                            }}>
                            {isExpired
                              ? "Expired"
                              : isSoon
                                ? "Expiring Soon"
                                : "Fresh"}
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
