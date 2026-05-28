import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Package, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllMedicines, getAllStockBatches, getSystemSettings } from '../services/firestoreService';

const getStockStatus = (stock) => {
  const s = Number(stock);
  if (s === 0) return { label: "Out of Stock", color: "#EF4444", bg: "#FEF2F2" };
  if (s <= 10) return { label: "Low Stock", color: "#F59E0B", bg: "#FFFBEB" };
  return { label: "In Stock", color: "#10B981", bg: "#ECFDF5" };
};

const getExpiryStatus = (expiry) => {
  if (!expiry) return { label: "N/A", color: "#94A3B8" };
  const date = expiry?.toDate ? expiry.toDate() : new Date(expiry);
  if (Number.isNaN(date.getTime())) return { label: "N/A", color: "#94A3B8" };
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "#EF4444" };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: "#F59E0B" };
  return { label: date.toLocaleDateString(), color: "#64748B" };
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [realNotifications, setRealNotifications] = useState([]);

  const [query, setQuery] = useState("");
  const [allInventory, setAllInventory] = useState([]);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Load inventory for search
  useEffect(() => {
    const load = async () => {
      try {
        const [meds, batches] = await Promise.all([getAllMedicines(), getAllStockBatches()]);
        const combined = batches.map(b => {
          const med = meds.find(m => m.id === b.medicineId);
          return {
            id: b.id, medicineId: b.medicineId, name: med?.name || "Unknown",
            category: med?.category, batch: b.batchNo, stock: b.quantity,
            expiry: b.expiry, price: b.sellingPrice || med?.price,
          };
        });
        setAllInventory(combined);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  // Generate Real Notifications based on Settings
  useEffect(() => {
    const generateNotifs = async () => {
      try {
        const [batches, meds, settings] = await Promise.all([
          getAllStockBatches(), getAllMedicines(), getSystemSettings()
        ]);
        const medMap = meds.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});
        const threshold = settings.lowStockThreshold || 10;
        const warnDays = settings.expiryWarningDays || 60;
        
        const notifs = [];
        const today = new Date(); today.setHours(0,0,0,0);
        
        batches.forEach(b => {
          const medName = medMap[b.medicineId]?.name || "Unknown Medicine";
          const expiryDate = b.expiry?.toDate ? b.expiry.toDate() : new Date(b.expiry);
          
          if (!isNaN(expiryDate)) {
            const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
              notifs.push({ id: `exp-${b.id}`, title: "Expired Stock", message: `${medName} (Batch ${b.batchNo}) has expired.`, type: "error" });
            } else if (diffDays <= warnDays) {
              notifs.push({ id: `warn-${b.id}`, title: "Expiring Soon", message: `${medName} (Batch ${b.batchNo}) expires in ${diffDays} days.`, type: "warning" });
            }
          }
          
          if (b.quantity <= threshold && b.quantity > 0) {
            notifs.push({ id: `low-${b.id}`, title: "Low Stock Alert", message: `${medName} (Batch ${b.batchNo}) is at ${b.quantity} units.`, type: "warning" });
          } else if (b.quantity === 0) {
            notifs.push({ id: `out-${b.id}`, title: "Out of Stock", message: `${medName} (Batch ${b.batchNo}) is completely out of stock.`, type: "error" });
          }
        });
        
        setRealNotifications(notifs);
      } catch (err) { console.error("Failed to generate notifications", err); }
    };
    generateNotifs();
  }, []);

  // Filter Search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setShowDropdown(false); setActiveIndex(-1); return; }
    const filtered = allInventory
      .filter((m) => m.name?.toLowerCase().includes(q) || m.batch?.toLowerCase().includes(q))
      .slice(0, 7);
    setResults(filtered);
    setShowDropdown(true);
    setActiveIndex(-1);
  }, [query, allInventory]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((prev) => Math.min(prev + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((prev) => Math.max(prev - 1, -1)); }
    else if (e.key === "Escape") { setShowDropdown(false); setActiveIndex(-1); inputRef.current?.blur(); }
  };

  const handleLogout = async () => {
    try { await logout(); navigate("/login", { replace: true }); } catch (err) { console.error(err); }
  };

  return (
    <header className="header">
      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
        <div className="search-bar">
          <Search size={20} style={{ color: "#94A3B8", flexShrink: 0 }} />
          <input ref={inputRef} type="text" placeholder="Search medicines by name or batch..." value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => results.length > 0 && setShowDropdown(true)} onKeyDown={handleKeyDown} autoComplete="off" />
          {query && <button onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#94A3B8", display: "flex" }}><X size={16} /></button>}
        </div>

        {showDropdown && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "white", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #F1F5F9", zIndex: 1000, overflow: "hidden" }}>
            {results.length > 0 ? (
              <>
                {results.map((med, i) => {
                  const stock = getStockStatus(med.stock);
                  const expiry = getExpiryStatus(med.expiry);
                  return (
                    <div key={med.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", cursor: "pointer", background: i === activeIndex ? "#F8FAFC" : "white", borderTop: "1px solid #F8FAFC" }} onClick={() => navigate('/inventory')} onMouseEnter={() => setActiveIndex(i)}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#F0FDFA", display: "flex", alignItems: "center", justifyContent: "center", color: "#0D9488" }}><Package size={18} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1E293B" }}>{med.name}</span>
                          <span style={{ fontSize: "0.65rem", fontWeight: "700", padding: "2px 8px", borderRadius: "20px", background: stock.bg, color: stock.color }}>{stock.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: "14px", fontSize: "0.75rem" }}>
                          <span style={{ color: "#64748B" }}>Batch: <strong style={{ color: "#475569" }}>{med.batch}</strong></span>
                          <span style={{ color: "#64748B" }}>Stock: <strong style={{ color: "#475569" }}>{med.stock}</strong></span>
                          <span style={{ color: expiry.color, fontWeight: "500" }}>{expiry.label}</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: "800", fontSize: "0.9rem", color: "#0D9488" }}>ETB {Number(med.price || 0).toLocaleString()}</div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8" }}>
                <Package size={28} style={{ marginBottom: "8px", opacity: 0.4 }} />
                <p style={{ fontWeight: "600", margin: "0 0 4px" }}>No medicines found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="icon-button" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell size={22} />
          {realNotifications.length > 0 && <div className="badge" style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></div>}
          {showNotifs && (
            <div className="notif-dropdown" style={{ position: 'absolute', right: 0, top: '100%', width: '320px', background: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden' }}>
              <div className="notif-header" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                <span>Notifications ({realNotifications.length})</span>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {realNotifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>No new alerts!</div>
                ) : (
                  realNotifications.slice(0, 10).map((n) => (
                    <div key={n.id} className="notif-item" style={{ padding: '12px 16px', borderBottom: '1px solid #F8FAFC' }}>
                      <div className="notif-title" style={{ color: n.type === "error" ? "#EF4444" : "#F59E0B", fontSize: "0.85rem", fontWeight: '700' }}>{n.title}</div>
                      <div className="notif-msg" style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div title={user?.name} style={{ width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", border: "3px solid #F0FDFA", background: "#F8FAFC" }}>
          <img src={user?.avatar} alt={user?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <button className="icon-button" onClick={handleLogout} title="Logout" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", width: "44px", height: "44px" }}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
