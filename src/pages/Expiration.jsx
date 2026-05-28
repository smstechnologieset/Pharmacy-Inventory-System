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
  createStockMovement, // ← NEW IMPORT
} from "../services/firestoreService.js";
import { useAuth } from "../context/AuthContext.jsx";

const Expiration = () => {
    const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: timezone-safe date comparison (YYYY-MM-DD)
  const toDateKey = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const isExpired = (expiry) => {
    if (!expiry) return false;
    return toDateKey(expiry) < toDateKey(new Date());
  };

  const isExpiringSoon = (expiry, days = 60) => {
    if (!expiry || isExpired(expiry)) return false;
    const expiryDate = new Date(expiry);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  };

  // Fetch real medicines from Firestore on mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const data = await getAllMedicines();
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
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (action === "remove") {
      if (!window.confirm(`Permanently delete "${item.name}" from inventory?`))
        return;
      try {
        // ⚠️ TEMPORARY: Deletes entire medicine doc.
        // TODO: When splitting to stockBatches, delete only the batch, not the product master.
        await deleteMedicine(id);

        // Log the movement for audit
        await createStockMovement({
          medicineId: id,
          medicineName: item.name,
          batchNo: item.batch || "N/A",
          type: "expired_disposal",
          quantityChanged: -(item.stock || 0),
          reason: "Manual deletion via Expiration page",
          performedBy: user?.uid, 
        });

        setItems(items.filter((i) => i.id !== id));
        alert("Item removed successfully.");
      } catch (err) {
        console.error("Failed to remove medicine:", err);
        alert("Failed to remove item. Please try again.");
      }
    } else if (action === "dispose") {
      if (
        !window.confirm(
          `Mark "${item.name}" as disposed? Stock will be set to 0.`,
        )
      )
        return;
      try {
        // Update medicine: zero stock, mark status
        await updateMedicine(id, {
          stock: 0,
          status: "Disposed",
          disposedAt: new Date().toISOString(), // ← NEW FIELD for audit
        });

        // Log the movement
        await createStockMovement({
          medicineId: id,
          medicineName: item.name,
          batchNo: item.batch || "N/A",
          type: "expired_disposal",
          quantityChanged: -(item.stock || 0),
          reason: "Expired - marked disposed",
          performedBy: "current-user-id", // TODO: Replace with actual auth user ID
        });

        // Update local state optimistically
        setItems(
          items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  stock: 0,
                  status: "Disposed",
                  disposedAt: new Date().toISOString(),
                }
              : i,
          ),
        );
        alert("Item marked as disposed.");
      } catch (err) {
        console.error("Failed to dispose medicine:", err);
        alert("Failed to mark as disposed. Please try again.");
      }
    }
  };

  // Filtering logic (timezone-safe)
  const expiringSoon = items.filter((item) => isExpiringSoon(item.expiry));
  const expired = items.filter((item) => isExpired(item.expiry));

  const displayItems =
    filter === "expiring"
      ? expiringSoon
      : filter === "expired"
        ? expired
        : items.filter((item) => {
            if (!item.expiry) return false;
            return (
              isExpired(item.expiry) ||
              isExpiringSoon(item.expiry) ||
              (item.stock !== undefined && item.stock < 10)
            );
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
      {/* ... [Header, stats-grid, tabs remain unchanged] ... */}
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

      {/* Stats cards unchanged */}
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

      {/* Table */}
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
                  const expired = isExpired(item.expiry);
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
                          color: expired ? "#EF4444" : "#F59E0B",
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
                            background: expired ? "#FEE2E2" : "#FEF3C7",
                            color: expired ? "#B91C1C" : "#92400E",
                            fontSize: "0.75rem",
                          }}>
                          {expired
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
