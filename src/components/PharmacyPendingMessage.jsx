import React from "react";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PharmacyPendingMessage = () => {
  const { logout, user } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "32px",
      }}>
      <div
        style={{
          background: "white",
          borderRadius: "28px",
          padding: "48px",
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)",
        }}>
        <div
          style={{
            width: "76px",
            height: "76px",
            borderRadius: "24px",
            background: "#FEF3C7",
            color: "#D97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
          <Clock size={38} />
        </div>
        <h1
          style={{
            fontSize: "1.45rem",
            fontWeight: "800",
            color: "#1E293B",
            marginBottom: "12px",
          }}>
          Registration Pending
        </h1>
        <p
          style={{
            color: "#64748B",
            fontSize: "0.95rem",
            lineHeight: "1.6",
            marginBottom: "12px",
          }}>
          Thanks for signing up, <strong>{user?.name || user?.email}</strong>.
          Your pharmacy registration is under review. Please wait while our
          team verifies your request; we will contact you using the phone number
          you provided.
        </p>
        {user?.pharmacyName && (
          <p
            style={{
              color: "#94A3B8",
              fontSize: "0.85rem",
              marginBottom: "28px",
            }}>
            Pharmacy: <strong>{user.pharmacyName}</strong>
          </p>
        )}
        <button
          onClick={logout}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "13px 28px",
            background: "#0D9488",
            color: "white",
            border: "none",
            borderRadius: "16px",
            fontWeight: "700",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default PharmacyPendingMessage;
