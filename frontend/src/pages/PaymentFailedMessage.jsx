import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CreditCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PaymentFailedMessage = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#F8FAFC",
      padding: "32px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "28px",
        padding: "48px",
        maxWidth: "520px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)"
      }}>
        <div style={{
          width: "76px",
          height: "76px",
          borderRadius: "24px",
          background: "#FEE2E2",
          color: "#EF4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px"
        }}>
          <AlertCircle size={38} />
        </div>
        
        <h1 style={{
          fontSize: "1.45rem",
          fontWeight: "800",
          color: "#1E293B",
          marginBottom: "12px"
        }}>
          Payment Failed
        </h1>
                <p style={{
          color: "#64748B",
          fontSize: "0.95rem",
          lineHeight: "1.6",
          marginBottom: "24px"
        }}>
          Your subscription payment could not be processed. Please update your payment method to continue using PharmaCare.
        </p>
        
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/billing")}
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
              cursor: "pointer"
            }}
          >
            <CreditCard size={18} /> Update Payment
          </button>
          
          <button
            onClick={logout}
            style={{
              padding: "13px 28px",
              background: "#F1F5F9",
              color: "#64748B",
              border: "none",
              borderRadius: "16px",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer"
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
export default PaymentFailedMessage;
