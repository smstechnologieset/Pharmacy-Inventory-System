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
import ConfirmModal from "../components/ConfirmModal"; // 1. Import the ConfirmModal
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import CustomSelect from "../components/CustomSelect";

const Inventory = () => {
  const { user } = useAuth();
  const { t } = useSettings();
  const [stockList, setStockList] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    medicineId: "",
    batchNo: "",
    expiry: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // 2. Add states for the Confirm Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

  useEffect(() => {
    if (!user?.pharmacyId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [meds, batches] = await Promise.all([
          getAllMedicines(user.pharmacyId),
          getAllStockBatches(user.pharmacyId),
        ]);
        setMedicines(meds);

        const medMap = meds.reduce((acc, med) => {
          acc[med.id] = med;
          return acc;
        }, {});
        const combined = batches.map((b) => ({
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

  const getExpiryStatus = (expiry) => {
    if (!expiry) return "ok";
    const d = expiry?.toDate ? expiry.toDate() : new Date(expiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expired";
    if (diffDays <= 30) return "expiring-soon";
    return "ok";
  };

  const filteredBatches = stockList
    .filter(
      (batch) =>
        batch.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch.batchNo &&
          batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.medicineName.localeCompare(b.medicineName);
        case "name-desc":
          return b.medicineName.localeCompare(a.medicineName);
        case "qty-high":
          return Number(b.quantity) - Number(a.quantity);
        case "qty-low":
          return Number(a.quantity) - Number(b.quantity);
        case "cost-high":
          return Number(b.costPrice) - Number(a.costPrice);
        case "cost-low":
          return Number(a.costPrice) - Number(b.costPrice);
        case "expiry-soon": {
          const dateA = a.expiry?.toDate
            ? a.expiry.toDate()
            : new Date(a.expiry || "9999-12-31");
          const dateB = b.expiry?.toDate
            ? b.expiry.toDate()
            : new Date(b.expiry || "9999-12-31");
          return dateA - dateB;
        }
        case "status": {
          const statusOrder = { expired: 1, "expiring-soon": 2, ok: 3 };
          return (
            statusOrder[getExpiryStatus(a.expiry)] -
            statusOrder[getExpiryStatus(b.expiry)]
          );
        }
        default:
          return 0;
      }
    });

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      // Safely parse Firestore Timestamps or strings for the date input
      let expiryStr = "";
      if (item.expiry) {
        const d = item.expiry?.toDate
          ? item.expiry.toDate()
          : new Date(item.expiry);
        expiryStr = d.toISOString().split("T")[0];
      }
      setFormData({
        medicineId: item.medicineId,
        batchNo: item.batchNo || "",
        expiry: expiryStr,
        quantity: item.quantity,
        costPrice: item.costPrice || "",
        sellingPrice: item.sellingPrice || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        medicineId: medicines[0]?.id || "",
        batchNo: "",
        expiry: "",
        quantity: "",
        costPrice: "",
        sellingPrice: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleMedicineChange = (medicineId) => {
    const selectedMed = medicines.find((m) => m.id === medicineId);
    setFormData({
      ...formData,
      medicineId,
      sellingPrice: selectedMed?.price || formData.sellingPrice,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const selectedMed = medicines.find((m) => m.id === formData.medicineId);
    const payload = {
      medicineId: formData.medicineId,
      batchNo: formData.batchNo || "N/A",
      expiry: formData.expiry,
      quantity: Number(formData.quantity),
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      supplierId: selectedMed?.supplierId || "",
      supplierName: selectedMed?.supplierName || "",
      status: Number(formData.quantity) > 0 ? "In Stock" : "Out of Stock",
    };

    try {
      if (editingItem) {
        await updateStockBatch(editingItem.id, payload);
        setStockList((current) =>
          current.map((s) =>
            s.id === editingItem.id
              ? { ...s, ...payload, medicineName: selectedMed?.name }
              : s,
          ),
        );
      } else {
        const created = await createStockBatch(payload, user.pharmacyId);

        // Log stock movement for audit trail (Priority 7)
        await createStockMovement(
          {
            medicineId: payload.medicineId,
            medicineName: selectedMed?.name || "Unknown",
            batchNo: payload.batchNo,
            type: "purchase_received",
            quantityChanged: payload.quantity,
            reason: "Stock received via Inventory page",
            performedBy: user?.uid || "Unknown",
            costPrice: payload.costPrice,
          },
          user.pharmacyId,
        );

        setStockList((current) => [
          {
            ...created,
            medicineName: selectedMed?.name || "Unknown",
            category: selectedMed?.category || "N/A",
            supplierName: selectedMed?.supplierName || "N/A",
          },
          ...current,
        ]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to save inventory");
    } finally {
      setSaving(false);
    }
  };

  // 3. Split the logic: Open the modal first
  const openDeleteModal = (id) => {
    setBatchToDelete(id);
    setIsConfirmModalOpen(true);
  };

  // 4. Execute the actual deletion when confirmed
  const confirmDelete = async () => {
    if (!batchToDelete) return;
    const id = batchToDelete;
    setError("");
    try {
      await deleteStockBatch(id);
      setStockList((current) => current.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete inventory item");
    } finally {
      setBatchToDelete(null);
    }
  };

  return (
    <div className="inventory-page">
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
            {t("inventory.title")}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            {t("inventory.subtitle")}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleOpenForm()}
          disabled={medicines.length === 0}>
          <Plus size={20} /> {t("inventory.receiveStock")}
        </button>
      </div>

      {medicines.length === 0 && !loading && (
        <div
          className="card"
          style={{
            padding: "24px",
            color: "#D97706",
            background: "#FEF3C7",
            marginBottom: "24px",
          }}>
          <span
            dangerouslySetInnerHTML={{
              __html: t("inventory.mustAddMedicines").replace(
                "Medicine Catalog",
                "<strong>Medicine Catalog</strong>",
              ),
            }}
          />
        </div>
      )}

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
              placeholder={t("inventory.searchPlaceholder")}
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
                  label: t("inventory.sortNameAsc") || "Name (A-Z)",
                },
                {
                  value: "name-desc",
                  label: t("inventory.sortNameDesc") || "Name (Z-A)",
                },
                {
                  value: "qty-high",
                  label: t("inventory.sortQtyHigh") || "Quantity (High to Low)",
                },
                {
                  value: "qty-low",
                  label: t("inventory.sortQtyLow") || "Quantity (Low to High)",
                },
                {
                  value: "cost-high",
                  label: t("inventory.sortCostHigh") || "Cost (High to Low)",
                },
                {
                  value: "cost-low",
                  label: t("inventory.sortCostLow") || "Cost (Low to High)",
                },
                {
                  value: "expiry-soon",
                  label:
                    t("inventory.sortExpirySoon") || "Expiry Date (Soonest)",
                },
                {
                  value: "status",
                  label: t("inventory.sortStatus") || "Status (Severity)",
                },
              ]}
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: "24px 32px", color: "#64748B" }}>
              {t("inventory.loading")}
            </div>
          ) : error ? (
            <div style={{ padding: "24px 32px", color: "#EF4444" }}>
              {error}
            </div>
          ) : (
            <table style={{ borderSpacing: "0" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ padding: "16px 32px" }}>
                    {t("inventory.medicineName")}
                  </th>
                  <th>{t("inventory.batchNo")}</th>
                  <th>{t("inventory.quantity")}</th>
                  <th>{t("inventory.costPrice")}</th>
                  <th>{t("inventory.expiry")}</th>
                  <th>{t("inventory.status")}</th>
                  <th style={{ textAlign: "right", paddingRight: "32px" }}>
                    {t("inventory.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#94A3B8",
                      }}>
                      {t("inventory.noBatches")}
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const status = getExpiryStatus(batch.expiry);
                    const rowBg =
                      status === "expired"
                        ? "#FFF5F5"
                        : status === "expiring-soon"
                          ? "#FFFDF0"
                          : "transparent";
                    const d = batch.expiry?.toDate
                      ? batch.expiry.toDate()
                      : new Date(batch.expiry);

                    return (
                      <tr
                        key={batch.id}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          background: rowBg,
                        }}>
                        <td style={{ padding: "20px 32px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "12px",
                                background: "var(--primary-light)",
                                color: "var(--primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                              <Box size={20} />
                            </div>
                            <div>
                              <span
                                style={{ fontWeight: "700", fontSize: "1rem" }}>
                                {batch.medicineName}
                              </span>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#94A3B8",
                                }}>
                                {batch.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: "600", color: "#64748B" }}>
                          {batch.batchNo}
                        </td>
                        <td style={{ fontWeight: "700" }}>
                          {batch.quantity} units
                        </td>
                        <td>
                          <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                            {t("inventory.cost")}: ETB {batch.costPrice || 0}
                          </div>
                          <div style={{ fontWeight: "600" }}>
                            {t("inventory.sell")}: ETB {batch.sellingPrice || 0}
                          </div>
                        </td>
                        <td
                          style={{
                            color: status === "expired" ? "#EF4444" : "#64748B",
                            fontWeight: "500",
                          }}>
                          {batch.expiry ? d.toISOString().split("T")[0] : "N/A"}
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              background:
                                batch.quantity === 0
                                  ? "#FEE2E2"
                                  : batch.quantity < 50
                                    ? "#FEF3C7"
                                    : "#ECFDF5",
                              color:
                                batch.quantity === 0
                                  ? "#B91C1C"
                                  : batch.quantity < 50
                                    ? "#92400E"
                                    : "#059669",
                              fontSize: "0.75rem",
                            }}>
                            {batch.quantity === 0
                              ? t("header.outOfStock")
                              : batch.quantity < 50
                                ? t("header.lowStockAlert")
                                : t("header.inStock")}
                          </span>
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
                              onClick={() => handleOpenForm(batch)}
                              style={{ width: "40px", height: "40px" }}>
                              <Edit size={16} />
                            </button>
                            {/* 5. Update button to open the modal instead of using window.confirm */}
                            <button
                              className="icon-button"
                              onClick={() => openDeleteModal(batch.id)}
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
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Update Stock Batch" : "Receive New Stock"}>
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
              Select Medicine
            </label>
            <CustomSelect
              value={formData.medicineId}
              onChange={(val) => handleMedicineChange(val)}
              disabled={!!editingItem}
              placeholder="-- Choose existing medicine --"
              options={medicines.map((med) => ({
                value: med.id,
                label: med.name,
              }))}
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
                Batch No
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
                value={formData.batchNo}
                onChange={(e) =>
                  setFormData({ ...formData, batchNo: e.target.value })
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
                Expiry Date
              </label>
              <input
                type="date"
                required
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
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
                Quantity
              </label>
              <input
                type="number"
                required
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                }}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
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
                Cost Price
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                }}
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
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
                Selling Price
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                }}
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: e.target.value })
                }
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                color: "#B91C1C",
                background: "#FEE2E2",
                padding: "12px 16px",
                borderRadius: "16px",
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
              ? "Saving..."
              : editingItem
                ? "Update Batch"
                : "Confirm Stock Arrival"}
          </button>
        </form>
      </FormModal>

      {/* 6. Add the Confirm Modal at the bottom */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setBatchToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t("inventory.deleteTitle") || "Delete Stock Batch?"}
        message={
          t("inventory.confirmDeleteBatch") ||
          "Are you sure you want to delete this stock batch? This action cannot be undone."
        }
        type="danger"
        confirmText={t("inventory.delete") || "Delete"}
        cancelText={t("modal.cancel") || "Cancel"}
      />
    </div>
  );
};

export default Inventory;
