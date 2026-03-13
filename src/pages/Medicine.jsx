import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Pill } from 'lucide-react';
import { medicines as initialMedicines } from '../data/mockData';
import FormModal from '../components/FormModal';

const Medicine = () => {
  const [productList, setProductList] = useState(initialMedicines);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', description: '' });

  const filteredProducts = productList.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, category: product.category, price: product.price, description: product.description });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', price: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProductList(productList.map(p => p.id === editingProduct.id ? { ...p, ...formData, price: parseFloat(formData.price) } : p));
    } else {
      const newProduct = {
        id: Date.now(),
        ...formData,
        price: parseFloat(formData.price),
        stock: 0,
        status: 'Out of Stock'
      };
      setProductList([...productList, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this product?')) {
      setProductList(productList.filter(p => p.id !== id));
    }
  };

  return (
    <div className="medicine-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>Manage your pharmacy stock and items.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Medicine
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px' }}>
          <div className="search-bar" style={{ width: '100%', maxWidth: '500px' }}>
            <Search size={22} style={{ color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Search medicines by name or batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table style={{ borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '16px 32px' }}>Medicine Info</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Expiry</th>
                <th style={{ textAlign: 'right', paddingRight: '32px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '20px 32px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1E293B' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Batch: {p.batch || 'N/A'}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '6px 16px', 
                      background: '#F1F5F9', 
                      color: '#64748B', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {p.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: p.stock < 10 ? '#EF4444' : '#1E293B' }}>
                      {p.stock} tablets {p.stock < 10 && <span title="Low Stock">⚠️</span>}
                    </div>
                  </td>
                  <td style={{ fontWeight: '700' }}>ETB {p.price.toFixed(2)}</td>
                  <td style={{ color: '#64748B', fontWeight: '500' }}>{p.expiry || 'N/A'}</td>
                  <td style={{ paddingRight: '32px' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button className="icon-button" onClick={() => handleOpenModal(p)} style={{ width: '40px', height: '40px' }}><Edit size={16} /></button>
                      <button className="icon-button" onClick={() => handleDelete(p.id)} style={{ width: '40px', height: '40px', color: '#EF4444' }}><Trash2 size={16} /></button>
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
        title={editingProduct ? 'Edit Medicine' : 'Add New Medicine'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Medicine Name</label>
            <input 
              type="text" required className="search-bar" 
              style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px', fontSize: '1rem' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Category</label>
              <select 
                className="search-bar" 
                style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px', appearance: 'auto' }}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="Syrups">Syrups</option>
                <option value="Injections">Injections</option>
                <option value="Antihypertensives">Antihypertensives</option>
                <option value="Antibiotics">Antibiotics</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Price (ETB)</label>
              <input 
                type="number" required step="0.01" className="search-bar" 
                style={{ width: '100%', background: '#F8FAFC', padding: '14px 20px' }}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>Standard Description</label>
            <textarea 
              rows="3"
              style={{ width: '100%', padding: '16px 20px', borderRadius: '24px', border: 'none', background: '#F8FAFC', outline: 'none', fontStyle: 'inherit', resize: 'none', fontSize: '0.95rem' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '56px', fontSize: '1.05rem', marginTop: '10px' }}>
            {editingProduct ? 'Update Product' : 'Confirm & Add Medicine'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Medicine;
