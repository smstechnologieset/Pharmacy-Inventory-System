import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Package, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roles, notifications } from '../data/mockData';
import { getAllMedicines } from '../services/firestoreService';

// ── Stock status helper ───────────────────────────────────────────────────────
const getStockStatus = (stock) => {
  const s = Number(stock);
  if (s === 0) return { label: "Out of Stock", color: "#EF4444", bg: "#FEF2F2" };
  if (s <= 10) return { label: "Low Stock", color: "#F59E0B", bg: "#FFFBEB" };
  return { label: "In Stock", color: "#10B981", bg: "#ECFDF5" };
};

// ── Expiry helper ─────────────────────────────────────────────────────────────
const getExpiryStatus = (expiry) => {
  if (!expiry) return { label: "N/A", color: "#94A3B8" };
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime())) return { label: "N/A", color: "#94A3B8" };
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "#EF4444" };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: "#F59E0B" };
  return { label: date.toLocaleDateString(), color: "#64748B" };
};

const Header = () => {
  const { user, setRole } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  // ── Search state ─────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [allMedicines, setAllMedicines] = useState([]);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // keyboard nav

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load medicines once on mount ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMedicines(true);
        const data = await getAllMedicines();
        setAllMedicines(data);
      } catch (err) {
        console.error("Failed to load medicines for search:", err);
      } finally {
        setLoadingMedicines(false);
      }
    };
    load();
  }, []);

  // ── Filter on query change ───────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }
    const filtered = allMedicines
      .filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.batch?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q),
      )
      .slice(0, 7); // max 7 results
    setResults(filtered);
    setShowDropdown(true);
    setActiveIndex(-1);
  }, [query, allMedicines]);

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Keyboard navigation ──────────────────────────────────────────────────────
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

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <header className="header">

      {/* ── Search bar ────────────────────────────────────────────────────── */}
      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
        <div className="search-bar">
          <Search size={20} style={{ color: "#94A3B8", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search medicines by name or batch..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {query && (
            <button
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "#94A3B8",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Dropdown ──────────────────────────────────────────────────────── */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid #F1F5F9",
              zIndex: 1000,
              overflow: "hidden",
            }}>

            {/* Results */}
            {results.length > 0 ? (
              <>
                <div
                  style={{
                    padding: "10px 16px 6px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}>
                  {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
                </div>

                {results.map((med, i) => {
                  const stock = getStockStatus(med.stock);
                  const expiry = getExpiryStatus(med.expiry);
                  const isActive = i === activeIndex;

                  return (
                    <div
                      key={med.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "12px 16px",
                        cursor: "pointer",
                        background: isActive ? "#F8FAFC" : "white",
                        borderTop: "1px solid #F8FAFC",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}>

                      {/* Icon */}
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
                          flexShrink: 0,
                        }}>
                        <Package size={18} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span
                            style={{
                              fontWeight: "700",
                              fontSize: "0.9rem",
                              color: "#1E293B",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {med.name}
                          </span>
                          {/* Stock badge */}
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              background: stock.bg,
                              color: stock.color,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}>
                            {stock.label}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div style={{ display: "flex", gap: "14px", fontSize: "0.75rem" }}>
                          <span style={{ color: "#64748B" }}>
                            Batch: <strong style={{ color: "#475569" }}>{med.batch || "N/A"}</strong>
                          </span>
                          <span style={{ color: "#64748B" }}>
                            Stock: <strong style={{ color: "#475569" }}>{med.stock ?? "—"}</strong>
                          </span>
                          <span style={{ color: expiry.color, fontWeight: "500" }}>
                            {expiry.label}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "0.9rem",
                          color: "#0D9488",
                          flexShrink: 0,
                        }}>
                        ETB {Number(med.price || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })}

                {/* Footer hint */}
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.7rem",
                    color: "#CBD5E1",
                    borderTop: "1px solid #F1F5F9",
                    display: "flex",
                    gap: "12px",
                  }}>
                  <span>↑↓ navigate</span>
                  <span>Esc close</span>
                </div>
              </>
            ) : (
              /* No results */
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#94A3B8",
                }}>
                <Package size={28} style={{ marginBottom: "8px", opacity: 0.4 }} />
                <p style={{ fontWeight: "600", margin: "0 0 4px" }}>No medicines found</p>
                <p style={{ fontSize: "0.8rem", margin: 0 }}>
                  Try a different name or batch number
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right side (unchanged) ────────────────────────────────────────── */}
      <div className="header-right">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "9px", color: "#64748B", fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Mode:
          </span>
          <select
            onChange={(e) => setRole(e.target.value)}
            value={user?.role}
            style={{
              padding: "6px 10px",
              borderRadius: "12px",
              border: "1px solid #F1F5F9",
              outline: "none",
              fontSize: "13px",
              background: "white",
              fontWeight: "600",
              cursor: "pointer",
            }}>
            <option value={roles.ADMIN}>Admin</option>
            <option value={roles.PHARMACIST}>Pharmacist</option>
            <option value={roles.MANAGER}>Manager</option>
          </select>
        </div>

        <div className="icon-button" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell size={22} />
          <div className="badge"></div>
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                <span style={{ color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer" }}>
                  Mark all read
                </span>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {notifications.map((n) => (
                  <div key={n.id} className="notif-item">
                    <div
                      className="notif-title"
                      style={{
                        color: n.type === "error" ? "#EF4444" : n.type === "warning" ? "#F59E0B" : "#10B981",
                        fontSize: "0.85rem",
                      }}>
                      {n.title}
                    </div>
                    <div className="notif-msg">{n.message}</div>
                    <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "4px" }}>
                      {n.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="user-profile">
          <img src={user?.avatar} alt={user?.name} />
          <div className="info">
            <span className="name" style={{ color: "#0F172A" }}>{user?.name}</span>
          </div>
          <ChevronDown size={14} style={{ color: "#94A3B8" }} />
        </div>
      </div>
    </header>
  );
};

export default Header;
