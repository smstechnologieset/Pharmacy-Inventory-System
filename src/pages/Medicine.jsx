import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import FormModal from "../components/FormModal";
import {
  createMedicine,
  getAllMedicines,
  updateMedicine,
  deleteMedicine,
  getAllSuppliers,
} from "../services/firestoreService";

// ✅ Added: Returns "expired", "expiring-soon" (within 30 days), or "ok"
const getExpiryStatus = (expiryStr) => {
  if (!expiryStr || expiryStr === "N/A") return "ok";
  const expiry = new Date(expiryStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring-soon";
  return "ok";
};

// ✅ Added: Returns how many days until expiry (or how many days ago it expired)
const getDaysLabel = (expiryStr) => {
  if (!expiryStr || expiryStr === "N/A") return null;
  const expiry = new Date(expiryStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return "Expires today!";
  return `${diffDays}d left`;
};

const Medicine = () => {
  const [productList, setProductList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Tablets",
    price: "",
    description: "",
    batch: "",
    expiry: "",
    supplierId: "",
    supplierName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        setLoading(true);
        const [medicines, suppliersList] = await Promise.all([
          getAllMedicines(),
          getAllSuppliers().catch(() => []),
        ]);
        setProductList(medicines);
        setSuppliers(suppliersList);
      } catch (err) {
        setError(err.message || "Failed to load medicines.");
      } finally {
        setLoading(false);
      }
    };
    loadMedicines();
  }, []);

  console.log("Loaded medicines:", productList);

  if (loading) {
    return (
      <div className="medicine-page" style={{ padding: "32px" }}>
        <div style={{ fontSize: "1rem", color: "#64748B" }}>
          Loading medicines from Firebase...
        </div>
      </div>
    );
  }
  const getExpiryDays = (expiryStr) => {
    if (!expiryStr || expiryStr === "N/A") return Infinity;
    const diff = new Date(expiryStr) - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredProducts = productList
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const statusOrder = { "expiring-soon": 0, expired: 2, ok: 1 };
      const statusA = getExpiryStatus(a.expiry);
      const statusB = getExpiryStatus(b.expiry);
      if (statusA !== statusB)
        return statusOrder[statusA] - statusOrder[statusB];
      // Within the same status, sort by closest expiry date first
      return getExpiryDays(a.expiry) - getExpiryDays(b.expiry);
    });
  // const filteredProducts = productList.filter((p) =>
  //   p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  // );


  // const expiredMedicines = productList.filter(
  //   (p) => getExpiryStatus(p.expiry) === "expired",
  // );
  // const expiringSoonMedicines = productList.filter(
  //   (p) => getExpiryStatus(p.expiry) === "expiring-soon",
  // );

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        batch: product.batch || "",
        expiry: product.expiry || "",
        supplierId: product.supplierId || "",
        supplierName: product.supplierName || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "Tablets",
        price: "",
        description: "",
        batch: "",
        expiry: "",
        supplierId: suppliers[0]?.id || "",
        supplierName: suppliers[0]?.name || "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSupplierChange = (supplierId) => {
    const selected = suppliers.find((s) => s.id === supplierId);
    setFormData({
      ...formData,
      supplierId,
      supplierName: selected?.name || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingProduct) {
        const updatedMedicine = {
          ...formData,
          price: parseFloat(formData.price),
        };
        await updateMedicine(editingProduct.id, updatedMedicine);
        setProductList(
          productList.map((p) =>
            p.id === editingProduct.id ? { ...p, ...updatedMedicine } : p,
          ),
        );
      } else {
        const newProduct = {
          ...formData,
          price: parseFloat(formData.price),
          stock: 0,
          batch: formData.batch || "N/A",
          expiry: formData.expiry || "N/A",
          supplierId: formData.supplierId || "N/A",
          supplierName: formData.supplierName || "N/A",
          status: "Out of Stock",
        };
        const createdMedicine = await createMedicine(newProduct);
        setProductList([createdMedicine, ...productList]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to save medicine.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;
    setError("");
    try {
      await deleteMedicine(id);
      setProductList(productList.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete medicine.");
    }
  };

  return (
    <div className="medicine-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}>
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: "800",
              letterSpacing: "-0.025em",
            }}>
            Inventory
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            Manage your pharmacy stock and items.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Medicine
        </button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px" }}>
          <div
            className="search-bar"
            style={{ width: "100%", maxWidth: "500px" }}>
            <Search size={22} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search medicines by name or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: "0" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "16px 32px" }}>Medicine Info</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Expiry</th>
                <th style={{ textAlign: "right", paddingRight: "32px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                // ✅ Added: compute status per row
                const expiryStatus = getExpiryStatus(p.expiry);
                const daysLabel = getDaysLabel(p.expiry);

                // ✅ Added: row highlight for expired/expiring-soon
                const rowBg =
                  expiryStatus === "expired"
                    ? "#FFF5F5"
                    : expiryStatus === "expiring-soon"
                      ? "#FFFDF0"
                      : "transparent";

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: rowBg,
                    }}>
                    <td style={{ padding: "20px 32px" }}>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "0.95rem",
                          color: "#1E293B",
                        }}>
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#94A3B8",
                          marginTop: "2px",
                        }}>
                        Batch: {p.batch || "N/A"}
                      </div>
                      {p.supplierName && (
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "#0D9488",
                            marginTop: "2px",
                          }}>
                          Supplier: {p.supplierName}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "6px 16px",
                          background: "#F1F5F9",
                          color: "#64748B",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                        }}>
                        {p.category}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: "700",
                          color: p.stock < 10 ? "#EF4444" : "#1E293B",
                        }}>
                        {p.stock} tablets{" "}
                        {p.stock < 10 && <span title="Low Stock">⚠️</span>}
                      </div>
                    </td>
                    <td style={{ fontWeight: "700" }}>
                      ETB {p.price.toFixed(2)}
                    </td>

                    {/* ✅ Modified: Expiry cell now shows status badge */}
                    <td>
                      <div
                        style={{
                          color:
                            expiryStatus === "expired"
                              ? "#DC2626"
                              : expiryStatus === "expiring-soon"
                                ? "#D97706"
                                : "#64748B",
                          fontWeight: expiryStatus !== "ok" ? "700" : "500",
                        }}>
                        {p.expiry || "N/A"}
                      </div>
                      {/* ✅ Added: days label badge below the date */}
                      {daysLabel && expiryStatus !== "ok" && (
                        <div
                          style={{
                            marginTop: "4px",
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: "8px",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            background:
                              expiryStatus === "expired"
                                ? "#FEE2E2"
                                : "#FEF3C7",
                            color:
                              expiryStatus === "expired"
                                ? "#991B1B"
                                : "#92400E",
                          }}>
                          {daysLabel}
                        </div>
                      )}
                    </td>

                    <td style={{ paddingRight: "32px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          justifyContent: "flex-end",
                        }}>
                        <button
                          className="icon-button"
                          onClick={() => handleOpenModal(p)}
                          style={{ width: "40px", height: "40px" }}>
                          <Edit size={16} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => handleDelete(p.id)}
                          style={{
                            width: "40px",
                            height: "40px",
                            color: "#EF4444",
                          }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Medicine" : "Add New Medicine"}>
        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "700",
                marginBottom: "8px",
                color: "#1E293B",
              }}>
              Medicine Name
            </label>
            <input
              type="text"
              required
              className="search-bar"
              style={{
                width: "100%",
                background: "#F8FAFC",
                padding: "14px 20px",
                fontSize: "1rem",
              }}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr 1fr",
              gap: "16px",
            }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "#1E293B",
                }}>
                Category
              </label>
              <select
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                  appearance: "auto",
                }}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }>
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="Syrups">Syrups</option>
                <option value="Injections">Injections</option>
                <option value="Antihypertensives">Antihypertensives</option>
                <option value="Antibiotics">Antibiotics</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "#1E293B",
                }}>
                Supplier
              </label>
              <select
                className="search-bar"
                required
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                  appearance: "auto",
                  color: formData.supplierId ? "#1E293B" : "#94A3B8",
                }}
                value={formData.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}>
                <option value="" disabled>
                  {suppliers.length === 0
                    ? "No suppliers available"
                    : "Select a supplier"}
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "#1E293B",
                }}>
                Price (ETB)
              </label>
              <input
                type="number"
                required
                step="0.01"
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                }}
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "#1E293B",
                }}>
                Batch Number
              </label>
              <input
                type="text"
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                }}
                value={formData.batch}
                onChange={(e) =>
                  setFormData({ ...formData, batch: e.target.value })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "#1E293B",
                }}>
                Expiry Date
              </label>
              <input
                type="date"
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                  appearance: "auto",
                }}
                value={formData.expiry}
                onChange={(e) =>
                  setFormData({ ...formData, expiry: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "700",
                marginBottom: "8px",
                color: "#1E293B",
              }}>
              Standard Description
            </label>
            <textarea
              rows="3"
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: "24px",
                border: "none",
                background: "#F8FAFC",
                outline: "none",
                fontStyle: "inherit",
                resize: "none",
                fontSize: "0.95rem",
              }}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          {error && (
            <div
              style={{
                color: "#B91C1C",
                background: "#FEE2E2",
                padding: "12px 16px",
                borderRadius: "16px",
                marginBottom: "10px",
              }}>
              {error}
            </div>
          )}
          {suppliers.length === 0 && (
            <div
              style={{
                color: "#92400E",
                background: "#FEF3C7",
                padding: "12px 16px",
                borderRadius: "16px",
                fontSize: "0.85rem",
              }}>
              No suppliers found. Please add suppliers first in the Suppliers
              section to assign one to this medicine.
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              height: "52px",
              fontSize: "0.95rem",
              marginTop: "10px",
              opacity: saving ? 0.7 : 1,
            }}
            disabled={saving}>
            {saving
              ? "Saving..."
              : editingProduct
                ? "Update Product"
                : "Confirm & Add Medicine"}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Medicine;
