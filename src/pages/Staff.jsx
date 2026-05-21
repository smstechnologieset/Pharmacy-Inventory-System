import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  UserCheck,
  Shield,
  Edit,
  Trash2,
  UserCog,
} from "lucide-react";
import { users as initialUsers, roles } from "../data/mockData";
import {
  getAllUsers,
  updateUserProfile,
  createUserProfile,
} from "../services/firestoreService";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

import FormModal from "../components/FormModal";

// All possible roles including "staff" which was missing from the dropdown
const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
];

const getRoleIcon = (role) => {
  if (role === "admin") return <Shield size={14} />;
  return <UserCheck size={14} />;
};

const Staff = () => {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredStaff = staffList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        email: staff.email,
        role: staff.role || "staff", // fallback to "staff" if role is undefined
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingStaff) {
        // Update existing staff in Firestore
        await updateUserProfile(editingStaff.id, formData);
        setStaffList(
          staffList.map((s) =>
            s.id === editingStaff.id ? { ...s, ...formData } : s,
          ),
        );
      } else {
        // Create new staff profile in Firestore using timestamp as uid
        const newUid = `staff_${Date.now()}`;
        const profileData = await createUserProfile(newUid, {
          ...formData,
          avatar: `https://i.pravatar.cc/150?u=${newUid}`,
        });
        setStaffList([
          ...staffList,
          {
            id: newUid,
            ...profileData,
            avatar: `https://i.pravatar.cc/150?u=${newUid}`,
          },
        ]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save staff:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setStaffList(staffList.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete staff:", err);
      setError("Failed to delete staff member.");
    }
  };

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        const users = await getAllUsers();
        setStaffList(
          users.map((user) => ({
            id: user.id || user.uid || user.email,
            name: user.name || "",
            email: user.email || "",
            role: user.role || "staff",
            avatar:
              user.avatar ||
              `https://i.pravatar.cc/150?u=${user.id || user.email}`,
            status: user.status || "Active",
          })),
        );
      } catch (err) {
        console.error("Failed to load staff:", err);
        setError("Unable to load staff from Firebase.");
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  return (
    <div className="staff-page">
      {loading && <p>Loading staff...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
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
            Staff Management
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}>
            Manage user access and pharmacy roles.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add New Staff
        </button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px" }}>
          <div
            className="search-bar"
            style={{ width: "100%", maxWidth: "450px" }}>
            <Search size={22} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: "0" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "16px 32px" }}>Staff Name</th>
                <th>Role</th>
                <th>Email Address</th>
                <th>Status</th>
                <th style={{ textAlign: "right", paddingRight: "32px" }}>
                  Actions
                </th>
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
                      {(staff.role || "staff").toUpperCase()}
                    </div>
                  </td>
                  <td style={{ color: "#475569", fontWeight: "500" }}>
                    {staff.email}
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
                      {staff.status}
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
                        onClick={() => handleOpenModal(staff)}
                        style={{ width: "40px", height: "40px" }}
                        title="Edit">
                        <Edit size={16} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => handleDelete(staff.id)}
                        style={{
                          width: "40px",
                          height: "40px",
                          color: "#EF4444",
                        }}
                        title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? "Update Staff Member" : "Register New Staff"}>
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

          {error && (
            <p style={{ color: "#DC2626", fontSize: "0.85rem", margin: 0 }}>
              {error}
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
              Full Name
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
              Email Address
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
                System Role
              </label>
              <select
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                  appearance: "auto",
                }}
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }>
                {/* All 4 roles are now listed so the value always matches */}
                {ROLE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
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
                }}>
                Login Status
              </label>
              <select
                className="search-bar"
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  padding: "14px 20px",
                  appearance: "auto",
                }}
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ height: "52px", fontSize: "0.95rem", marginTop: "10px" }}>
            {saving
              ? "Saving..."
              : editingStaff
                ? "Update Permissions"
                : "Create Staff Profile"}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Staff;
