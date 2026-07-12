import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Package, DollarSign, Tag, CheckCircle, Plus, Search, X,
  Edit2, Trash2, Upload, Settings, AlertTriangle, Image as ImageIcon,
  ChevronRight, RefreshCw, ShieldOff, LayoutDashboard, MessageSquare, Send
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';

const API = 'http://localhost:5000';
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

// Main Component 
export default function AdminDashboard({ currency, showToast }) {
  const { user, getToken } = useAuth();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [formData, setFormData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('products');

  const fetchProducts = () => {
    setLoading(true);
    axios.get(`${API}/api/products`)
      .then(res => setProducts(res.data.products))
      .catch(() => showToast('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

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
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#aaa' }}>Manage your products, inventory, and live customer chats.</p>
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px', display: 'flex', gap: '32px' }}>
          <button onClick={() => setActiveTab('products')} style={{
            background: 'none', border: 'none', padding: '16px 0', cursor: 'pointer', fontFamily: 'Jost,sans-serif',
            fontSize: '0.95rem', fontWeight: activeTab === 'products' ? 800 : 600,
            color: activeTab === 'products' ? '#1a1a1a' : '#888',
            borderBottom: activeTab === 'products' ? '3px solid #1a1a1a' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}><Package size={18}/> Product Catalog</button>
          
          <button onClick={() => setActiveTab('chats')} style={{
            background: 'none', border: 'none', padding: '16px 0', cursor: 'pointer', fontFamily: 'Jost,sans-serif',
            fontSize: '0.95rem', fontWeight: activeTab === 'chats' ? 800 : 600,
            color: activeTab === 'chats' ? '#1a1a1a' : '#888',
            borderBottom: activeTab === 'chats' ? '3px solid #1a1a1a' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}><MessageSquare size={18}/> Live Chats</button>
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
        ) : (
          <LiveChatPanel user={user} getToken={getToken} showToast={showToast} />
        )}
      </div>
    </div>
  );
}
