import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';

export default function AdminDashboard({ currency, showToast }) {
  const { user, getToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data.products))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{padding:'100px 20px', textAlign:'center', fontFamily:'Jost'}}>
        <h2>Forbidden: You do not have admin access.</h2>
      </div>
    );
  }

  const handleEdit = (prod) => {
    setFormData({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      original_price: prod.original_price || '',
      image: prod.image,
      badge_label: prod.badge_label || '',
      badge_color: prod.badge_color || '',
      categories: typeof prod.categories === 'string' ? JSON.parse(prod.categories).join(', ') : (prod.categories||[]).join(', '),
      tags: typeof prod.tags === 'string' ? JSON.parse(prod.tags).join(', ') : (prod.tags||[]).join(', ')
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      showToast('Product deleted');
      fetchProducts();
    } catch (err) {
      showToast('Error deleting product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      categories: formData.categories.split(',').map(s=>s.trim()).filter(Boolean),
      tags: formData.tags.split(',').map(s=>s.trim()).filter(Boolean)
    };
    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/products/${formData.id}`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        showToast('Product updated');
      } else {
        await axios.post(`http://localhost:5000/api/products`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        showToast('Product created');
      }
      setFormData(null);
      fetchProducts();
    } catch (err) {
      showToast('Error saving product');
    }
  };

  return (
    <div className="container" style={{padding:'80px 20px', minHeight:'60vh', fontFamily:'Jost,sans-serif'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <h2 style={{fontSize:'2rem', fontWeight:700}}>Admin Dashboard</h2>
        {!formData && (
          <button 
            onClick={() => setFormData({ name:'', price:'', original_price:'', image:'/assets/images/product-1.jpg', badge_label:'', badge_color:'', categories:'', tags:'' })}
            style={{background:'#1a1a1a', color:'#fff', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600}}
          >
            + Add New Product
          </button>
        )}
      </div>

      {formData ? (
        <div style={{background:'#f9f9f9', padding:'30px', borderRadius:'10px', marginBottom:'40px'}}>
          <h3 style={{marginBottom:'20px'}}>{formData.id ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
            <input placeholder="Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
            <div style={{display:'flex', gap:'15px'}}>
              <input type="number" step="0.01" placeholder="Price (GBP)" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} required style={{flex:1, padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
              <input type="number" step="0.01" placeholder="Original Price (GBP)" value={formData.original_price} onChange={e=>setFormData({...formData, original_price:e.target.value})} style={{flex:1, padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
            </div>
            <input placeholder="Image URL (e.g. /assets/images/product-1.jpg)" value={formData.image} onChange={e=>setFormData({...formData, image:e.target.value})} required style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
            <div style={{display:'flex', gap:'15px'}}>
              <input placeholder="Badge Label (e.g. New, -25%)" value={formData.badge_label} onChange={e=>setFormData({...formData, badge_label:e.target.value})} style={{flex:1, padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
              <input placeholder="Badge Color (e.g. red, green)" value={formData.badge_color} onChange={e=>setFormData({...formData, badge_color:e.target.value})} style={{flex:1, padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
            </div>
            <input placeholder="Categories (comma separated, e.g. best-seller, trendy)" value={formData.categories} onChange={e=>setFormData({...formData, categories:e.target.value})} required style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
            <input placeholder="Tags (comma separated, e.g. shirt, men)" value={formData.tags} onChange={e=>setFormData({...formData, tags:e.target.value})} required style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}/>
            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
              <button type="submit" style={{background:'#4caf50', color:'#fff', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600}}>Save Product</button>
              <button type="button" onClick={() => setFormData(null)} style={{background:'#ccc', color:'#333', padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:600}}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
          <thead>
            <tr style={{background:'#f0f0f0', borderBottom:'2px solid #ddd'}}>
              <th style={{padding:'12px'}}>ID</th>
              <th style={{padding:'12px'}}>Image</th>
              <th style={{padding:'12px'}}>Name</th>
              <th style={{padding:'12px'}}>Price</th>
              <th style={{padding:'12px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{padding:'20px', textAlign:'center'}}>Loading products...</td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{borderBottom:'1px solid #eee'}}>
                <td style={{padding:'12px'}}>{p.id}</td>
                <td style={{padding:'12px'}}><img src={p.image} alt={p.name} style={{width:'50px', height:'50px', objectFit:'cover', borderRadius:'6px'}}/></td>
                <td style={{padding:'12px', fontWeight:600}}>{p.name}</td>
                <td style={{padding:'12px'}}>{formatPrice(p.price, currency)}</td>
                <td style={{padding:'12px'}}>
                  <button onClick={() => handleEdit(p)} style={{background:'#ff9800', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'4px', marginRight:'8px', cursor:'pointer'}}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{background:'#f44336', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer'}}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
