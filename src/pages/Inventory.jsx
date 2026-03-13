import React, { useState } from 'react';
import { Search, Plus, Filter, AlertCircle, X, Edit, Trash2, Box } from 'lucide-react';
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
        category: 'General',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Inventory & Stock</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>Monitor batches and precise stock levels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={20} /> Add Stock
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px' }}>
          <div className="search-bar" style={{ width: '100%', maxWidth: '500px' }}>
            <Search size={22} style={{ color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Search by name or batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '16px 32px' }}>Medicine Name</th>
                <th>Batch No</th>
                <th>Quantity</th>
                <th>Expiry</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '32px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map((med) => (
                <tr key={med.id} onClick={() => setSelectedMed(med)} style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '20px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box size={20} />
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>{med.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#64748B' }}>{med.batch}</td>
                  <td style={{ fontWeight: '700' }}>{med.stock} units</td>
                  <td style={{ color: new Date(med.expiry) < new Date() ? '#EF4444' : '#64748B', fontWeight: '500' }}>{med.expiry}</td>
                  <td>
                    <span className="status-badge" style={{ 
                      background: med.stock === 0 ? '#FEE2E2' : med.stock < 50 ? '#FEF3C7' : '#ECFDF5',
                      color: med.stock === 0 ? '#B91C1C' : med.stock < 50 ? '#92400E' : '#059669',
                      fontSize: '0.75rem'
                    }}>
                      {med.stock === 0 ? 'Out of Stock' : med.stock < 50 ? 'Low Stock' : 'Healthy'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{ paddingRight: '32px' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button className="icon-button" onClick={() => handleOpenForm(med)} style={{ width: '40px', height: '40px' }}><Edit size={16} /></button>
                      <button className="icon-button" onClick={() => handleDelete(med.id)} style={{ width: '40px', height: '40px', color: '#EF4444' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Popup */}
      {selectedMed && !isModalOpen && (
        <div className="modal-overlay" onClick={() => setSelectedMed(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedMed(null)} style={{ position: 'absolute', right: '30px', top: '30px', border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={24} /></button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>Batch Details</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Detailed information for {selectedMed.name}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '24px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Batch Number</label>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedMed.batch}</p>
              </div>
              <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '24px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Expiry Date</label>
                <p style={{ fontWeight: '700', fontSize: '1.1rem', color: new Date(selectedMed.expiry) < new Date() ? '#EF4444' : 'inherit' }}>{selectedMed.expiry}</p>
              </div>
              <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '24px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Supplier</label>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedMed.supplier}</p>
              </div>
              <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '24px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Current Stock</label>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedMed.stock} units</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Update Stock' : 'Add New Inventory'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Medicine Name</label>
            <input 
              type="text" required className="search-bar" style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px' }}
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Batch No</label>
              <input 
                type="text" required className="search-bar" style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px' }}
                value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Stock Qty</label>
              <input 
                type="number" required className="search-bar" style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px' }}
                value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Expiry Date</label>
            <input 
              type="date" required className="search-bar" style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px', appearance: 'auto' }}
              value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '56px', fontSize: '1.05rem', marginTop: '10px' }}>
            {editingItem ? 'Update Stock Level' : 'Confirm Stock Arrival'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Inventory;
