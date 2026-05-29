import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Users,
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
      // 1. Create the pharmacy document
      const newPharmacy = await createPharmacy({
        name: formData.pharmacyName,
        address: formData.address,
        phone: formData.phone,
        email: formData.adminEmail,
      });

      // 2. Create the admin account for this pharmacy
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

      // 3. Update the pharmacy with the admin's UID
      await updatePharmacy(newPharmacy.id, { adminId: uid });

      // Show credentials
      setCreatedCredentials({
        email: formData.adminEmail,
        password,
        pharmacyName: formData.pharmacyName,
      });

      // Refresh data
      await loadData();

      // Reset form but keep modal open to show credentials
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

  const handleToggleSuspend = async (pharmacy) => {
    const newStatus = pharmacy.status === "suspended" ? "active" : "suspended";
    const action = newStatus === "suspended" ? "suspend" : "reactivate";
    if (
      !window.confirm(
        `Are you sure you want to ${action} "${pharmacy.name}"? ${
          newStatus === "suspended"
            ? "All users will see a suspension notice."
            : "Users will be able to log in again."
        }`,
      )
    )
      return;

    try {
      await updatePharmacy(pharmacy.id, { status: newStatus });
      setPharmacies(
        pharmacies.map((p) =>
          p.id === pharmacy.id ? { ...p, status: newStatus } : p,
        ),
      );
    } catch (err) {
      setError(err.message || `Failed to ${action} pharmacy.`);
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
    activePharmacies: pharmacies.filter((p) => p.status !== "suspended").length,
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
            <ShieldCheck size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
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
            label: "Suspended",
            value: stats.suspendedPharmacies,
            icon: <ShieldOff size={24} />,
            bg: "#FEF2F2",
            color: "#EF4444",
          },
          {
            label: "Total Staff",
            value: stats.totalUsers,
            icon: <Users size={24} />,
            bg: "#EFF6FF",
            color: "#3B82F6",
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

      {/* Pharmacy Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B" }}>
          Loading pharmacies...
        </div>
      ) : filteredPharmacies.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "60px",
            color: "#94A3B8",
          }}>
          <Building2
            size={48}
            strokeWidth={1}
            style={{ margin: "0 auto 16px", opacity: 0.5 }}
          />
          <p>No pharmacies registered yet. Click "Register New Pharmacy" to get started.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "20px",
          }}>
          {filteredPharmacies.map((pharmacy) => {
            const admin = getPharmacyAdmin(pharmacy.id);
            const userCount = getPharmacyUserCount(pharmacy.id);
            const isSuspended = pharmacy.status === "suspended";

            return (
              <div
                key={pharmacy.id}
                className="card"
                style={{
                  padding: "28px",
                  opacity: isSuspended ? 0.7 : 1,
                  borderLeft: `4px solid ${isSuspended ? "#EF4444" : "#0D9488"}`,
                }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}>
                  <div>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        color: "#1E293B",
                        marginBottom: "4px",
                      }}>
                      {pharmacy.name}
                    </h3>
                    {pharmacy.address && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#94A3B8",
                        }}>
                        {pharmacy.address}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: isSuspended ? "#FEE2E2" : "#ECFDF5",
                      color: isSuspended ? "#EF4444" : "#059669",
                    }}>
                    {isSuspended ? "Suspended" : "Active"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "20px",
                  }}>
                  <div
                    style={{
                      padding: "12px",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                    }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#94A3B8",
                        marginBottom: "4px",
                      }}>
                      Admin
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "#1E293B",
                      }}>
                      {admin?.name || "—"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      {admin?.email || "—"}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                    }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#94A3B8",
                        marginBottom: "4px",
                      }}>
                      Staff Members
                    </div>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "800",
                        color: "#0D9488",
                      }}>
                      {userCount}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleSuspend(pharmacy)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: isSuspended ? "#ECFDF5" : "#FEF2F2",
                    color: isSuspended ? "#059669" : "#EF4444",
                    transition: "opacity 0.2s",
                  }}>
                  {isSuspended ? (
                    <>
                      <ShieldCheck
                        size={16}
                        style={{ marginRight: "6px", verticalAlign: "middle" }}
                      />
                      Reactivate Pharmacy
                    </>
                  ) : (
                    <>
                      <ShieldOff
                        size={16}
                        style={{ marginRight: "6px", verticalAlign: "middle" }}
                      />
                      Suspend Pharmacy
                    </>
                  )}
                </button>
              </div>
            );
          })}
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
    </div>
  );
};

export default SuperAdmin;
