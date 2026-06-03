import React from "react";
import { ShieldOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PharmacySuspendedMessage = () => {
  const { logout, user } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A, #1E293B)",
        padding: "32px",
      }}>
      <div
        style={{
          background: "white",
          borderRadius: "32px",
          padding: "60px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "24px",
            background: "#FEF2F2",
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
          <ShieldOff size={40} />
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "800",
            color: "#1E293B",
            marginBottom: "12px",
          }}>
          Pharmacy Suspended
        </h1>
        <p
          style={{
            color: "#64748B",
            fontSize: "0.95rem",
            lineHeight: "1.6",
            marginBottom: "8px",
          }}>
          Your pharmacy account has been temporarily suspended by the platform
          administrator. All data is preserved and will be available once the
          suspension is lifted.
        </p>
        {user?.pharmacyName && (
          <p
            style={{
              color: "#94A3B8",
              fontSize: "0.85rem",
              marginBottom: "32px",
            }}>
            Pharmacy: <strong>{user.pharmacyName}</strong>
          </p>
        )}
        <button
          onClick={logout}
          style={{
            padding: "14px 32px",
            background: "#EF4444",
            color: "white",
            border: "none",
            borderRadius: "16px",
            fontWeight: "700",
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#DC2626")}
          onMouseLeave={(e) => (e.target.style.background = "#EF4444")}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default PharmacySuspendedMessage;
