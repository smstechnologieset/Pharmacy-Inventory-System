// src/pages/Reports.jsx
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const PROFIT_MARGIN = 0.3;
const PAYMENT_METHODS = ["Cash", "CBE", "Telebirr"];

// ── Date helpers ──────────────────────────────────────────────────────────────
// FIX: also falls back to sale.date so charts never show NaN
const getSaleDate = (sale) => {
  if (sale.createdAt?.toDate) return sale.createdAt.toDate();
  if (sale.createdAt instanceof Date) return sale.createdAt;
  if (sale.date) {
    const parsed = new Date(sale.date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(); // fallback to now so sale is still counted
};

const getMedicineExpiryDate = (medicine) => {
  if (!medicine.expiry) return null;
  const parsed = new Date(medicine.expiry);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// ── Period helpers ────────────────────────────────────────────────────────────
const getPeriodRange = (period, customStart, customEnd) => {
  const now = new Date();
  if (period === "Custom") {
    return {
      start: customStart ? new Date(customStart) : new Date(),
      end: customEnd
        ? new Date(new Date(customEnd).setHours(23, 59, 59, 999))
        : new Date(),
    };
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "Daily") {
    return { start, end: new Date(new Date().setHours(23, 59, 59, 999)) };
  }
  if (period === "Weekly") {
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "Monthly") {
    start.setDate(1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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

// ── Chart builders ────────────────────────────────────────────────────────────
const buildChartLabels = (period) => {
  const now = new Date();
  if (period === "Daily") {
    return Array.from({ length: 24 }, (_, i) => ({
      key: i,
      display: `${String(i).padStart(2, "0")}:00`,
    }));
  }
  if (period === "Weekly") {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => ({
      key: i,
      display: d,
    }));
  }
  if (period === "Monthly") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      key: i + 1,
      display: String(i + 1),
    }));
  }
  // Yearly
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), i, 1);
    return { key: i, display: d.toLocaleString("default", { month: "short" }) };
  });
};

const buildChartData = (salesList, period, color = "#0D9488", label = "Revenue (ETB)", multiplier = 1) => {
  if (period === "All Time") {
    const years = {};
    salesList.forEach((s) => {
      const d = getSaleDate(s);
      if (!d) return;
      const y = String(d.getFullYear());
      years[y] = (years[y] || 0) + Number(s.amount || 0) * multiplier;
    });
    const sorted = Object.entries(years).sort((a, b) => a[0] - b[0]);
    return {
      labels: sorted.map(([y]) => y),
      datasets: [{
        label,
        data: sorted.map(([, v]) => Math.round(v)),
        backgroundColor: color,
        borderRadius: 10,
        barThickness: 28,
      }],
    };
  }
  if (period === "Custom") {
    const days = {};
    salesList.forEach((s) => {
      const d = getSaleDate(s);
      if (!d) return;
      const key = d.toLocaleDateString();
      days[key] = (days[key] || 0) + Number(s.amount || 0) * multiplier;
    });
    const sorted = Object.entries(days).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{
        label,
        data: sorted.map(([, v]) => Math.round(v)),
        backgroundColor: color,
        borderRadius: 10,
        barThickness: 28,
      }],
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
    if (key in buckets) buckets[key] += Number(s.amount || 0) * multiplier;
  });

  return {
    labels: chartLabels.map((l) => l.display),
    datasets: [{
      label,
      data: chartLabels.map((l) => Math.round(buckets[l.key])),
      backgroundColor: color,
      borderRadius: 10,
      barThickness: 28,
    }],
  };
};

// ── Tab-aware PDF Export ──────────────────────────────────────────────────────
const exportToPDF = (activeTab, period, filteredSales, stats, medicines, customStart, customEnd, extraData) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();

  // header color per tab
  const headerColors = {
    Sales: [13, 148, 136],
    Inventory: [37, 99, 235],
    Profit: [124, 58, 237],
    Expiration: [220, 38, 38],
  };
  const hc = headerColors[activeTab] || [13, 148, 136];

  // Cover header
  doc.setFillColor(...hc);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PharmaCare", 14, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Pharmacy Inventory & Stock Management", 14, 24);
  doc.setFontSize(10);
  doc.text(`${activeTab} Report · ${period}`, 14, 32);
  doc.text(`Generated: ${now.toLocaleString()}`, pageW - 14, 32, { align: "right" });

  // Period line
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  let periodLabel = period;
  if (period === "Custom" && customStart && customEnd) {
    periodLabel = `Custom: ${new Date(customStart).toLocaleDateString()} – ${new Date(customEnd).toLocaleDateString()}`;
  } else if (period !== "All Time") {
    const { start, end } = getPeriodRange(period);
    periodLabel = `${period}: ${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  }
  doc.text(periodLabel, 14, 45);

  let startY = 52;

  // ── SALES TAB ──
  if (activeTab === "Sales") {
    // Summary stat boxes
    const statBoxes = [
      { label: "Total Revenue", value: `ETB ${stats.totalRevenue.toLocaleString()}` },
      { label: "Transactions", value: String(stats.totalTransactions) },
      { label: "Avg Order Value", value: `ETB ${stats.averageOrder.toFixed(0)}` },
      { label: "Delivered Rate", value: `${stats.deliveredRate}%` },
    ];
    const boxW = (pageW - 28 - 9) / 4;
    statBoxes.forEach((box, i) => {
      const x = 14 + i * (boxW + 3);
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(x, startY, boxW, 22, 3, 3, "F");
      doc.setTextColor(13, 148, 136);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(box.label, x + boxW / 2, startY + 7, { align: "center" });
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(box.value, x + boxW / 2, startY + 16, { align: "center" });
    });
    startY += 28;

    // Payment method breakdown
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Revenue by Payment Method", 14, startY);
    startY += 4;
    autoTable(doc, {
      startY,
      head: [["Payment Method", "Transactions", "Total Revenue (ETB)", "Share (%)"]],
      body: extraData.paymentBreakdown.map((p) => {
        const share = stats.totalRevenue > 0
          ? ((p.total / stats.totalRevenue) * 100).toFixed(1)
          : "0.0";
        return [p.method, String(p.count), `ETB ${p.total.toLocaleString()}`, `${share}%`];
      }),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [239, 246, 255] },
    });
    startY = doc.lastAutoTable.finalY + 8;

    // Sales table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Sales Transactions", 14, startY);
    startY += 4;
    autoTable(doc, {
      startY,
      head: [["Invoice", "Product", "Batch", "Qty", "Date", "Amount (ETB)", "Payment", "Status"]],
      body: filteredSales.map((sale) => {
        const d = getSaleDate(sale);
        return [
          `#${sale.invoiceId || sale.id?.slice(0, 8) || "—"}`,
          sale.item || sale.product || "Unknown",
          sale.batch || "—",
          String(sale.quantity || 0),
          d ? d.toLocaleDateString() : "—",
          `ETB ${Number(sale.amount || 0).toLocaleString()}`,
          sale.payment || "Cash",
          sale.status || "—",
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  // ── INVENTORY TAB ──
  if (activeTab === "Inventory") {
    const { totalStock, lowStockCount, outOfStockCount, inStockCount, categories, medicines: meds } = extraData;
    const statBoxes = [
      { label: "Total Stock", value: `${totalStock.toLocaleString()} units`, color: [13, 148, 136], bg: [240, 253, 250] },
      { label: "In Stock", value: String(inStockCount), color: [5, 150, 105], bg: [236, 253, 245] },
      { label: "Low Stock", value: String(lowStockCount), color: [180, 83, 9], bg: [255, 251, 235] },
      { label: "Out of Stock", value: String(outOfStockCount), color: [220, 38, 38], bg: [254, 242, 242] },
    ];
    const boxW = (pageW - 28 - 9) / 4;
    statBoxes.forEach((box, i) => {
      const x = 14 + i * (boxW + 3);
      doc.setFillColor(...box.bg);
      doc.roundedRect(x, startY, boxW, 22, 3, 3, "F");
      doc.setTextColor(...box.color);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(box.label, x + boxW / 2, startY + 7, { align: "center" });
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(box.value, x + boxW / 2, startY + 16, { align: "center" });
    });
    startY += 28;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Medicine Inventory — ${categories} Categories`, 14, startY);
    startY += 4;
    autoTable(doc, {
      startY,
      head: [["Medicine", "Category", "Stock", "Price (ETB)", "Supplier", "Status"]],
      body: meds.map((med) => {
        const stock = Number(med.stock || 0);
        const status = stock === 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";
        return [
          med.name,
          med.category || "—",
          String(stock),
          `ETB ${Number(med.price || 0).toLocaleString()}`,
          med.supplier || "—",
          status,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  // ── PROFIT TAB ──
  if (activeTab === "Profit") {
    const totalProfit = Math.round(stats.totalRevenue * PROFIT_MARGIN);
    const statBoxes = [
      { label: "Est. Profit", value: `ETB ${totalProfit.toLocaleString()}`, color: [124, 58, 237], bg: [245, 243, 255] },
      { label: "Total Revenue", value: `ETB ${stats.totalRevenue.toLocaleString()}`, color: [13, 148, 136], bg: [240, 253, 250] },
      { label: "Profit Margin", value: "30%", color: [37, 99, 235], bg: [239, 246, 255] },
      { label: "Avg Monthly", value: `ETB ${Math.round(totalProfit / 6).toLocaleString()}`, color: [180, 83, 9], bg: [255, 251, 235] },
    ];
    const boxW = (pageW - 28 - 9) / 4;
    statBoxes.forEach((box, i) => {
      const x = 14 + i * (boxW + 3);
      doc.setFillColor(...box.bg);
      doc.roundedRect(x, startY, boxW, 22, 3, 3, "F");
      doc.setTextColor(...box.color);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(box.label, x + boxW / 2, startY + 7, { align: "center" });
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(box.value, x + boxW / 2, startY + 16, { align: "center" });
    });
    startY += 28;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Top Products by Estimated Profit", 14, startY);
    startY += 4;
    autoTable(doc, {
      startY,
      head: [["#", "Product", "Units Sold", "Unit Price (ETB)", "Est. Revenue (ETB)", "Est. Profit (ETB)"]],
      body: extraData.topSelling.map(([name, qty], i) => {
        const med = medicines.find((m) => m.name === name);
        const price = med ? Number(med.price || 0) : 0;
        const revenue = qty * price;
        return [
          String(i + 1),
          name,
          String(qty),
          price > 0 ? `ETB ${price}` : "—",
          price > 0 ? `ETB ${revenue.toLocaleString()}` : "—",
          price > 0 ? `ETB ${Math.round(revenue * PROFIT_MARGIN).toLocaleString()}` : "—",
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
    });
  }

  // ── EXPIRATION TAB ──
  if (activeTab === "Expiration") {
    const { expiredMeds, expiringSoonMeds, freshMeds, medicinesSortedByExpiry } = extraData;
    const statBoxes = [
      { label: "Expired", value: String(expiredMeds.length), color: [220, 38, 38], bg: [254, 242, 242] },
      { label: "Expiring in 30 Days", value: String(expiringSoonMeds.length), color: [217, 119, 6], bg: [255, 251, 235] },
      { label: "Fresh Stock", value: String(freshMeds.length), color: [5, 150, 105], bg: [236, 253, 245] },
      { label: "Total Tracked", value: String(medicines.length), color: [37, 99, 235], bg: [239, 246, 255] },
    ];
    const boxW = (pageW - 28 - 9) / 4;
    statBoxes.forEach((box, i) => {
      const x = 14 + i * (boxW + 3);
      doc.setFillColor(...box.bg);
      doc.roundedRect(x, startY, boxW, 22, 3, 3, "F");
      doc.setTextColor(...box.color);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(box.label, x + boxW / 2, startY + 7, { align: "center" });
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(box.value, x + boxW / 2, startY + 16, { align: "center" });
    });
    startY += 28;

    // Expiring soon alert table first
    if (expiredMeds.length > 0 || expiringSoonMeds.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠ Action Required: ${expiredMeds.length} Expired, ${expiringSoonMeds.length} Expiring Soon`, 14, startY);
      startY += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Medicine Expiry Details", 14, startY);
    startY += 4;
    autoTable(doc, {
      startY,
      head: [["Medicine", "Category", "Batch", "Stock", "Expiry Date", "Status"]],
      body: medicinesSortedByExpiry.map((med) => {
        const exp = getMedicineExpiryDate(med);
        const now2 = new Date();
        const in30 = new Date(); in30.setDate(in30.getDate() + 30);
        const status = !exp ? "No Date" : exp < now2 ? "Expired" : exp <= in30 ? "Expiring Soon" : "Fresh";
        return [
          med.name,
          med.category || "—",
          med.batch || "—",
          String(med.stock || 0),
          exp ? exp.toLocaleDateString() : "—",
          status,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (data) => {
        if (data.column.index === 5 && data.section === "body") {
          const status = data.cell.text[0];
          if (status === "Expired") doc.setTextColor(220, 38, 38);
          else if (status === "Expiring Soon") doc.setTextColor(217, 119, 6);
          else doc.setTextColor(5, 150, 105);
        }
      },
    });
  }

  // Footer on every page
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PharmaStock · ${activeTab} Report · Page ${p} of ${pageCount} · Confidential`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  const fileName = `pharmastock-${activeTab.toLowerCase()}-${period.toLowerCase()}-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

// ── Component ─────────────────────────────────────────────────────────────────
const Reports = () => {
  const [activeTab, setActiveTab] = useState("Sales");
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("Monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const PERIODS = ["Daily", "Weekly", "Monthly", "Yearly", "All Time", "Custom"];

  // ── Filtered sales ────────────────────────────────────────────────────────────
  const filteredSales = useMemo(
    () => filterSalesByPeriod(sales, reportPeriod, customStart, customEnd),
    [sales, reportPeriod, customStart, customEnd],
  );

  // ── Stats from filtered sales ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((s, sale) => s + Number(sale.amount || 0), 0);
    const totalTransactions = filteredSales.length;
    const deliveredCount = filteredSales.filter((s) => s.status === "Delivered").length;
    return {
      totalRevenue,
      totalTransactions,
      averageOrder: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      deliveredRate: totalTransactions > 0
        ? Math.round((deliveredCount / totalTransactions) * 100)
        : 0,
    };
  }, [filteredSales]);

  // ── Payment breakdown (Cash / CBE / Telebirr) ─────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    return PAYMENT_METHODS.map((method) => {
      const methodSales = filteredSales.filter(
        (s) => (s.payment || "Cash") === method,
      );
      return {
        method,
        count: methodSales.length,
        total: methodSales.reduce((sum, s) => sum + Number(s.amount || 0), 0),
      };
    });
  }, [filteredSales]);

  // ── Charts ────────────────────────────────────────────────────────────────────
  const salesChartData = useMemo(
    () => buildChartData(filteredSales, reportPeriod, "#0D9488", "Revenue (ETB)", 1),
    [filteredSales, reportPeriod],
  );

  // FIX: profit chart uses multiplier instead of double-applying PROFIT_MARGIN
  const profitChartData = useMemo(
    () => buildChartData(filteredSales, reportPeriod, "#8B5CF6", "Est. Profit (ETB)", PROFIT_MARGIN),
    [filteredSales, reportPeriod],
  );

  const pieData = useMemo(() => {
    const statusCounts = filteredSales.reduce((acc, sale) => {
      const s = sale.status || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const labels = Object.keys(statusCounts);
    const colors = ["#10B981", "#F59E0B", "#EF4444", "#0D9488"];
    return {
      labels,
      datasets: [{
        data: labels.map((s) => statusCounts[s]),
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
        hoverOffset: 15,
      }],
    };
  }, [filteredSales]);

  const paymentPieData = useMemo(() => ({
    labels: paymentBreakdown.map((p) => p.method),
    datasets: [{
      data: paymentBreakdown.map((p) => p.total),
      backgroundColor: ["#0D9488", "#2563EB", "#8B5CF6"],
      borderWidth: 0,
      hoverOffset: 15,
    }],
  }), [paymentBreakdown]);

  // ── Load data ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [salesList, medicinesList] = await Promise.all([
          getAllSales(),
          getAllMedicines(),
        ]);
        setSales(salesList);
        setMedicines(medicinesList);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch report data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Inventory derived ─────────────────────────────────────────────────────────
  const totalStock = medicines.reduce((s, m) => s + Number(m.stock || 0), 0);
  const lowStockCount = medicines.filter(
    (m) => Number(m.stock || 0) > 0 && Number(m.stock || 0) <= 10,
  ).length;
  const outOfStockCount = medicines.filter((m) => Number(m.stock || 0) === 0).length;
  const inStockCount = medicines.length - lowStockCount - outOfStockCount;
  const categories = [...new Set(medicines.map((m) => m.category || "Uncategorized"))];

  const inventoryCategoryChartData = useMemo(() => {
    const totals = medicines.reduce((acc, med) => {
      const cat = med.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + Number(med.stock || 0);
      return acc;
    }, {});
    const labels = Object.keys(totals);
    const colors = ["#0D9488", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    return {
      labels,
      datasets: [{
        label: "Stock Units",
        data: labels.map((l) => totals[l]),
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderRadius: 12,
        barThickness: 28,
      }],
    };
  }, [medicines]);

  const inventoryStatusPie = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [{
      data: [inStockCount, lowStockCount, outOfStockCount],
      backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
      borderWidth: 0,
      hoverOffset: 12,
    }],
  };

  // ── Expiration derived ────────────────────────────────────────────────────────
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiredMeds = medicines.filter((m) => { const e = getMedicineExpiryDate(m); return e && e < now; });
  const expiringSoonMeds = medicines.filter((m) => { const e = getMedicineExpiryDate(m); return e && e >= now && e <= in30Days; });
  const freshMeds = medicines.filter((m) => { const e = getMedicineExpiryDate(m); return !e || e > in30Days; });

  const expirationPieData = {
    labels: ["Expired", "Expiring Soon", "Fresh"],
    datasets: [{
      data: [expiredMeds.length, expiringSoonMeds.length, freshMeds.length],
      backgroundColor: ["#EF4444", "#F59E0B", "#0D9488"],
      borderWidth: 0,
      hoverOffset: 12,
    }],
  };

  const expirationTimelineData = useMemo(() => {
    const months = {};
    medicines.forEach((med) => {
      const exp = getMedicineExpiryDate(med);
      if (exp) {
        const key = exp.toLocaleString("default", { month: "short", year: "2-digit" });
        months[key] = (months[key] || 0) + 1;
      }
    });
    const sorted = Object.entries(months)
      .sort((a, b) => new Date("1 " + a[0]) - new Date("1 " + b[0]))
      .slice(0, 8);
    return {
      labels: sorted.map((e) => e[0]),
      datasets: [{
        label: "Medicines Expiring",
        data: sorted.map((e) => e[1]),
        backgroundColor: sorted.map((_, i) => (i === 0 ? "#EF4444" : "#F59E0B")),
        borderRadius: 12,
        barThickness: 28,
      }],
    };
  }, [medicines]);

  const medicinesSortedByExpiry = [...medicines]
    .filter((m) => getMedicineExpiryDate(m))
    .sort((a, b) => getMedicineExpiryDate(a) - getMedicineExpiryDate(b));

  const getExpiryStatusLabel = (med) => {
    const exp = getMedicineExpiryDate(med);
    if (!exp) return { label: "No Date", color: "#94A3B8", bg: "#F8FAFC" };
    if (exp < now) return { label: "Expired", color: "#DC2626", bg: "#FEF2F2" };
    if (exp <= in30Days) return { label: "Expiring Soon", color: "#D97706", bg: "#FFFBEB" };
    return { label: "Fresh", color: "#059669", bg: "#ECFDF5" };
  };

  // ── Profit derived ────────────────────────────────────────────────────────────
  const totalEstimatedProfit = Math.round(stats.totalRevenue * PROFIT_MARGIN);

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
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const topSelling = useMemo(() => getTopSellingProducts(filteredSales), [filteredSales]);

  const profitByProductData = useMemo(() => {
    const top = topSelling.slice(0, 5);
    const colors = ["#0D9488", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6"];
    return {
      labels: top.map(([name]) => name),
      datasets: [{
        data: top.map(([name, qty]) => {
          const med = medicines.find((m) => m.name === name);
          const price = med ? Number(med.price || 0) : 0;
          return Math.round(qty * price * PROFIT_MARGIN);
        }),
        backgroundColor: top.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
        hoverOffset: 12,
      }],
    };
  }, [topSelling, medicines]);

  // ── Export handler ────────────────────────────────────────────────────────────
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
          medicines,
          expiredMeds,
          expiringSoonMeds,
          freshMeds,
          medicinesSortedByExpiry,
        },
      );
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  // ── Chart options ─────────────────────────────────────────────────────────────
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
          label: (ctx) => ` ETB ${Number(ctx.parsed.y || 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        grid: { borderDash: [5, 5], drawBorder: false },
        beginAtZero: true,
        ticks: {
          callback: (v) => `ETB ${Number(v).toLocaleString()}`,
        },
      },
      x: { grid: { display: false } },
    },
  };
  const pieOptions = { ...chartOptions, scales: {} };

  // ── Period display label ──────────────────────────────────────────────────────
  const periodDisplayLabel = (() => {
    if (reportPeriod === "All Time") return "All Time";
    if (reportPeriod === "Custom") {
      if (customStart && customEnd)
        return `${new Date(customStart).toLocaleDateString()} – ${new Date(customEnd).toLocaleDateString()}`;
      return "Select date range";
    }
    const { start, end } = getPeriodRange(reportPeriod);
    return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  })();

  // ── Tab-aware summary stats ───────────────────────────────────────────────────
  const tabStats = {
    Sales: [
      { label: "Revenue", value: `ETB ${stats.totalRevenue.toLocaleString()}`, bg: "#F0FDFA", color: "#0D9488" },
      { label: "Transactions", value: stats.totalTransactions, bg: "#EFF6FF", color: "#2563EB" },
      { label: "Avg Order", value: `ETB ${stats.averageOrder.toFixed(0)}`, bg: "#F5F3FF", color: "#7C3AED" },
      { label: "Delivered Rate", value: `${stats.deliveredRate}%`, bg: "#ECFDF5", color: "#059669" },
    ],
    Inventory: [
      { label: "Total Stock", value: `${totalStock.toLocaleString()} units`, bg: "#F0FDFA", color: "#0D9488" },
      { label: "Low Stock Items", value: lowStockCount, bg: "#FFFBEB", color: "#B45309" },
      { label: "Out of Stock", value: outOfStockCount, bg: "#FEF2F2", color: "#DC2626" },
      { label: "Categories", value: categories.length, bg: "#EFF6FF", color: "#2563EB" },
    ],
    Profit: [
      { label: "Est. Profit", value: `ETB ${totalEstimatedProfit.toLocaleString()}`, bg: "#F5F3FF", color: "#7C3AED" },
      { label: "Total Revenue", value: `ETB ${stats.totalRevenue.toLocaleString()}`, bg: "#F0FDFA", color: "#0D9488" },
      { label: "Profit Margin", value: "30%", bg: "#EFF6FF", color: "#2563EB" },
      { label: "Avg Monthly", value: `ETB ${Math.round(totalEstimatedProfit / 6).toLocaleString()}`, bg: "#FFFBEB", color: "#B45309" },
    ],
    Expiration: [
      { label: "Expired", value: expiredMeds.length, bg: "#FEF2F2", color: "#DC2626" },
      { label: "Expiring in 30 Days", value: expiringSoonMeds.length, bg: "#FFFBEB", color: "#D97706" },
      { label: "Fresh Stock", value: freshMeds.length, bg: "#ECFDF5", color: "#059669" },
      { label: "Total Tracked", value: medicines.length, bg: "#EFF6FF", color: "#2563EB" },
    ],
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="reports-page" onClick={() => showPeriodMenu && setShowPeriodMenu(false)}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.025em" }}>
            Analytics & Reports
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Deep insights into your pharmacy's performance.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Period dropdown */}
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPeriodMenu((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 16px", borderRadius: "12px",
                border: "2px solid #E2E8F0", background: "white",
                fontWeight: "700", fontSize: "0.85rem", cursor: "pointer",
                color: "#0F172A", whiteSpace: "nowrap",
              }}>
              <FileText size={16} style={{ color: "#0D9488" }} />
              {reportPeriod} Report
              <ChevronDown size={14} style={{ color: "#94A3B8" }} />
            </button>

            {showPeriodMenu && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                background: "white", borderRadius: "14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                border: "1px solid #F1F5F9", zIndex: 100,
                minWidth: "160px", overflow: "hidden",
              }}>
                {PERIODS.map((p) => (
                  <div
                    key={p}
                    onClick={() => { setReportPeriod(p); setShowPeriodMenu(false); }}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      fontWeight: "600", fontSize: "0.85rem",
                      color: reportPeriod === p ? "#0D9488" : "#1E293B",
                      background: reportPeriod === p ? "#F0FDFA" : "white",
                      borderBottom: "1px solid #F8FAFC",
                    }}>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom date inputs */}
          {reportPeriod === "Custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "10px", border: "2px solid #E2E8F0", fontSize: "0.82rem", fontWeight: "600", outline: "none", cursor: "pointer" }}
              />
              <span style={{ color: "#94A3B8", fontWeight: "600" }}>–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: "10px", border: "2px solid #E2E8F0", fontSize: "0.82rem", fontWeight: "600", outline: "none", cursor: "pointer" }}
              />
            </div>
          )}

          {/* Period range label */}
          {reportPeriod !== "Custom" && (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "10px 14px", background: "#F8FAFC",
              borderRadius: "12px", fontSize: "0.8rem",
              color: "#64748B", fontWeight: "500",
            }}>
              <Calendar size={14} />
              {periodDisplayLabel}
            </div>
          )}

          {/* Export button */}
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting || loading}
            style={{ padding: "10px 20px", opacity: exporting ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
            <Download size={18} />
            {exporting ? "Generating..." : `Export ${activeTab} PDF`}
          </button>
        </div>
      </div>

      {/* ── Tab-aware summary stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {(tabStats[activeTab] || tabStats.Sales).map((s) => (
          <div key={s.label} style={{ background: s.bg, borderRadius: "16px", padding: "18px 20px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "700", color: s.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              {s.label}
              {(activeTab === "Sales" || activeTab === "Profit") && (
                <span style={{ marginLeft: "6px", opacity: 0.7 }}>· {reportPeriod}</span>
              )}
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0F172A" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
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

      {/* ── SALES TAB ── */}
      {activeTab === "Sales" && (
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Revenue Overview</h2>
                  <p style={{ fontSize: "0.78rem", color: "#94A3B8", marginTop: "2px" }}>
                    {filteredSales.length} transactions · {reportPeriod}
                  </p>
                </div>
              </div>
              <div style={{ height: "320px" }}>
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94A3B8" }}>
                    Loading...
                  </div>
                ) : (
                  <Bar data={salesChartData} options={chartOptions} />
                )}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>
                Sales Status
              </h2>
              <div style={{ height: "200px", marginBottom: "24px" }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
                Revenue by Payment Method
              </h2>
              <div style={{ height: "180px" }}>
                <Pie data={paymentPieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Payment breakdown cards */}
          <div className="card" style={{ marginTop: "28px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>
              Payment Methods · {reportPeriod}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {paymentBreakdown.map((p, i) => {
                const colors = ["#0D9488", "#2563EB", "#8B5CF6"];
                const bgs = ["#F0FDFA", "#EFF6FF", "#F5F3FF"];
                const share = stats.totalRevenue > 0
                  ? ((p.total / stats.totalRevenue) * 100).toFixed(1)
                  : "0.0";
                return (
                  <div key={p.method} style={{ padding: "20px", background: bgs[i], borderRadius: "16px" }}>
                    <div style={{ fontWeight: "700", color: colors[i], fontSize: "0.9rem", marginBottom: "12px" }}>
                      {p.method}
                    </div>
                    <div style={{ fontWeight: "800", fontSize: "1.4rem", color: "#0F172A" }}>
                      ETB {p.total.toLocaleString()}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                      <span style={{ color: "#64748B", fontSize: "0.8rem" }}>
                        {p.count} transaction{p.count !== 1 ? "s" : ""}
                      </span>
                      <span style={{ color: colors[i], fontWeight: "700", fontSize: "0.8rem" }}>
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
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
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
                      <td colSpan={7} style={{ textAlign: "center", color: "#94A3B8", padding: "40px" }}>
                        No transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const d = getSaleDate(sale);
                      const method = sale.payment || "Cash";
                      const methodColors = { Cash: { bg: "#F0FDFA", color: "#0D9488" }, CBE: { bg: "#EFF6FF", color: "#2563EB" }, Telebirr: { bg: "#F5F3FF", color: "#7C3AED" } };
                      const mc = methodColors[method] || { bg: "#F8FAFC", color: "#64748B" };
                      return (
                        <tr key={sale.id}>
                          <td style={{ fontWeight: "700", color: "var(--primary)", padding: "16px 28px" }}>
                            #{sale.invoiceId || sale.id?.slice(0, 8)}
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <div style={{ fontWeight: "600" }}>{sale.item || sale.product || "Unknown"}</div>
                            <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{sale.batch || "—"}</div>
                          </td>
                          <td style={{ padding: "16px 28px" }}>{sale.quantity}</td>
                          <td style={{ padding: "16px 28px" }}>{d ? d.toLocaleDateString() : "—"}</td>
                          <td style={{ fontWeight: "800", padding: "16px 28px" }}>
                            ETB {Number(sale.amount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "20px", fontWeight: "600", fontSize: "0.78rem", background: mc.bg, color: mc.color }}>
                              {method}
                            </span>
                          </td>
                          <td style={{ padding: "16px 28px" }}>
                            <span
                              className="status-badge"
                              style={{
                                background: sale.status === "Delivered" ? "#ECFDF5" : sale.status === "Cancelled" ? "#FEF2F2" : "#FFFBEB",
                                color: sale.status === "Delivered" ? "#059669" : sale.status === "Cancelled" ? "#DC2626" : "#D97706",
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

      {/* ── INVENTORY TAB ── */}
      {activeTab === "Inventory" && (
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Stock by Category</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "0.9rem" }}>
                  <Package size={16} /> All Categories
                </div>
              </div>
              <div style={{ height: "340px" }}>
                <Bar data={inventoryCategoryChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, ticks: { callback: (v) => v } } } }} />
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>Stock Status</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "In Stock", value: inStockCount, bg: "#ECFDF5", color: "#059669" },
                  { label: "Low Stock", value: lowStockCount, bg: "#FFFBEB", color: "#D97706" },
                  { label: "Out of Stock", value: outOfStockCount, bg: "#FEF2F2", color: "#DC2626" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "16px", background: item.bg, borderRadius: "14px", textAlign: "center" }}>
                    <div style={{ fontWeight: "600", color: item.color, fontSize: "0.78rem" }}>{item.label}</div>
                    <div style={{ fontWeight: "800", fontSize: "1.4rem", marginTop: "6px" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: "280px" }}>
                <Pie data={inventoryStatusPie} options={pieOptions} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "28px", padding: "0" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Medicine Inventory</h2>
              <span style={{ color: "#64748B", fontSize: "0.85rem" }}>{medicines.length} products</span>
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
                  {medicines.map((med) => {
                    const stock = Number(med.stock || 0);
                    const isOut = stock === 0;
                    const isLow = stock > 0 && stock <= 10;
                    return (
                      <tr key={med.id}>
                        <td style={{ padding: "16px 28px" }}>
                          <div style={{ fontWeight: "600" }}>{med.name}</div>
                          <div
                            style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {med.dosage || "N/A"}
                          </div>
                        </td>
                        <td style={{ padding: "16px 28px" }}>
                          {med.category || "—"}
                        </td>
                        <td style={{ padding: "16px 28px", fontWeight: "700" }}>
                          {stock}
                        </td>
                        <td style={{ padding: "16px 28px" }}>
                          ETB {Number(med.price || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "16px 28px" }}>
                          {med.supplier || "—"}
                        </td>
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

      {/* ── PROFIT TAB ── */}
      {activeTab === "Profit" && (
        <>
          <div style={{ padding: "10px 16px", background: "#EFF6FF", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#1D4ED8" }}>
            <TrendingUp size={15} />
            Profit is estimated at 30% margin on revenue — purchase cost data not available.
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Est. Profit · {reportPeriod}</h2>
              </div>
              <div style={{ height: "340px" }}>
                <Bar data={profitChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>Est. Profit by Product</h2>
              <div style={{ height: "360px" }}>
                <Pie data={profitByProductData} options={pieOptions} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "28px", padding: "0" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Top Products by Est. Profit</h2>
              <span style={{ color: "#64748B", fontSize: "0.85rem" }}>Top {topSelling.length}</span>
            </div>
            <div className="table-container">
              <table style={{ margin: "0" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Unit Price</th>
                    <th>Est. Revenue</th>
                    <th>Est. Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {topSelling.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#94A3B8", padding: "40px" }}>
                        No data for this period.
                      </td>
                    </tr>
                  ) : (
                    topSelling.map(([name, qty], i) => {
                      const med = medicines.find((m) => m.name === name);
                      const price = med ? Number(med.price || 0) : 0;
                      const revenue = qty * price;
                      const profit = Math.round(revenue * PROFIT_MARGIN);
                      return (
                        <tr key={name}>
                          <td style={{ padding: "16px 28px", fontWeight: "700", color: "var(--primary)" }}>{i + 1}</td>
                          <td style={{ padding: "16px 28px", fontWeight: "600" }}>{name}</td>
                          <td style={{ padding: "16px 28px" }}>{qty}</td>
                          <td style={{ padding: "16px 28px" }}>{price > 0 ? `ETB ${price}` : "—"}</td>
                          <td style={{ padding: "16px 28px" }}>{price > 0 ? `ETB ${revenue.toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "16px 28px", fontWeight: "800", color: "#7C3AED" }}>
                            {price > 0 ? `ETB ${profit.toLocaleString()}` : "—"}
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

      {/* ── EXPIRATION TAB ── */}
      {activeTab === "Expiration" && (
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Expiration Timeline</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.85rem" }}>
                  <Clock size={15} /> By Month
                </div>
              </div>
              <div style={{ height: "340px" }}>
                <Bar data={expirationTimelineData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, ticks: { callback: (v) => v } } } }} />
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>Expiration Status</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "Expired", value: expiredMeds.length, bg: "#FEF2F2", color: "#DC2626" },
                  { label: "Expiring Soon", value: expiringSoonMeds.length, bg: "#FFFBEB", color: "#D97706" },
                  { label: "Fresh", value: freshMeds.length, bg: "#ECFDF5", color: "#059669" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "16px", background: item.bg, borderRadius: "14px", textAlign: "center" }}>
                    <div style={{ fontWeight: "600", color: item.color, fontSize: "0.78rem" }}>{item.label}</div>
                    <div style={{ fontWeight: "800", fontSize: "1.4rem", marginTop: "6px" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: "280px" }}>
                <Pie data={expirationPieData} options={pieOptions} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "28px", padding: "0" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Medicine Expiry Details</h2>
              <span style={{ color: "#64748B", fontSize: "0.85rem" }}>{medicinesSortedByExpiry.length} tracked</span>
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
                  {medicinesSortedByExpiry.map((med) => {
                    const { label, color, bg } = getExpiryStatusLabel(med);
                    const exp = getMedicineExpiryDate(med);
                    return (
                      <tr key={med.id}>
                        <td style={{ padding: "16px 28px" }}>
                          <div style={{ fontWeight: "600" }}>{med.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{med.dosage || "N/A"}</div>
                        </td>
                        <td style={{ padding: "16px 28px" }}>{med.category || "—"}</td>
                        <td style={{ padding: "16px 28px" }}>{med.batch || "—"}</td>
                        <td style={{ padding: "16px 28px", fontWeight: "700" }}>{med.stock}</td>
                        <td style={{ padding: "16px 28px" }}>{exp ? exp.toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "16px 28px" }}>
                          <span className="status-badge" style={{ background: bg, color }}>{label}</span>
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
