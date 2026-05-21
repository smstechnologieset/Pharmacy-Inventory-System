import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Truck,
  Phone,
  MapPin,
  Mail,
  Edit,
  Trash2,
  Building2,
} from "lucide-react";
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/firestoreService";
import FormModal from "../components/FormModal";

const Suppliers = () => {
  const [supplierList, setSupplierList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      try {
        setLoading(true);
        const suppliers = await getAllSuppliers();
        setSupplierList(suppliers);
      } catch ( err ) {
        setLoading(false);
        setError(err.message || "Failed to load suppliers");
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  const filteredSuppliers = supplierList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: "", contact: "", phone: "", email: "", address: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...formData,
      medicines: editingSupplier?.medicines || [],
    };

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
        setSupplierList((current) =>
          current.map((supplier) =>
            supplier.id === editingSupplier.id
              ? { ...supplier, ...payload }
              : supplier,
          ),
        );
      } else {
        const created = await createSupplier(payload);
        setSupplierList((current) => [...current, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to save supplier");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this supplier?")) {
      setError("");
      try {
        await deleteSupplier(id);
        setSupplierList((current) => current.filter((s) => s.id !== id));
      } catch (err) {
        setError(err.message || "Failed to delete supplier");
      }
    }
  };

  return (
    <div className="suppliers-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}>
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: "800",
              letterSpacing: "-0.025em",
            }}>
            Suppliers
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            Manage your pharmacy's vendors and suppliers.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Supplier
        </button>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div
          className="search-bar"
          style={{ width: "100%", maxWidth: "450px" }}>
          <Search size={22} style={{ color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search suppliers by name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Bubbly Cards as seen in screenshot */}
      {loading ? (
        <div style={{ padding: "24px 0", color: "#64748B" }}>
          Loading suppliers...
        </div>
      ) : error ? (
        <div style={{ padding: "24px 0", color: "#EF4444" }}>{error}</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "32px",
          }}>
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{ padding: "32px", position: "relative" }}>
              <div
                style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: "#F0FDFA",
                    color: "#0D9488",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <Building2 size={32} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: "800",
                      color: "#1E293B",
                    }}>
                    {s.name}
                  </h3>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#0D9488",
                      fontWeight: "700",
                    }}>
                    {s.medicines?.length || 6} items supplied
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    padding: "10px 18px",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    color: "#475569",
                  }}>
                  <Edit size={16} /> <span>{s.contact}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    padding: "10px 18px",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    color: "#475569",
                  }}>
                  <Phone size={16} /> <span>{s.phone}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    padding: "10px 18px",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    color: "#475569",
                  }}>
                  <Mail size={16} /> <span>{s.email}</span>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "32px",
                  right: "32px",
                  display: "flex",
                  gap: "8px",
                }}>
                <button
                  className="icon-button"
                  onClick={() => handleOpenModal(s)}
                  style={{ width: "36px", height: "36px" }}
                  title="Edit">
                  <Edit size={14} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => handleDelete(s.id)}
                  style={{ width: "36px", height: "36px", color: "#EF4444" }}
                  title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}>
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
              }}>
              Supplier Name
            </label>
            <input
              type="text"
              required
              className="search-bar"
              style={{
                width: "100%",
                background: "#F8FAFC",
                padding: "14px 20px",
              }}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
              }}>
              Contact Person
            </label>
            <input
              type="text"
              required
              className="search-bar"
              style={{
                width: "100%",
                background: "#F8FAFC",
                padding: "14px 20px",
              }}
              value={formData.contact}
              onChange={(e) =>
                setFormData({ ...formData, contact: e.target.value })
              }
            />
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
                }}>
                Phone
              </label>
              <input
                type="text"
                required
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                }}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
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
                }}>
                Email
              </label>
              <input
                type="email"
                required
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                }}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
              }}>
              Office Address
            </label>
            <input
              type="text"
              required
              className="search-bar"
              style={{
                width: "100%",
                background: "#F8FAFC",
                padding: "14px 20px",
              }}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: "52px", fontSize: "0.95rem", marginTop: "10px" }}>
            {editingSupplier ? "Update Supplier" : "Confirm & Save Supplier"}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Suppliers;
