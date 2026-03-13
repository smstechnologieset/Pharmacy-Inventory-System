import React, { useState } from 'react';
import { Search, Plus, UserCheck, Shield, Edit, Trash2, UserCog } from 'lucide-react';
import { users as initialUsers, roles } from '../data/mockData';
import FormModal from '../components/FormModal';

const Staff = () => {
  const [staffList, setStaffList] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: roles.PHARMACIST, status: 'Active' });

  const filteredStaff = staffList.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({ name: staff.name, email: staff.email, role: staff.role, status: staff.status });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', email: '', role: roles.PHARMACIST, status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingStaff) {
      setStaffList(staffList.map(s => s.id === editingStaff.id ? { ...s, ...formData } : s));
    } else {
      const newStaff = {
        id: Date.now(),
        ...formData,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
      };
      setStaffList([...staffList, newStaff]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this staff member?')) {
      setStaffList(staffList.filter(s => s.id !== id));
    }
  };

  return (
    <div className="staff-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Staff Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Manage user access and pharmacy roles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add New Staff
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px' }}>
          <div className="search-bar" style={{ width: '100%', maxWidth: '450px' }}>
            <Search size={22} style={{ color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Search staff members..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '16px 32px' }}>Staff Name</th>
                <th>Role</th>
                <th>Email Address</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '32px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '20px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img src={staff.avatar} style={{ width: '40px', height: '40px', border: '3px solid #F0FDFA', borderRadius: '50%' }} alt="" />
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1E293B' }}>{staff.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDFA', color: '#0D9488', width: 'fit-content', padding: '6px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>
                      {staff.role === roles.ADMIN ? <Shield size={14} /> : <UserCheck size={14} />}
                      {staff.role.toUpperCase()}
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontWeight: '500' }}>{staff.email}</td>
                  <td>
                    <span className="status-badge" style={{ 
                      background: staff.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                      color: staff.status === 'Active' ? '#059669' : '#DC2626',
                      fontSize: '0.75rem'
                    }}>
                      {staff.status}
                    </span>
                  </td>
                  <td style={{ paddingRight: '32px' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button className="icon-button" onClick={() => handleOpenModal(staff)} style={{ width: '40px', height: '40px' }} title="Edit"><Edit size={16} /></button>
                      <button className="icon-button" onClick={() => handleDelete(staff.id)} style={{ width: '40px', height: '40px', color: '#EF4444' }} title="Delete"><Trash2 size={16} /></button>
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
        title={editingStaff ? 'Update Staff Member' : 'Register New Staff'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488' }}>
              <UserCog size={40} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Full Name</label>
            <input 
              type="text" required className="search-bar" style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px' }}
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Email Address</label>
            <input 
              type="email" required className="search-bar" style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px' }}
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>System Role</label>
              <select 
                className="search-bar" 
                style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px', appearance: 'auto' }}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value={roles.ADMIN}>Admin</option>
                <option value={roles.PHARMACIST}>Pharmacist</option>
                <option value={roles.MANAGER}>Manager</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Login Status</label>
              <select 
                className="search-bar" 
                style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px', appearance: 'auto' }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '52px', fontSize: '0.95rem', marginTop: '10px' }}>
            {editingStaff ? 'Update Permissions' : 'Create Staff Profile'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Staff;
