import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { retryPayment, verifyPaymentStatus } from "../services/payment.js";

const PaymentVerify = () => {
  const [status, setStatus] = useState("verifying");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user, authUser, loading: authLoading, refreshPharmacyStatus } = useAuth(); // 🚨 Added refreshPharmacyStatus

  useEffect(() => {
    // 🚨 CRITICAL FIX: Wait for Firebase Auth to restore the user session!
    if (authLoading) return;

    // If Auth is done loading and there is no user, redirect to login
    if (!user) {
      navigate("/login");
      return;
    }

    const checkPayment = async () => {
      const txRef =
        searchParams.get("tx_ref") ||
        sessionStorage.getItem("pending_payment_txRef");

      if (!txRef) {
        setStatus("error");
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
            
            // 🚨 CRITICAL FIX: Refresh global auth context so the app knows we paid!
            if (refreshPharmacyStatus) await refreshPharmacyStatus();
            if (authUser) await authUser.getIdToken(true);
            
            navigate("/payment/success", { state: { receipt: result } });
          } else if (result.status === "failed") {
            setStatus("failed");
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 3000); // 🚨 Increased to 3 seconds (Total 60 seconds now)
          } else {
            // 🚨 FIX: Instead of getting stuck on a "timeout" screen,
            // redirect to the dashboard. The dashboard will check their subscription status.
            // If the webhook already fired, they will have access. If not, they will see a "Pending" state.
            // navigate("/", { state: { paymentPending: true, txRef } });
          }
        };



        await poll();
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
      }
    };

    checkPayment();
  }, [searchParams, navigate, user, authLoading]); // 🚨 Added authLoading to dependencies

  // 🚨 Show a loading screen while Firebase Auth is restoring the session
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

  // ... keep the rest of your return statement (the JSX) exactly as it was ...
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
              Please wait while we confirm your payment. This may take a moment.
            </p>
          </>
        )}

        {status === "retrying" && (
          <>
            <RefreshCw
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
              Preparing Retry...
            </h1>
            <p style={{ color: "#64748B" }}>
              Redirecting you to payment page...
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
              {" "}
              Payment Successful! 🎉
            </h1>
            <p style={{ color: "#64748B", marginBottom: "16px" }}>
              Thank you! Your subscription is now active.
            </p>
            {paymentDetails && (
              <div
                style={{
                  background: "#F0FDFA",
                  padding: "16px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}>
                <p style={{ fontSize: "0.85rem", color: "#0D9488", margin: 0 }}>
                 
                  <strong>Plan:</strong>{" "}
                  {paymentDetails.tier
                    ? paymentDetails.tier.replace("_", " ")
                    : "N/A"}
                  <br />
                  <strong>Billing:</strong>{" "}
                  {paymentDetails.billingCycle || "N/A"}
                  <br />
                  <strong>Amount:</strong>{" "}
                  {paymentDetails.amount
                    ? `${paymentDetails.amount} ETB`
                    : "N/A"}
                </p>
              </div>
            )}
            <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
              Redirecting to your dashboard...
            </p>
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
              Your payment could not be processed. Please try again or contact
              support.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}>
              <button
                onClick={retryPayment}
                style={{
                  padding: "12px 24px",
                  background: "#0D9488",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                <RefreshCw size={16} /> Try Again
              </button>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "12px 24px",
                  background: "#F1F5F9",
                  color: "#64748B",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}>
                Cancel
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
              Your payment is being processed. You can check your dashboard for
              the latest status.
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
              Error
            </h1>
            <p style={{ color: "#64748B", marginBottom: "24px" }}>
              Something went wrong. Please try again or contact support.
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
