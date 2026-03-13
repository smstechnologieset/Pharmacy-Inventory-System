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

  const addToCart = (medicine) => {
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
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
    }
  };

  return (
    <div className="sales-page">
      <h1>Sales Terminal</h1>
      
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr', marginTop: '20px' }}>
        {/* Medicine Selection */}
        <div className="card">
          <div className="search-bar" style={{ marginBottom: '20px', width: '100%' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search medicine to sell..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {availableMedicines.map(med => (
              <div 
                key={med.id} 
                className="card" 
                style={{ padding: '12px', cursor: 'pointer', border: '1px solid #f3f4f6', transition: 'all 0.2s' }}
                onClick={() => addToCart(med)}
              >
                <div style={{ fontWeight: '600', marginBottom: '2px', fontSize: '0.9rem' }}>{med.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '8px' }}>{med.category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', color: '#4A6CF7', fontSize: '0.85rem' }}>ETB {med.price}</span>
                  <span style={{ fontSize: '0.7rem', color: med.stock < 20 ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                    {med.stock} LEFT
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart / Checkout */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
            <ShoppingCart size={18} /> Current Invoice
          </h2>
          
          <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
            {cart.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                <ShoppingCart size={32} style={{ marginBottom: '8px', opacity: 0.2 }} />
                <p style={{ fontSize: '0.85rem' }}>No items added</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#F9FAFB', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>ETB {item.price} x {item.quantity}</div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white' }}>
                        <button onClick={(e) => {e.stopPropagation(); updateQuantity(item.id, -1);}} style={{ padding: '2px 6px', border: 'none', background: 'none', cursor: 'pointer' }}><Minus size={12} /></button>
                        <span style={{ padding: '2px 4px', fontSize: '0.8rem', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={(e) => {e.stopPropagation(); updateQuantity(item.id, 1);}} style={{ padding: '2px 6px', border: 'none', background: 'none', cursor: 'pointer' }}><Plus size={12} /></button>
                      </div>
                      <button onClick={(e) => {e.stopPropagation(); removeFromCart(item.id)}} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: '800' }}>
              <span>Total Bill</span>
              <span style={{ color: '#4A6CF7' }}>ETB {total.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              Confirm Sale
            </button>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="card" style={{ marginTop: '24px', padding: '0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} color="#6B7280" />
          <h2 style={{ margin: '0', fontSize: '1rem' }}>Transaction History</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Medicine Name</th>
                <th>Quantity</th>
                <th>Date / Time</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(sale => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: '600' }}>#{sale.id}</td>
                  <td>{sale.item}</td>
                  <td>{sale.quantity}</td>
                  <td>{sale.date} 10:45 AM</td>
                  <td>{sale.payment}</td>
                  <td style={{ fontWeight: '700' }}>ETB {sale.amount.toFixed(2)}</td>
                  <td>
                    <span className="status-badge" style={{ 
                      background: sale.status === 'Delivered' ? '#DEF7EC' : sale.status === 'Pending' ? '#FEF3C7' : '#FDE2E2',
                      color: sale.status === 'Delivered' ? '#03543F' : sale.status === 'Pending' ? '#92400E' : '#9B1C1C'
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

      {/* Mock Receipt (Modal) */}
      {showReceipt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <CheckCircle size={48} color="#10B981" style={{ marginBottom: '16px', marginInline: 'auto' }} />
            <h2 style={{ marginBottom: '8px' }}>Sale Confirmed!</h2>
            <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>The transaction has been recorded.</p>
            
            <div style={{ textAlign: 'left', background: '#F9FAFB', padding: '15px', borderRadius: '10px', marginBlock: '20px', fontSize: '0.8rem' }}>
              <div style={{ borderBottom: '1px dashed #D1D5DB', paddingBottom: '8px', marginBottom: '8px', fontWeight: '800' }}>PHARMACY ETHIOPIA</div>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{item.name} x{item.quantity}</span>
                  <span>ETB {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #D1D5DB', marginTop: '8px', paddingTop: '8px', fontWeight: '800', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>TOTAL</span>
                <span>ETB {lastTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ flex: 1, border: '1px solid #E5E7EB' }} onClick={() => {setShowReceipt(false); setCart([]);}}>Exit</button>
              <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
