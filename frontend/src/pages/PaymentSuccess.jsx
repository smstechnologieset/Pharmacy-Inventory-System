import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  ArrowRight,
  Building2,
  Calendar,
  CreditCard,
  Hash,
  User,
} from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { receipt } = location.state || {};

  // Fallback if user refreshes the page and loses state
  if (!receipt) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#F8FAFC",
        }}>
        <div style={{ textAlign: "center" }}>
          <h2>No receipt data found.</h2>
          <button
            onClick={() => navigate("/")}
            className="btn btn-primary"
            style={{ marginTop: "20px" }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { amount, tier, billingCycle, chapaResponse, pharmacyInfo } = receipt;

  // Format date nicely
  const paymentDate = chapaResponse.created_at
    ? new Date(chapaResponse.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Today";

  const formattedAmount = new Intl.NumberFormat("en-US").format(amount);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        fontFamily: "'Lexend', sans-serif",
      }}>
      <div
        style={{
          background: "white",
          borderRadius: "28px",
          padding: "48px",
          maxWidth: "550px",
          width: "100%",
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.1)",
          textAlign: "center",
        }}>
        {/* Success Header */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#ECFDF5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
          <CheckCircle2 size={48} />
        </div>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "800",
            color: "#1E293B",
            marginBottom: "8px",
          }}>
          Payment Successful!
        </h1>
        <p
          style={{
            color: "#64748B",
            fontSize: "0.95rem",
            marginBottom: "32px",
          }}>
          Your subscription is now active. Here is your payment receipt.
        </p>

        {/* The Receipt Card */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "20px",
            padding: "24px",
            textAlign: "left",
            marginBottom: "32px",
          }}>
          {/* Receipt Header */}
          <div
            style={{
              borderBottom: "2px dashed #CBD5E1",
              paddingBottom: "16px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: "#0D9488",
                  margin: 0,
                }}>
                PharmaCare
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: 0 }}>
                Subscription Receipt
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: 0 }}>
                Date
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#1E293B",
                  margin: 0,
                }}>
                {paymentDate}
              </p>
            </div>
          </div>

          {/* Receipt Details Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#94A3B8",
                  fontSize: "0.75rem",
                  marginBottom: "4px",
                }}>
                <Building2 size={12} /> Pharmacy
              </div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#1E293B",
                  margin: 0,
                  fontSize: "0.9rem",
                }}>
                {pharmacyInfo?.name || "N/A"}
              </p>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#94A3B8",
                  fontSize: "0.75rem",
                  marginBottom: "4px",
                }}>
                <User size={12} /> Account{" "}
              </div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#1E293B",
                  margin: 0,
                  fontSize: "0.9rem",
                }}>
                {chapaResponse?.email || "N/A"}
              </p>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#94A3B8",
                  fontSize: "0.75rem",
                  marginBottom: "4px",
                }}>
                <CreditCard size={12} /> Plan
              </div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#1E293B",
                  margin: 0,
                  fontSize: "0.9rem",
                  textTransform: "capitalize",
                }}>
                {tier?.replace(/_/g, " ")} ({billingCycle})
              </p>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#94A3B8",
                  fontSize: "0.75rem",
                  marginBottom: "4px",
                }}>
                <Hash size={12} /> Transaction ID
              </div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#1E293B",
                  margin: 0,
                  fontSize: "0.8rem",
                  fontFamily: "monospace",
                }}>
                {chapaResponse?.reference || "N/A"}
              </p>
            </div>
          </div>

          {/* Total Amount */}
          <div
            style={{
              borderTop: "2px dashed #CBD5E1",
              paddingTop: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <span
              style={{ fontSize: "1rem", fontWeight: "700", color: "#64748B" }}>
              Total Paid
            </span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#059669",
              }}>
              {formattedAmount}{" "}
              <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>ETB</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => window.print()}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "16px",
              border: "2px solid #E2E8F0",
              background: "white",
              color: "#64748B",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}>
            <Download size={18} /> Print Receipt
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn btn-primary"
            style={{
              flex: 2,
              padding: "14px",
              borderRadius: "16px",
              background: "#0D9488",
              color: "white",
              border: "none",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}>
            Continue to Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
