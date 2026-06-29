import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import FormModal from "../components/FormModal";
import ConfirmModal from "../components/ConfirmModal"; // 1. Import the ConfirmModal

import { useSettings } from "../context/SettingsContext";
import CustomSelect from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";
import {
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from "../services/medicines.js";
import { getAllSuppliers } from "../services/suppliers.js";
import MedicinesTable from "../components/MedicinesTable.jsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const Medicine = () => {
  const { t } = useSettings();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Tablets",
    price: "",
    description: "",
    supplierId: "",
    supplierName: "",
  });
  // const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // 2. Add states for the Confirm Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);

  const {
    data: productList = [],
    isLoading: isMedicinesLoading,
    error: medicinesError,
  } = useQuery({
    queryKey: ["medicines", user?.pharmacyId],
    queryFn: () => getAllMedicines(user.pharmacyId),
    enabled: !!user?.pharmacyId,
  });

  const {
    data: suppliers = [],
    isLoading: isSuppliersLoading,
    error: suppliersError,
  } = useQuery({
    queryKey: ["suppliers", user?.pharmacyId],
    queryFn: () => getAllSuppliers(user.pharmacyId).catch(() => []),
    enabled: !!user?.pharmacyId,
  });

  const loading = isMedicinesLoading || isSuppliersLoading;

  const queryError = medicinesError?.message || suppliersError?.message || "";

  const createMutation = useMutation({
    mutationFn: (payload) => createMedicine(payload, user.pharmacyId),
    onSuccess: () => {
      // Tells React Query to refetch the medicines list automatically
      queryClient.invalidateQueries({
        queryKey: ["medicines", user?.pharmacyId],
      });
      setIsModalOpen(false);
      setError("");
    },
    onError: (err) => setError(err.message || "Failed to create medicine."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateMedicine(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medicines", user?.pharmacyId],
      });
      setIsModalOpen(false);
      setError("");
    },
    onError: (err) => setError(err.message || "Failed to update medicine."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medicines", user?.pharmacyId],
      });
      setIsConfirmModalOpen(false);
      setMedicineToDelete(null);
      setError("");
    },
    onError: (err) => setError(err.message || "Failed to delete medicine."),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
    setError("");
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
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

  const handleSave = (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      supplierId: formData.supplierId || "N/A",
      supplierName: formData.supplierName || "N/A",
    };

    if (editingProduct) {
      // Trigger update mutation with both ID and payload
      updateMutation.mutate({ id: editingProduct.id, payload });
    } else {
      // Trigger create mutation with just the payload
      createMutation.mutate(payload);
    }
  };

  // 3. Split the logic: Open the modal first
  const openDeleteModal = (id) => {
    setMedicineToDelete(id);
    setIsConfirmModalOpen(true);
  };

  // 4. Execute the actual deletion when confirmed
  const confirmDelete = () => {
    if (!medicineToDelete) return;
    deleteMutation.mutate(medicineToDelete);
  };

  if (loading)
    return (
      <div className="medicine-page" style={{ padding: "32px" }}>
        <div style={{ fontSize: "1rem", color: "#64748B" }}>
          {t("medicine.loading")}
        </div>
      </div>
    );

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
            {t("medicine.title")}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            {t("medicine.subtitle")}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> {t("medicine.addMedicine")}
        </button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div
          style={{
            padding: "24px 32px",
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: "500px" }}>
            <Search size={22} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder={t("medicine.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ width: "250px" }}>
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                {
                  value: "name-asc",
                  label: t("medicine.sortNameAsc") || "Name (A-Z)",
                },
                {
                  value: "name-desc",
                  label: t("medicine.sortNameDesc") || "Name (Z-A)",
                },
                {
                  value: "stock-high",
                  label: t("medicine.sortStockHigh") || "Stock (High to Low)",
                },
                {
                  value: "stock-low",
                  label: t("medicine.sortStockLow") || "Stock (Low to High)",
                },
                {
                  value: "price-high",
                  label: t("medicine.sortPriceHigh") || "Price (High to Low)",
                },
                {
                  value: "price-low",
                  label: t("medicine.sortPriceLow") || "Price (Low to High)",
                },
                {
                  value: "category",
                  label: t("medicine.sortCategory") || "Category (A-Z)",
                },
              ]}
            />
          </div>
        </div>

        <MedicinesTable
          filteredProducts={filteredProducts}
          handleOpenModal={handleOpenModal}
          openDeleteModal={openDeleteModal}
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingProduct
            ? t("medicine.editMedicine")
            : t("medicine.addNewMedicine")
        }>
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
              {t("inventory.medicineName")}
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
                {t("medicine.category")}
              </label>
              <CustomSelect
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={[
                  { value: "Tablets", label: "Tablets" },
                  { value: "Capsules", label: "Capsules" },
                  { value: "Syrups", label: "Syrups" },
                  { value: "Injections", label: "Injections" },
                  { value: "Antihypertensives", label: "Antihypertensives" },
                  { value: "Antibiotics", label: "Antibiotics" },
                ]}
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
                {t("medicine.supplier")}
              </label>
              <CustomSelect
                value={formData.supplierId}
                onChange={(val) => handleSupplierChange(val)}
                placeholder={
                  suppliers.length === 0
                    ? t("medicine.noSuppliers")
                    : t("medicine.selectSupplier")
                }
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
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
                {t("medicine.defaultPrice")} (ETB)
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
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "700",
                marginBottom: "8px",
                color: "#1E293B",
              }}>
              {t("medicine.description")}
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
          {(error || queryError) && (
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
              opacity: isSaving ? 0.7 : 1,
            }}
            disabled={isSaving}>
            {isSaving
              ? t("settings.saving") || "Saving..."
              : editingProduct
                ? t("medicine.updateProduct")
                : t("medicine.confirmAdd")}
          </button>
        </form>
      </FormModal>

      {/* 6. Add the Confirm Modal at the bottom */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setMedicineToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t("medicine.deleteTitle") || "Delete Medicine?"}
        message={
          t("medicine.confirmDelete") ||
          "Are you sure you want to delete this medicine? This action cannot be undone."
        }
        type="danger"
        confirmText={t("medicine.delete") || "Delete"}
        cancelText={t("modal.cancel") || "Cancel"}
      />
    </div>
  );
};

export default Medicine;
