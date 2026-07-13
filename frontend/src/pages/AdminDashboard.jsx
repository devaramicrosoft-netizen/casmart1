import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Package, DollarSign, Tag, CheckCircle, Plus, Search, X,
  Edit2, Trash2, Upload, AlertTriangle, Image as ImageIcon,
  RefreshCw, ShieldOff, LayoutDashboard, MessageSquare, Send, ShoppingCart,
  Ticket, BarChart2, TrendingUp, Percent, Gift, Users, Activity,
  Copy, ToggleLeft, ToggleRight, Calendar, Zap
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BADGE_COLORS = ['', 'red', 'green', 'blue', 'orange', 'purple'];
const EMPTY_FORM = {
  name: '', price: '', original_price: '',
  image: '', badge_label: '', badge_color: '',
  categories: '', tags: ''
};

// Stats Card 
function StatCard({ Icon, label, value, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '22px 24px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', gap: '18px', flex: '1', minWidth: '180px'
    }}>
      <div style={{
        width: '46px', height: '46px', borderRadius: '10px',
        background: accent + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={20} color={accent} strokeWidth={2.2} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#9e9e9e', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

// Image Uploader 
function ImageUploader({ value, onChange, getToken }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await axios.post(`${API}/api/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${getToken()}` }
      });
      onChange(`${API}${res.data.url}`);
    } catch (err) {
      alert('Upload gagal: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const preview = value && (value.startsWith('http') || value.startsWith('/'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#1a1a1a' : '#d8d8d8'}`,
          borderRadius: '10px', padding: '28px 20px', textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer', transition: 'all 0.2s',
          background: dragOver ? '#f5f5f5' : '#fafafa',
        }}
      >
        {uploading ? (
          <div style={{ color: '#888', fontFamily: 'Jost,sans-serif' }}>
            <RefreshCw size={28} color="#bbb" style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Uploading...</p>
          </div>
        ) : preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <img src={value} alt="preview" style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', fontFamily: 'Jost,sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Upload size={13} /> Click or drag to replace
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#bbb', fontFamily: 'Jost,sans-serif' }}>
            <ImageIcon size={36} color="#d0d0d0" />
            <p style={{ margin: 0, fontWeight: 700, color: '#777', fontSize: '0.9rem' }}>Drop image here or click to browse</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#bbb' }}>JPG, PNG, WEBP — Max 5MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, height: '1px', background: '#eee' }} />
        <span style={{ fontSize: '0.75rem', color: '#bbb', fontFamily: 'Jost,sans-serif', whiteSpace: 'nowrap' }}>or paste URL</span>
        <div style={{ flex: 1, height: '1px', background: '#eee' }} />
      </div>
      <input
        type="text"
        placeholder="https://... or /assets/images/..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: '8px',
          fontFamily: 'Jost,sans-serif', fontSize: '0.88rem', outline: 'none', color: '#555'
        }}
      />
    </div>
  );
}

// Field + Input 
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: '7px', fontSize: '0.78rem', fontWeight: 700,
        color: '#555', letterSpacing: '0.4px', textTransform: 'uppercase', fontFamily: 'Jost,sans-serif'
      }}>
        {label} {required && <span style={{ color: '#e53935' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '5px 0 0', fontSize: '0.75rem', color: '#bbb', fontFamily: 'Jost,sans-serif' }}>{hint}</p>}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8',
        borderRadius: '8px', fontFamily: 'Jost,sans-serif', fontSize: '0.92rem',
        outline: 'none', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        ...props.style
      }}
      onFocus={e => e.target.style.borderColor = '#1a1a1a'}
      onBlur={e => e.target.style.borderColor = '#e8e8e8'}
    />
  );
}

// Product Form Modal 
function ProductForm({ initial, onSave, onCancel, getToken }) {
  const [data, setData] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = {
      ...data,
      categories: data.categories.split(',').map(s => s.trim()).filter(Boolean),
      tags: data.tags.split(',').map(s => s.trim()).filter(Boolean),
    };
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '680px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        fontFamily: 'Jost,sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {data.id ? <Edit2 size={16} color="#555" /> : <Plus size={16} color="#555" />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1a1a1a' }}>
                {data.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                {data.id ? `Editing product #${data.id}` : 'Fill in the details below'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} style={{
            background: '#f5f5f5', border: 'none', borderRadius: '8px',
            width: '34px', height: '34px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <X size={16} color="#888" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <Field label="Product Image" required>
            <ImageUploader value={data.image} onChange={v => set('image', v)} getToken={getToken} />
          </Field>
          <Field label="Product Name" required>
            <Input placeholder="e.g. Varsi Leather Bag" value={data.name} onChange={e => set('name', e.target.value)} required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Price (GBP £)" required>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={data.price} onChange={e => set('price', e.target.value)} required />
            </Field>
            <Field label="Original Price (GBP £)" hint="Leave blank if no discount">
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={data.original_price} onChange={e => set('original_price', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Badge Label" hint="e.g. New, -25%, Hot">
              <Input placeholder="e.g. -25%" value={data.badge_label} onChange={e => set('badge_label', e.target.value)} />
            </Field>
            <Field label="Badge Color">
              <select value={data.badge_color} onChange={e => set('badge_color', e.target.value)} style={{
                width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8',
                borderRadius: '8px', fontFamily: 'Jost,sans-serif', fontSize: '0.92rem',
                outline: 'none', color: '#1a1a1a', background: '#fff', cursor: 'pointer', boxSizing: 'border-box'
              }}>
                {BADGE_COLORS.map(c => <option key={c} value={c}>{c || '— None —'}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Categories" required hint="Comma-separated: best-seller, hot-collection, trendy, new-arrival">
            <Input placeholder="e.g. best-seller, trendy" value={data.categories} onChange={e => set('categories', e.target.value)} required />
          </Field>
          <Field label="Tags" required hint="Keywords for search, comma-separated">
            <Input placeholder="e.g. bag, leather, women" value={data.tags} onChange={e => set('tags', e.target.value)} required />
          </Field>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
            <button type="button" onClick={onCancel} style={{
              padding: '11px 22px', border: '1.5px solid #e0e0e0', borderRadius: '8px',
              background: '#fff', color: '#666', fontFamily: 'Jost,sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <X size={15} /> Cancel
            </button>
            <button type="submit" disabled={saving} style={{
              padding: '11px 22px', border: 'none', borderRadius: '8px',
              background: saving ? '#bbb' : '#1a1a1a', color: '#fff',
              fontFamily: 'Jost,sans-serif', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {saving
                ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                : <><CheckCircle size={15} /> {data.id ? 'Update Product' : 'Create Product'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirm Modal 
function ConfirmDialog({ product, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: 'Jost,sans-serif' }}>
        <div style={{ width: '60px', height: '60px', background: '#ffebee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={26} color="#e53935" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#1a1a1a', fontWeight: 800 }}>Delete Product?</h3>
        <p style={{ margin: '0 0 24px', color: '#777', fontSize: '0.88rem', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>"{product?.name}"</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '10px 22px', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: '#fff', color: '#666', fontFamily: 'Jost,sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <X size={15} /> Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '10px 22px', border: 'none', borderRadius: '8px', background: '#e53935', color: '#fff', fontFamily: 'Jost,sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Live Chat Panel (Admin) 
function LiveChatPanel({ user, getToken, showToast }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [unreadChats, setUnreadChats] = useState({});
  const activeChatRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat) {
      setUnreadChats(prev => {
        const next = { ...prev };
        delete next[activeChat.id];
        return next;
      });
    }
  }, [activeChat]);

  const fetchChats = React.useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/live-chats`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setChats(res.data.chats);
    } catch(e) { console.error(e); }
  }, [getToken]);

  useEffect(() => {
    fetchChats();
    const socket = io(API, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('admin:join');

    socket.on('admin:new_chat', () => { fetchChats(); });
    socket.on('admin:chat_activity', ({ chatId }) => { 
      fetchChats(); 
      setUnreadChats(prev => {
        if (activeChatRef.current && activeChatRef.current.id === chatId) return prev;
        return { ...prev, [chatId]: true };
      });
    });

    return () => socket.disconnect();
  }, [fetchChats]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const parent = messagesEndRef.current.parentNode;
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!activeChat) return;
    const socket = socketRef.current;
    if (socket) socket.emit('admin:join_chat', { chatId: activeChat.id });

    axios.get(`${API}/api/live-chats/${activeChat.id}/messages`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(res => setMessages(res.data.messages))
      .catch(e => console.error(e));

    const handleMessage = (msg) => {
      if (msg.chatId === activeChat.id) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      }
    };
    socket.on('chat:message', handleMessage);
    
    return () => socket.off('chat:message', handleMessage);
  }, [activeChat, getToken]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendReply = (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeChat || activeChat.status === 'closed') return;
    socketRef.current.emit('admin:message', { chatId: activeChat.id, message: reply.trim(), adminName: user.name });
    setReply('');
  };

  const closeChat = async () => {
    if (!activeChat) return;
    try {
      await axios.patch(`${API}/api/live-chats/${activeChat.id}/close`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('Chat closed successfully');
      setActiveChat(prev => ({ ...prev, status: 'closed' }));
      fetchChats();
    } catch(e) { showToast('Failed to close chat'); }
  };

  return (
    <div style={{ display: 'flex', background: '#fff', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', height: '650px', overflow: 'hidden' }}>
      
      {/* Left Sidebar: Chat List */}
      <div style={{ width: '320px', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1a1a1a' }}>Live Chats</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.map(chat => {
            const isUnread = unreadChats[chat.id];
            return (
            <div key={chat.id} onClick={() => setActiveChat(chat)} style={{
              padding: '16px 20px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
              background: activeChat?.id === chat.id ? '#fff' : (isUnread ? '#f0fdf4' : 'transparent'),
              borderLeft: activeChat?.id === chat.id ? '4px solid #1a1a1a' : (isUnread ? '4px solid #25D366' : '4px solid transparent'),
              transition: 'background 0.2s', display: 'flex', gap: '12px', alignItems: 'flex-start'
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>
                {chat.user_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem', color: isUnread ? '#000' : '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
                    {chat.user_name}
                  </strong>
                  <span style={{ fontSize: '0.65rem', color: chat.status === 'open' ? '#4caf50' : '#e53935', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', background: chat.status === 'open' ? '#e8f5e9' : '#ffebee', borderRadius: '4px', flexShrink: 0 }}>
                    {chat.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: isUnread ? '#1a1a1a' : '#888', fontWeight: isUnread ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '12px', flex: 1 }}>
                    {chat.last_message || 'No messages yet'}
                  </p>
                  {isUnread && (
                    <div style={{ width: '20px', height: '20px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, boxShadow: '0 2px 4px rgba(37,211,102,0.3)' }}>
                      1
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
          {chats.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>No active chats.</p>}
        </div>
      </div>

      {/* Right Panel: Active Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a' }}>{activeChat.user_name}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Started {new Date(activeChat.created_at).toLocaleString()}</p>
              </div>
              {activeChat.status === 'open' && (
                <button onClick={closeChat} style={{ padding: '8px 16px', background: '#ffebee', color: '#e53935', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  Resolve Chat
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, idx) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#bbb' }}>{isAdmin ? `Admin · ${msg.sender_name}` : msg.sender_name}</span>
                    <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isAdmin ? '#1a1a1a' : '#fff', color: isAdmin ? '#fff' : '#333', fontSize: '0.9rem', lineHeight: 1.5, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {activeChat.status === 'open' ? (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
                <form onSubmit={sendReply} style={{ display: 'flex', gap: '12px' }}>
                  <input type="text" value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply..." style={{ flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: '24px', outline: 'none', fontSize: '0.9rem', fontFamily: 'Jost,sans-serif' }} />
                  <button type="submit" disabled={!reply.trim()} style={{ width: '44px', height: '44px', borderRadius: '50%', background: reply.trim() ? '#1a1a1a' : '#ccc', color: '#fff', border: 'none', cursor: reply.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', background: '#fafafa', color: '#888', fontSize: '0.85rem' }}>
                This chat session is closed.
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>
            <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a chat from the list to start replying</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mini Chart (Canvas-based tanpa library, pakai Chart.js via CDN) ────────

function useChart(canvasRef, config, deps) {
  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;
    const ctx = canvasRef.current.getContext('2d');
    if (canvasRef.current._chartInstance) {
      canvasRef.current._chartInstance.destroy();
    }
    canvasRef.current._chartInstance = new window.Chart(ctx, config);
    return () => {
      if (canvasRef.current?._chartInstance) {
        canvasRef.current._chartInstance.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ─── Voucher Form Modal ──────────────────────────────────────────────────────

const EMPTY_VOUCHER = {
  code: '', type: 'percent', value: '', min_order: '',
  max_uses: '', expires_at: '', is_active: 1, description: ''
};

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function VoucherForm({ initial, onSave, onCancel, getToken }) {
  const [data, setData] = useState(initial || EMPTY_VOUCHER);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave(data); }
    catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  const labelStyle = {
    display:'block', marginBottom:'6px', fontSize:'0.75rem', fontWeight:700,
    color:'#555', letterSpacing:'0.5px', textTransform:'uppercase', fontFamily:'Jost,sans-serif'
  };
  const inputStyle = {
    width:'100%', padding:'10px 13px', border:'1.5px solid #e8e8e8',
    borderRadius:'8px', fontFamily:'Jost,sans-serif', fontSize:'0.9rem',
    outline:'none', color:'#1a1a1a', background:'#fff', boxSizing:'border-box'
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:7000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)' }}>
      <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'560px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 40px 100px rgba(0,0,0,0.25)', fontFamily:'Jost,sans-serif' }}>
        {/* Header */}
        <div style={{ padding:'22px 28px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(135deg,#1a1a1a,#333)', borderRadius:'20px 20px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.15)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ticket size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>{data.id ? 'Edit Voucher' : 'Create Voucher'}</h3>
              <p style={{ margin:0, fontSize:'0.78rem', color:'rgba(255,255,255,0.6)' }}>Isi form di bawah</p>
            </div>
          </div>
          <button onClick={onCancel} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:'18px' }}>
          {err && (
            <div style={{ padding:'12px 16px', background:'#ffebee', borderRadius:'8px', color:'#c62828', fontSize:'0.85rem', fontWeight:600, display:'flex', alignItems:'center', gap:'8px' }}>
              <AlertTriangle size={15} /> {err}
            </div>
          )}

          {/* Kode */}
          <div>
            <label style={labelStyle}>Kode Voucher *</label>
            <div style={{ display:'flex', gap:'8px' }}>
              <input value={data.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. HEMAT50" required
                style={{ ...inputStyle, flex:1, textTransform:'uppercase', letterSpacing:'2px', fontWeight:700 }} />
              <button type="button" onClick={() => set('code', generateCode())}
                style={{ padding:'10px 14px', background:'#f5f5f5', border:'1.5px solid #e8e8e8', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontFamily:'Jost,sans-serif', fontSize:'0.8rem', fontWeight:700, color:'#555', whiteSpace:'nowrap' }}>
                <Zap size={13} /> Auto
              </button>
            </div>
          </div>

          {/* Type + Value */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div>
              <label style={labelStyle}>Tipe Diskon *</label>
              <select value={data.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="percent">Persentase (%)</option>
                <option value="fixed">Fixed (IDR)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nilai {data.type === 'percent' ? '(%)' : '(IDR)'} *</label>
              <input type="number" min="0" step="0.01" value={data.value} onChange={e => set('value', e.target.value)}
                placeholder={data.type === 'percent' ? 'e.g. 20' : 'e.g. 50000'} required style={inputStyle} />
            </div>
          </div>

          {/* Min Order + Max Uses */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div>
              <label style={labelStyle}>Min. Order (IDR)</label>
              <input type="number" min="0" value={data.min_order} onChange={e => set('min_order', e.target.value)}
                placeholder="0 = tanpa batas" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Maks. Penggunaan</label>
              <input type="number" min="0" value={data.max_uses} onChange={e => set('max_uses', e.target.value)}
                placeholder="0 = unlimited" style={inputStyle} />
            </div>
          </div>

          {/* Expires At */}
          <div>
            <label style={labelStyle}>Tanggal Kadaluarsa</label>
            <input type="datetime-local" value={data.expires_at} onChange={e => set('expires_at', e.target.value)} style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Deskripsi</label>
            <input value={data.description} onChange={e => set('description', e.target.value)}
              placeholder="e.g. Diskon spesial lebaran 20%" style={inputStyle} />
          </div>

          {/* Active Toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'#f8f9fa', borderRadius:'10px' }}>
            <div>
              <p style={{ margin:0, fontWeight:700, color:'#1a1a1a', fontSize:'0.9rem' }}>Aktif</p>
              <p style={{ margin:0, fontSize:'0.78rem', color:'#888' }}>Voucher bisa digunakan oleh customer</p>
            </div>
            <button type="button" onClick={() => set('is_active', data.is_active ? 0 : 1)}
              style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
              {data.is_active
                ? <ToggleRight size={36} color="#4caf50" />
                : <ToggleLeft size={36} color="#ccc" />}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'10px', borderTop:'1px solid #f0f0f0' }}>
            <button type="button" onClick={onCancel} style={{ padding:'11px 20px', border:'1.5px solid #e0e0e0', borderRadius:'9px', background:'#fff', color:'#666', fontFamily:'Jost,sans-serif', fontWeight:700, cursor:'pointer', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'6px' }}>
              <X size={14} /> Batal
            </button>
            <button type="submit" disabled={saving} style={{ padding:'11px 22px', border:'none', borderRadius:'9px', background: saving ? '#bbb' : 'linear-gradient(135deg,#1a1a1a,#333)', color:'#fff', fontFamily:'Jost,sans-serif', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'6px' }}>
              {saving ? <><RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} /> Menyimpan...</> : <><CheckCircle size={14} /> {data.id ? 'Update' : 'Buat Voucher'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Voucher Panel ───────────────────────────────────────────────────────────

function VoucherPanel({ getToken, showToast }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const pieRef = useRef();
  const barRef = useRef();

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/vouchers`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setVouchers(res.data.vouchers);
    } catch { showToast('Gagal memuat voucher'); }
    finally { setLoading(false); }
  }, [getToken, showToast]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  // Pie Chart — Tipe Voucher
  const pct = vouchers.filter(v => v.type === 'percent').length;
  const fix = vouchers.filter(v => v.type === 'fixed').length;
  useChart(pieRef, {
    type: 'doughnut',
    data: {
      labels: ['Persentase (%)', 'Fixed (IDR)'],
      datasets: [{ data: [pct, fix], backgroundColor: ['#667eea', '#f093fb'], borderWidth: 0, hoverOffset: 8 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Jost', size: 12 }, padding: 14 } } } }
  }, [pct, fix]);

  // Bar Chart — Usage count per voucher (top 8)
  const top8 = [...vouchers].sort((a,b) => b.used_count - a.used_count).slice(0, 8);
  useChart(barRef, {
    type: 'bar',
    data: {
      labels: top8.map(v => v.code),
      datasets: [{
        label: 'Dipakai',
        data: top8.map(v => v.used_count),
        backgroundColor: top8.map((_, i) => `hsl(${220 + i * 20}, 70%, 60%)`),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'Jost' } }, grid: { color: '#f0f0f0' } },
        x: { ticks: { font: { family: 'Jost', weight: '700' } }, grid: { display: false } }
      }
    }
  }, [top8.length, top8.map(v => v.used_count).join(',')]);

  const handleSave = async (data) => {
    if (data.id) {
      await axios.put(`${API}/api/vouchers/${data.id}`, data, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('Voucher diperbarui!');
    } else {
      await axios.post(`${API}/api/vouchers`, data, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('Voucher berhasil dibuat!');
    }
    setFormData(null); fetchVouchers();
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/vouchers/${deleteId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('Voucher dihapus.');
      setDeleteId(null); fetchVouchers();
    } catch { showToast('Gagal menghapus.'); }
  };

  const filtered = vouchers.filter(v => v.code.includes(search.toUpperCase()) || (v.description || '').toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (v) => {
    const now = new Date();
    const expired = v.expires_at && new Date(v.expires_at) < now;
    const exhausted = v.max_uses > 0 && v.used_count >= v.max_uses;
    if (!v.is_active) return { label: 'Nonaktif', bg: '#f5f5f5', color: '#999' };
    if (expired)      return { label: 'Kadaluarsa', bg: '#ffebee', color: '#c62828' };
    if (exhausted)    return { label: 'Habis', bg: '#fff3e0', color: '#e65100' };
    return { label: 'Aktif', bg: '#e8f5e9', color: '#2e7d32' };
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {formData && <VoucherForm initial={formData} onSave={handleSave} onCancel={() => setFormData(null)} getToken={getToken} />}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, zIndex:8000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'36px 32px', maxWidth:'360px', width:'90%', textAlign:'center', fontFamily:'Jost,sans-serif' }}>
            <div style={{ width:'60px', height:'60px', background:'#ffebee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={26} color="#e53935" />
            </div>
            <h3 style={{ margin:'0 0 8px', color:'#1a1a1a', fontWeight:800 }}>Hapus Voucher?</h3>
            <p style={{ color:'#777', fontSize:'0.88rem', margin:'0 0 24px' }}>Tindakan ini tidak dapat dibatalkan.</p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding:'10px 20px', border:'1.5px solid #e0e0e0', borderRadius:'8px', background:'#fff', color:'#666', fontFamily:'Jost,sans-serif', fontWeight:700, cursor:'pointer' }}>Batal</button>
              <button onClick={handleDelete} style={{ padding:'10px 20px', border:'none', borderRadius:'8px', background:'#e53935', color:'#fff', fontFamily:'Jost,sans-serif', fontWeight:700, cursor:'pointer' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px' }}>
        {/* Pie */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0' }}>
          <h3 style={{ margin:'0 0 16px', fontSize:'0.9rem', fontWeight:800, color:'#1a1a1a', display:'flex', alignItems:'center', gap:'8px' }}>
            <Percent size={15} color="#667eea" /> Tipe Voucher
          </h3>
          <div style={{ height:'200px', position:'relative' }}>
            {vouchers.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#bbb', fontSize:'0.85rem' }}>Belum ada voucher</div>
            ) : <canvas ref={pieRef} />}
          </div>
        </div>
        {/* Bar */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0' }}>
          <h3 style={{ margin:'0 0 16px', fontSize:'0.9rem', fontWeight:800, color:'#1a1a1a', display:'flex', alignItems:'center', gap:'8px' }}>
            <BarChart2 size={15} color="#667eea" /> Penggunaan per Voucher
          </h3>
          <div style={{ height:'200px', position:'relative' }}>
            {vouchers.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#bbb', fontSize:'0.85rem' }}>Belum ada data</div>
            ) : <canvas ref={barRef} />}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0', overflow:'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#1a1a1a', display:'flex', alignItems:'center', gap:'8px' }}>
            <Ticket size={17} color="#555" /> Daftar Voucher
            <span style={{ background:'#f0f0f0', borderRadius:'50px', padding:'2px 10px', fontSize:'0.75rem', fontWeight:700, color:'#666' }}>{vouchers.length}</span>
          </h2>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f7f8fa', borderRadius:'8px', padding:'9px 14px', border:'1.5px solid #ebebeb', minWidth:'200px' }}>
              <Search size={14} color="#bbb" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode atau deskripsi..."
                style={{ border:'none', background:'transparent', outline:'none', fontFamily:'Jost,sans-serif', fontSize:'0.85rem', color:'#555', width:'100%' }} />
            </div>
            <button onClick={() => setFormData(EMPTY_VOUCHER)}
              style={{ padding:'9px 16px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 4px 12px rgba(102,126,234,0.4)' }}>
              <Plus size={15} /> Buat Voucher
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Jost,sans-serif' }}>
            <thead>
              <tr style={{ background:'#fafafa', borderBottom:'1px solid #f0f0f0' }}>
                {['Kode', 'Tipe', 'Nilai', 'Min. Order', 'Pakai/Maks', 'Kadaluarsa', 'Hemat Diberikan', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:'0.7rem', fontWeight:700, color:'#9e9e9e', letterSpacing:'0.5px', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ padding:'60px', textAlign:'center' }}>
                  <RefreshCw size={26} color="#ddd" style={{ animation:'spin 1s linear infinite' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" style={{ padding:'60px', textAlign:'center', color:'#bbb' }}>
                  <Gift size={32} color="#e0e0e0" style={{ marginBottom:'8px' }} />
                  <p style={{ margin:0, fontFamily:'Jost,sans-serif' }}>Belum ada voucher</p>
                </td></tr>
              ) : filtered.map(v => {
                const badge = statusBadge(v);
                const expiryStr = v.expires_at ? new Date(v.expires_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '∞';
                return (
                  <tr key={v.id} style={{ borderBottom:'1px solid #f5f5f5', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <code style={{ fontWeight:800, letterSpacing:'1.5px', color:'#667eea', fontSize:'0.88rem', background:'#f0f1ff', padding:'3px 8px', borderRadius:'6px' }}>{v.code}</code>
                        <button onClick={() => { navigator.clipboard.writeText(v.code); showToast('Kode disalin!'); }}
                          style={{ background:'none', border:'none', cursor:'pointer', padding:'2px', color:'#bbb', display:'flex' }}>
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:'50px', fontSize:'0.72rem', fontWeight:700,
                        background: v.type === 'percent' ? '#f0f1ff' : '#fff8e1',
                        color: v.type === 'percent' ? '#667eea' : '#f57f17' }}>
                        {v.type === 'percent' ? '% Persen' : 'Fixed IDR'}
                      </span>
                    </td>
                    <td style={{ padding:'13px 14px', fontWeight:800, color:'#1a1a1a', fontSize:'0.9rem' }}>
                      {v.type === 'percent' ? `${v.value}%` : `Rp${Number(v.value).toLocaleString('id-ID')}`}
                    </td>
                    <td style={{ padding:'13px 14px', color:'#666', fontSize:'0.85rem' }}>
                      {Number(v.min_order) > 0 ? `Rp${Number(v.min_order).toLocaleString('id-ID')}` : '—'}
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <div style={{ background:'#f5f5f5', borderRadius:'50px', height:'6px', width:'60px', overflow:'hidden' }}>
                          <div style={{ height:'100%', background:'#667eea', width: v.max_uses > 0 ? `${Math.min((v.used_count / v.max_uses) * 100, 100)}%` : '0%', borderRadius:'50px', transition:'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#555' }}>
                          {v.used_count} / {v.max_uses > 0 ? v.max_uses : '∞'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 14px', fontSize:'0.82rem', color:'#888', display:'flex', alignItems:'center', gap:'5px' }}>
                      <Calendar size={12} /> {expiryStr}
                    </td>
                    <td style={{ padding:'13px 14px', fontWeight:700, color:'#388e3c', fontSize:'0.85rem' }}>
                      Rp{Number(v.total_discount_given || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ padding:'4px 10px', borderRadius:'50px', fontSize:'0.73rem', fontWeight:700, background:badge.bg, color:badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => setFormData({ ...v, expires_at: v.expires_at ? new Date(v.expires_at).toISOString().slice(0,16) : '' })}
                          style={{ padding:'6px 12px', background:'#fff', border:'1.5px solid #e0e0e0', borderRadius:'7px', cursor:'pointer', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:'0.76rem', color:'#555', display:'flex', alignItems:'center', gap:'4px', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='#667eea'; e.currentTarget.style.color='#667eea'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='#e0e0e0'; e.currentTarget.style.color='#555'; }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => setDeleteId(v.id)}
                          style={{ padding:'6px 12px', background:'#fff', border:'1.5px solid #ffcdd2', borderRadius:'7px', cursor:'pointer', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:'0.76rem', color:'#e53935', display:'flex', alignItems:'center', gap:'4px' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ffebee'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 24px', borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ margin:0, fontSize:'0.78rem', color:'#bbb' }}>
            Menampilkan <strong style={{ color:'#666' }}>{filtered.length}</strong> dari <strong style={{ color:'#666' }}>{vouchers.length}</strong> voucher
          </p>
          <button onClick={fetchVouchers} style={{ background:'none', border:'1px solid #eee', borderRadius:'7px', padding:'6px 12px', cursor:'pointer', fontFamily:'Jost,sans-serif', fontSize:'0.78rem', color:'#999', display:'flex', alignItems:'center', gap:'5px' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Panel ─────────────────────────────────────────────────────────

function AnalyticsPanel({ getToken, showToast, currency }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const lineRef = useRef();
  const donutRef = useRef();
  const hbarRef = useRef();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/analytics`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setData(res.data);
    } catch { showToast('Gagal memuat analytics'); }
    finally { setLoading(false); }
  }, [getToken, showToast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Build last 7 days labels
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const revenueMap = {};
  (data?.revenue_trend || []).forEach(r => { revenueMap[r.date?.slice(0,10)] = Number(r.revenue); });

  useChart(lineRef, {
    type: 'line',
    data: {
      labels: last7.map(d => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })),
      datasets: [{
        label: 'Revenue (IDR)',
        data: last7.map(d => revenueMap[d] || 0),
        fill: true,
        backgroundColor: 'rgba(102,126,234,0.12)',
        borderColor: '#667eea',
        borderWidth: 2.5,
        pointBackgroundColor: '#667eea',
        pointRadius: 4,
        tension: 0.4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => `${(v/1000).toFixed(0)}k`, font: { family: 'Jost' } }, grid: { color: '#f0f0f0' } },
        x: { ticks: { font: { family: 'Jost' } }, grid: { display: false } }
      }
    }
  }, [JSON.stringify(revenueMap)]);

  const statusColors = { pending:'#f59e0b', success:'#10b981', settlement:'#10b981', failure:'#ef4444', expire:'#8b5cf6', cancel:'#64748b', completed:'#3b82f6', shipped:'#0ea5e9' };
  const statuses = data?.orders_by_status || [];
  useChart(donutRef, {
    type: 'doughnut',
    data: {
      labels: statuses.map(s => s.status),
      datasets: [{ data: statuses.map(s => s.count), backgroundColor: statuses.map(s => statusColors[s.status] || '#ddd'), borderWidth: 0, hoverOffset: 8 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position:'bottom', labels: { font: { family:'Jost', size:11 }, padding:12 } } } }
  }, [JSON.stringify(statuses)]);

  const topP = data?.top_products || [];
  useChart(hbarRef, {
    type: 'bar',
    data: {
      labels: topP.map(p => p.product_name.length > 18 ? p.product_name.slice(0,18)+'…' : p.product_name),
      datasets: [{
        label: 'Terjual',
        data: topP.map(p => p.total_qty),
        backgroundColor: ['#667eea','#f093fb','#f5576c','#4facfe','#43e97b'],
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision:0, font: { family:'Jost' } }, grid: { color:'#f0f0f0' } },
        y: { ticks: { font: { family:'Jost', weight:'700' } }, grid: { display:false } }
      }
    }
  }, [JSON.stringify(topP)]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'300px' }}>
      <RefreshCw size={32} color="#ddd" style={{ animation:'spin 1s linear infinite' }} />
    </div>
  );

  const s = data?.summary || {};

  const statCards = [
    { icon: DollarSign, label: 'Total Revenue', value: `Rp${Number(s.total_revenue||0).toLocaleString('id-ID')}`, color:'#10b981', bg:'#ecfdf5' },
    { icon: ShoppingCart, label: 'Total Orders', value: s.total_orders || 0, color:'#3b82f6', bg:'#eff6ff' },
    { icon: Users, label: 'Total Users', value: s.total_users || 0, color:'#8b5cf6', bg:'#f5f3ff' },
    { icon: Ticket, label: 'Voucher Aktif', value: s.active_vouchers || 0, color:'#f59e0b', bg:'#fffbeb' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px' }}>
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{ background:'#fff', borderRadius:'14px', padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'46px', height:'46px', borderRadius:'12px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <p style={{ margin:0, fontSize:'0.72rem', color:'#9e9e9e', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', fontFamily:'Jost,sans-serif' }}>{label}</p>
              <p style={{ margin:'4px 0 0', fontSize:'1.5rem', fontWeight:800, color:'#1a1a1a', lineHeight:1, fontFamily:'Jost,sans-serif' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px' }}>
        <div style={{ background:'#fff', borderRadius:'14px', padding:'22px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
            <h3 style={{ margin:0, fontSize:'0.95rem', fontWeight:800, color:'#1a1a1a', fontFamily:'Jost,sans-serif', display:'flex', alignItems:'center', gap:'8px' }}>
              <TrendingUp size={16} color="#667eea" /> Revenue 7 Hari Terakhir
            </h3>
            <span style={{ fontSize:'0.75rem', color:'#bbb', fontFamily:'Jost,sans-serif' }}>Rp (IDR)</span>
          </div>
          <div style={{ height:'220px' }}>
            {statuses.length === 0 && topP.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#bbb', fontSize:'0.85rem', fontFamily:'Jost,sans-serif' }}>Belum ada data transaksi</div>
            ) : <canvas ref={lineRef} />}
          </div>
        </div>
        <div style={{ background:'#fff', borderRadius:'14px', padding:'22px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0' }}>
          <h3 style={{ margin:'0 0 18px', fontSize:'0.95rem', fontWeight:800, color:'#1a1a1a', fontFamily:'Jost,sans-serif', display:'flex', alignItems:'center', gap:'8px' }}>
            <Activity size={16} color="#667eea" /> Status Pesanan
          </h3>
          <div style={{ height:'220px' }}>
            {statuses.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#bbb', fontSize:'0.85rem', fontFamily:'Jost,sans-serif' }}>Belum ada pesanan</div>
            ) : <canvas ref={donutRef} />}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        {/* Top Products */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'22px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0' }}>
          <h3 style={{ margin:'0 0 18px', fontSize:'0.95rem', fontWeight:800, color:'#1a1a1a', fontFamily:'Jost,sans-serif', display:'flex', alignItems:'center', gap:'8px' }}>
            <Package size={16} color="#667eea" /> Top 5 Produk Terlaris
          </h3>
          <div style={{ height:'220px' }}>
            {topP.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#bbb', fontSize:'0.85rem', fontFamily:'Jost,sans-serif' }}>Belum ada data</div>
            ) : <canvas ref={hbarRef} />}
          </div>
        </div>

        {/* Voucher Usage Table */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'22px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f0f0f0' }}>
          <h3 style={{ margin:'0 0 16px', fontSize:'0.95rem', fontWeight:800, color:'#1a1a1a', fontFamily:'Jost,sans-serif', display:'flex', alignItems:'center', gap:'8px' }}>
            <Ticket size={16} color="#667eea" /> Top Voucher Dipakai
          </h3>
          {(data?.voucher_stats || []).length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'180px', color:'#bbb', fontSize:'0.85rem', fontFamily:'Jost,sans-serif' }}>Belum ada penggunaan voucher</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {(data?.voucher_stats || []).slice(0,6).map((v, i) => (
                <div key={v.code} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', background:'#fafafa', borderRadius:'8px' }}>
                  <span style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#667eea', color:'#fff', fontSize:'0.72rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                  <code style={{ flex:1, fontWeight:800, color:'#667eea', fontSize:'0.85rem', letterSpacing:'1px' }}>{v.code}</code>
                  <span style={{ fontSize:'0.78rem', color:'#888', fontFamily:'Jost,sans-serif' }}>{v.usage_count}x</span>
                  <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#388e3c', fontFamily:'Jost,sans-serif' }}>Rp{Number(v.total_discount||0).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign:'right' }}>
        <button onClick={fetchAnalytics} style={{ background:'none', border:'1px solid #eee', borderRadius:'7px', padding:'8px 14px', cursor:'pointer', fontFamily:'Jost,sans-serif', fontSize:'0.78rem', color:'#999', display:'inline-flex', alignItems:'center', gap:'5px' }}>
          <RefreshCw size={12} /> Refresh Data
        </button>
      </div>
    </div>
  );
}

// Main Component 
export default function AdminDashboard({ currency, showToast }) {
  const { user, getToken } = useAuth();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [formData, setFormData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('products');
  const [orders, setOrders]             = useState([]);

  const fetchProducts = () => {
    setLoading(true);
    axios.get(`${API}/api/products`)
      .then(res => setProducts(res.data.products))
      .catch(() => showToast('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchProducts();
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  const fetchOrders = () => {
    setLoading(true);
    axios.get(`${API}/api/admin/orders`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(res => setOrders(res.data.orders))
      .catch(() => showToast('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost,sans-serif', gap: '14px' }}>
        <div style={{ width: '72px', height: '72px', background: '#ffebee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldOff size={32} color="#e53935" />
        </div>
        <h2 style={{ margin: 0, color: '#1a1a1a' }}>Access Denied</h2>
        <p style={{ color: '#888', margin: 0 }}>You do not have admin privileges.</p>
      </div>
    );
  }

  const handleSave = async (payload) => {
    try {
      if (payload.id) {
        await axios.put(`${API}/api/products/${payload.id}`, payload, { headers: { Authorization: `Bearer ${getToken()}` } });
        showToast('Product updated successfully');
      } else {
        await axios.post(`${API}/api/products`, payload, { headers: { Authorization: `Bearer ${getToken()}` } });
        showToast('Product created successfully');
      }
      setFormData(null); fetchProducts();
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/products/${deleteTarget.id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('Product deleted');
      setDeleteTarget(null); fetchProducts();
    } catch {
      showToast('Failed to delete product');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/api/admin/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast(`Order #${orderId} marked as ${newStatus}`);
      fetchOrders();
    } catch (err) {
      showToast('Failed to update order status');
    }
  };

  const openEdit = (p) => setFormData({
    id: p.id, name: p.name, price: p.price,
    original_price: p.original_price || '',
    image: p.image,
    badge_label: p.badge_label || '',
    badge_color: p.badge_color || '',
    categories: (() => { try { return (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories || []).join(', '); } catch { return ''; } })(),
    tags: (() => { try { return (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags || []).join(', '); } catch { return ''; } })(),
  });

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalValue = products.reduce((s, p) => s + Number(p.price), 0);

  return (
    <div style={{ background: '#f7f8fa', minHeight: '100vh', fontFamily: 'Jost,sans-serif', paddingBottom: '60px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {formData && <ProductForm initial={formData} onSave={handleSave} onCancel={() => setFormData(null)} getToken={getToken} />}
      {deleteTarget && <ConfirmDialog product={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* Page Header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ebebeb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '26px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', background: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a' }}>Admin Dashboard</h1>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#aaa' }}>Kelola produk, voucher, pesanan, dan chat pelanggan.</p>
            </div>
          </div>
          {activeTab === 'products' && (
            <button
              onClick={() => setFormData(EMPTY_FORM)}
              style={{
                background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '10px',
                padding: '12px 20px', cursor: 'pointer', fontFamily: 'Jost,sans-serif',
                fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.18)', transition: 'transform 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={16} /> Add New Product
            </button>
          )}
        </div>
        
        {/* Tabs ── */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px', display: 'flex', gap: '28px', overflowX: 'auto' }}>
          {[
            { key: 'products', label: 'Produk', icon: Package },
            { key: 'orders',   label: 'Pesanan', icon: ShoppingCart },
            { key: 'vouchers', label: 'Vouchers', icon: Ticket },
            { key: 'analytics', label: 'Analytics', icon: BarChart2 },
            { key: 'chats',   label: 'Live Chat', icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              background: 'none', border: 'none', padding: '16px 0', cursor: 'pointer', fontFamily: 'Jost,sans-serif',
              fontSize: '0.93rem', fontWeight: activeTab === key ? 800 : 600,
              color: activeTab === key ? '#1a1a1a' : '#888',
              borderBottom: activeTab === key ? '3px solid #1a1a1a' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: '7px', whiteSpace: 'nowrap', transition: 'color 0.2s'
            }}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 40px 0' }}>
        {activeTab === 'products' ? (
          <>
            {/* Stats Row ── */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <StatCard Icon={Package}      label="Total Products"      value={products.length}                                    accent="#1976d2" />
          <StatCard Icon={DollarSign}   label="Total Catalog Value" value={formatPrice(totalValue, currency)}                  accent="#388e3c" />
          <StatCard Icon={Tag}          label="Products on Sale"    value={products.filter(p => p.original_price).length}      accent="#f57c00" />
          <StatCard Icon={CheckCircle}  label="Active Listings"     value={products.length}                                    accent="#7b1fa2" />
        </div>

        {/* Product Table ── */}
        <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={17} color="#555" /> Product Catalog
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f7f8fa', borderRadius: '8px', padding: '9px 14px', border: '1.5px solid #ebebeb', minWidth: '220px' }}>
              <Search size={15} color="#bbb" />
              <input
                type="text" placeholder="Search products..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Jost,sans-serif', fontSize: '0.88rem', color: '#555', width: '100%' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <X size={14} color="#bbb" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['#', 'Image', 'Product Name', 'Price', 'Category', 'Badge', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '60px', textAlign: 'center' }}>
                    <RefreshCw size={28} color="#ddd" style={{ animation: 'spin 1s linear infinite' }} />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#bbb', fontFamily: 'Jost,sans-serif' }}>
                    <Search size={32} color="#ddd" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0 }}>No products found</p>
                  </td></tr>
                ) : filtered.map(p => {
                  let cats = [];
                  try { cats = typeof p.categories === 'string' ? JSON.parse(p.categories) : (p.categories || []); } catch {}
                  const discount = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : null;

                  return (
                    <tr key={p.id}
                      style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <td style={{ padding: '14px 16px', color: '#ccc', fontSize: '0.82rem', fontWeight: 700 }}>#{p.id}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <img src={p.image} alt={p.name}
                          style={{ width: '50px', height: '62px', objectFit: 'cover', borderRadius: '8px', background: '#f5f5f5', border: '1px solid #eee' }}
                          onError={e => { e.target.src = 'https://placehold.co/50x62/f5f5f5/ccc?text=?'; }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem' }}>{p.name}</p>
                        {(() => {
                          try {
                            const ts = typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []);
                            return <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: '#bbb' }}>{ts.slice(0, 3).join(' · ')}</p>;
                          } catch { return null; }
                        })()}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#1a1a1a', fontSize: '0.88rem' }}>{formatPrice(p.price, currency)}</p>
                        {discount && <p style={{ margin: '2px 0 0', fontSize: '0.73rem', color: '#4caf50', fontWeight: 700 }}>−{discount}% off</p>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {cats.slice(0, 2).map(c => (
                            <span key={c} style={{ padding: '3px 10px', background: '#f0f0f0', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, color: '#666', whiteSpace: 'nowrap' }}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {p.badge_label ? (
                          <span style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                            background: p.badge_color === 'red' ? '#ffebee' : p.badge_color === 'green' ? '#e8f5e9' : '#e3f2fd',
                            color: p.badge_color === 'red' ? '#c62828' : p.badge_color === 'green' ? '#2e7d32' : '#1565c0'
                          }}>{p.badge_label}</span>
                        ) : <span style={{ color: '#ddd', fontSize: '0.8rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEdit(p)}
                            style={{
                              padding: '7px 13px', background: '#fff', border: '1.5px solid #e0e0e0',
                              borderRadius: '7px', cursor: 'pointer', fontFamily: 'Jost,sans-serif',
                              fontWeight: 700, fontSize: '0.78rem', color: '#555', transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#1a1a1a'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#555'; }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            style={{
                              padding: '7px 13px', background: '#fff', border: '1.5px solid #ffcdd2',
                              borderRadius: '7px', cursor: 'pointer', fontFamily: 'Jost,sans-serif',
                              fontWeight: 700, fontSize: '0.78rem', color: '#e53935', transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ffebee'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#bbb' }}>
                Showing <strong style={{ color: '#666' }}>{filtered.length}</strong> of <strong style={{ color: '#666' }}>{products.length}</strong> products
              </p>
              <button
                onClick={fetchProducts}
                style={{ background: 'none', border: '1px solid #eee', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'Jost,sans-serif', fontSize: '0.78rem', color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          )}
        </div>
          </>
        ) : activeTab === 'chats' ? (
          <LiveChatPanel user={user} getToken={getToken} showToast={showToast} />
        ) : activeTab === 'vouchers' ? (
          <VoucherPanel getToken={getToken} showToast={showToast} />
        ) : activeTab === 'analytics' ? (
          <AnalyticsPanel getToken={getToken} showToast={showToast} currency={currency} />
        ) : (
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', overflow: 'hidden', padding: '24px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} color="#555" /> Customer Orders
            </h2>
            {loading ? (
               <div style={{ padding: '60px', textAlign: 'center' }}>
                 <RefreshCw size={28} color="#ddd" style={{ animation: 'spin 1s linear infinite' }} />
               </div>
            ) : orders.length === 0 ? (
               <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
                 <p>No orders found.</p>
               </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'Jost,sans-serif' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '2px solid #ebebeb' }}>
                    <th style={{ padding: '14px 16px', color: '#888', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</th>
                    <th style={{ padding: '14px 16px', color: '#888', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                    <th style={{ padding: '14px 16px', color: '#888', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ padding: '14px 16px', color: '#888', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</th>
                    <th style={{ padding: '14px 16px', color: '#888', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                    <th style={{ padding: '14px 16px', color: '#888', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 600 }}>#{order.midtrans_order_id || order.id}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem' }}>{order.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{order.customer_email}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#666' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#555', maxWidth: '200px' }}>{order.items_summary || '-'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: 700, color: '#1a1a1a' }}>{formatPrice(order.gross_amount_idr, 'IDR')}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          style={{
                            padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid #e0e0e0', cursor: 'pointer', outline: 'none',
                            background: ['success', 'completed', 'shipped', 'settlement'].includes(order.status) ? '#e8f5e9' : order.status === 'pending' ? '#fff3e0' : '#ffebee',
                            color: ['success', 'completed', 'shipped', 'settlement'].includes(order.status) ? '#2e7d32' : order.status === 'pending' ? '#ef6c00' : '#c62828'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="success">Paid (Success)</option>
                          <option value="settlement">Paid (Settlement)</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                          <option value="cancel">Cancelled</option>
                          <option value="expire">Expired</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
