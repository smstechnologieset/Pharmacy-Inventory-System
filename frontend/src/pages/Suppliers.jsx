import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Edit,
  Trash2,
  Building2,
  X,
} from "lucide-react";

import FormModal from "../components/FormModal";
import ConfirmModal from "../components/ConfirmModal"; // 1. Import the ConfirmModal
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { createSupplier, deleteSupplier, getAllSuppliers, updateSupplier } from "../services/suppliers.js";
import { getAllMedicines, updateMedicine } from "../services/medicines.js";

const Suppliers = () => {
  const { user } = useAuth();
  const { t } = useSettings();
  const [supplierList, setSupplierList] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    medicines: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 2. Add states for the Confirm Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Dropdown state
  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false);
  const [medSearchTerm, setMedSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.pharmacyId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [suppliersData, medicinesData] = await Promise.all([
          getAllSuppliers(user.pharmacyId),
          getAllMedicines(user.pharmacyId).catch(() => []),
        ]);

        setAllMedicines(medicinesData);

        const enrichedSuppliers = suppliersData.map((s) => ({
          ...s,
          currentMedicines: medicinesData
            .filter((m) => m.supplierId === s.id)
            .map((m) => ({ id: m.id, name: m.name })),
        }));

        setSupplierList(enrichedSuppliers);
      } catch (err) {
        setError(
          err.message ||
            t("suppliers.failedToLoad") ||
            "Failed to load suppliers",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [t, user?.pharmacyId]);

  const filteredSuppliers = supplierList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredAvailableMedicines = allMedicines.filter(
    (m) =>
      m.name.toLowerCase().includes(medSearchTerm.toLowerCase()) &&
      !formData.medicines.find((fm) => fm.id === m.id) &&
      (m.supplierId === "" ||
        m.supplierId === null ||
        m.supplierId === editingSupplier?.id),
  );

  const handleAddMedicine = (med) => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { id: med.id, name: med.name }],
    });
    setMedSearchTerm("");
  };

  const handleRemoveMedicine = (medId) => {
    setFormData({
      ...formData,
      medicines: formData.medicines.filter((m) => m.id !== medId),
    });
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        medicines: supplier.currentMedicines || [],
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        contact: "",
        phone: "",
        email: "",
        address: "",
        medicines: [],
      });
    }
    setIsModalOpen(true);
    setIsMedDropdownOpen(false);
    setMedSearchTerm("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        contact: formData.contact,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
      };

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);

        const originalMedIds = (editingSupplier.currentMedicines || []).map(
          (m) => m.id,
        );
        const newMedIds = formData.medicines.map((m) => m.id);

        const removedIds = originalMedIds.filter(
          (id) => !newMedIds.includes(id),
        );
        const addedIds = newMedIds.filter((id) => !originalMedIds.includes(id));

        const updatePromises = [];

        removedIds.forEach((medId) => {
          updatePromises.push(
            updateMedicine(medId, { supplierId: "", supplierName: "" }),
          );
        });

        addedIds.forEach((medId) => {
          updatePromises.push(
            updateMedicine(medId, {
              supplierId: editingSupplier.id,
              supplierName: editingSupplier.name,
            }),
          );
        });

        await Promise.all(updatePromises);

        setSupplierList((current) =>
          current.map((s) =>
            s.id === editingSupplier.id
              ? { ...s, ...payload, currentMedicines: formData.medicines }
              : s,
          ),
        );
      } else {
        const created = await createSupplier(payload, user.pharmacyId);
        setSupplierList((current) => [
          ...current,
          { ...created, currentMedicines: [] },
        ]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(
        err.message || t("suppliers.failedToSave") || "Failed to save supplier",
      );
    } finally {
      setSaving(false);
    }
  };

  // 3. Split the logic: Open the modal first
  const openDeleteModal = (id) => {
    setSupplierToDelete(id);
    setIsConfirmModalOpen(true);
  };

  // 4. Execute the actual deletion when confirmed
  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    const id = supplierToDelete;
    setError("");
    try {
      await deleteSupplier(id);
      setSupplierList((current) => current.filter((s) => s.id !== id));
    } catch (err) {
      setError(
        err.message ||
          t("suppliers.failedToDelete") ||
          "Failed to delete supplier",
      );
    } finally {
      setSupplierToDelete(null);
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
            {t("suppliers.title")}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            {t("suppliers.subtitle")}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> {t("suppliers.addSupplier")}
        </button>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div
          className="search-bar"
          style={{ width: "100%", maxWidth: "450px" }}>
          <Search size={22} style={{ color: "#94A3B8" }} />
          <input
            type="text"
            placeholder={t("suppliers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "24px 0", color: "#64748B" }}>
          {t("suppliers.loading")}
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
                    {s.currentMedicines?.length || 0}{" "}
                    {t("suppliers.itemsSupplied")}
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
                {/* 5. Update button to open the modal instead of using window.confirm */}
                <button
                  className="icon-button"
                  onClick={() => openDeleteModal(s.id)}
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
        title={
          editingSupplier
            ? t("suppliers.editSupplier")
            : t("suppliers.addNewSupplier")
        }>
        {/* Form content remains exactly the same */}
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
              {t("suppliers.supplierName")}
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
              {t("suppliers.medicinesSupplied", "Medicines Supplied")}
            </label>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "12px",
                minHeight: "38px",
              }}>
              {formData.medicines.map((med) => (
                <div
                  key={med.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#E0F2FE",
                    color: "#0369A1",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                  }}>
                  {med.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedicine(med.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#0369A1",
                      cursor: "pointer",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                    }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  background: "#F8FAFC",
                  border: "1px dashed #94A3B8",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  color: "#475569",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
                onClick={() => setIsMedDropdownOpen(!isMedDropdownOpen)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E2E8F0";
                  e.currentTarget.style.borderColor = "#64748B";
                  e.currentTarget.style.color = "#1E293B";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.borderColor = "#94A3B8";
                  e.currentTarget.style.color = "#475569";
                }}>
                <Plus size={18} />
                <span>
                  {isMedDropdownOpen
                    ? t("suppliers.searchMedicines", "Search medicines...")
                    : t(
                        "suppliers.clickToAddMedicines",
                        "Click to add medicines...",
                      )}
                </span>
              </div>

              {isMedDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    marginTop: "8px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 10,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}>
                  <div
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #E2E8F0",
                      position: "sticky",
                      top: 0,
                      background: "white",
                    }}>
                    <input
                      type="text"
                      placeholder={t(
                        "suppliers.searchMedicines",
                        "Search medicines...",
                      )}
                      value={medSearchTerm}
                      onChange={(e) => setMedSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ padding: "8px" }}>
                    {filteredAvailableMedicines.length > 0 ? (
                      filteredAvailableMedicines.map((med) => (
                        <div
                          key={med.id}
                          onClick={() => handleAddMedicine(med)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            color: "#334155",
                            transition: "background 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#F1F5F9")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }>
                          <Plus size={14} style={{ color: "#0D9488" }} />
                          {med.name}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: "16px 12px",
                          color: "#94A3B8",
                          fontSize: "0.85rem",
                          textAlign: "center",
                        }}>
                        {t("suppliers.noMedicinesFound", "No medicines found")}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              {t("suppliers.contactPerson")}
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
                {t("suppliers.phone")}
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
                {t("suppliers.email")}
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
              {t("suppliers.officeAddress")}
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
              ? t("settings.saving", "Saving...")
              : editingSupplier
                ? t("suppliers.updateSupplier")
                : t("suppliers.confirmAdd")}
          </button>
        </form>
      </FormModal>

      {/* 6. Add the Confirm Modal at the bottom */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSupplierToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t("suppliers.deleteTitle") || "Delete Supplier?"}
        message={
          t("suppliers.confirmDelete") ||
          "Are you sure you want to delete this supplier? This action cannot be undone."
        }
        type="danger"
        confirmText={t("suppliers.delete") || "Delete"}
        cancelText={t("modal.cancel") || "Cancel"}
      />
    </div>
  );
};

export default Suppliers;
