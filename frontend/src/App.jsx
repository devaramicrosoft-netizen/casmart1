import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingCart, X, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import AuthModal from './components/AuthModal.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import Shop from './pages/Shop.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { formatPrice, RATES } from './utils/formatPrice.js';

// Toast 
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
      <CheckCircle color="#4caf50" size={18} />
      {message}
    </div>
  );
}

// Currency Switcher 
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

// Quick View Modal 
function QuickView({ product, onClose, onAddToCart, currency, onToggleWishlist, isWished }) {
  if (!product) return null;
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:10000,backdropFilter:'blur(5px)',transition:'opacity 0.3s'}} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', borderRadius:'24px', zIndex:10001, width:'95%', maxWidth:'950px',
        display:'flex', overflow:'hidden', boxShadow:'0 30px 90px rgba(0,0,0,0.4)',
        fontFamily:'Jost,sans-serif', maxHeight:'90vh',
      }}>
        {/* Left Side: Image */}
        <div style={{ width: '45%', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
           {product.badge_label && (
            <span style={{position:'absolute', top:'24px', left:'24px', background: product.badge_color==='red'?'#e53935':'#4caf50', color:'#fff', padding:'6px 14px', borderRadius:'8px', fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.5px'}}>
              {product.badge_label.toUpperCase()}
            </span>
          )}
          <img src={product.image} alt={product.name} style={{width:'100%', height:'auto', maxHeight:'400px', objectFit:'contain', filter:'drop-shadow(0 20px 30px rgba(0,0,0,0.1))'}} />
        </div>

        {/* Right Side: Details */}
        <div style={{padding:'40px 48px',flex:1,overflowY:'auto', display:'flex', flexDirection:'column'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f5b041', marginBottom: '12px' }}>
             <ion-icon name="star"></ion-icon>
             <ion-icon name="star"></ion-icon>
             <ion-icon name="star"></ion-icon>
             <ion-icon name="star"></ion-icon>
             <ion-icon name="star-half"></ion-icon>
             <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '6px' }}>(4.8 / 5 Reviews)</span>
          </div>

          <h2 style={{margin:'0 0 12px',fontSize:'1.8rem',fontWeight:800,color:'#1a1a1a', lineHeight:1.2}}>{product.name}</h2>
          
          <div style={{display:'flex',alignItems:'baseline',gap:'12px',marginBottom:'24px', paddingBottom:'24px', borderBottom:'1px solid #eee'}}>
            <span style={{fontSize:'2rem',fontWeight:800,color:'#e53935'}}>{formatPrice(product.price, currency)}</span>
            {product.original_price && <span style={{fontSize:'1.1rem',color:'#bbb',textDecoration:'line-through', fontWeight:500}}>{formatPrice(product.original_price, currency)}</span>}
          </div>

          <p style={{color:'#666',lineHeight:1.8,marginBottom:'32px',fontSize:'1rem'}}>
            Premium quality <strong>{product.name.toLowerCase()}</strong> crafted with the finest materials. 
            Designed for everyday wear and timeless style. Elevate your look with this exclusive piece.
          </p>

          <div style={{ marginBottom: '36px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#333' }}>Select Size</p>
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              {['XS','S','M','L','XL'].map((s, i) => (
                <button key={s} style={{
                  width:'48px',height:'48px',border:'1.5px solid', borderColor: i === 2 ? '#1a1a1a' : '#e0e0e0', borderRadius:'12px',background: i === 2 ? '#1a1a1a' : '#fff',cursor:'pointer',fontWeight:600,fontSize:'0.9rem',color: i === 2 ? '#fff' : '#333',transition:'all 0.2s',fontFamily:'Jost,sans-serif'
                }}
                  onMouseEnter={e=>{if(i !== 2) {e.target.style.borderColor='#1a1a1a';e.target.style.color='#1a1a1a';}}}
                  onMouseLeave={e=>{if(i !== 2) {e.target.style.borderColor='#e0e0e0';e.target.style.color='#333';}}}
                >{s}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: '16px' }}>
            <button
              onClick={() => { onAddToCart(product); onClose(); }}
              style={{flex:1,padding:'16px',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:'12px',fontFamily:'Jost,sans-serif',fontWeight:700,fontSize:'1.1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',transition:'all 0.2s', boxShadow:'0 8px 20px rgba(0,0,0,0.15)'}}
              onMouseEnter={e=>{e.target.style.transform='translateY(-2px)';e.target.style.boxShadow='0 12px 24px rgba(0,0,0,0.2)';}}
              onMouseLeave={e=>{e.target.style.transform='translateY(0)';e.target.style.boxShadow='0 8px 20px rgba(0,0,0,0.15)';}}
            >
              <ShoppingCart size={20} /> Add to Cart
            </button>
            <button 
              onClick={() => onToggleWishlist(product.id)}
              style={{ width: '56px', height: '56px', borderRadius: '12px', border: '1.5px solid #e0e0e0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isWished ? '#e53935' : '#666', transition: 'all 0.2s' }}
              onMouseEnter={e=>{e.target.style.borderColor='#e53935';e.target.style.color='#e53935';}}
              onMouseLeave={e=>{if(!isWished) { e.target.style.borderColor='#e0e0e0';e.target.style.color='#666'; }}}
            >
              <ion-icon name={isWished ? "heart" : "heart-outline"} style={{ fontSize: '24px' }}></ion-icon>
            </button>
          </div>
        </div>
        
        <button onClick={onClose} style={{position:'absolute',top:'24px',right:'24px',background:'#f5f5f5',border:'none',borderRadius:'50%',width:'40px',height:'40px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center', color:'#555', transition:'background 0.2s'}}
          onMouseEnter={e=>{e.target.style.background='#e0e0e0';}}
          onMouseLeave={e=>{e.target.style.background='#f5f5f5';}}
        ><X size={20} strokeWidth={2.5} /></button>
      </div>
    </>
  );
}

// Cart Drawer 
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
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#888',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={24} /></button>
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
              <ShoppingCart size={64} color="#ddd" strokeWidth={1.5} />
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
                    style={{position:'absolute',top:'-8px',right:'-8px',background:'#ff5252',color:'#fff',border:'none',borderRadius:'50%',width:'22px',height:'22px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                  ><X size={12} strokeWidth={3} /></button>
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
              {isLoading ? <><Loader2 size={18} style={{animation:'spin 1s linear infinite'}} /> Processing...</> : <><CreditCard size={18} /> Checkout via Midtrans</>}
            </button>
            <p style={{textAlign:'center',fontSize:'0.75rem',color:'#ccc',marginTop:'10px',marginBottom:0,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
              <ShieldCheck size={13} /> Secure payment · Powered by Midtrans
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Main App 
export default function App() {
  const { user, logout, getToken, wishlistIds, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const [cart,         setCart]         = useState([]);
  const [cartOpen,     setCartOpen]     = useState(false);
  const [authOpen,     setAuthOpen]     = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [toast,        setToast]        = useState({ show:false, msg:'' });
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [quickView,    setQuickView]    = useState(null);
  const [currency,     setCurrency]     = useState('IDR');
  
  // Mobile Nav 
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

  // Helpers 
  const showToast = useCallback((msg) => {
    setToast({ show:true, msg });
    setTimeout(() => setToast(t=>({...t, show:false})), 2800);
  }, []);

  // Cart Actions 
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===product.id);
      if (ex) return prev.map(i=>i.id===product.id ? {...i, qty:i.qty+1} : i);
      return [...prev, {...product, qty:1}];
    });
    showToast(`"${product.name}" added to cart!`);
  }, [showToast]);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) { setCart(prev=>prev.filter(i=>i.id!==id)); return; }
    setCart(prev=>prev.map(i=>i.id===id?{...i, qty}:i));
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev=>prev.filter(i=>i.id!==id));
    showToast('Item removed from cart');
  }, [showToast]);

  const handleToggleWishlist = useCallback(async (id) => {
    if (!user) {
      setAuthOpen(true);
      showToast('Please login first to use the wishlist!');
      return;
    }
    await toggleWishlist(id);
  }, [user, toggleWishlist, showToast]);

  // Checkout 
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) {
      setCartOpen(false);
      setAuthOpen(true);
      showToast('Please login first to checkout!');
      return;
    }
    setIsLoading(true);
    try {
      const totalPrice = cart.reduce((s,i)=>s+i.price*i.qty, 0);
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
          onSuccess:  (r) => { showToast('Payment successful!'); setCart([]); console.log(r); },
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

  const totalItems = cart.reduce((s,i)=>s+i.qty, 0);

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

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          showToast(`Welcome back!`);
          setAuthOpen(false);
        }}
      />

      <ChatWidget user={user} />

      {quickView && (
        <QuickView 
          product={quickView} 
          onClose={()=>setQuickView(null)} 
          onAddToCart={addToCart} 
          currency={currency} 
          onToggleWishlist={handleToggleWishlist}
          isWished={wishlistIds.includes(quickView.id)}
        />
      )}

      {searchActive && (
        <div className="header-search-overlay" onClick={()=>setSearchActive(false)}>
          <div className="search-box" onClick={e=>e.stopPropagation()}>
            <input
              autoFocus
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape') { setSearchActive(false); navigate('/'); }}}
            />
            <button onClick={()=>{setSearchActive(false); navigate('/');}}>Search</button>
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

      {/* HEADER ─────────────────────────────────────────── */}
      <header className="header" data-header>
        <div className="container">
          <div className="overlay" data-overlay></div>

          <div className="header-search">
            <input
              type="search" name="search" placeholder="Search Product..." className="input-field"
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
            />
            <button className="search-btn" aria-label="Search" onClick={() => navigate('/')}>
              <ion-icon name="search-outline"></ion-icon>
            </button>
          </div>

          <Link to="/" className="logo">
            <img src="/assets/images/logo.svg" alt="Casmart logo" width="130" height="31" />
          </Link>

          <div className="header-actions">
            {user ? (
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{display:'flex',flexDirection:'column',lineHeight:1.2,alignItems:'flex-end'}}>
                  <span style={{fontSize:'0.78rem',fontWeight:700,color:'#1a1a1a',maxWidth:'80px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name.split(' ')[0]}</span>
                  <div style={{display:'flex', gap:'8px', fontSize:'0.75rem', marginTop:'3px'}}>
                    <Link to="/profile" style={{color:'#666', textDecoration:'none', fontWeight:600}}>Profile</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" style={{color:'#e53935', textDecoration:'none', fontWeight:600}}>Admin</Link>
                    )}
                    <span style={{color:'#aaa', cursor:'pointer'}} onClick={()=>{ if(window.confirm(`Logout dari akun ${user.name}?`)) { logout(); navigate('/'); showToast('Logged out. See you!'); }}}>Logout</span>
                  </div>
                </div>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#1a1a1a',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.85rem',flexShrink:0, overflow: 'hidden'}}>
                  {user.avatar ? (
                    <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
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

            <button className="header-action-btn" style={{position:'relative'}} onClick={() => {if(user) navigate('/profile'); else {setAuthOpen(true); showToast('Login to view wishlist');}}}>
              <ion-icon name="heart-outline" aria-hidden="true"></ion-icon>
              <p className="header-action-label">Wishlist</p>
              {wishlistIds.length > 0 && (
                <div className="btn-badge" aria-hidden="true">{wishlistIds.length}</div>
              )}
            </button>
          </div>

          <button className="nav-open-btn" data-nav-open-btn aria-label="Open Menu">
            <span></span><span></span><span></span>
          </button>

          <nav className="navbar" data-navbar>
            <div className="navbar-top">
              <Link to="/" className="logo">
                <img src="/assets/images/logo.svg" alt="Casmart logo" width="130" height="31" />
              </Link>
              <button className="nav-close-btn" data-nav-close-btn aria-label="Close Menu">
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>
            <ul className="navbar-list">
              <li><Link to="/" className="navbar-link">Home</Link></li>
              <li><Link to="/" className="navbar-link">Shop</Link></li>
              {user && <li><Link to="/profile" className="navbar-link">Profile</Link></li>}
              {user && user.role === 'admin' && <li><Link to="/admin" className="navbar-link" style={{color:'#e53935'}}>Admin Dashboard</Link></li>}
            </ul>
          </nav>
        </div>
      </header>

      {/* MAIN ROUTES ───────────────────────────────────────────── */}
      <main>
        <Routes>
          <Route path="/" element={
            <Shop 
              addToCart={addToCart} 
              setQuickView={setQuickView} 
              wishlist={wishlistIds} 
              toggleWishlist={handleToggleWishlist} 
              currency={currency} 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showToast={showToast}
            />
          } />
          <Route path="/profile" element={<ProfilePage currency={currency} showToast={showToast} />} />
          <Route path="/admin" element={<AdminDashboard currency={currency} showToast={showToast} />} />
        </Routes>
      </main>

      {/* FOOTER ─────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-top">
          <div className="container">
            <div className="footer-brand">
              <Link to="/" className="logo"><img src="/assets/images/logo.svg" alt="Casmart logo" /></Link>
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
              <li><p className="footer-list-title">Help & Support</p></li>
              {['Dealers & Agents','FAQ Information','Return Policy','Shipping & Delivery','Order Tranking','List of Shops'].map(l=>(
                <li key={l}><a href="#" className="footer-link">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p className="copyright">
              &copy; 2026 <a href="#">codewithsadee</a>. All Rights Reserved
            </p>
            <ul className="footer-bottom-list">
              <li><a href="#" className="footer-bottom-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-bottom-link">Terms & Conditions</a></li>
              <li><a href="#" className="footer-bottom-link">Sitemap</a></li>
            </ul>
            <div className="payment">
              <p className="payment-title">We Support</p>
              <img src="/assets/images/payment-img.png" alt="Online payment logos" className="payment-img" />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
