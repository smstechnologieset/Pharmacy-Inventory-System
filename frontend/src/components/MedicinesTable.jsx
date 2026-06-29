
import { useSettings } from "../context/SettingsContext.jsx";
import { Edit, Trash2 } from "lucide-react";
export default function MedicinesTable({
  handleOpenModal,
  filteredProducts,
  openDeleteModal,
}) {
  const { t } = useSettings();

  return (
    <div className="table-container">
      <table style={{ borderSpacing: "0" }}>
        <thead>
          <tr style={{ background: "#F8FAFC" }}>
            <th style={{ padding: "16px 32px" }}>
              {t("medicine.medicineInfo")}
            </th>
            <th>{t("medicine.category")}</th>
            <th>{t("medicine.totalStock")}</th>
            <th>{t("medicine.defaultPrice")}</th>
            <th style={{ textAlign: "right", paddingRight: "32px" }}>
              {t("medicine.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
              <td style={{ padding: "20px 32px" }}>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    color: "#1E293B",
                  }}>
                  {p.name}
                </div>
                {p.supplierName && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#0D9488",
                      marginTop: "2px",
                    }}>
                    {t("medicine.supplier")}: {p.supplierName}
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
                    color: (p.totalStock || 0) < 10 ? "#EF4444" : "#1E293B",
                  }}>
                  {p.totalStock || 0} {t("medicine.units")}
                </div>
              </td>
              <td style={{ fontWeight: "700" }}>
                ETB {p.price ? parseFloat(p.price).toFixed(2) : "0.00"}
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
                  {/* 5. Update button to open the modal instead of using window.confirm */}
                  <button
                    className="icon-button"
                    onClick={() => openDeleteModal(p.id)}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
