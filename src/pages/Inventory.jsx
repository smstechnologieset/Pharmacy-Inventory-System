import React, { useState } from 'react';
import { Search, Plus, Filter, AlertCircle, X, Edit, Trash2 } from 'lucide-react';
import { medicines as initialMedicines } from '../data/mockData';
import FormModal from '../components/FormModal';

const Inventory = () => {
  const [stockList, setStockList] = useState(initialMedicines);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', batch: '', expiry: '', stock: '' });

  const filteredMedicines = stockList.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    med.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, batch: item.batch, expiry: item.expiry, stock: item.stock });
    } else {
      setEditingItem(null);
      setFormData({ name: '', batch: '', expiry: '', stock: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      setStockList(stockList.map(s => s.id === editingItem.id ? { ...s, ...formData, stock: parseInt(formData.stock) } : s));
    } else {
      const newItem = {
        id: Date.now(),
        ...formData,
        stock: parseInt(formData.stock),
        price: 0,
        category: 'Unknown',
        supplier: 'New Supplier',
        status: parseInt(formData.stock) > 50 ? 'In Stock' : 'Low Stock'
      };
      setStockList([...stockList, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this stock entry?')) {
      setStockList(stockList.filter(s => s.id !== id));
    }
  };

  return (
    <div className="inventory-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Inventory & Stock</h1>
        <button className="btn btn-primary" onClick={() => handleOpenForm()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add Inventory
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or batch..." 
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
                <th>Medicine Name</th>
                <th>Batch No</th>
                <th>Stock Qty</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map((med) => (
                <tr key={med.id} onClick={() => setSelectedMed(med)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: '600', color: '#4A6CF7' }}>{med.name}</td>
                  <td>{med.batch}</td>
                  <td>{med.stock}</td>
                  <td style={{ color: new Date(med.expiry) < new Date() ? '#EF4444' : 'inherit' }}>{med.expiry}</td>
                  <td>
                    <span className="status-badge" style={{ 
                      background: med.stock === 0 ? '#FDE2E2' : med.stock < 50 ? '#FEF3C7' : '#DEF7EC',
                      color: med.stock === 0 ? '#9B1C1C' : med.stock < 50 ? '#92400E' : '#03543F'
                    }}>
                      {med.stock === 0 ? 'Out of Stock' : med.stock < 50 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-button" onClick={() => handleOpenForm(med)} title="Edit"><Edit size={14} /></button>
                      <button className="icon-button" onClick={() => handleDelete(med.id)} style={{ color: '#EF4444' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedMed && !isModalOpen && (
        <div className="modal-overlay" onClick={() => setSelectedMed(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedMed(null)} style={{ position: 'absolute', right: '20px', top: '20px', border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <h2>{selectedMed.name} Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div><label style={{ fontSize: '0.75rem', color: '#6B7280' }}>Batch Number</label><p>{selectedMed.batch}</p></div>
              <div><label style={{ fontSize: '0.75rem', color: '#6B7280' }}>Expiry Date</label><p>{selectedMed.expiry}</p></div>
              <div><label style={{ fontSize: '0.75rem', color: '#6B7280' }}>Supplier</label><p>{selectedMed.supplier}</p></div>
              <div><label style={{ fontSize: '0.75rem', color: '#6B7280' }}>Current Stock</label><p>{selectedMed.stock} units</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Edit Stock' : 'Add New Inventory'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Medicine Name</label>
            <input 
              type="text" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Batch No</label>
              <input 
                type="text" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
                value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Stock Qty</label>
              <input 
                type="number" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
                value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Expiry Date</label>
            <input 
              type="date" required className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal', appearance: 'auto' }}
              value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
            {editingItem ? 'Update Stock' : 'Confirm Stock'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Inventory;
