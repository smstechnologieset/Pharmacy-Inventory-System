import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Trash2, Clock } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext";
import {
  createStockMovement,
  deleteStockBatch,
  getAllStockBatches,
  updateStockBatch,
} from "../services/stockBatches.js";
import { getAllMedicines } from "../services/medicines.js";
import ConfirmModal from "../components/ConfirmModal"; // 1. Import ConfirmModal

const Expiration = () => {
  const { user } = useAuth();
  const { t } = useSettings();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Add states for the Confirm Modal and Action Feedback
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { batchId, action }
  const [actionMessage, setActionMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Helper: timezone-safe date comparison (YYYY-MM-DD)
  const toDateKey = (date) => {
    if (!date) return null;
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split("T")[0];
  };

  const isExpired = (expiry) => {
    if (!expiry) return false;
    return toDateKey(expiry) < toDateKey(new Date());
  };

  const isExpiringSoon = (expiry, days = 60) => {
    if (!expiry || isExpired(expiry)) return false;
    const expiryDate = expiry?.toDate ? expiry.toDate() : new Date(expiry);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  };

  useEffect(() => {
    if (!user?.pharmacyId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batches, medicines] = await Promise.all([
          getAllStockBatches(user?.pharmacyId),
          getAllMedicines(user?.pharmacyId),
        ]);

        const medMap = medicines.reduce((acc, med) => {
          acc[med.id] = med;
          return acc;
        }, {});

        const combinedData = batches
          .filter((b) => b.expiry)
          .map((b) => ({
            ...b,
            id: b.id,
            medicineId: b.medicineId,
            name: medMap[b.medicineId]?.name || "Unknown Medicine",
            category: medMap[b.medicineId]?.category || "N/A",
            batchNo: b.batchNo || "N/A",
            expiry: b.expiry,
            stock: b.quantity || 0,
            status: b.status || "In Stock",
          }));

        setItems(combinedData);
        setError(null);
      } catch (err) {
        console.error("Failed to load expiration data:", err);
        setError(
          t("expiration.loadError") ||
            "Could not load expiration data. Please check your connection.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t, user?.pharmacyId]);

  // 3. Split logic: Open modal first
  const openActionModal = (batchId, action) => {
    setPendingAction({ batchId, action });
    setIsConfirmModalOpen(true);
  };

  // 4. Execute action on confirm
  const confirmAction = async () => {
    if (!pendingAction) return;
    const { batchId, action } = pendingAction;
    const item = items.find((i) => i.id === batchId);
    if (!item) return;

    setActionMessage(null);

    if (action === "remove") {
      try {
        await deleteStockBatch(batchId, user?.pharmacyId);

        await createStockMovement(
          {
            medicineId: item.medicineId,
            medicineName: item.name,
            batchNo: item.batchNo,
            type: "expired_disposal",
            quantityChanged: -item.stock,
            reason: "Manual deletion via Expiration page",
            performedBy: user?.uid || "Unknown",
          },
          user?.pharmacyId,
        );

        setItems(items.filter((i) => i.id !== batchId));
        setActionMessage({
          type: "success",
          text: t("expiration.batchRemoved") || "Batch removed successfully.",
        });
      } catch (err) {
        console.error("Failed to remove batch:", err);
        setActionMessage({
          type: "error",
          text:
            t("expiration.failedToRemove") ||
            "Failed to remove batch. Please try again.",
        });
      }
    } else if (action === "dispose") {
      try {
        await updateStockBatch(
          batchId,
          {
            quantity: 0,
            status: "Disposed",
            disposedAt: new Date().toISOString(),
          },
          user?.pharmacyId,
        );

        await createStockMovement(
          {
            medicineId: item.medicineId,
            medicineName: item.name,
            batchNo: item.batchNo,
            type: "expired_disposal",
            quantityChanged: -item.stock,
            reason: "Expired - marked disposed",
            performedBy: user?.uid || "Unknown",
          },
          user?.pharmacyId,
        );

        setItems(
          items.map((i) =>
            i.id === batchId
              ? {
                  ...i,
                  stock: 0,
                  status: "Disposed",
                  disposedAt: new Date().toISOString(),
                }
              : i,
          ),
        );
        setActionMessage({
          type: "success",
          text: t("expiration.batchDisposed") || "Batch marked as disposed.",
        });
      } catch (err) {
        console.error("Failed to dispose batch:", err);
        setActionMessage({
          type: "error",
          text:
            t("expiration.failedToDispose") ||
            "Failed to mark as disposed. Please try again.",
        });
      }
    }

    setPendingAction(null);
    // Auto-clear success/error message after 4 seconds
    setTimeout(() => setActionMessage(null), 4000);
  };

  const expiringSoon = items.filter((item) => isExpiringSoon(item.expiry));
  const expiredItems = items.filter((item) => isExpired(item.expiry));

  const displayItems =
    filter === "expiring"
      ? expiringSoon
      : filter === "expired"
        ? expiredItems
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
        <p>{t("expiration.loading")}</p>
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
          {t("expiration.retry")}
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
            {t("expiration.title")}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            {t("expiration.subtitle")}
          </p>
        </div>
        <div className="tabs">
          <div
            className={`tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}>
            {t("expiration.allAlerts")}
          </div>
          <div
            className={`tab ${filter === "expiring" ? "active" : ""}`}
            onClick={() => setFilter("expiring")}>
            {t("expiration.expiringSoon")}
          </div>
          <div
            className={`tab ${filter === "expired" ? "active" : ""}`}
            onClick={() => setFilter("expired")}>
            {t("expiration.expired")}
          </div>
        </div>
      </div>

      {/* 5. Inline Feedback Banner (Replaces native alert) */}
      {actionMessage && (
        <div
          style={{
            color: actionMessage.type === "success" ? "#065F46" : "#B91C1C",
            background:
              actionMessage.type === "success" ? "#ECFDF5" : "#FEE2E2",
            padding: "14px 24px",
            borderRadius: "16px",
            marginBottom: "24px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
          {actionMessage.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {actionMessage.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="card stat-card">
          <div
            className="stat-icon"
            style={{ background: "#FEF2F2", color: "#EF4444" }}>
            <AlertCircle size={28} />
          </div>
          <div className="stat-info">
            <span className="label">{t("expiration.expiredItems")}</span>
            <div className="value">{expiredItems.length}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div
            className="stat-icon"
            style={{ background: "#FFF7ED", color: "#F59E0B" }}>
            <Clock size={28} />
          </div>
          <div className="stat-info">
            <span className="label">{t("expiration.expiringSoon")}</span>
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
                <th style={{ padding: "16px 32px" }}>
                  {t("expiration.medicineName")}
                </th>
                <th>{t("expiration.batchNo")}</th>
                <th>{t("expiration.expiryDate")}</th>
                <th>{t("expiration.remaining")}</th>
                <th>{t("expiration.status")}</th>
                <th style={{ textAlign: "right", paddingRight: "32px" }}>
                  {t("expiration.actions")}
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
                    <p>{t("expiration.noAlerts")}</p>
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => {
                  const isItemExpired = isExpired(item.expiry);
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
                        {item.batchNo}
                      </td>
                      <td
                        style={{
                          color: isItemExpired ? "#EF4444" : "#F59E0B",
                          fontWeight: "700",
                        }}>
                        {item.expiry ? toDateKey(item.expiry) : "N/A"}
                      </td>
                      <td style={{ fontWeight: "600" }}>
                        {item.stock !== undefined
                          ? `${item.stock} ${t("medicine.units")}`
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background: isItemExpired ? "#FEE2E2" : "#FEF3C7",
                            color: isItemExpired ? "#B91C1C" : "#92400E",
                            fontSize: "0.75rem",
                          }}>
                          {isItemExpired
                            ? t("expiration.expired")
                            : item.stock < 10
                              ? t("expiration.lowStock")
                              : t("expiration.expiringSoon")}
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
                            onClick={() => openActionModal(item.id, "dispose")}
                            disabled={item.status === "Disposed"}>
                            {item.status === "Disposed"
                              ? t("expiration.disposed")
                              : t("expiration.markDisposed")}
                          </button>
                          <button
                            className="icon-button"
                            style={{
                              width: "36px",
                              height: "36px",
                              color: "#EF4444",
                            }}
                            onClick={() => openActionModal(item.id, "remove")}>
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

      {/* 6. Render Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPendingAction(null);
        }}
        onConfirm={confirmAction}
        title={
          pendingAction?.action === "remove"
            ? t("expiration.confirmDeleteTitle") || "Delete Batch?"
            : t("expiration.confirmDisposeTitle") || "Mark as Disposed?"
        }
        message={
          pendingAction?.action === "remove"
            ? t("expiration.confirmDelete") ||
              "Are you sure you want to permanently delete this batch? This action cannot be undone."
            : t("expiration.confirmDispose") ||
              "Are you sure you want to mark this batch as disposed? The stock quantity will be set to 0."
        }
        type={pendingAction?.action === "remove" ? "danger" : "warning"}
        confirmText={
          pendingAction?.action === "remove"
            ? t("expiration.delete") || "Delete"
            : t("expiration.dispose") || "Dispose"
        }
        cancelText={t("modal.cancel") || "Cancel"}
      />
    </div>
  );
};

export default Expiration;
