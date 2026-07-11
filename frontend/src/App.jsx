import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import AuthModal from './components/AuthModal.jsx';
import ChatWidget from './components/ChatWidget.jsx';

// ─── Currency Config ──────────────────────────────────────────────────────────
// Base price adalah GBP (£). Rate konversi ke USD dan IDR
const RATES   = { GBP: 1, USD: 1.27, IDR: 20500 };
const SYMBOLS  = { GBP: '£', USD: '$', IDR: 'Rp' };
const LOCALES  = { GBP: 'en-GB', USD: 'en-US', IDR: 'id-ID' };

function formatPrice(gbpAmount, currency) {
  const converted = gbpAmount * RATES[currency];
  if (currency === 'IDR') {
    return 'Rp ' + Math.round(converted).toLocaleString('id-ID');
  }
  return SYMBOLS[currency] + converted.toFixed(2);
}

// ─── Product Data ─────────────────────────────────────────────────────────────
// Kategori: 'all' | 'best-seller' | 'hot-collection' | 'trendy' | 'new-arrival'
const PRODUCTS = [
  { id:1,  name:'Varsi Leather Bag',           price:48.75, originalPrice:65.00, image:'/assets/images/product-1.jpg',  badge:{label:'-25%',color:'red'},   category:['best-seller','hot-collection'], tags:['bag','leather'] },
  { id:2,  name:'Fit Twill Shirt for Woman',   price:62.00, originalPrice:null,  image:'/assets/images/product-2.jpg',  badge:{label:'New',color:'green'},  category:['new-arrival'],                  tags:['shirt','woman'] },
  { id:3,  name:'Grand Atlantic Chukka Boots', price:32.00, originalPrice:null,  image:'/assets/images/product-3.jpg',  badge:null,                         category:['best-seller'],                  tags:['boots','shoes'] },
  { id:4,  name:"Women's Faux-Trim Shirt",     price:84.00, originalPrice:null,  image:'/assets/images/product-4.jpg',  badge:null,                         category:['hot-collection','trendy'],      tags:['shirt','woman'] },
  { id:5,  name:'Soft Touch Interlock Polo',   price:45.00, originalPrice:null,  image:'/assets/images/product-5.jpg',  badge:null,                         category:['trendy'],                       tags:['polo','shirt'] },
  { id:6,  name:'Casmart Smart Watch',         price:30.00, originalPrice:38.00, image:'/assets/images/product-6.jpg',  badge:null,                         category:['best-seller','trendy'],         tags:['watch','accessories'] },
  { id:7,  name:'Casmart Smart Glass',         price:25.00, originalPrice:39.00, image:'/assets/images/product-7.jpg',  badge:null,                         category:['hot-collection'],               tags:['glasses','accessories'] },
  { id:8,  name:'Cotton Shirt for Men',        price:85.00, originalPrice:99.00, image:'/assets/images/product-8.jpg',  badge:null,                         category:['best-seller'],                  tags:['shirt','men'] },
  { id:9,  name:'Double-breasted Blazer',      price:32.00, originalPrice:null,  image:'/assets/images/product-9.jpg',  badge:null,                         category:['trendy','hot-collection'],      tags:['blazer','men'] },
  { id:10, name:'Ribbed Cotton Bodysuits',     price:71.00, originalPrice:null,  image:'/assets/images/product-10.jpg', badge:{label:'New',color:'green'},  category:['new-arrival','trendy'],         tags:['bodysuit','woman'] },
];

const FILTERS = [
  { key:'all',           label:'All Products' },
  { key:'best-seller',   label:'Best Seller'    },
  { key:'hot-collection',label:'Hot Collection' },
  { key:'trendy',        label:'Trendy'         },
  { key:'new-arrival',   label:'New Arrival'    },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, show }) {
  return (
    <div style={{
      position:'fixed', bottom:'2rem', left:'50%',
      transform: show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(150px)',
      background:'#1a1a1a', color:'#fff', padding:'13px 26px', borderRadius:'50px',
      fontFamily:'Jost,sans-serif', fontSize:'0.9rem', fontWeight:500,
      boxShadow:'0 8px 32px rgba(0,0,0,0.35)', transition:'transform 0.35s cubic-bezier(.4,0,.2,1)',
      zIndex:99999, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'10px',
    }}>
      <span style={{color:'#4caf50',fontSize:'1.15rem'}}>✓</span>
      {message}
    </div>
  );
}

// ─── Currency Switcher ────────────────────────────────────────────────────────
function CurrencySwitcher({ currency, onChange }) {
  const OPTIONS = ['USD','IDR'];
  return (
    <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
      {OPTIONS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            padding:'4px 12px', borderRadius:'20px', border:'1.5px solid',
            borderColor: currency === c ? '#1a1a1a' : '#ddd',
            background: currency === c ? '#1a1a1a' : 'transparent',
            color: currency === c ? '#fff' : '#666',
            fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:'0.78rem',
            cursor:'pointer', transition:'all 0.2s', letterSpacing:'0.5px'
          }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// ─── Quick View Modal ────────────────────────────────────────────────────────
function QuickView({ product, onClose, onAddToCart, currency }) {
  if (!product) return null;
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:10000,transition:'opacity 0.3s'}} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', borderRadius:'16px', zIndex:10001, width:'90%', maxWidth:'700px',
        display:'flex', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.3)',
        fontFamily:'Jost,sans-serif', maxHeight:'90vh',
      }}>
        <img src={product.image} alt={product.name} style={{width:'45%',objectFit:'cover',flexShrink:0}} />
        <div style={{padding:'32px',flex:1,overflowY:'auto'}}>
          {product.badge && (
            <span style={{background: product.badge.color==='red'?'#e53935':'#4caf50', color:'#fff', padding:'3px 12px', borderRadius:'4px', fontSize:'0.78rem', fontWeight:700}}>
              {product.badge.label}
            </span>
          )}
          <h2 style={{margin:'12px 0 8px',fontSize:'1.4rem',fontWeight:700,color:'#1a1a1a'}}>{product.name}</h2>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
            <span style={{fontSize:'1.5rem',fontWeight:800,color:'#e53935'}}>{formatPrice(product.price, currency)}</span>
            {product.originalPrice && <span style={{fontSize:'1rem',color:'#bbb',textDecoration:'line-through'}}>{formatPrice(product.originalPrice, currency)}</span>}
          </div>
          <p style={{color:'#666',lineHeight:1.7,marginBottom:'24px',fontSize:'0.95rem'}}>
            Premium quality {product.name.toLowerCase()} crafted with the finest materials. 
            Designed for everyday wear and timeless style. Available in multiple sizes.
          </p>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'24px'}}>
            {['XS','S','M','L','XL'].map(s => (
              <button key={s} style={{width:'44px',height:'44px',border:'1.5px solid #e0e0e0',borderRadius:'8px',background:'#fff',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',color:'#333',transition:'all 0.2s',fontFamily:'Jost,sans-serif'}}
                onMouseEnter={e=>{e.target.style.borderColor='#1a1a1a';e.target.style.background='#1a1a1a';e.target.style.color='#fff';}}
                onMouseLeave={e=>{e.target.style.borderColor='#e0e0e0';e.target.style.background='#fff';e.target.style.color='#333';}}
              >{s}</button>
            ))}
          </div>
          <button
            onClick={() => { onAddToCart(product); onClose(); }}
            style={{width:'100%',padding:'14px',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:'8px',fontFamily:'Jost,sans-serif',fontWeight:700,fontSize:'1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}
          >
            🛒 Add to Cart
          </button>
        </div>
        <button onClick={onClose} style={{position:'absolute',top:'16px',right:'16px',background:'rgba(0,0,0,0.1)',border:'none',borderRadius:'50%',width:'36px',height:'36px',cursor:'pointer',fontSize:'1.1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      </div>
    </>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ isOpen, onClose, cart, onUpdateQty, onRemove, onCheckout, isLoading, currency, onCurrencyChange }) {
  const total      = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9998,opacity:isOpen?1:0,pointerEvents:isOpen?'all':'none',transition:'opacity 0.3s ease'}} />

      {/* Drawer Panel */}
      <div style={{
        position:'fixed',top:0,right:0,height:'100dvh',width:'100%',maxWidth:'430px',
        background:'#fff',zIndex:9999,display:'flex',flexDirection:'column',
        transform:isOpen?'translateX(0)':'translateX(100%)',
        transition:'transform 0.35s cubic-bezier(.4,0,.2,1)',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.15)',fontFamily:'Jost,sans-serif',
      }}>

        {/* Header */}
        <div style={{padding:'18px 24px',borderBottom:'1px solid #f0f0f0'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <h2 style={{margin:0,fontSize:'1.15rem',fontWeight:700,color:'#1a1a1a'}}>Shopping Cart</h2>
              <span style={{background:'#1a1a1a',color:'#fff',borderRadius:'50px',padding:'2px 10px',fontSize:'0.75rem',fontWeight:700}}>{totalItems}</span>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.4rem',color:'#888',lineHeight:1}}>✕</button>
          </div>
          {/* Currency Switcher */}
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'0.8rem',color:'#999',fontWeight:600}}>Currency:</span>
            <CurrencySwitcher currency={currency} onChange={onCurrencyChange} />
          </div>
        </div>

        {/* Items */}
        <div style={{flex:1,overflowY:'auto',padding:'8px 24px'}}>
          {cart.length === 0 ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:'16px',color:'#bbb',paddingBottom:'60px'}}>
              <span style={{fontSize:'4.5rem'}}>🛒</span>
              <p style={{fontSize:'1rem',margin:0,fontWeight:600,color:'#aaa'}}>Your cart is empty</p>
              <p style={{fontSize:'0.85rem',margin:0,color:'#ccc',textAlign:'center'}}>Add items to get started!</p>
              <button onClick={onClose} style={{background:'#1a1a1a',color:'#fff',border:'none',padding:'11px 28px',borderRadius:'8px',cursor:'pointer',fontFamily:'Jost,sans-serif',fontWeight:700,fontSize:'0.9rem',marginTop:'8px'}}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{display:'flex',gap:'14px',padding:'18px 0',borderBottom:'1px solid #f5f5f5',alignItems:'flex-start'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <img src={item.image} alt={item.name} style={{width:'76px',height:'96px',objectFit:'cover',borderRadius:'10px',background:'#f5f5f5'}} />
                  <button
                    onClick={() => onRemove(item.id)}
                    title="Remove"
                    style={{position:'absolute',top:'-8px',right:'-8px',background:'#ff5252',color:'#fff',border:'none',borderRadius:'50%',width:'22px',height:'22px',cursor:'pointer',fontSize:'0.65rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}
                  >✕</button>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:'0 0 4px',fontWeight:600,fontSize:'0.9rem',color:'#1a1a1a',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{item.name}</p>
                  <p style={{margin:'0 0 12px',color:'#e53935',fontWeight:700,fontSize:'0.95rem'}}>{formatPrice(item.price, currency)}</p>
                  {/* Qty Stepper */}
                  <div style={{display:'flex',alignItems:'center',gap:'0'}}>
                    <button onClick={() => onUpdateQty(item.id, item.qty-1)} style={{width:'30px',height:'30px',background:'#f5f5f5',border:'1px solid #e0e0e0',borderRight:'none',borderRadius:'6px 0 0 6px',cursor:'pointer',fontSize:'1.1rem',color:'#333',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.2s'}}>−</button>
                    <span style={{width:'38px',height:'30px',border:'1px solid #e0e0e0',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.9rem',color:'#1a1a1a'}}>
                      {item.qty}
                    </span>
                    <button onClick={() => onUpdateQty(item.id, item.qty+1)} style={{width:'30px',height:'30px',background:'#f5f5f5',border:'1px solid #e0e0e0',borderLeft:'none',borderRadius:'0 6px 6px 0',cursor:'pointer',fontSize:'1.1rem',color:'#333',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.2s'}}>+</button>
                  </div>
                </div>
                <p style={{fontWeight:800,color:'#1a1a1a',margin:0,flexShrink:0,fontSize:'0.95rem'}}>{formatPrice(item.price*item.qty, currency)}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{padding:'20px 24px',borderTop:'1px solid #f0f0f0',background:'#fafafa'}}>
            <div style={{background:'#fff',borderRadius:'10px',padding:'14px 16px',marginBottom:'16px',border:'1px solid #f0f0f0'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'0.88rem',color:'#888'}}>
                <span>Subtotal ({totalItems} item{totalItems>1?'s':''})</span>
                <span style={{fontWeight:700,color:'#1a1a1a'}}>{formatPrice(total, currency)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px',fontSize:'0.85rem',color:'#aaa'}}>
                <span>Shipping</span>
                <span style={{color:'#4caf50',fontWeight:700}}>FREE</span>
              </div>
              <div style={{height:'1px',background:'#f0f0f0',marginBottom:'10px'}} />
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'1.05rem',fontWeight:800,color:'#1a1a1a'}}>
                <span>Total</span>
                <span style={{color:'#e53935'}}>{formatPrice(total, currency)}</span>
              </div>
              {currency !== 'GBP' && (
                <p style={{margin:'8px 0 0',fontSize:'0.75rem',color:'#bbb',textAlign:'right'}}>
                  ≈ {formatPrice(total, 'GBP')} original price
                </p>
              )}
            </div>

            <button
              id="checkout-btn"
              onClick={onCheckout}
              disabled={isLoading}
              style={{
                width:'100%',padding:'15px',background:isLoading?'#aaa':'#1a1a1a',color:'#fff',
                border:'none',borderRadius:'10px',fontFamily:'Jost,sans-serif',
                fontWeight:700,fontSize:'1rem',cursor:isLoading?'not-allowed':'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',
                transition:'background 0.2s, transform 0.1s',
              }}
              onMouseEnter={e=>{if(!isLoading)e.target.style.background='#333';}}
              onMouseLeave={e=>{if(!isLoading)e.target.style.background='#1a1a1a';}}
            >
              {isLoading ? <>⏳ Processing...</> : <>💳 Checkout via Midtrans</>}
            </button>
            <p style={{textAlign:'center',fontSize:'0.75rem',color:'#ccc',marginTop:'10px',marginBottom:0}}>
              🔒 Secure payment · Powered by Midtrans
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, onQuickView, wishlist, onToggleWishlist, currency }) {
  const [added, setAdded] = useState(false);
  const isWished = wishlist.includes(product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <li>
      <div className="product-card">
        <figure className="card-banner">
          <a href="#" onClick={e=>{e.preventDefault();onQuickView(product);}}>
            <img src={product.image} alt={product.name} loading="lazy" width="800" height="1034" className="w-100" />
          </a>
          {product.badge && <div className={`card-badge ${product.badge.color}`}>{product.badge.label}</div>}
          <div className="card-actions">
            <button className="card-action-btn" aria-label="Quick view" onClick={()=>onQuickView(product)} title="Quick View">
              <ion-icon name="eye-outline"></ion-icon>
            </button>
            <button
              className="card-action-btn cart-btn"
              onClick={handleAdd}
              style={{background: added ? '#4caf50' : undefined, transition:'background 0.3s'}}
            >
              <ion-icon name={added ? 'checkmark-outline' : 'bag-handle-outline'} aria-hidden="true"></ion-icon>
              <p>{added ? 'Added!' : 'Add to Cart'}</p>
            </button>
            <button
              className="card-action-btn"
              aria-label="Toggle Wishlist"
              onClick={()=>onToggleWishlist(product.id)}
              title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
              style={{color: isWished ? '#e53935' : undefined, transition:'color 0.2s'}}
            >
              <ion-icon name={isWished ? 'heart' : 'heart-outline'}></ion-icon>
            </button>
          </div>
        </figure>
        <div className="card-content">
          <h3 className="h4 card-title">
            <a href="#" onClick={e=>{e.preventDefault();onQuickView(product);}}>{product.name}</a>
          </h3>
          <div className="card-price">
            <data value={product.price}>{formatPrice(product.price, currency)}</data>
            {product.originalPrice && <data value={product.originalPrice}>{formatPrice(product.originalPrice, currency)}</data>}
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout, getToken }    = useAuth();
  const [cart,         setCart]         = useState([]);
  const [wishlist,     setWishlist]     = useState([]);
  const [cartOpen,     setCartOpen]     = useState(false);
  const [authOpen,     setAuthOpen]     = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [toast,        setToast]        = useState({ show:false, msg:'' });
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [quickView,    setQuickView]    = useState(null);
  const [currency,     setCurrency]     = useState('IDR');
  const navRef   = useRef(null);
  const overlayRef = useRef(null);

  // ── Mobile Nav ──────────────────────────────────────────────────────────
  useEffect(() => {
    const openBtn  = document.querySelector('[data-nav-open-btn]');
    const closeBtn = document.querySelector('[data-nav-close-btn]');
    const overlay  = document.querySelector('[data-overlay]');
    const nav      = document.querySelector('[data-navbar]');

    const open  = () => { nav?.classList.add('active'); overlay?.classList.add('active'); document.body.style.overflow='hidden'; };
    const close = () => { nav?.classList.remove('active'); overlay?.classList.remove('active'); document.body.style.overflow=''; };

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    return () => {
      openBtn?.removeEventListener('click', open);
      closeBtn?.removeEventListener('click', close);
      overlay?.removeEventListener('click', close);
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast({ show:true, msg });
    setTimeout(() => setToast(t=>({...t, show:false})), 2800);
  };

  // ── Cart Actions ─────────────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===product.id);
      if (ex) return prev.map(i=>i.id===product.id ? {...i, qty:i.qty+1} : i);
      return [...prev, {...product, qty:1}];
    });
    showToast(`"${product.name}" added to cart!`);
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) { setCart(prev=>prev.filter(i=>i.id!==id)); return; }
    setCart(prev=>prev.map(i=>i.id===id?{...i, qty}:i));
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev=>prev.filter(i=>i.id!==id));
    showToast('Item removed from cart');
  }, []);

  const toggleWishlist = useCallback((id) => {
    setWishlist(prev => {
      if (prev.includes(id)) { showToast('Removed from wishlist'); return prev.filter(x=>x!==id); }
      showToast('Added to wishlist! ❤️'); return [...prev, id];
    });
  }, []);

  // ── Filtered Products ────────────────────────────────────────────────────
  const filteredProducts = PRODUCTS.filter(p => {
    const matchFilter = activeFilter === 'all' || p.category.includes(activeFilter);
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t=>t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFilter && matchSearch;
  });

  // ── Counts ───────────────────────────────────────────────────────────────
  const totalItems = cart.reduce((s,i)=>s+i.qty, 0);
  const totalPrice = cart.reduce((s,i)=>s+i.price*i.qty, 0);

  // ── Checkout ─────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    // ── Guard: must be logged in ─────────────────────────────────────
    if (!user) {
      setCartOpen(false);
      setAuthOpen(true);
      showToast('Please login first to checkout! 🔐');
      return;
    }
    setIsLoading(true);
    try {
      const orderId     = 'CASMART-' + Date.now();
      const grossAmount = Math.round(totalPrice * RATES.IDR);
      const itemDetails = cart.map(item => ({
        id:       String(item.id),
        price:    Math.round(item.price * RATES.IDR),
        quantity: item.qty,
        name:     item.name,
      }));

      const token = getToken();
      const res   = await fetch('http://localhost:5000/api/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id:         orderId,
          gross_amount:     grossAmount,
          item_details:     itemDetails,
          currency_display: currency,
        }),
      });

      const data = await res.json();
      if (data.token) {
        setCartOpen(false);
        window.snap.pay(data.token, {
          onSuccess:  (r) => { showToast('Payment successful! 🎉'); setCart([]); console.log(r); },
          onPending:  (r) => { showToast('Payment pending — please complete it.'); console.log(r); },
          onError:    (r) => { showToast('Payment failed. Please try again.'); console.error(r); },
          onClose:    ()  => { showToast('Payment window closed.'); },
        });
      } else {
        throw new Error(data.error || 'Failed to create transaction');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not connect to payment server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .filter-btn.active { background: #1a1a1a !important; color: #fff !important; border-color: #1a1a1a !important; }
        .header-search-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:8888;display:flex;align-items:center;justify-content:center;padding:0 20px; }
        .search-box { background:#fff;border-radius:50px;display:flex;align-items:center;width:100%;max-width:600px;padding:6px 6px 6px 20px;box-shadow:0 16px 60px rgba(0,0,0,0.3); }
        .search-box input { flex:1;border:none;outline:none;font-size:1.1rem;font-family:Jost,sans-serif; }
        .search-box button { background:#1a1a1a;color:#fff;border:none;border-radius:50px;padding:10px 24px;cursor:pointer;font-family:Jost,sans-serif;font-weight:700; }
        .product-empty { text-align:center;padding:60px 20px;color:#aaa;font-family:Jost,sans-serif; }
        .product-empty p { font-size:1.1rem;margin:12px 0 0; }
      `}</style>

      <Toast message={toast.msg} show={toast.show} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          showToast(`Welcome back! 🎉`);
          setAuthOpen(false);
        }}
      />

      {/* Chat Widget */}
      <ChatWidget />

      {/* Quick View */}
      {quickView && (
        <QuickView
          product={quickView}
          onClose={()=>setQuickView(null)}
          onAddToCart={addToCart}
          currency={currency}
        />
      )}

      {/* Search Overlay */}
      {searchActive && (
        <div className="header-search-overlay" onClick={()=>setSearchActive(false)}>
          <div className="search-box" onClick={e=>e.stopPropagation()}>
            <input
              autoFocus
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape') setSearchActive(false);}}
            />
            <button onClick={()=>setSearchActive(false)}>Search</button>
          </div>
        </div>
      )}

      <CartDrawer
        isOpen={cartOpen}
        onClose={()=>setCartOpen(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onCheckout={handleCheckout}
        isLoading={isLoading}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="header" data-header>
        <div className="container">
          <div className="overlay" data-overlay></div>

          <div className="header-search">
            <input
              type="search" name="search" placeholder="Search Product..." className="input-field"
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
            />
            <button className="search-btn" aria-label="Search">
              <ion-icon name="search-outline"></ion-icon>
            </button>
          </div>

          <a href="#" className="logo">
            <img src="/assets/images/logo.svg" alt="Casmart logo" width="130" height="31" />
          </a>

          <div className="header-actions">
            {user ? (
              /* Logged-in state */
              <div style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}} onClick={()=>{ if(window.confirm(`Logout dari akun ${user.name}?`)) { logout(); showToast('Logged out. See you!'); }}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#1a1a1a',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.85rem',flexShrink:0}}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{display:'flex',flexDirection:'column',lineHeight:1.2}}>
                  <span style={{fontSize:'0.78rem',fontWeight:700,color:'#1a1a1a',maxWidth:'80px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name.split(' ')[0]}</span>
                  <span style={{fontSize:'0.68rem',color:'#aaa'}}>Logout</span>
                </div>
              </div>
            ) : (
              <button className="header-action-btn" onClick={()=>setAuthOpen(true)}>
                <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
                <p className="header-action-label">Sign in</p>
              </button>
            )}

            <button className="header-action-btn" onClick={()=>setSearchActive(true)}>
              <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
              <p className="header-action-label">Search</p>
            </button>

            <button id="header-cart-btn" className="header-action-btn" onClick={()=>setCartOpen(true)} style={{position:'relative'}}>
              <ion-icon name="cart-outline" aria-hidden="true"></ion-icon>
              <p className="header-action-label">Cart</p>
              {totalItems > 0 && (
                <div className="btn-badge green" aria-hidden="true" key={totalItems}>{totalItems}</div>
              )}
            </button>

            <button className="header-action-btn" style={{position:'relative'}}>
              <ion-icon name="heart-outline" aria-hidden="true"></ion-icon>
              <p className="header-action-label">Wishlist</p>
              {wishlist.length > 0 && (
                <div className="btn-badge" aria-hidden="true">{wishlist.length}</div>
              )}
            </button>
          </div>

          <button className="nav-open-btn" data-nav-open-btn aria-label="Open Menu">
            <span></span><span></span><span></span>
          </button>

          <nav className="navbar" data-navbar>
            <div className="navbar-top">
              <a href="#" className="logo">
                <img src="/assets/images/logo.svg" alt="Casmart logo" width="130" height="31" />
              </a>
              <button className="nav-close-btn" data-nav-close-btn aria-label="Close Menu">
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>
            <ul className="navbar-list">
              <li><a href="#home"     className="navbar-link">Home</a></li>
              <li><a href="#products" className="navbar-link">Shop</a></li>
              <li><a href="#"         className="navbar-link">About</a></li>
              <li><a href="#blog"     className="navbar-link">Blog</a></li>
              <li><a href="#"         className="navbar-link">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────── */}
      <main>
        <article>

          {/* HERO */}
          <section className="hero" id="home" style={{backgroundImage:"url('/assets/images/hero-banner.jpg')"}}>
            <div className="container">
              <div className="hero-content">
                <p className="hero-subtitle">Fashion Everyday</p>
                <h2 className="h1 hero-title">Unrivalled Fashion House</h2>
                <button className="btn btn-primary" onClick={()=>document.querySelector('#products')?.scrollIntoView({behavior:'smooth'})}>
                  Shop Now
                </button>
              </div>
            </div>
          </section>

          {/* SERVICE */}
          <section className="service">
            <div className="container">
              <ul className="service-list">
                {[
                  {icon:'/assets/images/service-icon-1.svg', title:'Free Shipping',    text:'On All Order Over £599'},
                  {icon:'/assets/images/service-icon-2.svg', title:'Easy Returns',     text:'30 Day Returns Policy'},
                  {icon:'/assets/images/service-icon-3.svg', title:'Member Discount',  text:'On Order Over 2 Items'},
                  {icon:'/assets/images/service-icon-4.svg', title:'Secure Payment',   text:'100% Secure Payment'},
                ].map(s=>(
                  <li className="service-item" key={s.title}>
                    <div className="service-item-icon"><img src={s.icon} alt={s.title} /></div>
                    <div className="service-content">
                      <p className="service-item-title">{s.title}</p>
                      <p className="service-item-text">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* CATEGORY */}
          <section className="section category">
            <div className="container">
              <h2 className="h2 section-title">Browse The Range</h2>
              <ul className="category-list">
                {[
                  {img:'/assets/images/category-1.jpg', label:'Dress'},
                  {img:'/assets/images/category-2.jpg', label:'Jacket'},
                  {img:'/assets/images/category-3.jpg', label:'Pants'},
                  {img:'/assets/images/category-4.jpg', label:'Tops'},
                  {img:'/assets/images/category-5.jpg', label:'Shoes'},
                  {img:'/assets/images/category-6.jpg', label:'Accessories'},
                ].map(c=>(
                  <li key={c.label}>
                    <div className="category-card">
                      <figure className="card-banner">
                        <img src={c.img} alt={c.label} loading="lazy" width="200" height="220" className="w-100" />
                      </figure>
                      <a href="#products" className="category-name">{c.label}</a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* PRODUCTS */}
          <section className="section product" id="products">
            <div className="container">
              <h2 className="h2 section-title">Products of the week</h2>

              {/* Search bar inline */}
              {searchQuery && (
                <div style={{marginBottom:'16px',display:'flex',alignItems:'center',gap:'12px'}}>
                  <p style={{fontFamily:'Jost,sans-serif',color:'#666',fontSize:'0.9rem'}}>
                    Showing <strong>{filteredProducts.length}</strong> results for "<strong>{searchQuery}</strong>"
                  </p>
                  <button onClick={()=>setSearchQuery('')} style={{background:'#f0f0f0',border:'none',borderRadius:'20px',padding:'4px 14px',cursor:'pointer',fontFamily:'Jost,sans-serif',fontSize:'0.82rem',color:'#666'}}>
                    Clear ✕
                  </button>
                </div>
              )}

              {/* Filter Tabs */}
              <ul className="filter-list">
                {FILTERS.map(f=>(
                  <li key={f.key}>
                    <button
                      className={`filter-btn${activeFilter===f.key?' active':''}`}
                      onClick={()=>setActiveFilter(f.key)}
                    >{f.label}</button>
                  </li>
                ))}
              </ul>

              {filteredProducts.length === 0 ? (
                <div className="product-empty">
                  <span style={{fontSize:'3.5rem'}}>🔍</span>
                  <p>No products found. Try a different search or filter.</p>
                </div>
              ) : (
                <ul className="product-list">
                  {filteredProducts.map(p=>(
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={addToCart}
                      onQuickView={setQuickView}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                      currency={currency}
                    />
                  ))}
                </ul>
              )}
              <button className="btn btn-outline">View All Products</button>
            </div>
          </section>

          {/* BLOG */}
          <section className="section blog" id="blog">
            <div className="container">
              <h2 className="h2 section-title">Latest fashion news</h2>
              <ul className="blog-list">
                {[
                  {img:'/assets/images/blog-1.jpg', alt:'Worthy Cyber Monday Fashion From Casmart',      title:'Worthy Cyber Monday Fashion From Casmart'},
                  {img:'/assets/images/blog-2.jpg', alt:"Holiday Home Decoration I've Recently Ordered", title:"Holiday Home Decoration I've Recently Ordered"},
                  {img:'/assets/images/blog-3.jpg', alt:"Unique Ideas for Fashion You Haven't heard yet",title:"Unique Ideas for Fashion You Haven't heard yet"},
                ].map(post=>(
                  <li key={post.title}>
                    <div className="blog-card">
                      <figure className="card-banner">
                        <a href="#"><img src={post.img} alt={post.alt} loading="lazy" width="1020" height="700" className="w-100" /></a>
                      </figure>
                      <div className="card-content">
                        <ul className="card-meta-list">
                          <li className="card-meta-item"><ion-icon name="folder-open-outline"></ion-icon><a href="#" className="card-meta-link">Fashion</a></li>
                          <li className="card-meta-item"><ion-icon name="time-outline"></ion-icon><a href="#" className="card-meta-link"><time dateTime="2021-03-31">31 Mar 2021</time></a></li>
                        </ul>
                        <h3 className="h3 card-title"><a href="#">{post.title}</a></h3>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* NEWSLETTER */}
          <section className="section newsletter">
            <div className="container">
              <div className="newsletter-card" style={{backgroundImage:"url('/assets/images/newsletter-bg.png')"}}>
                <h2 className="card-title">Subscribe Newsletter</h2>
                <p className="card-text">Enter your email below to be the first to know about new collections and product launches.</p>
                <form className="card-form" onSubmit={e=>{e.preventDefault();showToast('Subscribed successfully! 🎉');}}>
                  <div className="input-wrapper">
                    <ion-icon name="mail-outline"></ion-icon>
                    <input type="email" name="email" placeholder="Enter your email" required className="input-field" />
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    <span>Subscribe</span>
                    <ion-icon name="arrow-forward" aria-hidden="true"></ion-icon>
                  </button>
                </form>
              </div>
            </div>
          </section>

        </article>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-top">
          <div className="container">
            <div className="footer-brand">
              <a href="#" className="logo"><img src="/assets/images/logo.svg" alt="Casmart logo" /></a>
              <p className="footer-text">Casmart is a fashion theme presenting a complete wardrobe of uniquely crafted Ethnic Wear, Casuals, Edgy Denims, &amp; Accessories.</p>
              <ul className="social-list">
                {['logo-facebook','logo-twitter','logo-instagram','logo-pinterest'].map(icon=>(
                  <li key={icon}><a href="#" className="social-link"><ion-icon name={icon}></ion-icon></a></li>
                ))}
              </ul>
            </div>
            <ul className="footer-list">
              <li><p className="footer-list-title">Information</p></li>
              {['About Company','Payment Type','Awards Winning','World Media Partner','Become an Agent','Refund Policy'].map(l=>(
                <li key={l}><a href="#" className="footer-link">{l}</a></li>
              ))}
            </ul>
            <ul className="footer-list">
              <li><p className="footer-list-title">Category</p></li>
              {['Handbags & Wallets',"Women's Clothing",'Plus Sizes','Complete Your Look','Baby Corner','Man & Woman Shoe'].map(l=>(
                <li key={l}><a href="#" className="footer-link">{l}</a></li>
              ))}
            </ul>
            <ul className="footer-list">
              <li><p className="footer-list-title">Help &amp; Support</p></li>
              {['Dealers & Agents','FAQ Information','Return Policy','Shipping & Delivery','Order Tracking','List of Shops'].map(l=>(
                <li key={l}><a href="#" className="footer-link">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p className="copyright">&copy; 2024 <a href="#">Casmart</a>. All Rights Reserved</p>
            <ul className="footer-bottom-list">
              {['Privacy Policy','Terms & Conditions','Sitemap'].map(l=>(
                <li key={l}><a href="#" className="footer-bottom-link">{l}</a></li>
              ))}
            </ul>
            <div className="payment">
              <p className="payment-title">We Support</p>
              <img src="/assets/images/payment-img.png" alt="Online payment logos" className="payment-img" />
            </div>
          </div>
        </div>
      </footer>

      {/* Ionicons */}
      <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
      <script noModule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
    </>
  );
}
