import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProductList(productList.filter(p => p.id !== id));
    }
  };

  return (
    <div className="medicine-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Medicine Management</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add New Medicine
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search products..." 
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
                <th>Product Name</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>Standard Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '600', color: '#4A6CF7' }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td style={{ fontWeight: '700' }}>ETB {p.price.toFixed(2)}</td>
                  <td style={{ color: '#6B7280', fontSize: '0.8rem' }}>{p.description || 'No description'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-button" onClick={() => handleOpenModal(p)} title="Edit"><Edit size={14} /></button>
                      <button className="icon-button" onClick={() => handleDelete(p.id)} style={{ color: '#EF4444' }} title="Delete"><Trash2 size={14} /></button>
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
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Medicine Name</label>
            <input 
              type="text" 
              required
              className="btn" 
              style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Category</label>
              <select 
                className="btn" 
                style={{ width: '100%', border: '1px solid #E5E7EB', appearance: 'auto', background: 'white' }}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="Syrups">Syrups</option>
                <option value="Injections">Injections</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Price (ETB)</label>
              <input 
                type="number" 
                required
                step="0.01"
                className="btn" 
                style={{ width: '100%', border: '1px solid #E5E7EB', textAlign: 'left', fontWeight: 'normal' }}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Description</label>
            <textarea 
              rows="3"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', outline: 'none', fontStyle: 'inherit' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
            {editingProduct ? 'Update Medicine' : 'Add Medicine'}
          </button>
        </form>
      </FormModal>
    </div>
  );
};

export default Medicine;
