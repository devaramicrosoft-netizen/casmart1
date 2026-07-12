import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, X, Eye, Heart, ShoppingBag, Check } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

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
          {product.badge_label && <div className={`card-badge ${product.badge_color}`}>{product.badge_label}</div>}
          <div className="card-actions">
            <button className="card-action-btn" aria-label="Quick view" onClick={()=>onQuickView(product)} title="Quick View">
              <Eye size={18} />
            </button>
            <button
              className="card-action-btn cart-btn"
              onClick={handleAdd}
              style={{background: added ? '#4caf50' : undefined, transition:'background 0.3s'}}
            >
              {added ? <Check size={16} aria-hidden="true" /> : <ShoppingBag size={16} aria-hidden="true" />}
              <p>{added ? 'Added!' : 'Add to Cart'}</p>
            </button>
            <button
              className="card-action-btn"
              aria-label="Toggle Wishlist"
              onClick={()=>onToggleWishlist(product.id)}
              title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
              style={{color: isWished ? '#e53935' : undefined, transition:'color 0.2s'}}
            >
              <Heart size={18} fill={isWished ? '#e53935' : 'none'} />
            </button>
          </div>
        </figure>
        <div className="card-content">
          <h3 className="h4 card-title">
            <a href="#" onClick={e=>{e.preventDefault();onQuickView(product);}}>{product.name}</a>
          </h3>
          <div className="card-price">
            <data value={product.price}>{formatPrice(product.price, currency)}</data>
            {product.original_price && <data value={product.original_price}>{formatPrice(product.original_price, currency)}</data>}
          </div>
        </div>
      </div>
    </li>
  );
}

const FILTERS = [
  { key:'all',           label:'All Products' },
  { key:'best-seller',   label:'Best Seller'    },
  { key:'hot-collection',label:'Hot Collection' },
  { key:'trendy',        label:'Trendy'         },
  { key:'new-arrival',   label:'New Arrival'    },
];

export default function Shop({ 
  addToCart, 
  setQuickView, 
  wishlist, 
  toggleWishlist, 
  currency, 
  searchQuery, 
  setSearchQuery,
  showToast
}) {
  const [products, setProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data.products))
      .catch(err => {
        console.error(err);
        showToast('Failed to load products');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const filteredProducts = products.filter(p => {
    let cats = [];
    try { cats = typeof p.categories === 'string' ? JSON.parse(p.categories) : (p.categories || []); } catch(e){}
    let ts = [];
    try { ts = typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []); } catch(e){}
    
    const matchFilter = activeFilter === 'all' || cats.includes(activeFilter);
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ts.some(t=>t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
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
              <button onClick={()=>setSearchQuery('')} style={{background:'#f0f0f0',border:'none',borderRadius:'20px',padding:'4px 14px',cursor:'pointer',fontFamily:'Jost,sans-serif',fontSize:'0.82rem',color:'#666',display:'flex',alignItems:'center',gap:'4px'}}>
                Clear <X size={12} strokeWidth={3} />
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

          {loading ? (
             <div style={{textAlign:'center', padding:'60px', fontFamily:'Jost'}}>Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="product-empty" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
              <Search size={64} color="#ddd" strokeWidth={1.5} />
              <p style={{ margin: 0 }}>No products found. Try a different search or filter.</p>
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
              {img:'/assets/images/blog-1.jpg', alt:'Worthy Cyber Monday Fashion',      title:'Worthy Cyber Monday Fashion'},
              {img:'/assets/images/blog-2.jpg', alt:"Holiday Home Decoration", title:"Holiday Home Decoration"},
              {img:'/assets/images/blog-3.jpg', alt:"Unique Ideas for Fashion",title:"Unique Ideas for Fashion"},
            ].map(post=>(
              <li key={post.title}>
                <div className="blog-card">
                  <figure className="card-banner">
                    <a href="#"><img src={post.img} alt={post.alt} loading="lazy" width="1020" height="700" className="w-100" /></a>
                  </figure>
                  <div className="card-content">
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
            <form className="card-form" onSubmit={e=>{e.preventDefault();showToast('Subscribed successfully!');}}>
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
  );
}
