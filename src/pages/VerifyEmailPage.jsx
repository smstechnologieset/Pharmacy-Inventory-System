import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MailCheck, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

const VerifyEmailPage = () => {
  const { authUser, resendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleCheckVerification = async () => {
    setChecking(true);
    setError("");
    try {
      // Reload the Firebase user to get latest emailVerified status
      await authUser.reload();
      if (authUser.emailVerified) {
        navigate("/pending");
      } else {
        setError(
          "Email not verified yet. Please check your inbox and click the link.",
        );
      }
    } catch (err) {
      setError("Failed to check verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    setError("");
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

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
          maxWidth: "480px",
          width: "100%",
          background: "white",
          borderRadius: "28px",
          padding: "48px 40px",
          boxShadow: "0 20px 60px rgba(13, 148, 136, 0.08)",
          textAlign: "center",
          border: "1px solid #E2E8F0",
        }}>
        {/* Icon */}
        <div
          style={{
            width: "88px",
            height: "88px",
            margin: "0 auto 28px",
            background: "linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <MailCheck size={40} style={{ color: "#0D9488" }} />
        </div>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "800",
            color: "#1E293B",
            marginBottom: "12px",
          }}>
          Verify Your Email
        </h1>

        <p
          style={{
            color: "#64748B",
            fontSize: "1rem",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}>
          We sent a verification link to{" "}
          <strong style={{ color: "#0D9488" }}>{authUser?.email}</strong>. Click
          the link in that email then come back and press the button below.
        </p>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor: "#FEE2E2",
              borderRadius: "16px",
              border: "1px solid #FECACA",
              textAlign: "left",
            }}>
            <AlertCircle
              size={18}
              style={{ color: "#DC2626", flexShrink: 0, marginTop: "2px" }}
            />
            <span style={{ color: "#991B1B", fontSize: "0.9rem" }}>
              {error}
            </span>
          </div>
        )}

        {/* Resend success message */}
        {resendSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 16px",
              marginBottom: "20px",
              backgroundColor: "#F0FDF4",
              borderRadius: "16px",
              border: "1px solid #BBF7D0",
            }}>
            <CheckCircle
              size={18}
              style={{ color: "#16A34A", flexShrink: 0 }}
            />
            <span style={{ color: "#15803D", fontSize: "0.9rem" }}>
              Verification email resent successfully.
            </span>
          </div>
        )}

        {/* Primary CTA */}
        <button
          onClick={handleCheckVerification}
          disabled={checking}
          style={{
            width: "100%",
            padding: "16px",
            background: checking ? "#99F6E4" : "#0D9488",
            border: "none",
            borderRadius: "16px",
            color: "white",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: checking ? "not-allowed" : "pointer",
            marginBottom: "12px",
            transition: "all 0.3s",
            fontFamily: "inherit",
          }}>
          {checking ? "Checking..." : "I've Verified My Email"}
        </button>

        {/* Resend */}
        <button
          onClick={handleResend}
          disabled={resending}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            border: "2px solid #E2E8F0",
            borderRadius: "16px",
            color: "#64748B",
            fontWeight: "600",
            fontSize: "0.95rem",
            cursor: resending ? "not-allowed" : "pointer",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.3s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!resending) e.currentTarget.style.borderColor = "#0D9488";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E2E8F0";
          }}>
          <RefreshCw
            size={16}
            style={{
              animation: resending ? "spin 1s linear infinite" : "none",
            }}
          />
          {resending ? "Sending..." : "Resend Verification Email"}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            border: "none",
            color: "#94A3B8",
            fontWeight: "600",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
          Sign Out
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmailPage;
