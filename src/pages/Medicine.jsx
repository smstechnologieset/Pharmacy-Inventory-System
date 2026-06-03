import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import FormModal from "../components/FormModal";
import {
  createMedicine,
  getAllMedicines,
  updateMedicine,
  deleteMedicine,
  getAllSuppliers,
} from "../services/firestoreService";
import { useSettings } from "../context/SettingsContext";
import CustomSelect from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";

const Medicine = () => {
  const { t } = useSettings();
  const { user } = useAuth();
  const [productList, setProductList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "", category: "Tablets", price: "", description: "", supplierId: "", supplierName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  useEffect(() => {
    if (!user?.pharmacyId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [medicines, suppliersList] = await Promise.all([
          getAllMedicines(user.pharmacyId),
          getAllSuppliers(user.pharmacyId).catch(() => []),
        ]);
        setProductList(medicines);
        setSuppliers(suppliersList);
      } catch (err) {
        setError(err.message || "Failed to load medicines.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.pharmacyId]);

  const filteredProducts = productList
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "stock-high":
          return (b.totalStock || 0) - (a.totalStock || 0);
        case "stock-low":
          return (a.totalStock || 0) - (b.totalStock || 0);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

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
        await createMedicine(payload, user.pharmacyId);
        const medicines = await getAllMedicines(user.pharmacyId);
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
    if (!window.confirm(t("medicine.confirmDelete"))) return;
    setError("");
    try {
      await deleteMedicine(id);
      setProductList(productList.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message || t("medicine.failedToDelete") || "Failed to delete medicine.");
    }
  };

  if (loading) return <div className="medicine-page" style={{ padding: "32px" }}><div style={{ fontSize: "1rem", color: "#64748B" }}>{t("medicine.loading")}</div></div>;

  return (
    <div className="medicine-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.025em" }}>{t("medicine.title")}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            {t("medicine.subtitle")}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={20} /> {t("medicine.addMedicine")}</button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px", display: "flex", gap: "16px", alignItems: "center" }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: "500px" }}>
            <Search size={22} style={{ color: "#94A3B8" }} />
            <input type="text" placeholder={t("medicine.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div style={{ width: "250px" }}>
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: "name-asc", label: t("medicine.sortNameAsc") || "Name (A-Z)" },
                { value: "name-desc", label: t("medicine.sortNameDesc") || "Name (Z-A)" },
                { value: "stock-high", label: t("medicine.sortStockHigh") || "Stock (High to Low)" },
                { value: "stock-low", label: t("medicine.sortStockLow") || "Stock (Low to High)" },
                { value: "price-high", label: t("medicine.sortPriceHigh") || "Price (High to Low)" },
                { value: "price-low", label: t("medicine.sortPriceLow") || "Price (Low to High)" },
                { value: "category", label: t("medicine.sortCategory") || "Category (A-Z)" }
              ]}
            />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: "0" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "16px 32px" }}>{t("medicine.medicineInfo")}</th>
                <th>{t("medicine.category")}</th>
                <th>{t("medicine.totalStock")}</th>
                <th>{t("medicine.defaultPrice")}</th>
                <th style={{ textAlign: "right", paddingRight: "32px" }}>{t("medicine.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "20px 32px" }}>
                    <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1E293B" }}>{p.name}</div>
                    {p.supplierName && <div style={{ fontSize: "0.7rem", color: "#0D9488", marginTop: "2px" }}>{t("medicine.supplier")}: {p.supplierName}</div>}
                  </td>
                  <td>
                    <span style={{ padding: "6px 16px", background: "#F1F5F9", color: "#64748B", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>{p.category}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", color: (p.totalStock || 0) < 10 ? "#EF4444" : "#1E293B" }}>{p.totalStock || 0} {t("medicine.units")}</div>
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

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? t("medicine.editMedicine") : t("medicine.addNewMedicine")}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>{t("inventory.medicineName")}</label>
            <input type="text" required className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px", fontSize: "1rem" }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>{t("medicine.category")}</label>
              <CustomSelect 
                value={formData.category} 
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={[
                  { value: "Tablets", label: "Tablets" },
                  { value: "Capsules", label: "Capsules" },
                  { value: "Syrups", label: "Syrups" },
                  { value: "Injections", label: "Injections" },
                  { value: "Antihypertensives", label: "Antihypertensives" },
                  { value: "Antibiotics", label: "Antibiotics" }
                ]}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>{t("medicine.supplier")}</label>
              <CustomSelect 
                value={formData.supplierId} 
                onChange={(val) => handleSupplierChange(val)}
                placeholder={suppliers.length === 0 ? t("medicine.noSuppliers") : t("medicine.selectSupplier")}
                options={suppliers.map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>{t("medicine.defaultPrice")} (ETB)</label>
              <input type="number" required step="0.01" className="search-bar" style={{ width: "100%", background: "#F8FAFC", padding: "14px 20px" }} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", color: "#1E293B" }}>{t("medicine.description")}</label>
            <textarea rows="3" style={{ width: "100%", padding: "16px 20px", borderRadius: "24px", border: "none", background: "#F8FAFC", outline: "none", fontStyle: "inherit", resize: "none", fontSize: "0.95rem" }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          {error && <div style={{ color: "#B91C1C", background: "#FEE2E2", padding: "12px 16px", borderRadius: "16px", marginBottom: "10px" }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ height: "52px", fontSize: "0.95rem", marginTop: "10px", opacity: saving ? 0.7 : 1 }} disabled={saving}>
            {saving ? (t("settings.saving") || "Saving...") : editingProduct ? t("medicine.updateProduct") : t("medicine.confirmAdd")}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Medicine;
