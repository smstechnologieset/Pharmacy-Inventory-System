import React, { useState } from 'react';
import { Search, Plus, UserCheck, Shield, Edit, Trash2 } from 'lucide-react';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Staff Management</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add New Staff
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="search-bar" style={{ width: '100%', maxWidth: '400px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search staff..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={staff.avatar} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="" />
                      <span style={{ fontWeight: '600' }}>{staff.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: staff.role === roles.ADMIN ? '#4A6CF7' : '#6B7280' }}>
                      {staff.role === roles.ADMIN ? <Shield size={14} /> : <UserCheck size={14} />}
                      {staff.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: '#6B7280' }}>{staff.email}</td>
                  <td>
                    <span className="status-badge" style={{ 
                      background: staff.status === 'Active' ? '#DEF7EC' : '#FDE2E2',
                      color: staff.status === 'Active' ? '#03543F' : '#9B1C1C'
                    }}>
                      {staff.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-button" onClick={() => handleOpenModal(staff)} title="Edit"><Edit size={14} /></button>
                      <button className="icon-button" onClick={() => handleDelete(staff.id)} style={{ color: '#EF4444' }} title="Delete"><Trash2 size={14} /></button>
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
        title={editingStaff ? 'Edit Staff Details' : 'Add New Staff'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Full Name</label>
            <input 
              type="text" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Email Address</label>
            <input 
              type="email" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Role</label>
              <select 
                className="btn" 
                style={{ width: '100%', border: '1px solid #E5E7EB', appearance: 'auto', background: 'white' }}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value={roles.ADMIN}>Admin</option>
                <option value={roles.PHARMACIST}>Pharmacist</option>
                <option value={roles.MANAGER}>Manager</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Status</label>
              <select 
                className="btn" 
                style={{ width: '100%', border: '1px solid #E5E7EB', appearance: 'auto', background: 'white' }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
            {editingStaff ? 'Update Staff member' : 'Add Staff Member'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Staff;
