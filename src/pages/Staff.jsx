import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  UserCheck,
  Shield,
  Edit,
  Trash2,
  UserCog,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
} from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import {
  getAllUsers,
  updateUserProfile,
  createStaffAccount,
} from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import FormModal from "../components/FormModal";

import CustomSelect from "../components/CustomSelect";
import ConfirmModal from "../components/ConfirmModal.jsx";

const getRoleIcon = (role) =>
  role === "admin" ? <Shield size={14} /> : <UserCheck size={14} />;

const maskEmail = (email = "") => {
  const [username, domain] = email.split("@");
  if (!domain) return "***";
  return `${username[0]}${"*".repeat(Math.max(username.length - 1, 2))}@${domain}`;
};

const Staff = () => {
  // "user" matches exactly what AuthContext exposes — it has uid, email, role, name etc.
  const { user } = useAuth();
  const { t } = useSettings();
  const isAdmin = user?.role === "admin";
  const roleLabels = {
    admin: t("staff.roles.admin"),
    pharmacist: t("staff.roles.pharmacist"),
    manager: t("staff.roles.manager"),
    staff: t("staff.roles.staff"),
  };
  const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({
    value,
    label,
  }));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "pharmacist",
    status: "Active",
  });

  const [successInfo, setSuccessInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");

  // ── Load staff ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        const users = await getAllUsers();
        setStaffList(
          users.map((u) => ({
            id: u.id || u.uid,
            name: u.name || "",
            email: u.email || "",
            role: u.role || "staff",
            avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`,
            status: u.status || "Active",
          })),
        );
      } catch (err) {
        console.error(err);
        setPageError(
          t("staff.loadError") || "Unable to load staff from Firebase.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, [t]);

  // ── Open add/edit modal ──────────────────────────────────────────────────────
  const handleOpenModal = (staff = null) => {
    setFormError("");
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        email: staff.email,
        role: staff.role || "staff",
        status: staff.status || "Active",
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        email: "",
        role: "pharmacist",
        status: "Active",
      });
    }
    setIsModalOpen(true);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editingStaff) {
        // Email is fixed after creation; only these fields are editable
        const updates = {
          name: formData.name,
          role: formData.role,
          status: formData.status,
        };
        await updateUserProfile(editingStaff.id, updates);
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === editingStaff.id ? { ...s, ...updates } : s,
          ),
        );
        setIsModalOpen(false);
      } else {
        // Creates Firebase Auth account without disturbing admin session
        const { uid, password } = await createStaffAccount(formData);
        setStaffList((prev) => [
          ...prev,
          {
            id: uid,
            ...formData,
            avatar: `https://i.pravatar.cc/150?u=${uid}`,
          },
        ]);
        setIsModalOpen(false);
        // Show credentials to admin so they can pass them to the new staff member
        setShowPassword(false);
        setCopied(false);
        setSuccessInfo({
          name: formData.name,
          email: formData.email,
          password,
        });
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setFormError(
          t("staff.emailInUse") || "An account with this email already exists.",
        );
      } else {
        setFormError(
          err.message ||
            t("staff.failedToSave") ||
            "Failed to save. Please try again.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // Deleting the Firestore doc will instantly trigger the onSnapshot
      // listener in AuthContext, forcing the user to be signed out!
      await deleteDoc(doc(db, "users", deleteTarget.id));
      setStaffList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setPageError(
        t("staff.failedToDelete") || "Failed to delete staff member.",
      );
      setDeleteTarget(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(successInfo.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const filteredStaff = staffList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="staff-page">
      {loading && <p>{t("staff.loading")}</p>}
      {pageError && <p style={{ color: "red" }}>{pageError}</p>}

      {/* Header */}
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
            {t("staff.title")}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            {isAdmin ? t("staff.adminSubtitle") : t("staff.staffSubtitle")}
          </p>
        </div>

        {/* Only admins see this button */}
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} /> {t("staff.addNewStaff")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px" }}>
          <div
            className="search-bar"
            style={{ width: "100%", maxWidth: "450px" }}>
            <Search size={22} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder={
                t("staff.searchPlaceholder") || "Search staff members..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: "0" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "16px 32px" }}>{t("staff.staffName")}</th>
                <th>{t("staff.role")}</th>
                <th>{t("staff.emailAddress")}</th>
                <th>{t("staff.status")}</th>
                {isAdmin && (
                  <th style={{ textAlign: "right", paddingRight: "32px" }}>
                    {t("staff.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr
                  key={staff.id}
                  style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "20px 32px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}>
                      <img
                        src={staff.avatar}
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "3px solid #F0FDFA",
                          borderRadius: "50%",
                        }}
                        alt=""
                      />
                      <span
                        style={{
                          fontWeight: "700",
                          fontSize: "0.95rem",
                          color: "#1E293B",
                        }}>
                        {staff.name}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#F0FDFA",
                        color: "#0D9488",
                        width: "fit-content",
                        padding: "6px 14px",
                        borderRadius: "12px",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                      }}>
                      {getRoleIcon(staff.role)}
                      {roleLabels[staff.role] || roleLabels.staff}
                    </div>
                  </td>

                  {/* Admins see full email; managers and others see masked */}
                  <td style={{ color: "#475569", fontWeight: "500" }}>
                    {isAdmin ? staff.email : maskEmail(staff.email)}
                  </td>

                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background:
                          staff.status === "Active" ? "#ECFDF5" : "#FEF2F2",
                        color:
                          staff.status === "Active" ? "#059669" : "#DC2626",
                        fontSize: "0.75rem",
                      }}>
                      {staff.status === "Active"
                        ? t("staff.active")
                        : t("staff.inactive")}
                    </span>
                  </td>

                  {/* Edit/Delete only for admins */}
                  {isAdmin && (
                    <td style={{ paddingRight: "32px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          justifyContent: "flex-end",
                        }}>
                        <button
                          className="icon-button"
                          onClick={() => handleOpenModal(staff)}
                          style={{ width: "40px", height: "40px" }}
                          title={t("staff.edit")}>
                          <Edit size={16} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => setDeleteTarget(staff)}
                          style={{
                            width: "40px",
                            height: "40px",
                            color: "#EF4444",
                          }}
                          title={t("staff.delete")}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit modal ─────────────────────────────────────────────────── */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingStaff ? t("staff.updateStaff") : t("staff.registerStaff")
        }>
        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "10px",
            }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#F0FDFA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0D9488",
              }}>
              <UserCog size={40} />
            </div>
          </div>

          {formError && (
            <p style={{ color: "#DC2626", fontSize: "0.85rem", margin: 0 }}>
              {formError}
            </p>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "700",
                marginBottom: "8px",
              }}>
              {t("staff.fullName")}
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
              {t("staff.emailAddress")}
            </label>
            <input
              type="email"
              required
              disabled={!!editingStaff}
              className="search-bar"
              style={{
                width: "100%",
                background: editingStaff ? "#F1F5F9" : "#F8FAFC",
                padding: "14px 20px",
                cursor: editingStaff ? "not-allowed" : "text",
              }}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {!editingStaff && (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#64748B",
                  marginTop: "6px",
                }}>
                {t("staff.autoPasswordInfo")}
              </p>
            )}
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
                {t("staff.systemRole")}
              </label>
              <CustomSelect
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: val })}
                options={roleOptions}
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
                {t("staff.loginStatus")}
              </label>
              <CustomSelect
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={[
                  { value: "Active", label: t("staff.active") || "Active" },
                  {
                    value: "Inactive",
                    label: t("staff.inactive") || "Inactive",
                  },
                ]}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ height: "52px", fontSize: "0.95rem", marginTop: "10px" }}>
            {saving
              ? t("staff.saving")
              : editingStaff
                ? t("staff.updateStaff")
                : t("staff.createAccount")}
          </button>
        </form>
      </FormModal>

      {/* ── Credentials modal ────────────────────────────────────────────────── */}
      <FormModal
        isOpen={!!successInfo}
        onClose={() => setSuccessInfo(null)}
        title={t("staff.accountCreated") || "Staff Account Created"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
                fontSize: "2rem",
              }}>
              ✓
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#475569", margin: 0 }}>
            {t("staff.accountCreatedFor")}{" "}
            <strong style={{ color: "#1E293B" }}>{successInfo?.name}</strong>
            {t("staff.shareCredentials")}
          </p>

          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "12px",
              padding: "16px 20px",
            }}>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "#94A3B8",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
              {t("staff.email")}
            </p>
            <p style={{ fontWeight: "600", color: "#1E293B", margin: 0 }}>
              {successInfo?.email}
            </p>
          </div>

          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "12px",
              padding: "16px 20px",
            }}>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "#94A3B8",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
              {t("staff.password")}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}>
              <p
                style={{
                  fontWeight: "700",
                  color: "#0D9488",
                  fontSize: "1.1rem",
                  margin: 0,
                  letterSpacing: "0.05em",
                  fontFamily: "monospace",
                }}>
                {showPassword ? successInfo?.password : "••••••••••"}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="icon-button"
                  style={{ width: "36px", height: "36px" }}
                  title={
                    showPassword
                      ? t("staff.hidePassword")
                      : t("staff.showPassword")
                  }
                  onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  className="icon-button"
                  style={{
                    width: "36px",
                    height: "36px",
                    color: copied ? "#059669" : undefined,
                  }}
                  title={t("staff.copyPassword")}
                  onClick={handleCopy}>
                  {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: "0.78rem",
              color: "#94A3B8",
              textAlign: "center",
              margin: 0,
            }}>
            {t("staff.copyInfo")}
          </p>

          <button
            className="btn btn-primary"
            style={{ height: "48px" }}
            onClick={() => setSuccessInfo(null)}>
            {t("staff.done")}
          </button>
        </div>
      </FormModal>
            {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        type="danger"
        title={t("staff.confirmDeleteTitle")}
        message={`${t("staff.confirmDeleteMsgPrefix")} ${deleteTarget?.name || ""}? ${t("staff.confirmDeleteMsgSuffix")}`}
        confirmText={t("staff.yesDelete")}
        cancelText={t("staff.cancel")}
      />
    </div>
  );
};




export default Staff;
