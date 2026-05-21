import React from "react";

const StaffWaitingMessage = ({ user }) => {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <div
        style={{
          maxWidth: "500px",
          margin: "60px auto",
          padding: "40px",
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "40px",
          }}>
          ⏳
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "800",
            marginBottom: "12px",
            color: "#1F2937",
          }}>
          Waiting for Promotion
        </h2>
        <p
          style={{
            fontSize: "0.95rem",
            color: "#6B7280",
            lineHeight: "1.6",
          }}>
          Hello, <strong>{user?.name || user?.email}</strong>! Your current role
          is <strong>Staff Member</strong>. You'll gain access to the dashboard
          once you're promoted to <strong>Pharmacist, Manager, or Admin</strong>
          .
        </p>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#9CA3AF",
            marginTop: "16px",
          }}>
          Contact your administrator for role updates.
        </p>
      </div>
    </div>
  );
};

export default StaffWaitingMessage;
