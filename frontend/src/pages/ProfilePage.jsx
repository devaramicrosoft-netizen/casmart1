import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import {
  User, ShoppingBag, Shield, LogOut, ChevronRight, Edit3,
  Lock, Check, X, Loader2, Package, Calendar, CreditCard,
  Eye, EyeOff, AlertCircle, CheckCircle2, Ticket, Heart, MapPin
} from 'lucide-react';

const API = 'http://localhost:5000';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B59B6', '#34495E',
];

function Avatar({ name, color, size = 80 }) {
  const initials = name ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, fontFamily: 'Jost, sans-serif', flexShrink: 0,
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)', userSelect: 'none', border: '3px solid #fff'
    }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    success: { bg: '#E8F5E9', color: '#2E7D32', label: 'Success' },
    pending: { bg: '#FFF8E1', color: '#F57F17', label: 'Pending' },
    failure: { bg: '#FFEBEE', color: '#C62828', label: 'Failed' },
    expire:  { bg: '#F3E5F5', color: '#6A1B9A', label: 'Expired' },
    cancel:  { bg: '#EEEEEE', color: '#616161', label: 'Cancelled' },
  };
  const s = map[status] || map.failure;
  return (
    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function InputField({ label, type = 'text', value, onChange, disabled, placeholder, error }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#444', fontFamily: 'Jost, sans-serif' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          value={value} onChange={onChange} disabled={disabled} placeholder={placeholder}
          style={{
            width: '100%', padding: '14px 16px', paddingRight: isPassword ? '46px' : '16px',
            border: `1px solid ${error ? '#e53935' : '#ddd'}`, borderRadius: '8px',
            fontSize: '0.95rem', fontFamily: 'Jost, sans-serif',
            background: disabled ? '#f9f9f9' : '#fff', color: disabled ? '#999' : '#333',
            outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
          }}
          onFocus={e => { if (!disabled) e.target.style.borderColor = '#1a1a1a'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,26,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = error ? '#e53935' : '#ddd'; e.target.style.boxShadow = 'none'; }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#e53935', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Jost' }}>
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
}

function AccountTab({ user, getToken, updateUser, showToast, avatarColor, setAvatarColor }) {
  const [name, setName] = useState(user.name || '');
  const [savingName, setSavingName] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user.name) return;
    setSavingName(true);
    try {
      const res = await axios.put(`${API}/api/auth/profile`, { name: name.trim() }, { headers: { Authorization: `Bearer ${getToken()}` } });
      updateUser(res.data.user, res.data.token);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile');
    }
    setSavingName(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    if (newPw.length < 6) { setPwError('Minimum 6 characters.'); return; }
    setSavingPw(true);
    try {
      await axios.put(`${API}/api/auth/password`, { oldPassword: oldPw, newPassword: newPw }, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('Password changed successfully!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password.');
    }
    setSavingPw(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={card}>
        <h3 style={sectionTitle}>My Profile</h3>
        <p style={{ margin: '-10px 0 24px', fontSize: '0.9rem', color: '#666', fontFamily: 'Jost' }}>Manage your personal information to ensure your account is secure.</p>
        
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          {/* Form Side */}
          <div style={{ flex: '1 1 400px' }}>
            <InputField label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            <InputField label="Email Address" value={user.email} disabled />
            <button onClick={handleSaveName}
              disabled={savingName || !name.trim() || name.trim() === user.name}
              style={{ ...btnStyle, marginTop: '10px', opacity: (savingName || !name.trim() || name.trim() === user.name) ? 0.5 : 1 }}>
              {savingName ? <Loader2 size={18} className="spin" /> : 'Save Changes'}
            </button>
          </div>
          
          {/* Avatar Side */}
          <div style={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px', borderLeft: '1px solid #eee' }}>
            <Avatar name={user.name} color={avatarColor} size={100} />
            <div style={{ marginTop: '24px', width: '100%' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#666', fontFamily: 'Jost', textAlign: 'center', fontWeight: 600 }}>Avatar Color</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {AVATAR_COLORS.map(c => (
                  <button key={c} onClick={() => { setAvatarColor(c); localStorage.setItem('casmart_avatar_color', c); }}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', 
                      outline: 'none', transition: 'all 0.2s', 
                      boxShadow: avatarColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none',
                      transform: avatarColor === c ? 'scale(1.1)' : 'scale(1)'
                    }} 
                  />
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center', marginTop: '24px', lineHeight: 1.5 }}>
              File size: maximum 10 MB<br/>File extension: .JPEG, .PNG
            </p>
          </div>
        </div>
      </div>

      <div style={card}>
        <h3 style={sectionTitle}>Change Password</h3>
        <p style={{ margin: '-10px 0 24px', fontSize: '0.9rem', color: '#666', fontFamily: 'Jost' }}>Keep your account secure by regularly updating your password.</p>
        <form onSubmit={handleChangePassword} style={{ maxWidth: '500px' }}>
          <InputField label="Current Password" type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Enter current password" />
          <InputField label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
          <InputField label="Confirm New Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" error={pwError} />
          <button type="submit" disabled={savingPw || !oldPw || !newPw || !confirmPw}
            style={{ ...btnStyle, marginTop: '10px', opacity: (savingPw || !oldPw || !newPw || !confirmPw) ? 0.5 : 1 }}>
            {savingPw ? <Loader2 size={18} className="spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function OrdersTab({ user, getToken, currency, showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    axios.get(`${API}/api/orders`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(res => setOrders(res.data.orders))
      .catch(() => showToast('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user, getToken, showToast]);

  const statusFilters = ['all', 'success', 'pending', 'failure', 'expire', 'cancel'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={card}>
      <h3 style={sectionTitle}>My Orders</h3>
      
      {/* Modern Filter Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0', marginBottom: '24px', overflowX: 'auto' }}>
        {statusFilters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '12px 24px', border: 'none', background: 'transparent',
            color: filter === f ? '#e53935' : '#666',
            borderBottom: filter === f ? '3px solid #e53935' : '3px solid transparent',
            marginBottom: '-2px', fontFamily: 'Jost, sans-serif', fontWeight: 600, fontSize: '0.95rem',
            cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize', whiteSpace: 'nowrap'
          }}>
            {f === 'all' ? 'All Orders' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#bbb' }}>
          <Loader2 size={40} className="spin" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'Jost', color: '#888' }}>Loading your orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div style={{ width: '120px', height: '120px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Package size={50} color="#ccc" />
          </div>
          <h4 style={{ fontFamily: 'Jost', fontSize: '1.2rem', color: '#333', margin: '0 0 8px' }}>No orders yet</h4>
          <p style={{ fontFamily: 'Jost', color: '#888', fontSize: '0.95rem', margin: 0 }}>
            {filter === 'all' ? "Looks like you haven't made your choice yet." : `You have no ${filter} orders.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map(order => (
            <div key={order.id} style={{ 
              border: '1px solid #e8e8e8', borderRadius: '12px', overflow: 'hidden', 
              transition: 'box-shadow 0.2s', ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } 
            }}>
              {/* Card Header */}
              <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={16} color="#666" />
                    <span style={{ fontSize: '0.85rem', color: '#666', fontFamily: 'Jost', fontWeight: 600 }}>Shopping</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#888', fontFamily: 'Jost' }}>
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <StatusBadge status={order.status} />
                  <span style={{ fontSize: '0.85rem', color: '#888', fontFamily: 'Jost' }}>INV/{order.midtrans_order_id}</span>
                </div>
              </div>
              
              {/* Card Body */}
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '300px' }}>
                  <div style={{ width: '60px', height: '60px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={24} color="#ccc" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#333', fontFamily: 'Jost', fontWeight: 600 }}>Casmart Order</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontFamily: 'Jost' }}>
                      {order.items_summary || '1 Product'}
                    </p>
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid #eee', paddingLeft: '24px', minWidth: '150px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#888', fontFamily: 'Jost' }}>Total Price</p>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e53935', fontFamily: 'Jost' }}>
                    {formatPrice(order.gross_amount_idr / 20500, currency)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityTab({ user, logout, showToast }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={card}>
        <h3 style={sectionTitle}>Account Security</h3>
        <p style={{ margin: '-10px 0 24px', fontSize: '0.9rem', color: '#666', fontFamily: 'Jost' }}>Manage your account security and authentication methods.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { icon: <Lock size={20} />, title: 'Password', desc: 'Last changed 3 months ago', action: 'Update' },
            { icon: <Shield size={20} />, title: 'Two-Factor Authentication', desc: 'Not configured', action: 'Enable' },
            { icon: <MapPin size={20} />, title: 'Login Activity', desc: 'Review active sessions', action: 'View' },
          ].map((item, i) => (
            <div key={i} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '20px 0', borderBottom: i === 2 ? 'none' : '1px solid #eee' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  {item.icon}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: '#333', fontFamily: 'Jost', fontWeight: 600 }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', fontFamily: 'Jost' }}>{item.desc}</p>
                </div>
              </div>
              <button style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#333', cursor: 'pointer', fontFamily: 'Jost' }}>
                {item.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, border: '1px solid #ffebee' }}>
        <h3 style={{ ...sectionTitle, color: '#c62828' }}>Danger Zone</h3>
        <p style={{ margin: '-10px 0 20px', fontSize: '0.9rem', color: '#666', fontFamily: 'Jost' }}>
          Signing out will safely remove your session from this device.
        </p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} style={{ background: '#fff', color: '#c62828', border: '1px solid #c62828', padding: '10px 24px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={18} /> Sign Out of Casmart
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#fff3f3', padding: '16px', borderRadius: '8px' }}>
            <AlertCircle color="#c62828" size={20} />
            <span style={{ fontFamily: 'Jost', fontSize: '0.95rem', color: '#c62828', fontWeight: 600, flex: 1 }}>Are you absolutely sure?</span>
            <button onClick={() => { logout(); navigate('/'); showToast('Logged out.'); }} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost' }}>
              Yes, Sign Out
            </button>
            <button onClick={() => setConfirming(false)} style={{ background: 'transparent', color: '#666', border: '1px solid #ccc', padding: '8px 20px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const card = { background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const sectionTitle = { margin: '0 0 20px', fontSize: '1.15rem', fontWeight: 700, color: '#222', fontFamily: 'Jost, sans-serif' };
const btnStyle = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

const SIDEBAR_ITEMS = [
  { key: 'account',  label: 'My Profile',    icon: <User size={20} /> },
  { key: 'orders',   label: 'My Orders',     icon: <ShoppingBag size={20} /> },
  { key: 'wishlist', label: 'Wishlist',      icon: <Heart size={20} /> },
  { key: 'vouchers', label: 'My Vouchers',   icon: <Ticket size={20} /> },
  { key: 'security', label: 'Security',      icon: <Shield size={20} /> },
];

export default function ProfilePage({ currency, showToast }) {
  const { user, getToken, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [avatarColor, setAvatarColor] = useState(() => localStorage.getItem('casmart_avatar_color') || AVATAR_COLORS[0]);

  useEffect(() => { if (!user) navigate('/'); }, [user, navigate]);
  if (!user) return null;

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        body { background-color: #f5f5f5; }
      `}</style>
      
      {/* Breadcrumb Area */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '8px', fontFamily: 'Jost', fontSize: '0.85rem', color: '#888' }}>
          <span style={{ cursor: 'pointer', color: '#1a1a1a' }} onClick={() => navigate('/')}>Home</span>
          <span>/</span>
          <span>Profile</span>
          <span>/</span>
          <span style={{ color: '#e53935', fontWeight: 600 }}>{SIDEBAR_ITEMS.find(t => t.key === activeTab)?.label}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '32px auto 64px', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Left Sidebar (Tokopedia/Shopee style) */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            {/* User Info Card */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '16px' }}>
              <Avatar name={user.name} color={avatarColor} size={56} />
              <div style={{ overflow: 'hidden' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#222', fontFamily: 'Jost', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ padding: '2px 8px', background: '#FFD700', color: '#856404', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px', fontFamily: 'Jost' }}>
                    GOLD MEMBER
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
              {SIDEBAR_ITEMS.map((item) => (
                <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 24px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'Jost, sans-serif', fontSize: '0.95rem',
                  fontWeight: activeTab === item.key ? 700 : 500,
                  color: activeTab === item.key ? '#e53935' : '#555',
                  textAlign: 'left', transition: 'all 0.2s',
                  position: 'relative'
                }}>
                  {/* Left highlight border for active state */}
                  {activeTab === item.key && <div style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: '4px', background: '#e53935', borderRadius: '0 4px 4px 0' }} />}
                  
                  <span style={{ color: activeTab === item.key ? '#e53935' : '#999' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>
            {activeTab === 'account'  && <AccountTab user={user} getToken={getToken} updateUser={updateUser} showToast={showToast} avatarColor={avatarColor} setAvatarColor={setAvatarColor} />}
            {activeTab === 'orders'   && <OrdersTab user={user} getToken={getToken} currency={currency} showToast={showToast} />}
            {activeTab === 'security' && <SecurityTab user={user} logout={logout} showToast={showToast} />}
            {(activeTab === 'wishlist' || activeTab === 'vouchers') && (
              <div style={card}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  {activeTab === 'wishlist' ? <Heart size={64} color="#ddd" style={{ margin: '0 auto 16px' }} /> : <Ticket size={64} color="#ddd" style={{ margin: '0 auto 16px' }} />}
                  <h3 style={{ fontFamily: 'Jost', fontSize: '1.2rem', color: '#333' }}>Feature Coming Soon</h3>
                  <p style={{ fontFamily: 'Jost', color: '#888' }}>We are working hard to bring this feature to you.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}