
import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Trash2,
  Clock,
} from "lucide-react";
import {
  getAllMedicines,
  updateMedicine,
  deleteMedicine,
} from "../services/firestoreService.js"; // Adjust path if needed

const Expiration = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real medicines from Firestore on mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const data = await getAllMedicines();
        // Filter to only items with expiry dates for this page
        const withExpiry = data.filter((item) => item.expiry);
        setItems(withExpiry);
        setError(null);
      } catch (err) {
        console.error("Failed to load medicines:", err);
        setError(
          "Could not load expiration data. Please check your connection.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  const handleAction = async (id, action) => {
    if (action === "remove") {
      if (window.confirm("Remove this expired item from inventory?")) {
        try {
          await deleteMedicine(id);
          setItems(items.filter((item) => item.id !== id));
        } catch (err) {
          console.error("Failed to remove medicine:", err);
          alert("Failed to remove item. Please try again.");
        }
      }
    } else if (action === "dispose") {
      if (window.confirm("Mark this item as disposed?")) {
        try {
          await updateMedicine(id, { stock: 0, status: "Disposed" });
          setItems(
            items.map((item) =>
              item.id === id ? { ...item, stock: 0, status: "Disposed" } : item,
            ),
          );
        } catch (err) {
          console.error("Failed to dispose medicine:", err);
          alert("Failed to mark as disposed. Please try again.");
        }
      }
    }
  };

  const expiringSoon = items.filter((item) => {
    if (!item.expiry) return false;
    const expiryDate = new Date(item.expiry);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 60;
  });

  const expired = items.filter((item) => {
    if (!item.expiry) return false;
    return new Date(item.expiry) < new Date();
  });

  const displayItems =
    filter === "expiring"
      ? expiringSoon
      : filter === "expired"
        ? expired
        : items.filter((item) => {
            if (!item.expiry) return false;
            const isExpired = new Date(item.expiry) < new Date();
            return isExpired || (item.stock !== undefined && item.stock < 10);
          });

  if (loading) {
    return (
      <div
        className="expiration-page"
        style={{ padding: "32px", textAlign: "center" }}>
        <p>Loading expiration data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="expiration-page"
        style={{ padding: "32px", color: "#EF4444" }}>
        <p>{error}</p>
        <button
          className="btn"
          onClick={() => window.location.reload()}
          style={{ marginTop: "16px" }}>
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="expiration-page">
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
            Stock Expiration
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            Proactively manage items nearing expiry.
          </p>
        </div>
        <div className="tabs">
          <div
            className={`tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}>
            All Alerts
          </div>
          <div
            className={`tab ${filter === "expiring" ? "active" : ""}`}
            onClick={() => setFilter("expiring")}>
            Expiring Soon
          </div>
          <div
            className={`tab ${filter === "expired" ? "active" : ""}`}
            onClick={() => setFilter("expired")}>
            Expired
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div
            className="stat-icon"
            style={{ background: "#FEF2F2", color: "#EF4444" }}>
            <AlertCircle size={28} />
          </div>
          <div className="stat-info">
            <span className="label">Expired Items</span>
            <div className="value">{expired.length}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div
            className="stat-icon"
            style={{ background: "#FFF7ED", color: "#F59E0B" }}>
            <Clock size={28} />
          </div>
          <div className="stat-info">
            <span className="label">Expiring Soon</span>
            <div className="value">{expiringSoon.length}</div>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{ padding: "0", overflow: "hidden", marginTop: "32px" }}>
        <div className="table-container">
          <table style={{ borderSpacing: "0" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "16px 32px" }}>Medicine Name</th>
                <th>Batch No</th>
                <th>Expiry Date</th>
                <th>Remaining</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: "32px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "60px",
                      color: "#94A3B8",
                    }}>
                    <CheckCircle
                      size={48}
                      strokeWidth={1}
                      style={{
                        marginBottom: "16px",
                        opacity: 0.5,
                        color: "#10B981",
                      }}
                    />
                    <p>No expiration alerts found.</p>
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => {
                  const isExpired = item.expiry
                    ? new Date(item.expiry) < new Date()
                    : false;
                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "20px 32px" }}>
                        <div style={{ fontWeight: "700", fontSize: "1rem" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                          {item.category}
                        </div>
                      </td>
                      <td style={{ fontWeight: "600", color: "#64748B" }}>
                        {item.batch || "N/A"}
                      </td>
                      <td
                        style={{
                          color: isExpired ? "#EF4444" : "#F59E0B",
                          fontWeight: "700",
                        }}>
                        {item.expiry || "N/A"}
                      </td>
                      <td style={{ fontWeight: "600" }}>
                        {item.stock !== undefined
                          ? `${item.stock} units`
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background: isExpired ? "#FEE2E2" : "#FEF3C7",
                            color: isExpired ? "#B91C1C" : "#92400E",
                            fontSize: "0.75rem",
                          }}>
                          {isExpired
                            ? "Expired"
                            : item.stock < 10
                              ? "Low Stock"
                              : "Expiring Soon"}
                        </span>
                      </td>
                      <td style={{ paddingRight: "32px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "flex-end",
                          }}>
                          <button
                            className="btn"
                            style={{
                              padding: "8px 16px",
                              background: "#F8FAFC",
                              color: "#475569",
                              fontSize: "0.8rem",
                            }}
                            onClick={() => handleAction(item.id, "dispose")}
                            disabled={item.status === "Disposed"}>
                            {item.status === "Disposed"
                              ? "Disposed"
                              : "Mark Disposed"}
                          </button>
                          <button
                            className="icon-button"
                            style={{
                              width: "36px",
                              height: "36px",
                              color: "#EF4444",
                            }}
                            onClick={() => handleAction(item.id, "remove")}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expiration;
