import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export const exportToPDF = (
  activeTab,
  period,
  filteredSales,
  stats,
  medicines,
  customStart,
  customEnd,
  extraData,
  getPeriodRange,
  getSaleDate,
  calculateRealProfit,
  getBatchExpiryDate,
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
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
  doc.text("PharmaStock", 14, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Pharmacy Inventory & Stock Management", 14, 24);
  doc.setFontSize(10);
  doc.text(`${activeTab} Report · ${period}`, 14, 32);
  doc.text(`Generated: ${now.toLocaleString()}`, pageW - 14, 32, {
    align: "right",
  });

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
      {
        label: "Total Revenue",
        value: `ETB ${stats.totalRevenue.toLocaleString()}`,
      },
      { label: "Transactions", value: String(stats.totalTransactions) },
      {
        label: "Avg Order Value",
        value: `ETB ${stats.averageOrder.toFixed(0)}`,
      },
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
      head: [
        ["Payment Method", "Transactions", "Total Revenue (ETB)", "Share (%)"],
      ],
      body: extraData.paymentBreakdown.map((p) => {
        const share =
          stats.totalRevenue > 0
            ? ((p.total / stats.totalRevenue) * 100).toFixed(1)
            : "0.0";
        return [
          p.method,
          String(p.count),
          `ETB ${p.total.toLocaleString()}`,
          `${share}%`,
        ];
      }),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
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
      head: [
        [
          "Invoice",
          "Product",
          "Batch",
          "Qty",
          "Date",
          "Amount (ETB)",
          "Payment",
          "Status",
        ],
      ],
      body: filteredSales.map((sale) => {
        const d = getSaleDate(sale);
        const items = sale.items && Array.isArray(sale.items) ? sale.items : [];
        const totalQty =
          items.length > 0
            ? items.reduce((sum, i) => sum + Number(i.quantity || 0), 0)
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
          primaryItem.batch || primaryItem.batchNo || sale.batch || "—";
        const amount = Number(sale.total || sale.amount || 0);
        const paymentMethod = sale.paymentMethod || sale.payment || "Cash";

        return [
          `#${sale.invoiceId || sale.id?.slice(0, 8) || "—"}`,
          productDisplay,
          batchDisplay,
          String(totalQty),
          d ? d.toLocaleDateString() : "—",
          `ETB ${amount.toLocaleString()}`,
          paymentMethod,
          sale.status || "—",
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [13, 148, 136],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  // ── INVENTORY TAB ──
  if (activeTab === "Inventory") {
    const {
      totalStock,
      lowStockCount,
      outOfStockCount,
      inStockCount,
      categories,
      medicines: meds,
    } = extraData;
    const statBoxes = [
      {
        label: "Total Stock",
        value: `${totalStock.toLocaleString()} units`,
        color: [13, 148, 136],
        bg: [240, 253, 250],
      },
      {
        label: "In Stock",
        value: String(inStockCount),
        color: [5, 150, 105],
        bg: [236, 253, 245],
      },
      {
        label: "Low Stock",
        value: String(lowStockCount),
        color: [180, 83, 9],
        bg: [255, 251, 235],
      },
      {
        label: "Out of Stock",
        value: String(outOfStockCount),
        color: [220, 38, 38],
        bg: [254, 242, 242],
      },
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
      head: [
        ["Medicine", "Category", "Stock", "Price (ETB)", "Supplier", "Status"],
      ],
      body: meds.map((med) => {
        const stock = Number(med.stock || 0);
        const status =
          stock === 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";
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
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  // ── PROFIT TAB ──
  if (activeTab === "Profit") {
    const totalProfit = Math.round(calculateRealProfit(filteredSales));
    const statBoxes = [
      {
        label: "Est. Profit",
        value: `ETB ${totalProfit.toLocaleString()}`,
        color: [124, 58, 237],
        bg: [245, 243, 255],
      },
      {
        label: "Total Revenue",
        value: `ETB ${stats.totalRevenue.toLocaleString()}`,
        color: [13, 148, 136],
        bg: [240, 253, 250],
      },
      {
        label: "Profit Margin",
        value:
          stats.totalRevenue > 0
            ? `${((totalProfit / stats.totalRevenue) * 100).toFixed(1)}%`
            : "0%",
        color: [37, 99, 235],
        bg: [239, 246, 255],
      },
      {
        label: "Avg Monthly",
        value: `ETB ${Math.round(totalProfit / 6).toLocaleString()}`,
        color: [180, 83, 9],
        bg: [255, 251, 235],
      },
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
      head: [
        [
          "#",
          "Product",
          "Units Sold",
          "Unit Price (ETB)",
          "Est. Revenue (ETB)",
          "Est. Profit (ETB)",
        ],
      ],
      body: extraData.topSelling.map(([name, data], i) => {
        const price = Number(data.price || 0);
        const revenue = Number(data.revenue || 0);
        const profit = Number(data.profit || 0);
        return [
          String(i + 1),
          name,
          String(data.qty || 0),
          price > 0 ? `ETB ${price}` : "—",
          `ETB ${revenue.toLocaleString()}`,
          `ETB ${Math.round(profit).toLocaleString()}`,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [245, 243, 255] },
    });
  }

  // ── EXPIRATION TAB ──
  if (activeTab === "Expiration") {
    const {
      expiredBatches,
      expiringSoonBatches,
      freshBatches,
      batchesSortedByExpiry,
      totalBatches,
    } = extraData;
    const statBoxes = [
      {
        label: "Expired",
        value: String(expiredBatches.length),
        color: [220, 38, 38],
        bg: [254, 242, 242],
      },
      {
        label: "Expiring in 30 Days",
        value: String(expiringSoonBatches.length),
        color: [217, 119, 6],
        bg: [255, 251, 235],
      },
      {
        label: "Fresh Stock",
        value: String(freshBatches.length),
        color: [5, 150, 105],
        bg: [236, 253, 245],
      },
      {
        label: "Total Tracked",
        value: String(totalBatches),
        color: [37, 99, 235],
        bg: [239, 246, 255],
      },
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
    if (expiredBatches.length > 0 || expiringSoonBatches.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38);
      doc.text(
        `⚠ Action Required: ${expiredBatches.length} Expired, ${expiringSoonBatches.length} Expiring Soon`,
        14,
        startY,
      );
      startY += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Medicine Expiry Details", 14, startY);
    startY += 4;
    autoTable(doc, {
      startY,
      head: [
        ["Medicine", "Category", "Batch", "Stock", "Expiry Date", "Status"],
      ],
      body: batchesSortedByExpiry.map((med) => {
        const exp = getBatchExpiryDate(med);
        const now2 = new Date();
        const in30 = new Date();
        in30.setDate(in30.getDate() + 30);
        const status = !exp
          ? "No Date"
          : exp < now2
            ? "Expired"
            : exp <= in30
              ? "Expiring Soon"
              : "Fresh";
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
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
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
