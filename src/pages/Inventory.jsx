import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Box } from "lucide-react";
import {
  getAllMedicines,
  getAllStockBatches,
  createStockBatch,
  updateStockBatch,
  deleteStockBatch,
  createStockMovement,
} from "../services/firestoreService";
import FormModal from "../components/FormModal";
import { useAuth } from "../context/AuthContext";

const Inventory = () => {
  const { user } = useAuth();
  const [stockList, setStockList] = useState([]); 
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    medicineId: "", batchNo: "", expiry: "", quantity: "", costPrice: "", sellingPrice: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [meds, batches] = await Promise.all([ getAllMedicines(), getAllStockBatches() ]);
        setMedicines(meds);
        
        const medMap = meds.reduce((acc, med) => { acc[med.id] = med; return acc; }, {});
        const combined = batches.map(b => ({
          ...b,
          medicineName: medMap[b.medicineId]?.name || "Unknown Medicine",
          category: medMap[b.medicineId]?.category || "N/A",
          supplierName: medMap[b.medicineId]?.supplierName || "N/A",
        }));
        setStockList(combined);
      } catch (err) {
        setError(err.message || "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredBatches = stockList.filter((batch) =>
    batch.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.batchNo && batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      // Safely parse Firestore Timestamps or strings for the date input
      let expiryStr = "";
      if (item.expiry) {
        const d = item.expiry?.toDate ? item.expiry.toDate() : new Date(item.expiry);
        expiryStr = d.toISOString().split('T')[0];
      }
      setFormData({
        medicineId: item.medicineId, batchNo: item.batchNo || "", expiry: expiryStr,
        quantity: item.quantity, costPrice: item.costPrice || "", sellingPrice: item.sellingPrice || "",
      });
    } else {
      setEditingItem(null);
      setFormData({ medicineId: medicines[0]?.id || "", batchNo: "", expiry: "", quantity: "", costPrice: "", sellingPrice: "" });
    }
    setIsModalOpen(true);
  };

  const handleMedicineChange = (medicineId) => {
    const selectedMed = medicines.find(m => m.id === medicineId);
    setFormData({ ...formData, medicineId, sellingPrice: selectedMed?.price || formData.sellingPrice });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const selectedMed = medicines.find(m => m.id === formData.medicineId);
    const payload = {
      medicineId: formData.medicineId, batchNo: formData.batchNo || "N/A", expiry: formData.expiry,
      quantity: Number(formData.quantity), costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      supplierId: selectedMed?.supplierId || "", supplierName: selectedMed?.supplierName || "",
      status: Number(formData.quantity) > 0 ? "In Stock" : "Out of Stock",
    };

    try {
      if (editingItem) {
        await updateStockBatch(editingItem.id, payload);
        setStockList((current) => current.map(s => s.id === editingItem.id ? {...s, ...payload, medicineName: selectedMed?.name} : s));
      } else {
        const created = await createStockBatch(payload);
        
        // Log stock movement for audit trail (Priority 7)
        await createStockMovement({
          medicineId: payload.medicineId, medicineName: selectedMed?.name || "Unknown",
          batchNo: payload.batchNo, type: "purchase_received",
          quantityChanged: payload.quantity, reason: "Stock received via Inventory page",
          performedBy: user?.uid || "Unknown", costPrice: payload.costPrice,
        });

        setStockList((current) => [{
          ...created, medicineName: selectedMed?.name || "Unknown",
          category: selectedMed?.category || "N/A", supplierName: selectedMed?.supplierName || "N/A",
        }, ...current]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to save inventory");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this stock batch?")) {
      setError("");
      try {
        await deleteStockBatch(id);
        setStockList((current) => current.filter((s) => s.id !== id));
      } catch (err) {
        setError(err.message || "Failed to delete inventory item");
      }
    }
  };

  const getExpiryStatus = (expiry) => {
    if (!expiry) return "ok";
    const d = expiry?.toDate ? expiry.toDate() : new Date(expiry);
    const today = new Date(); today.setHours(0,0,0,0);
    const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expired";
    if (diffDays <= 30) return "expiring-soon";
    return "ok";
  };

  return (
    <div className="inventory-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.025em" }}>Inventory & Stock Batches</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Receive stock for existing medicines and manage batch expirations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()} disabled={medicines.length === 0}><Plus size={20} /> Receive Stock</button>
      </div>

      {medicines.length === 0 && !loading && (
        <div className="card" style={{ padding: "24px", color: "#D97706", background: "#FEF3C7", marginBottom: "24px" }}>
          You must add medicines to the <strong>Medicine Catalog</strong> before you can receive stock batches.
        </div>
      )}

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px" }}>
          <div className="search-bar" style={{ width: "100%", maxWidth: "500px" }}>
            <Search size={22} style={{ color: "#94A3B8" }} />
            <input type="text" placeholder="Search by medicine name or batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: "24px 32px", color: "#64748B" }}>Loading inventory...</div>
          ) : error ? (
            <div style={{ padding: "24px 32px", color: "#EF4444" }}>{error}</div>
          ) : (
            <table style={{ borderSpacing: "0" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ padding: "16px 32px" }}>Medicine Name</th>
                  <th>Batch No</th>
                  <th>Quantity</th>
                  <th>Cost / Price</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right", paddingRight: "32px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>No stock batches found.</td></tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const status = getExpiryStatus(batch.expiry);
                    const rowBg = status === "expired" ? "#FFF5F5" : status === "expiring-soon" ? "#FFFDF0" : "transparent";
                    const d = batch.expiry?.toDate ? batch.expiry.toDate() : new Date(batch.expiry);
                    
                    return (
                      <tr key={batch.id} style={{ borderBottom: "1px solid #F1F5F9", background: rowBg }}>
                        <td style={{ padding: "20px 32px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><Box size={20} /></div>
                            <div>
                              <span style={{ fontWeight: "700", fontSize: "1rem" }}>{batch.medicineName}</span>
                              <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{batch.category}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: "600", color: "#64748B" }}>{batch.batchNo}</td>
                        <td style={{ fontWeight: "700" }}>{batch.quantity} units</td>
                        <td>
                          <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Cost: ETB {batch.costPrice || 0}</div>
                          <div style={{ fontWeight: "600" }}>Sell: ETB {batch.sellingPrice || 0}</div>
                        </td>
                        <td style={{ color: status === "expired" ? "#EF4444" : "#64748B", fontWeight: "500" }}>
                          {batch.expiry ? d.toISOString().split('T')[0] : "N/A"}
                        </td>
                        <td>
                          <span className="status-badge" style={{
                            background: batch.quantity === 0 ? "#FEE2E2" : batch.quantity < 50 ? "#FEF3C7" : "#ECFDF5",
                            color: batch.quantity === 0 ? "#B91C1C" : batch.quantity < 50 ? "#92400E" : "#059669",
                            fontSize: "0.75rem",
                          }}>
                            {batch.quantity === 0 ? "Out of Stock" : batch.quantity < 50 ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td style={{ paddingRight: "32px" }}>
                          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button className="icon-button" onClick={() => handleOpenForm(batch)} style={{ width: "40px", height: "40px" }}><Edit size={16} /></button>
                            <button className="icon-button" onClick={() => handleDelete(batch.id)} style={{ width: "40px", height: "40px", color: "#EF4444" }}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Update Stock Batch" : "Receive New Stock"}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px" }}>Select Medicine</label>
            <select className="search-bar" required style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px" }} value={formData.medicineId} onChange={(e) => handleMedicineChange(e.target.value)} disabled={!!editingItem}>
              <option value="">-- Choose existing medicine --</option>
              {medicines.map((med) => ( <option key={med.id} value={med.id}>{med.name}</option> ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px" }}>Batch No</label>
              <input type="text" required className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px" }} value={formData.batchNo} onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px" }}>Expiry Date</label>
              <input type="date" required className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px", appearance: "auto" }} value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px" }}>Quantity</label>
              <input type="number" required className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px" }} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px" }}>Cost Price</label>
              <input type="number" step="0.01" required className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px" }} value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px" }}>Selling Price</label>
              <input type="number" step="0.01" required className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px" }} value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} />
            </div>
          </div>
          
          {error && <div style={{ color: "#B91C1C", background: "#FEE2E2", padding: "12px 16px", borderRadius: "16px" }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary" style={{ height: "52px", fontSize: "0.95rem", marginTop: "10px", opacity: saving ? 0.7 : 1 }} disabled={saving}>
            {saving ? "Saving..." : editingItem ? "Update Batch" : "Confirm Stock Arrival"}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Inventory;
