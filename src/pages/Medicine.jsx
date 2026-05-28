import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import FormModal from "../components/FormModal";
import {
  createMedicine,
  getAllMedicines,
  updateMedicine,
  deleteMedicine,
  getAllSuppliers,
  getAllStockBatches,
} from "../services/firestoreService";

const Medicine = () => {
  const [productList, setProductList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockCounts, setStockCounts] = useState({}); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "", category: "Tablets", price: "", description: "", supplierId: "", supplierName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [medicines, suppliersList, batches] = await Promise.all([
          getAllMedicines(),
          getAllSuppliers().catch(() => []),
          getAllStockBatches().catch(() => []),
        ]);
        setProductList(medicines);
        setSuppliers(suppliersList);
        
        // Calculate total stock per medicine from batches
        const counts = {};
        batches.forEach(b => {
          if (b.medicineId && b.quantity > 0) {
            counts[b.medicineId] = (counts[b.medicineId] || 0) + b.quantity;
          }
        });
        setStockCounts(counts);
      } catch (err) {
        setError(err.message || "Failed to load medicines.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProducts = productList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, category: product.category, price: product.price,
        description: product.description, supplierId: product.supplierId || "", supplierName: product.supplierName || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "", category: "Tablets", price: "", description: "",
        supplierId: suppliers[0]?.id || "", supplierName: suppliers[0]?.name || "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSupplierChange = (supplierId) => {
    const selected = suppliers.find((s) => s.id === supplierId);
    setFormData({ ...formData, supplierId, supplierName: selected?.name || "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: formData.name, category: formData.category,
        price: parseFloat(formData.price), description: formData.description,
        supplierId: formData.supplierId || "N/A", supplierName: formData.supplierName || "N/A",
      };

      if (editingProduct) {
        await updateMedicine(editingProduct.id, payload);
        setProductList(productList.map((p) => p.id === editingProduct.id ? { ...p, ...payload } : p));
      } else {
        await createMedicine(payload);
        const medicines = await getAllMedicines();
        setProductList(medicines);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to save medicine.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product master? (Note: Existing stock batches will remain but become unlinked)")) return;
    setError("");
    try {
      await deleteMedicine(id);
      setProductList(productList.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete medicine.");
    }
  };

  if (loading) return <div className="medicine-page" style={{ padding: "32px" }}><div style={{ fontSize: "1rem", color: "#64748B" }}>Loading medicines...</div></div>;

  return (
    <div className="medicine-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.025em" }}>Medicine Catalog</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Manage product master data. Use the Inventory page to receive actual stock batches.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={20} /> Add Medicine</button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px" }}>
          <div className="search-bar" style={{ width: "100%", maxWidth: "500px" }}>
            <Search size={22} style={{ color: "#94A3B8" }} />
            <input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: "0" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "16px 32px" }}>Medicine Info</th>
                <th>Category</th>
                <th>Total Stock</th>
                <th>Default Price</th>
                <th style={{ textAlign: "right", paddingRight: "32px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "20px 32px" }}>
                    <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1E293B" }}>{p.name}</div>
                    {p.supplierName && <div style={{ fontSize: "0.7rem", color: "#0D9488", marginTop: "2px" }}>Supplier: {p.supplierName}</div>}
                  </td>
                  <td>
                    <span style={{ padding: "6px 16px", background: "#F1F5F9", color: "#64748B", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>{p.category}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", color: (stockCounts[p.id] || 0) < 10 ? "#EF4444" : "#1E293B" }}>{stockCounts[p.id] || 0} units</div>
                  </td>
                  <td style={{ fontWeight: "700" }}>ETB {p.price ? parseFloat(p.price).toFixed(2) : "0.00"}</td>
                  <td style={{ paddingRight: "32px" }}>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      <button className="icon-button" onClick={() => handleOpenModal(p)} style={{ width: "40px", height: "40px" }}><Edit size={16} /></button>
                      <button className="icon-button" onClick={() => handleDelete(p.id)} style={{ width: "40px", height: "40px", color: "#EF4444" }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Medicine" : "Add New Medicine"}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>Medicine Name</label>
            <input type="text" required className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px", fontSize: "1rem" }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>Category</label>
              <select className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px", appearance: "auto" }} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option value="Tablets">Tablets</option><option value="Capsules">Capsules</option><option value="Syrups">Syrups</option>
                <option value="Injections">Injections</option><option value="Antihypertensives">Antihypertensives</option><option value="Antibiotics">Antibiotics</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>Supplier</label>
              <select className="search-bar" required style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px", appearance: "auto", color: formData.supplierId ? "#1E293B" : "#94A3B8" }} value={formData.supplierId} onChange={(e) => handleSupplierChange(e.target.value)}>
                <option value="" disabled>{suppliers.length === 0 ? "No suppliers available" : "Select a supplier"}</option>
                {suppliers.map((s) => ( <option key={s.id} value={s.id}>{s.name}</option> ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>Default Price (ETB)</label>
              <input type="number" required step="0.01" className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px" }} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>Description</label>
            <textarea rows="3" style={{ width: "100%", padding: "16px 20px", borderRadius: "24px", border: "none", background: "#F8FAFC", outline: "none", fontStyle: "inherit", resize: "none", fontSize: "0.95rem" }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          {error && <div style={{ color: "#B91C1C", background: "#FEE2E2", padding: "12px 16px", borderRadius: "16px", marginBottom: "10px" }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ height: "52px", fontSize: "0.95rem", marginTop: "10px", opacity: saving ? 0.7 : 1 }} disabled={saving}>
            {saving ? "Saving..." : editingProduct ? "Update Product" : "Confirm & Add Medicine"}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Medicine;
