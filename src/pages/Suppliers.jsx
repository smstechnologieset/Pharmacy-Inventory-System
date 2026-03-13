import React, { useState } from 'react';
import { Search, Plus, Truck, Phone, MapPin, Mail, Edit, Trash2 } from 'lucide-react';
import { suppliers as initialSuppliers } from '../data/mockData';
import FormModal from '../components/FormModal';

const Suppliers = () => {
  const [supplierList, setSupplierList] = useState(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact: '', phone: '', email: '', address: '' });

  const filteredSuppliers = supplierList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ name: supplier.name, contact: supplier.contact, phone: supplier.phone, email: supplier.email, address: supplier.address });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      setSupplierList(supplierList.map(s => s.id === editingSupplier.id ? { ...s, ...formData } : s));
    } else {
      const newSupplier = {
        id: Date.now(),
        ...formData,
        medicines: []
      };
      setSupplierList([...supplierList, newSupplier]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this supplier?')) {
      setSupplierList(supplierList.filter(s => s.id !== id));
    }
  };

  return (
    <div className="suppliers-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Supplier Management</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Supplier
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="search-bar" style={{ width: '100%', maxWidth: '400px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
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
                <th>Supplier Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600', color: '#4A6CF7' }}>{s.name}</td>
                  <td>{s.contact}</td>
                  <td><Phone size={14} style={{ marginRight: '6px' }} />{s.phone}</td>
                  <td><Mail size={14} style={{ marginRight: '6px' }} />{s.email}</td>
                  <td><MapPin size={14} style={{ marginRight: '6px' }} />{s.address}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-button" onClick={() => handleOpenModal(s)} title="Edit"><Edit size={14} /></button>
                      <button className="icon-button" onClick={() => handleDelete(s.id)} style={{ color: '#EF4444' }} title="Delete"><Trash2 size={14} /></button>
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
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Supplier Name</label>
            <input 
              type="text" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Contact Person</label>
            <input 
              type="text" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
              value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Phone</label>
              <input 
                type="text" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Email</label>
              <input 
                type="email" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Address</label>
            <input 
              type="text" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
              value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
            {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Suppliers;
