import React from 'react';
import { X } from 'lucide-react';

const FormModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '700px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Sticky header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '28px 36px 20px',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}
          >
            <X size={24} />
          </button>
        </div>
        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '28px 36px 36px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};


export default FormModal;
