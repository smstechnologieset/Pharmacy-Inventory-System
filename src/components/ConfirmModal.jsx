import React from "react";
import { AlertTriangle, X, CheckCircle } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;
  const isDanger = type === "danger";
  const isSuccess = type === "success";

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "420px", padding: "32px", position: "relative" }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#94A3B8",
          }}>
          <X size={20} />
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "24px",
          }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: isDanger
                ? "#FEF2F2"
                : isSuccess
                  ? "#ECFDF5"
                  : "#FFFBEB",
              color: isDanger ? "#DC2626" : isSuccess ? "#059669" : "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}>
            {isSuccess ? (
              <CheckCircle size={32} />
            ) : (
              <AlertTriangle size={32} />
            )}
          </div>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "800",
              marginBottom: "8px",
              color: "#0F172A",
            }}>
            {title}
          </h2>
          <p
            style={{ color: "#64748B", fontSize: "0.9rem", lineHeight: "1.5" }}>
            {message}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn"
            onClick={onClose}
            style={{
              flex: 1,
              background: "#F8FAFC",
              color: "#475569",
              border: "1px solid #E2E8F0",
            }}>
            {cancelText}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              background: isDanger ? "#DC2626" : "var(--primary)",
            }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
