import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, Package, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { useSettings } from "../context/SettingsContext";
import {
  searchMedicinesByPrefix,
  subscribeToMedicines,
} from "../services/medicines.js";
import {
  upsertNotification,
  resolveNotification,
  markAllNotificationsRead,
  subscribeToNotifications,
} from "../services/notifications.js";
import { subscribeToStockBatches } from "../services/stockBatches.js";
import { getSystemSettings } from "../services/settings.js";
import Avatar from "./Avatar.jsx";

const getStockStatus = (stock, t) => {
  const s = Number(stock);
  if (s === 0)
    return { label: t("header.outOfStock"), color: "#EF4444", bg: "#FEF2F2" };
  if (s <= 10)
    return {
      label: t("header.lowStockAlert"),
      color: "#F59E0B",
      bg: "#FFFBEB",
    };
  return {
    label: t("header.inStock") || "In Stock",
    color: "#10B981",
    bg: "#ECFDF5",
  };
};

const getExpiryStatus = (expiry, t) => {
  if (!expiry) return { label: "N/A", color: "#94A3B8" };
  const date = expiry?.toDate ? expiry.toDate() : new Date(expiry);
  if (Number.isNaN(date.getTime())) return { label: "N/A", color: "#94A3B8" };
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0)
    return { label: t("header.expiredStock"), color: "#EF4444" };
  if (daysLeft <= 30)
    return {
      label: `${t("header.expiresIn") || "Expires in"} ${daysLeft}d`,
      color: "#F59E0B",
    };
  return { label: date.toLocaleDateString(), color: "#64748B" };
};

const Header = () => {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const canSeeNotifications = [
    "admin",
    "manager",
    "pharmacist",
    "superadmin",
  ].includes(user?.role);

  const [realNotifications, setPersistedNotifs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Add a ref for the notification wrapper
  const notifRef = useRef(null);

  // Debounced Server-side Search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        const capitalizedQ =
          query.trim().charAt(0).toUpperCase() + query.trim().slice(1);

        const meds = await searchMedicinesByPrefix(
          user?.pharmacyId,
          capitalizedQ,
        );

        const searchResults = meds.map((m) => ({
          id: m.id,
          medicineId: m.id,
          name: m.name || "Unknown",
          category: m.category,
          batch: m.batch || "N/A",
          stock: m.totalStock || 0,
          price: m.price,
        }));

        setResults(searchResults);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, user?.pharmacyId]);

  // Detect conditions and upsert notification docs to Firestore
  useEffect(() => {
    if (!user?.pharmacyId || !canSeeNotifications) return;

    let medsCache = [];
    let batchesCache = [];
    let settingsCache = { lowStockThreshold: 10, expiryWarningDays: 60 };

    const detectAndSync = async () => {
      const medMap = medsCache.reduce((acc, m) => {
        acc[m.id] = m;
        return acc;
      }, {});
      const threshold = settingsCache.lowStockThreshold || 10;
      const warnDays = settingsCache.expiryWarningDays || 60;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const detected = {};

      batchesCache.forEach((b) => {
        const medName = medMap[b.medicineId]?.name || "Unknown Medicine";
        const expiryDate = b.expiry?.toDate
          ? b.expiry.toDate()
          : new Date(b.expiry);

        const mark = (type, title, detail) => {
          const key = `${b.medicineId}_${type}`;
          if (!detected[key])
            detected[key] = { medName, title, count: 0, details: [] };
          detected[key].count += 1;
          detected[key].details.push(detail);
        };

        if (!isNaN(expiryDate)) {
          const diffDays = Math.ceil(
            (expiryDate - today) / (1000 * 60 * 60 * 24),
          );
          if (diffDays < 0)
            mark("expired", t("header.expiredStock"), `Batch ${b.batchNo}`);
          else if (diffDays <= warnDays)
            mark(
              "expiring",
              t("header.expiringSoon"),
              `Batch ${b.batchNo} (${diffDays}d)`,
            );
        }

        if (b.quantity === 0)
          mark("out-of-stock", t("header.outOfStock"), `Batch ${b.batchNo}`);
        else if (b.quantity <= threshold)
          mark(
            "low-stock",
            t("header.lowStockAlert"),
            `Batch ${b.batchNo} (${b.quantity} units)`,
          );
      });

      // Upsert all currently-detected conditions
      await Promise.all(
        Object.entries(detected).map(([key, d]) => {
          const [medicineId, type] = key.split("_");
          const message =
            d.count === 1
              ? `${d.medName} — ${d.details[0]}`
              : `${d.medName} — ${d.count} batches (${d.title.toLowerCase()})`;
          return upsertNotification(user.pharmacyId, medicineId, type, {
            title: d.title,
            message,
            severity:
              type === "expired" || type === "out-of-stock"
                ? "error"
                : "warning",
            isResolved: false,
          });
        }),
      );

      // Resolve conditions that no longer exist
      const stillActiveKeys = Object.keys(detected);
      const allPossibleTypes = [
        "expired",
        "expiring",
        "out-of-stock",
        "low-stock",
      ];
      const knownMedicineIds = new Set(medsCache.map((m) => m.id));
      await Promise.all(
        Array.from(knownMedicineIds).flatMap((medicineId) =>
          allPossibleTypes
            .filter(
              (type) => !stillActiveKeys.includes(`${medicineId}_${type}`),
            )
            .map((type) =>
              resolveNotification(user.pharmacyId, medicineId, type),
            ),
        ),
      );
    };

    getSystemSettings(user.pharmacyId).then((settings) => {
      settingsCache = settings;
    });

    const unsubMedicines = subscribeToMedicines(user.pharmacyId, (meds) => {
      medsCache = meds;
      detectAndSync();
    });

    const unsubBatches = subscribeToStockBatches(user.pharmacyId, (batches) => {
      batchesCache = batches;
      detectAndSync();
    });

    return () => {
      unsubMedicines();
      unsubBatches();
    };
  }, [t, user?.pharmacyId, canSeeNotifications]);

  // Subscribe to persisted notification docs for display
  useEffect(() => {
    if (!user?.pharmacyId || !canSeeNotifications) return;
    const unsub = subscribeToNotifications(user.pharmacyId, (notifs) => {
      const sorted = [...notifs].sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
        return 0;
      });
      setPersistedNotifs(sorted);
    });
    return () => unsub();
  }, [user?.pharmacyId, canSeeNotifications]);

  // 2. Update the click outside handler to close both Search and Notifications
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const unreadCount = realNotifications.filter((n) => !n.isRead).length;
  const hasUnreadCritical = realNotifications.some(
    (n) => !n.isRead && n.severity === "error",
  );

  const handleMarkAllRead = async () => {
    const unreadIds = realNotifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    if (unreadIds.length > 0)
      await markAllNotificationsRead(user?.pharmacyId, unreadIds);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="header">
      <div
        ref={searchRef}
        style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
        <div className="search-bar">
          <Search size={20} style={{ color: "#94A3B8", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("header.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setShowDropdown(false);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "#94A3B8",
                display: "flex",
              }}>
              <X size={16} />
            </button>
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              border: "1px solid #F1F5F9",
              zIndex: 1000,
              overflow: "hidden",
            }}>
            {results.length > 0 ? (
              <>
                {results.map((med, i) => {
                  const stock = getStockStatus(med.stock, t);
                  const expiry = getExpiryStatus(med.expiry, t);
                  return (
                    <div
                      key={med.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "12px 16px",
                        cursor: "pointer",
                        background: i === activeIndex ? "#F8FAFC" : "white",
                        borderTop: "1px solid #F8FAFC",
                      }}
                      onClick={() => navigate("/inventory")}
                      onMouseEnter={() => setActiveIndex(i)}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "#F0FDFA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#0D9488",
                        }}>
                        <Package size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "3px",
                          }}>
                          <span
                            style={{
                              fontWeight: "700",
                              fontSize: "0.9rem",
                              color: "#1E293B",
                            }}>
                            {med.name}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              background: stock.bg,
                              color: stock.color,
                            }}>
                            {stock.label}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "14px",
                            fontSize: "0.75rem",
                          }}>
                          <span style={{ color: "#64748B" }}>
                            Batch:{" "}
                            <strong style={{ color: "#475569" }}>
                              {med.batch}
                            </strong>
                          </span>
                          <span style={{ color: "#64748B" }}>
                            Stock:{" "}
                            <strong style={{ color: "#475569" }}>
                              {med.stock}
                            </strong>
                          </span>
                          <span
                            style={{
                              color: expiry.color,
                              fontWeight: "500",
                            }}>
                            {expiry.label}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "0.9rem",
                          color: "#0D9488",
                        }}>
                        ETB {Number(med.price || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#94A3B8",
                }}>
                <Package
                  size={28}
                  style={{ marginBottom: "8px", opacity: 0.4 }}
                />
                <p style={{ fontWeight: "600", margin: "0 0 4px" }}>
                  {t("header.noMedicinesFound")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        {/* 3. Wrap the notification icon and dropdown in a relative container with the ref */}
        <div ref={notifRef} style={{ position: "relative" }}>
          {/* The clickable icon button is now separated from the dropdown content */}
          <div
            className="icon-button"
            onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={22} />
            {unreadCount > 0 && (
              <div
                className="badge"
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "8px",
                  height: "8px",
                  background: "#EF4444",
                  borderRadius: "50%",
                  animation: hasUnreadCritical
                    ? "notifPulse 1.4s ease-in-out infinite"
                    : "none",
                }}></div>
            )}
          </div>
          {showNotifs && (
            <div
              className="notif-dropdown"
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                width: "320px",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                zIndex: 1000,
                overflow: "hidden",
              }}>
              <div
                className="notif-header"
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: "700",
                }}>
                <span>
                  {t("header.notifications")} ({realNotifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0D9488",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {realNotifications.length === 0 ? (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#94A3B8",
                    }}>
                    {t("header.noNewAlerts")}
                  </div>
                ) : (
                  realNotifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className="notif-item"
                      onClick={() => {
                        if (!n.isRead)
                          markAllNotificationsRead(user?.pharmacyId, [n.id]);
                        navigate("/inventory");
                        setShowNotifs(false);
                      }}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #F8FAFC",
                        cursor: "pointer",
                        background: n.isRead ? "white" : "#F8FAFC",
                        opacity: n.isRead ? 0.65 : 1,
                      }}>
                      <div
                        className="notif-title"
                        style={{
                          color: n.severity === "error" ? "#EF4444" : "#F59E0B",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}>
                        {!n.isRead && (
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background:
                                n.severity === "error" ? "#EF4444" : "#F59E0B",
                              display: "inline-block",
                            }}
                          />
                        )}
                        {n.title}
                      </div>
                      <div
                        className="notif-msg"
                        style={{
                          fontSize: "0.8rem",
                          color: "#475569",
                          marginTop: "4px",
                        }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <Avatar
          src={user?.avatar}
          name={user?.name}
          pharmacyName={user?.pharmacyName}
          size={44}
          style={{ border: "3px solid #F0FDFA" }}
        />

        <button
          className="icon-button"
          onClick={handleLogout}
          title={t("header.logout")}
          style={{
            background: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FECACA",
            width: "44px",
            height: "44px",
          }}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
