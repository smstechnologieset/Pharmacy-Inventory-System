import React, { useEffect, useState } from "react";

const PILLS = [
  { color: "#0D9488", delay: "0s", size: 28 },
  { color: "#3B82F6", delay: "0.15s", size: 22 },
  { color: "#F59E0B", delay: "0.3s", size: 18 },
  { color: "#EF4444", delay: "0.45s", size: 14 },
];

const MESSAGES = [
  "Loading your pharmacy dashboard...",
  "Fetching inventory data...",
  "Checking stock levels...",
  "Almost ready...",
];

const LoadingScreen = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through messages every 1.2s
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Animate progress bar to ~90% (the app fills the rest when ready)
  useEffect(() => {
    const steps = [15, 35, 55, 72, 85, 90];
    let i = 0;
    const tick = () => {
      if (i < steps.length) {
        setProgress(steps[i]);
        i++;
        setTimeout(tick, 400 + i * 80);
      }
    };
    tick();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(135deg, #F0FDFA 0%, #EFF6FF 50%, #FFF7ED 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: "inherit",
      }}>
      {/* ── Animated pill logo ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "40px",
        }}>
        {PILLS.map((pill, i) => (
          <div
            key={i}
            style={{
              width: `${pill.size}px`,
              height: `${pill.size / 2}px`,
              borderRadius: "999px",
              background: pill.color,
              opacity: 0,
              transform: "translateY(12px)",
              animation: `pillIn 0.5s ease forwards`,
              animationDelay: pill.delay,
            }}
          />
        ))}
      </div>

      {/* ── App name ────────────────────────────────────────────────────────── */}
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: "800",
          color: "#0F172A",
          letterSpacing: "-0.03em",
          marginBottom: "6px",
          opacity: 0,
          animation: "fadeUp 0.5s ease 0.5s forwards",
        }}>
        PharmaCare
      </h1>
      <p
        style={{
          fontSize: "0.85rem",
          color: "#64748B",
          marginBottom: "48px",
          opacity: 0,
          animation: "fadeUp 0.5s ease 0.65s forwards",
        }}>
        Inventory & Stock Management
      </p>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          width: "220px",
          height: "4px",
          background: "#E2E8F0",
          borderRadius: "999px",
          overflow: "hidden",
          marginBottom: "20px",
          opacity: 0,
          animation: "fadeUp 0.4s ease 0.8s forwards",
        }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #0D9488, #3B82F6)",
            borderRadius: "999px",
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* ── Cycling message ─────────────────────────────────────────────────── */}
      <p
        key={msgIndex}
        style={{
          fontSize: "0.78rem",
          color: "#94A3B8",
          fontWeight: "500",
          letterSpacing: "0.02em",
          opacity: 0,
          animation: "fadeUp 0.35s ease forwards",
          margin: 0,
        }}>
        {MESSAGES[msgIndex]}
      </p>

      {/* ── Keyframes ───────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes pillIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);  }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
