import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';

export default function Orders({ currency, showToast }) {
  const { user, getToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const token = getToken();
    axios.get('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setOrders(res.data.orders))
    .catch(err => {
      console.error(err);
      showToast('Failed to load orders');
    })
    .finally(() => setLoading(false));
  }, [user, getToken, showToast]);

  if (!user) {
    return (
      <div className="container" style={{padding:'100px 20px', textAlign:'center', fontFamily:'Jost'}}>
        <h2>Please login to view your orders</h2>
      </div>
    );
  }

  return (
    <div className="container" style={{padding:'80px 20px', minHeight:'60vh', fontFamily:'Jost,sans-serif'}}>
      <h2 style={{marginBottom:'30px', fontSize:'2rem', fontWeight:700}}>My Orders</h2>
      
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px 20px', background:'#f9f9f9', borderRadius:'10px'}}>
          <span style={{fontSize:'3rem'}}>📦</span>
          <p style={{marginTop:'10px', fontSize:'1.1rem', color:'#666'}}>You have no orders yet.</p>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          {orders.map(order => (
            <div key={order.id} style={{
              border:'1px solid #eee', borderRadius:'10px', padding:'20px',
              display:'flex', flexDirection:'column', gap:'15px', background:'#fff',
              boxShadow:'0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f0f0f0', paddingBottom:'15px', flexWrap:'wrap', gap:'10px'}}>
                <div>
                  <p style={{margin:0, fontSize:'0.85rem', color:'#888'}}>Order ID</p>
                  <p style={{margin:0, fontWeight:700, color:'#1a1a1a'}}>{order.midtrans_order_id}</p>
                </div>
                <div>
                  <p style={{margin:0, fontSize:'0.85rem', color:'#888'}}>Date</p>
                  <p style={{margin:0, fontWeight:600}}>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p style={{margin:0, fontSize:'0.85rem', color:'#888'}}>Amount</p>
                  <p style={{margin:0, fontWeight:800, color:'#e53935'}}>{formatPrice(order.gross_amount_idr / 20500, currency)}</p>
                </div>
                <div>
                  <span style={{
                    padding:'6px 14px', borderRadius:'50px', fontSize:'0.85rem', fontWeight:700,
                    background: order.status === 'success' ? '#e8f5e9' : order.status === 'pending' ? '#fff3e0' : '#ffebee',
                    color: order.status === 'success' ? '#2e7d32' : order.status === 'pending' ? '#ef6c00' : '#c62828'
                  }}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <p style={{margin:0, fontSize:'0.9rem', color:'#555'}}><strong>Items:</strong> {order.items_summary || 'No items found'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
