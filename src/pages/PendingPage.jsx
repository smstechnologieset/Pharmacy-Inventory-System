import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Clock, Phone, Mail, Loader2 } from "lucide-react";

const PendingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // If user is already approved, redirect to dashboard
  useEffect(() => {
    if (user && user.status === "active") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #F0FDFA 0%, #F8FAFC 100%)",
        fontFamily: "'Lexend', sans-serif",
        padding: "20px",
      }}>
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          background: "white",
          borderRadius: "28px",
          padding: "48px 40px",
          boxShadow: "0 20px 60px rgba(13, 148, 136, 0.08)",
          textAlign: "center",
          border: "1px solid #E2E8F0",
        }}>
        {/* Animated Icon */}
        <div
          style={{
            width: "88px",
            height: "88px",
            margin: "0 auto 28px",
            background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
          <Clock size={40} style={{ color: "#D97706" }} />
          <div
            style={{
              position: "absolute",
              inset: "-4px",
              border: "3px solid #FCD34D",
              borderRadius: "50%",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </div>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "800",
            color: "#1E293B",
            marginBottom: "12px",
          }}>
          Account Under Review
        </h1>

        <p
          style={{
            color: "#64748B",
            fontSize: "1rem",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}>
          Thank you for signing up,{" "}
          <strong style={{ color: "#0D9488" }}>{user?.name}</strong>! Your
          pharmacy{" "}
          <strong style={{ color: "#0D9488" }}>{user?.pharmacyName}</strong> is
          being reviewed. Our team will contact you within{" "}
          <strong>24–48 hours</strong> to activate your account.
        </p>

        {/* Status Card */}
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "28px",
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "#92400E",
              fontWeight: "700",
              fontSize: "0.95rem",
            }}>
            <Loader2
              size={18}
              style={{ animation: "spin 1.5s linear infinite" }}
            />
            Status: Pending Approval
          </div>
        </div>

        {/* What happens next */}
        <div
          style={{
            textAlign: "left",
            background: "#F8FAFC",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "28px",
          }}>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: "700",
              color: "#1E293B",
              marginBottom: "16px",
            }}>
            What happens next?
          </h3>
          {[
            "We verify your pharmacy details",
            "Our team will call or email you",
            "Once approved, you'll get full access",
          ].map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: i < 2 ? "12px" : "0",
                color: "#475569",
                fontSize: "0.9rem",
              }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  background: "#0D9488",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  flexShrink: 0,
                }}>
                {i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "#F1F5F9",
              borderRadius: "14px",
              fontSize: "0.85rem",
              color: "#475569",
            }}>
            <Phone size={14} />
            Need help? Contact support
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "#F1F5F9",
              borderRadius: "14px",
              fontSize: "0.85rem",
              color: "#475569",
            }}>
            <Mail size={14} />
            We'll email you soon
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            border: "2px solid #E2E8F0",
            borderRadius: "16px",
            color: "#64748B",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.95rem",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#0D9488";
            e.target.style.color = "#0D9488";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "#E2E8F0";
            e.target.style.color = "#64748B";
          }}>
          Sign Out
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PendingPage;
