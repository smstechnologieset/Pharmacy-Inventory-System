import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, RefreshCw, CreditCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initializePayment, verifyPaymentStatus } from "../services/payment.js";

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hasTxParam = Boolean(
    searchParams.get("tx_ref") ||
    searchParams.get("trx_ref") ||
    sessionStorage.getItem("pending_payment_txRef")
  );

  const [status, setStatus] = useState(hasTxParam ? "verifying" : "no_tx");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { user, authUser, loading: authLoading, refreshPharmacyStatus } = useAuth();

  const handleProceedToPayment = async () => {
    setActionLoading(true);
    setErrorMessage("");
    try {
      const { checkoutUrl, txRef } = await initializePayment("monthly");
      if (!checkoutUrl) {
        throw new Error("No checkout URL returned from payment provider.");
      }
      sessionStorage.setItem("pending_payment_txRef", txRef);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Payment retry error:", err);
      setErrorMessage(err.message || "Failed to initialize payment. Please try again.");
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const checkPayment = async () => {
      const txRef =
        searchParams.get("tx_ref") ||
        searchParams.get("trx_ref") ||
        sessionStorage.getItem("pending_payment_txRef");

      // If no explicit txRef, check if the pharmacy has already completed a payment
      if (!txRef) {
        try {
          const check = await verifyPaymentStatus("");
          if (check.status === "completed") {
            setStatus("success");
            if (refreshPharmacyStatus) await refreshPharmacyStatus();
            if (authUser) await authUser.getIdToken(true);
            navigate("/payment/success", { state: { receipt: check } });
            return;
          }
        } catch (_) {
          // If no completed payment found, stay on "no_tx" state (Proceed to Payment)
        }
        setStatus("no_tx");
        return;
      }

      try {
        let attempts = 0;
        const maxAttempts = 15;
        const poll = async () => {
          const result = await verifyPaymentStatus(txRef);
          setPaymentDetails(result);

          if (result.status === "completed") {
            setStatus("success");
            sessionStorage.removeItem("pending_payment_txRef");
            
            if (refreshPharmacyStatus) await refreshPharmacyStatus();
            if (authUser) await authUser.getIdToken(true);
            
            navigate("/payment/success", { state: { receipt: result } });
          } else if (result.status === "failed") {
            setStatus("failed");
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 3000);
          } else {
            setStatus("timeout");
          }
        };

        await poll();
      } catch (error) {
        console.error("Payment verification error:", error);
        setErrorMessage(error.message || "Payment verification failed.");
        setStatus("error");
      }
    };

    checkPayment();
  }, [searchParams, navigate, user, authLoading]);

  if (authLoading || !user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}>
        <Loader2
          size={48}
          className="animate-spin"
          style={{ color: "#0D9488" }}
        />
      </div>
    );
  }

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
        {status === "verifying" && (
          <>
            <Loader2
              size={64}
              className="animate-spin"
              style={{ margin: "0 auto 24px", color: "#0D9488" }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "12px",
              }}>
              Verifying Payment...
            </h1>
            <p style={{ color: "#64748B" }}>
              Please wait while we confirm your payment with Chapa. This may take a moment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle
              size={64}
              style={{ margin: "0 auto 24px", color: "#059669" }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "12px",
              }}>
              Payment Successful! 🎉
            </h1>
            <p style={{ color: "#64748B", marginBottom: "16px" }}>
              Thank you! Your subscription is now active.
            </p>
            <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === "no_tx" && (
          <>
            <CreditCard
              size={64}
              style={{ margin: "0 auto 24px", color: "#0D9488" }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "12px",
              }}>
              Subscription Payment
            </h1>
            <p style={{ color: "#64748B", marginBottom: "24px", lineHeight: "1.5" }}>
              Your pharmacy registration is saved. Please complete your subscription payment to activate your account.
            </p>
            {errorMessage && (
              <p style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "16px" }}>
                {errorMessage}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleProceedToPayment}
                disabled={actionLoading}
                style={{
                  padding: "14px 24px",
                  background: "#0D9488",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  fontWeight: "700",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}>
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                Proceed to Payment (Chapa)
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle
              size={64}
              style={{ margin: "0 auto 24px", color: "#EF4444" }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "12px",
              }}>
              Payment Failed
            </h1>
            <p style={{ color: "#64748B", marginBottom: "24px" }}>
              Your transaction could not be completed. Please try again.
            </p>
            {errorMessage && (
              <p style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "16px" }}>
                {errorMessage}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}>
              <button
                onClick={handleProceedToPayment}
                disabled={actionLoading}
                style={{
                  padding: "12px 24px",
                  background: "#0D9488",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Try Again
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle
              size={64}
              style={{ margin: "0 auto 24px", color: "#EF4444" }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "12px",
              }}>
              Payment Notice
            </h1>
            <p style={{ color: "#64748B", marginBottom: "24px" }}>
              {errorMessage || "Unable to verify payment status at this moment. You can retry paying below."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleProceedToPayment}
                disabled={actionLoading}
                style={{
                  padding: "14px 24px",
                  background: "#0D9488",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  fontWeight: "700",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}>
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                Pay with Chapa
              </button>
            </div>
          </>
        )}

        {status === "timeout" && (
          <>
            <Loader2
              size={64}
              style={{ margin: "0 auto 24px", color: "#D97706" }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "12px",
              }}>
              Payment Processing
            </h1>
            <p style={{ color: "#64748B", marginBottom: "24px" }}>
              Your payment is being processed. You can check your dashboard for the latest status.
            </p>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "12px 24px",
                background: "#0D9488",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default PaymentVerify;
