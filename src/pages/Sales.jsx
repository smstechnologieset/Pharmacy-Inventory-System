import React, { useEffect, useState, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import CustomSelect from "../components/CustomSelect";
import { getAllMedicines } from "../services/medicines.js";
import { getAllSales, getRecentSales } from "../services/sales.js";
import { createStockMovement, getAllStockBatches } from "../services/stockBatches.js";
import { processCheckoutTransaction, processRefundTransaction } from "../services/transactions.js";

const Sales = () => {
  const { user } = useAuth();
  const { t } = useSettings();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const receiptRef = useRef(null);

  const isExpired = (expiry) => {
    if (!expiry) return false;
    const d = expiry?.toDate ? expiry.toDate() : new Date(expiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const getSaleDate = (sale) => {
    if (sale.createdAt && typeof sale.createdAt.toDate === "function")
      return sale.createdAt.toDate();
    if (sale.date) {
      const parsedDate = new Date(sale.date);
      if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
    }
    return new Date();
  };

  useEffect(() => {
    if (!user?.pharmacyId) return;
    const loadSalesData = async () => {
      try {
        setLoading(true);
        const [meds, salesList, stockBatches] = await Promise.all([
          getAllMedicines(user.pharmacyId),
          getRecentSales(user.pharmacyId, 50),
          getAllStockBatches(user.pharmacyId),
        ]);
        setMedicines(meds);
        setTransactions(salesList);
        setBatches(stockBatches);
      } catch (loadError) {
        console.error("Failed to load sales data", loadError);
        setError("Unable to load data from Firestore.");
      } finally {
        setLoading(false);
      }
    };
    loadSalesData();
  }, [user?.pharmacyId]);

  // Group batches by medicine to show total available stock in the grid
  // Group batches by medicine, but ONLY show the batch expiring soonest
  const validBatches = batches.filter(
    (b) => b.quantity > 0 && !isExpired(b.expiry),
  );

  const productGrid = medicines
    .filter((med) => med.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((med) => {
      const medBatches = validBatches.filter((b) => b.medicineId === med.id);

      // If no valid batches, hide the medicine entirely
      if (medBatches.length === 0) return null;

      // Sort by expiry date ascending (FEFO)
      medBatches.sort((a, b) => {
        const dateA = a.expiry?.toDate ? a.expiry.toDate() : new Date(a.expiry);
        const dateB = b.expiry?.toDate ? b.expiry.toDate() : new Date(b.expiry);
        return dateA - dateB;
      });

      // Grab ONLY the first batch (the one that needs to be sold first)
      const activeBatch = medBatches[0];

      return {
        ...med,
        activeBatchId: activeBatch.id,
        activeBatchNo: activeBatch.batchNo,
        activeExpiry: activeBatch.expiry,
        availableStock: activeBatch.quantity, // Show ONLY this batch's stock
        displayPrice: activeBatch.sellingPrice || med.price,
      };
    })
    .filter(Boolean); // Removes nulls (medicines with 0 valid batches)

  // const productGrid = medicines
  //   .map((med) => {
  //     const medBatches = validBatches.filter((b) => b.medicineId === med.id);
  //     const totalStock = medBatches.reduce((sum, b) => sum + b.quantity, 0);
  //     const oldestBatch = medBatches.sort((a, b) => {
  //       const dateA = a.expiry?.toDate ? a.expiry.toDate() : new Date(a.expiry);
  //       const dateB = b.expiry?.toDate ? b.expiry.toDate() : new Date(b.expiry);
  //       return dateA - dateB;
  //     })[0];

  //     return {
  //       ...med,
  //       availableStock: totalStock,
  //       displayPrice: oldestBatch ? oldestBatch.sellingPrice : med.price,
  //     };
  //   })
  //   .filter(
  //     (med) =>
  //       med.availableStock > 0 &&
  //       med.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );

  // FEFO Allocation: Automatically adds the batch expiring soonest
  // const handleAddToCart = (medicineId) => {
  //   const medBatches = validBatches
  //     .filter((b) => b.medicineId === medicineId)
  //     .sort((a, b) => {
  //       const dateA = a.expiry?.toDate ? a.expiry.toDate() : new Date(a.expiry);
  //       const dateB = b.expiry?.toDate ? b.expiry.toDate() : new Date(b.expiry);
  //       return dateA - dateB;
  //     });

  //   if (medBatches.length === 0) {
  //     setError("This medicine is currently out of stock or expired.");
  //     return;
  //   }

  //   const med = medicines.find((m) => m.id === medicineId);
  //   let added = false;
  //   const newCart = [...cart];

  //   // Try to add to an existing cart item first
  //   for (let i = 0; i < medBatches.length; i++) {
  //     const batch = medBatches[i];
  //     const cartIndex = newCart.findIndex((item) => item.batchId === batch.id);
  //     if (cartIndex !== -1 && newCart[cartIndex].quantity < batch.quantity) {
  //       newCart[cartIndex].quantity += 1;
  //       added = true;
  //       break;
  //     }
  //   }

  //   // If not added, find a batch not in cart yet
  //   if (!added) {
  //     for (let i = 0; i < medBatches.length; i++) {
  //       const batch = medBatches[i];
  //       const cartIndex = newCart.findIndex(
  //         (item) => item.batchId === batch.id,
  //       );
  //       if (cartIndex === -1) {
  //         newCart.push({
  //           batchId: batch.id,
  //           medicineId: med.id,
  //           name: med.name,
  //           price: batch.sellingPrice || med.price,
  //           costPrice: batch.costPrice || 0, // ← ADD THIS LINE
  //           quantity: 1,
  //           maxQty: batch.quantity,
  //           batchNo: batch.batchNo,
  //           expiry: batch.expiry,
  //         });
  //         added = true;
  //         break;
  //       }
  //     }
  //   }

  //   if (added) {
  //     setCart(newCart);
  //     setError("");
  //   } else {
  //     setError("All available batches are fully added to the cart.");
  //   }
  // };

  const handleAddToCart = (medicineId) => {
    const medBatches = validBatches
      .filter((b) => b.medicineId === medicineId)
      .sort((a, b) => {
        const dateA = a.expiry?.toDate ? a.expiry.toDate() : new Date(a.expiry);
        const dateB = b.expiry?.toDate ? b.expiry.toDate() : new Date(b.expiry);
        return dateA - dateB; // Soonest expiring first
      });

    if (medBatches.length === 0) {
      setError("This medicine is currently out of stock or expired.");
      return;
    }

    const med = medicines.find((m) => m.id === medicineId);
    const newCart = [...cart];
    let added = false;

    // Strict FEFO: Find the first batch in the sorted list that has available stock
    for (let i = 0; i < medBatches.length; i++) {
      const batch = medBatches[i];
      const cartIndex = newCart.findIndex((item) => item.batchId === batch.id);
      const currentCartQty = cartIndex !== -1 ? newCart[cartIndex].quantity : 0;

      // If this batch still has available stock to add
      if (currentCartQty < batch.quantity) {
        if (cartIndex !== -1) {
          // It's already in the cart, just increment
          newCart[cartIndex].quantity += 1;
        } else {
          // It's not in the cart, add it as a new line item
          newCart.push({
            batchId: batch.id,
            medicineId: med.id,
            name: med.name,
            price: batch.sellingPrice || med.price,
            costPrice: batch.costPrice || 0,
            quantity: 1,
            maxQty: batch.quantity,
            batchNo: batch.batchNo,
            expiry: batch.expiry,
          });
        }
        added = true;
        break; // Stop after adding to the soonest available batch
      }
    }

    if (added) {
      setCart(newCart);
      setError("");
    } else {
      setError("All available batches are fully added to the cart.");
    }
  };
  const updateQuantity = (batchId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.batchId === batchId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.maxQty) {
              setError(
                `Only ${item.maxQty} units available in batch ${item.batchNo}`,
              );
              return item;
            }
            setError("");
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (batchId) =>
    setCart(cart.filter((item) => item.batchId !== batchId));

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const total = subtotal;

  const handlePrint = () => setTimeout(() => window.print(), 100);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setError("");

    try {
      const result = await processCheckoutTransaction(
        cart,
        paymentMethod,
        user?.uid,
        user?.pharmacyId,
      );

      // Log stock movements for audit trail (Priority 7)
      for (const item of cart) {
        await createStockMovement(
          {
            medicineId: item.medicineId,
            medicineName: item.name,
            batchNo: item.batchNo,
            type: "sale",
            quantityChanged: -item.quantity,
            reason: `Sold via POS (Invoice: ${result.invoiceNumber})`,
            performedBy: user?.uid || "Unknown",
          },
          user?.pharmacyId,
        );
      }

      const now = new Date();
      setCurrentReceipt({
        invoiceNumber: result.invoiceNumber,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: cart.map((item) => ({
          name: `${item.name} (${item.batchNo})`,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        payment: paymentMethod,
      });

      // Refresh data and reset cart
      const [salesList, stockBatches] = await Promise.all([
        getAllSales(user?.pharmacyId),
        getAllStockBatches(user?.pharmacyId),
      ]);
      setTransactions(salesList);
      setBatches(stockBatches);
      setCart([]);
      setShowReceipt(true);
    } catch (checkoutError) {
      console.error("Checkout failed", checkoutError);
      setError(
        checkoutError.message ||
          "Unable to complete checkout. Please try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRefund = async (sale) => {
    if (!sale.items || sale.items.length === 0) {
      alert("Cannot refund: This legacy sale has no batch details recorded.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to refund Invoice ${sale.invoiceNumber}? Stock will be restored to inventory.`,
      )
    )
      return;

    try {
      await processRefundTransaction(
        sale.id,
        sale.items,
        user?.uid,
        user?.pharmacyId,
      );

      // Log stock movements for audit trail
      for (const item of sale.items) {
        await createStockMovement(
          {
            medicineId: item.medicineId,
            medicineName: item.name,
            batchNo: item.batchNo,
            type: "return",
            quantityChanged: item.quantity, // Positive because it's returning to stock
            reason: `Refund for Invoice: ${sale.invoiceNumber}`,
            performedBy: user?.uid || "Unknown",
          },
          user?.pharmacyId,
        );
      }

      // Refresh sales list
      const salesList = await getAllSales(user?.pharmacyId);
      setTransactions(salesList);
      alert("Refund successful! Stock has been restored.");
    } catch (err) {
      console.error("Refund failed:", err);
      alert(err.message || "Failed to process refund.");
    }
  };

  return (
    <div className="sales-page">
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: "800",
            letterSpacing: "-0.025em",
          }}>
          {t("sales.title")}
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginTop: "4px",
          }}>
          {t("sales.subtitle")}
        </p>
        {error && (
          <div style={{ marginTop: "16px", color: "#dc2626", fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: "1.8fr 1fr" }}>
        {/* Left: Product Selection */}
        <div className="card" style={{ padding: "0", overflow: "hidden" }}>
          <div
            style={{ padding: "24px 32px", borderBottom: "1px solid #F1F5F9" }}>
            <div
              className="search-bar"
              style={{ width: "100%", maxWidth: "450px" }}>
              <Search size={22} style={{ color: "#94A3B8" }} />
              <input
                type="text"
                placeholder={t("sales.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              padding: "32px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "20px",
              maxHeight: "600px",
              overflowY: "auto",
            }}>
            {loading ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#64748B",
                }}>
                {t("sales.loadingProducts")}
              </div>
            ) : productGrid.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#64748B",
                }}>
                {t("sales.noMedicines")}
              </div>
            ) : (
              productGrid.map((med) => (
                <div
                  key={med.id}
                  className="card"
                  style={{
                    padding: "20px",
                    cursor: "pointer",
                    border: "1px solid #F1F5F9",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
                    textAlign: "center",
                  }}
                  onClick={() => handleAddToCart(med.id)}>
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "16px",
                      background: "#F0FDFA",
                      color: "#0D9488",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}>
                    <ShoppingCart size={24} />
                  </div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      marginBottom: "4px",
                      height: "40px",
                      overflow: "hidden",
                    }}>
                    {med.name}
                  </div>
                  <div
                    style={{
                      color: "#0D9488",
                      fontWeight: "800",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                    }}>
                    ETB {Number(med.displayPrice).toFixed(2)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color:
                        Number(med.availableStock) < 10 ? "#EF4444" : "#94A3B8",
                    }}>
                    {Number(med.availableStock)} {t("sales.unitsLeft")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0",
            overflow: "hidden",
            maxHeight: "780px",
          }}>
          <div
            style={{
              padding: "24px 32px",
              background: "var(--primary)",
              color: "white",
            }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
              {t("sales.currentCart")}
            </h2>
            <p style={{ fontSize: "0.75rem", opacity: "0.9" }}>
              {cart.length} {t("sales.items")}
            </p>
          </div>

          <div
            style={{
              flex: 1,
              padding: "24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
            {cart.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#94A3B8",
                }}>
                <ShoppingCart
                  size={48}
                  strokeWidth={1}
                  style={{ marginBottom: "16px", opacity: 0.5 }}
                />
                <p>{t("sales.cartEmpty")}</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.batchId}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#0D9488",
                        fontWeight: "600",
                      }}>
                      {t("sales.batch")}: {item.batchNo}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                      ETB {item.price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#F8FAFC",
                      padding: "4px",
                      borderRadius: "12px",
                    }}>
                    <button
                      className="icon-button"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                      }}
                      onClick={() => updateQuantity(item.batchId, -1)}>
                      <Minus size={14} />
                    </button>
                    <span
                      style={{
                        fontWeight: "700",
                        minWidth: "20px",
                        textAlign: "center",
                      }}>
                      {item.quantity}
                    </span>
                    <button
                      className="icon-button"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                      }}
                      onClick={() => updateQuantity(item.batchId, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.batchId)}
                    style={{
                      padding: "8px",
                      border: "none",
                      background: "none",
                      color: "#EF4444",
                      cursor: "pointer",
                    }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: "32px",
              borderTop: "1px solid #F1F5F9",
              background: "#F8FAFC",
            }}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "#64748B",
                }}>
                {t("sales.paymentMethod")}
              </label>
              <CustomSelect
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
                options={[
                  { value: "Cash", label: "Cash" },
                  { value: "CBE Birr", label: "CBE Birr" },
                  { value: "Telebirr", label: "Telebirr" },
                  { value: "Bank Transfer", label: "Bank Transfer" },
                ]}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "24px",
                fontSize: "1.15rem",
                fontWeight: "800",
              }}>
              <span>{t("sales.total")}</span>
              <span>ETB {total.toLocaleString()}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", height: "52px", fontSize: "1rem" }}
              disabled={cart.length === 0 || isCheckingOut}
              onClick={handleCheckout}>
              {isCheckingOut
                ? t("sales.processing")
                : t("sales.confirmCheckout")}
            </button>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div
        className="card"
        style={{ marginTop: "32px", padding: "0", overflow: "hidden" }}>
        <div
          style={{ padding: "24px 32px", borderBottom: "1px solid #F1F5F9" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
            {t("sales.transactionHistory")}
          </h2>
        </div>
        <div className="table-container">
          <table style={{ borderSpacing: "0" }}>
            <thead style={{ background: "#F8FAFC" }}>
              <tr>
                <th style={{ padding: "16px 32px" }}>{t("sales.invoice")}</th>
                <th>{t("sales.items")}</th>
                <th>{t("sales.qty")}</th>
                <th>{t("sales.dateTime")}</th>
                <th>{t("sales.payment")}</th>
                <th>{t("sales.amount")}</th>
                <th style={{ paddingRight: "32px" }}>{t("sales.status")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((sale) => (
                <tr key={sale.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td
                    style={{
                      fontWeight: "700",
                      color: "var(--primary)",
                      padding: "20px 32px",
                    }}>
                    #{sale.invoiceNumber || sale.id}
                  </td>
                  <td>
                    {sale.items ? `${sale.items.length} items` : sale.item}
                  </td>
                  <td>
                    {sale.items
                      ? sale.items.reduce((sum, i) => sum + i.quantity, 0)
                      : sale.quantity}
                  </td>
                  <td>
                    <div>
                      {sale.date || getSaleDate(sale).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                      {getSaleDate(sale).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.85rem",
                      }}>
                      <CheckCircle size={14} color="#10B981" />{" "}
                      {sale.paymentMethod || sale.payment}
                    </div>
                  </td>
                  <td style={{ fontWeight: "800" }}>
                    ETB{" "}
                    {sale.amount
                      ? sale.amount.toLocaleString()
                      : sale.total.toLocaleString()}
                  </td>
                  <td style={{ paddingRight: "32px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}>
                      <span
                        className="status-badge"
                        style={{
                          background:
                            sale.status === "Refunded" ? "#F1F5F9" : "#ECFDF5",
                          color:
                            sale.status === "Refunded" ? "#64748B" : "#059669",
                        }}>
                        {sale.status || "Completed"}
                      </span>
                      {sale.status !== "Refunded" && sale.items && (
                        <button
                          className="icon-button"
                          onClick={() => handleRefund(sale)}
                          title="Refund & Restore Stock"
                          style={{
                            width: "32px",
                            height: "32px",
                            color: "#F59E0B",
                            background: "#FFFBEB",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt */}
      {currentReceipt && (
        <div ref={receiptRef} className="printable-receipt">
          <div
            style={{
              textAlign: "center",
              borderBottom: "1px dashed #000",
              paddingBottom: 6,
              marginBottom: 6,
            }}>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>
              PHARMACY RECEIPT
            </div>
          </div>
          <div style={{ fontSize: 11, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Invoice:</span>
              <span style={{ fontWeight: 700 }}>
                {currentReceipt.invoiceNumber}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Date:</span>
              <span>{currentReceipt.date}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Payment:</span>
              <span>{currentReceipt.payment}</span>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "4px 0",
              marginBottom: 4,
            }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                fontWeight: 700,
                fontSize: 10,
              }}>
              <span>ITEM</span>
              <span style={{ textAlign: "center" }}>QTY</span>
              <span style={{ textAlign: "right" }}>PRICE</span>
              <span style={{ textAlign: "right" }}>TOTAL</span>
            </div>
          </div>
          {currentReceipt.items.map((it, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                fontSize: 11,
                padding: "2px 0",
              }}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {it.name}
              </span>
              <span style={{ textAlign: "center" }}>{it.quantity}</span>
              <span style={{ textAlign: "right" }}>
                {Number(it.price).toFixed(2)}
              </span>
              <span style={{ textAlign: "right" }}>
                {(it.quantity * it.price).toFixed(2)}
              </span>
            </div>
          ))}
          <div
            style={{
              borderTop: "1px dashed #000",
              marginTop: 6,
              paddingTop: 6,
            }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 900,
                fontSize: 14,
              }}>
              <span>TOTAL</span>
              <span>ETB {Number(currentReceipt.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 400, padding: 40 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#F0FDFA",
                  color: "#0D9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                {t("sales.paymentSuccess")}
              </h2>
            </div>
            <div
              style={{
                background: "#F8FAFC",
                padding: 24,
                borderRadius: 24,
                marginBottom: 32,
              }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: "0.9rem",
                }}>
                <span style={{ color: "#64748B" }}>{t("sales.invoiceId")}</span>
                <span style={{ fontWeight: 700 }}>
                  #{currentReceipt?.invoiceNumber}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontSize: "1rem",
                }}>
                <span>{t("sales.totalPaid")}</span>
                <span style={{ color: "var(--primary)" }}>
                  ETB{Number(currentReceipt?.total || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              className="btn btn-primary no-print"
              style={{
                width: "100%",
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={handlePrint}>
              <Printer size={20} /> {t("sales.printReceipt")}
            </button>
            <button
              className="no-print"
              style={{
                width: "100%",
                marginTop: 10,
                padding: 12,
                background: "transparent",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "#475569",
              }}
              onClick={() => setShowReceipt(false)}>
              {t("sales.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
