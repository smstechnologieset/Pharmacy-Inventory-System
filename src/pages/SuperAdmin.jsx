import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  ShieldCheck,
  ShieldOff,
  Search,
  Activity,
  LogOut,
} from "lucide-react";
import {
  getAllPharmacies,
  createPharmacy,
  updatePharmacy,
  createStaffAccount,
  getAllUsers,
} from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import FormModal from "../components/FormModal";
import ConfirmModal from "../components/ConfirmModal";
import { updateUserStatusByPharmacyId } from "../../../../../Desktop/src/services/firestoreService.js";

const SuperAdmin = () => {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const [pharmacies, setPharmacies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pharmacyToToggle, setPharmacyToToggle] = useState(null);

  const [formData, setFormData] = useState({
    pharmacyName: "",
    address: "",
    phone: "",
    adminName: "",
    adminEmail: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pharmacyList, userList] = await Promise.all([
        getAllPharmacies(),
        getAllUsers(),
      ]);
      setPharmacies(pharmacyList);
      setAllUsers(userList);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePharmacy = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    setCreatedCredentials(null);

    try {
      const newPharmacy = await createPharmacy({
        name: formData.pharmacyName,
        address: formData.address,
        phone: formData.phone,
        email: formData.adminEmail,
      });

      const { uid, password } = await createStaffAccount(
        {
          name: formData.adminName,
          email: formData.adminEmail,
          role: "admin",
        },
        newPharmacy.id,
        formData.pharmacyName,
        user.uid,
      );

      await updatePharmacy(newPharmacy.id, { adminId: uid });

      setCreatedCredentials({
        email: formData.adminEmail,
        password,
        pharmacyName: formData.pharmacyName,
      });

      await loadData();

      setFormData({
        pharmacyName: "",
        address: "",
        phone: "",
        adminName: "",
        adminEmail: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create pharmacy.");
    } finally {
      setSaving(false);
    }
  };

  const openConfirmModal = (pharmacy) => {
    setPharmacyToToggle(pharmacy);
    setIsConfirmModalOpen(true);
  };

const confirmToggleSuspend = async () => {
  if (!pharmacyToToggle) return;
  const pharmacy = pharmacyToToggle;
  const newPharmacyStatus =
    pharmacy.status === "suspended" || pharmacy.status === "pending"
      ? "active"
      : "suspended";

  // Map pharmacy status to user status
  const newUserStatus = newPharmacyStatus === "active" ? "active" : "suspended";

  try {
    await updatePharmacy(pharmacy.id, { status: newPharmacyStatus });
    await updateUserStatusByPharmacyId(pharmacy.id, newUserStatus);
    setPharmacies(
      pharmacies.map((p) =>
        p.id === pharmacy.id ? { ...p, status: newPharmacyStatus } : p,
      ),
    );
  } catch (err) {
    setError(err.message || "Failed to update pharmacy.");
  } finally {
    setPharmacyToToggle(null);
  }
};

  const getPharmacyUserCount = (pharmacyId) =>
    allUsers.filter((u) => u.pharmacyId === pharmacyId).length;

  const getPharmacyAdmin = (pharmacyId) =>
    allUsers.find((u) => u.pharmacyId === pharmacyId && u.role === "admin");

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    totalPharmacies: pharmacies.length,
    activePharmacies: pharmacies.filter((p) => p.status === "active").length,
    pendingPharmacies: pharmacies.filter((p) => p.status === "pending").length,
    suspendedPharmacies: pharmacies.filter((p) => p.status === "suspended")
      .length,
    totalUsers: allUsers.filter((u) => u.role !== "superadmin").length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "32px 48px",
      }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}>
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: "800",
              letterSpacing: "-0.025em",
              color: "#1E293B",
            }}>
            🏥 Platform Administration
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.9rem", marginTop: "4px" }}>
            Manage pharmacies, administrators, and platform health.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              padding: "10px 20px",
              background: "#F0FDFA",
              borderRadius: "16px",
              color: "#0D9488",
              fontWeight: "600",
              fontSize: "0.85rem",
            }}>
            <ShieldCheck
              size={16}
              style={{ marginRight: "6px", verticalAlign: "middle" }}
            />
            Super Admin: {user?.name || user?.email}
          </div>
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#FEE2E2",
              color: "#EF4444",
              border: "none",
              borderRadius: "16px",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: "#B91C1C",
            background: "#FEE2E2",
            padding: "16px 24px",
            borderRadius: "16px",
            marginBottom: "24px",
            fontWeight: "600",
          }}>
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "32px",
        }}>
        {[
          {
            label: "Total Pharmacies",
            value: stats.totalPharmacies,
            icon: <Building2 size={24} />,
            bg: "#F0FDFA",
            color: "#0D9488",
          },
          {
            label: "Active",
            value: stats.activePharmacies,
            icon: <Activity size={24} />,
            bg: "#ECFDF5",
            color: "#059669",
          },
          {
            label: "Pending",
            value: stats.pendingPharmacies,
            icon: <Activity size={24} />,
            bg: "#FEF3C7",
            color: "#D97706",
          },
          {
            label: "Suspended",
            value: stats.suspendedPharmacies,
            icon: <ShieldOff size={24} />,
            bg: "#FEF2F2",
            color: "#EF4444",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background: stat.bg,
                color: stat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              {stat.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: "#1E293B",
                }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}>
        <div
          className="search-bar"
          style={{ maxWidth: "400px", width: "100%" }}>
          <Search size={22} style={{ color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search pharmacies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setCreatedCredentials(null);
            setIsModalOpen(true);
          }}>
          <Plus size={20} /> Register New Pharmacy
        </button>
      </div>

      {/* Pharmacy Table */}
      {loading ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "60px 0", color: "#64748B" }}>
          Loading pharmacies...
        </div>
      ) : filteredPharmacies.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "60px", color: "#94A3B8" }}>
          <Building2
            size={48}
            strokeWidth={1}
            style={{ margin: "0 auto 16px", opacity: 0.5 }}
          />
          <p>
            No pharmacies registered yet. Click "Register New Pharmacy" to get
            started.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-container">
            <table style={{ borderSpacing: "0", width: "100%" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th
                    style={{
                      padding: "16px 32px",
                      textAlign: "left",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                    Pharmacy Info
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                    Admin
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                    Staff
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      paddingRight: "32px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPharmacies.map((pharmacy) => {
                  const admin = getPharmacyAdmin(pharmacy.id);
                  const userCount = getPharmacyUserCount(pharmacy.id);
                  const isSuspended = pharmacy.status === "suspended";
                  const isPending = pharmacy.status === "pending";
                  const statusStyles = isSuspended
                    ? { bg: "#FEE2E2", color: "#EF4444", label: "Suspended" }
                    : isPending
                      ? { bg: "#FEF3C7", color: "#D97706", label: "Pending" }
                      : { bg: "#ECFDF5", color: "#059669", label: "Active" };

                  return (
                    <tr
                      key={pharmacy.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        opacity: isSuspended ? 0.7 : 1,
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F8FAFC")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }>
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
                              background: "#F0FDFA",
                              color: "#0D9488",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}>
                            <Building2 size={20} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: "700",
                                fontSize: "0.95rem",
                                color: "#1E293B",
                              }}>
                              {pharmacy.name}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#94A3B8",
                                marginTop: "2px",
                              }}>
                              {pharmacy.address || "No address provided"}
                            </div>
                            {pharmacy.phone && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748B",
                                  marginTop: "2px",
                                }}>
                                {pharmacy.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "6px 14px",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            background: statusStyles.bg,
                            color: statusStyles.color,
                          }}>
                          {statusStyles.label}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#1E293B",
                          }}>
                          {admin?.name || "Not assigned"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          {admin?.email || "—"}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: "700",
                            color: "#0D9488",
                            fontSize: "1.1rem",
                          }}>
                          {userCount}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                          Members
                        </div>
                      </td>
                      <td style={{ paddingRight: "32px", textAlign: "right" }}>
                        <button
                          onClick={() => openConfirmModal(pharmacy)}
                          style={{
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "12px",
                            fontWeight: "600",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            background:
                              isSuspended || isPending ? "#ECFDF5" : "#FEF2F2",
                            color:
                              isSuspended || isPending ? "#059669" : "#EF4444",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "0.8")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }>
                          {isSuspended || isPending ? (
                            <>
                              <ShieldCheck size={14} />
                              {isPending ? "Activate" : "Reactivate"}
                            </>
                          ) : (
                            <>
                              <ShieldOff size={14} />
                              Suspend
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Pharmacy Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCreatedCredentials(null);
        }}
        title="Register New Pharmacy">
        {createdCredentials ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#ECFDF5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
              <ShieldCheck size={32} />
            </div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "700",
                marginBottom: "8px",
              }}>
              Pharmacy Created Successfully!
            </h3>
            <p
              style={{
                color: "#64748B",
                fontSize: "0.9rem",
                marginBottom: "24px",
              }}>
              <strong>{createdCredentials.pharmacyName}</strong> has been
              registered. Share these credentials with the admin:
            </p>
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: "16px",
                padding: "20px",
                textAlign: "left",
                marginBottom: "24px",
              }}>
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#94A3B8",
                    marginBottom: "4px",
                  }}>
                  Email
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    color: "#1E293B",
                  }}>
                  {createdCredentials.email}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#94A3B8",
                    marginBottom: "4px",
                  }}>
                  Password
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    color: "#0D9488",
                    fontFamily: "monospace",
                  }}>
                  {createdCredentials.password}
                </div>
              </div>
            </div>
            <p
              style={{
                color: "#EF4444",
                fontSize: "0.8rem",
                fontWeight: "600",
              }}>
              ⚠️ Save this password now — it cannot be retrieved later.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: "20px", width: "100%" }}
              onClick={() => {
                setIsModalOpen(false);
                setCreatedCredentials(null);
              }}>
              Done
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleCreatePharmacy}
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
                Pharmacy Name
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
                value={formData.pharmacyName}
                onChange={(e) =>
                  setFormData({ ...formData, pharmacyName: e.target.value })
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
                    color: "#1E293B",
                  }}>
                  Address
                </label>
                <input
                  type="text"
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
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#1E293B",
                  }}>
                  Phone
                </label>
                <input
                  type="text"
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
            </div>
            <div
              style={{
                borderTop: "1px solid #F1F5F9",
                paddingTop: "20px",
                marginTop: "4px",
              }}>
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  color: "#64748B",
                  marginBottom: "16px",
                }}>
                Admin Account — this person will manage the pharmacy
              </p>
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
                    Admin Name
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
                    value={formData.adminName}
                    onChange={(e) =>
                      setFormData({ ...formData, adminName: e.target.value })
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
                    Admin Email
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
                    value={formData.adminEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, adminEmail: e.target.value })
                    }
                  />
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#94A3B8",
                  marginTop: "8px",
                }}>
                A password will be automatically generated from the email
                address.
              </p>
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
              {saving ? "Creating..." : "Register Pharmacy & Create Admin"}
            </button>
          </form>
        )}
      </FormModal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPharmacyToToggle(null);
        }}
        onConfirm={confirmToggleSuspend}
        title={`${pharmacyToToggle?.status === "pending" ? "Activate" : pharmacyToToggle?.status === "suspended" ? "Reactivate" : "Suspend"} Pharmacy?`}
        message={`Are you sure you want to ${pharmacyToToggle?.status === "pending" ? "activate" : pharmacyToToggle?.status === "suspended" ? "reactivate" : "suspend"} "${pharmacyToToggle?.name}"? ${
          pharmacyToToggle?.status === "active"
            ? "All users will see a suspension notice."
            : "Users will be able to access the system."
        }`}
        type={pharmacyToToggle?.status === "active" ? "danger" : "success"}
        confirmText={
          pharmacyToToggle?.status === "pending"
            ? "Activate"
            : pharmacyToToggle?.status === "suspended"
              ? "Reactivate"
              : "Suspend"
        }
        cancelText="Cancel"
      />
    </div>
  );
};

export default SuperAdmin;
