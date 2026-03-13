import React, { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle, Clock } from 'lucide-react';
import { medicines, salesData as initialSalesData } from '../data/mockData';

const Sales = () => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactions, setTransactions] = useState(initialSalesData);
  const [lastTotal, setLastTotal] = useState(0);

  const availableMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) && m.stock > 0
  );

  const addToCart = (med) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.quantity < med.stock) {
        setCart(cart.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = 0; 
  const total = subtotal;

  const handleCheckout = () => {
    if (cart.length > 0) {
      const newInvoiceId = Math.floor(8848 + Math.random() * 1000).toString();
      const newTransaction = {
        id: newInvoiceId,
        item: cart.length > 1 ? `${cart[0].name} +${cart.length - 1} more` : cart[0].name,
        date: new Date().toLocaleDateString(),
        quantity: cart.reduce((q, i) => q + i.quantity, 0),
        batch: cart[0].batch || 'N/A',
        status: 'Delivered',
        payment: 'Cash',
        amount: total
      };
      setTransactions([newTransaction, ...transactions]);
      setLastTotal(total);
      setShowReceipt(true);
      setCart([]);
    }
  };

  return (
    <div className="sales-page">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Point of Sale</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Fast and easy checkout terminal.</p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1.8fr 1fr' }}>
        {/* Left: Product Selection */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9' }}>
            <div className="search-bar" style={{ width: '100%', maxWidth: '450px' }}>
              <Search size={22} style={{ color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="Search products by name or batch..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', maxHeight: '600px', overflowY: 'auto' }}>
            {availableMedicines.map(med => (
              <div 
                key={med.id} 
                className="card" 
                style={{ 
                  padding: '20px', 
                  cursor: 'pointer', 
                  border: '1px solid #F1F5F9',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                  textAlign: 'center'
                }}
                onClick={() => addToCart(med)}
              >
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '16px', 
                  background: '#F0FDFA', 
                  color: '#0D9488', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <ShoppingCart size={24} />
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px', height: '40px', overflow: 'hidden' }}>{med.name}</div>
                <div style={{ color: '#0D9488', fontWeight: '800', marginBottom: '8px', fontSize: '0.9rem' }}>ETB {med.price.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: med.stock < 10 ? '#EF4444' : '#94A3B8' }}>{med.stock} units left</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cart Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', maxHeight: '780px' }}>
          <div style={{ padding: '24px 32px', background: 'var(--primary)', color: 'white' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Current Cart</h2>
            <p style={{ fontSize: '0.75rem', opacity: '0.9' }}>{cart.length} unique items</p>
          </div>
          
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
                <ShoppingCart size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Your cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>ETB {item.price.toFixed(2)} x {item.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '4px', borderRadius: '12px' }}>
                    <button className="icon-button" style={{ width: '28px', height: '28px', borderRadius: '8px' }} onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                    <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button className="icon-button" style={{ width: '28px', height: '28px', borderRadius: '8px' }} onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ padding: '8px', border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '32px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748B' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: '600' }}>ETB {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.15rem', fontWeight: '800' }}>
              <span>Total</span>
              <span>ETB {total.toLocaleString()}</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', height: '52px', fontSize: '1rem' }}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Confirm Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Sales History Table (Refined) */}
      <div className="card" style={{ marginTop: '32px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Transaction History</h2>
          <div className="tabs" style={{ padding: '4px' }}>
            <div className="tab active">Completed</div>
            <div className="tab">On Hold</div>
          </div>
        </div>
        <div className="table-container">
          <table style={{ borderSpacing: '0' }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                <th style={{ padding: '16px 32px' }}>Invoice</th>
                <th>Medicine / Product</th>
                <th>Qty</th>
                <th>Date / Time</th>
                <th>Payment</th>
                <th>Amount</th>
                <th style={{ paddingRight: '32px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(sale => (
                <tr key={sale.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ fontWeight: '700', color: 'var(--primary)', padding: '20px 32px' }}>#{sale.id}</td>
                  <td>{sale.item}</td>
                  <td>{sale.quantity}</td>
                  <td>
                    <div>{sale.date}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>10:45 AM</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <CheckCircle size={14} color="#10B981" /> {sale.payment}
                    </div>
                  </td>
                  <td style={{ fontWeight: '800' }}>ETB {sale.amount.toLocaleString()}</td>
                  <td style={{ paddingRight: '32px' }}>
                    <span className="status-badge" style={{ 
                      background: sale.status === 'Delivered' ? '#ECFDF5' : '#FFFBEB',
                      color: sale.status === 'Delivered' ? '#059669' : '#D97706'
                    }}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal (Refined) */}
      {showReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Payment Success!</h2>
              <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '4px' }}>Invoice has been generated.</p>
            </div>
            
            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', marginBottom: '32px' }}>
              <div style={{ borderBottom: '1px dashed #D1D5DB', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>Invoice ID</span>
                  <span style={{ fontWeight: '700' }}>#8848</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>Date</span>
                  <span style={{ fontWeight: '700' }}>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1rem' }}>
                <span>TOTAL PAID</span>
                <span style={{ color: 'var(--primary)' }}>ETB {lastTotal.toLocaleString()}</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', height: '56px' }} onClick={() => setShowReceipt(false)}>
              <Printer size={20} /> Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
