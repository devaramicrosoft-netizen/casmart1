import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, X, Send, MessageSquare, Maximize2, Minimize2, User, Headphones, ChevronLeft } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
const MIN_W = 300, MIN_H = 360, MAX_W = 720, MAX_H = 800;
const DEFAULT_W = 360, DEFAULT_H = 500;

let socketInstance = null;
function getSocket() {
  if (!socketInstance) socketInstance = io(SOCKET_URL, { transports: ['websocket'] });
  return socketInstance;
}

// Mode Selector Screen 
function ModeSelector({ onSelectBot, onSelectLive, isLoggedIn }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px', background: '#f9f9f9' }}>
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#555', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How can we help?</p>

      {/* Casbot AI */}
      <button onClick={onSelectBot} style={{
        width: '100%', padding: '18px 20px', background: '#fff', border: '1.5px solid #e0e0e0',
        borderRadius: '14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
        gap: '14px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ width: '44px', height: '44px', background: '#1a1a1a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={22} color="#fff" />
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', fontFamily: 'Jost,sans-serif' }}>Casbot AI</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#888', fontFamily: 'Jost,sans-serif' }}>Jawab instan · Tersedia 24/7</p>
        </div>
      </button>

      {/* Live Admin */}
      <button onClick={onSelectLive} style={{
        width: '100%', padding: '18px 20px', background: '#fff', border: '1.5px solid #e0e0e0',
        borderRadius: '14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
        gap: '14px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        opacity: isLoggedIn ? 1 : 0.5
      }}
        onMouseEnter={e => { if (isLoggedIn) { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ width: '44px', height: '44px', background: isLoggedIn ? '#e8f5e9' : '#f5f5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          <Headphones size={22} color={isLoggedIn ? '#2e7d32' : '#bbb'} />
          {isLoggedIn && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: '#4caf50', borderRadius: '50%', border: '2px solid #fff' }} />}
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', fontFamily: 'Jost,sans-serif' }}>Live Admin Chat</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#888', fontFamily: 'Jost,sans-serif' }}>
            {isLoggedIn ? 'Chat langsung dengan tim kami' : 'Login dulu untuk akses fitur ini'}
          </p>
        </div>
      </button>
    </div>
  );
}

// Main Widget 
export default function ChatWidget({ user }) {
  const [isOpen, setIsOpen]           = useState(false);
  const [mode, setMode]               = useState(null); // null | 'bot' | 'live'
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize]               = useState({ w: DEFAULT_W, h: DEFAULT_H });

  // Bot state
  const [botMessage, setBotMessage]   = useState('');
  const [botHistory, setBotHistory]   = useState([
    { role: 'model', text: 'Halo! Saya Casbot, customer service Casmart. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [botLoading, setBotLoading]   = useState(false);

  // Live chat state
  const [liveMsg, setLiveMsg]         = useState('');
  const [liveHistory, setLiveHistory] = useState([]);
  const [chatId, setChatId]           = useState(null);
  const [liveStatus, setLiveStatus]   = useState('idle'); // idle | connecting | open | closed
  const [unreadLive, setUnreadLive]   = useState(0);

  const messagesEndRef = useRef(null);
  const resizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: DEFAULT_W, h: DEFAULT_H });

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const parent = messagesEndRef.current.parentNode;
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
    }
  };
  useEffect(() => { if (isOpen) { scrollToBottom(); setHasNewMessage(false); } }, [botHistory, liveHistory, isOpen, mode]);

  // Socket.io for live chat 
  useEffect(() => {
    if (mode !== 'live') return;
    const socket = getSocket();

    socket.on('chat:message', (msg) => {
      setLiveHistory(prev => [...prev, msg]);
      if (msg.sender_role === 'admin') {
        if (!isOpen || mode !== 'live') { setHasNewMessage(true); setUnreadLive(n => n + 1); }
      }
    });

    socket.on('chat:closed', () => {
      setLiveStatus('closed');
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:closed');
    };
  }, [mode, isOpen]);

  const startLiveChat = useCallback(async () => {
    if (!user) return;
    setLiveStatus('connecting');
    const socket = getSocket();
    socket.emit('customer:start', { userId: user.id, userName: user.name }, (res) => {
      if (res?.success) {
        setChatId(res.chatId);
        setLiveStatus('open');
        const history = res.history || [];
        setLiveHistory([
          ...history,
          { sender_role: 'system', message: res.statusMessage || 'Sesi chat dimulai. Admin akan segera membalas!' }
        ]);
      } else {
        setLiveStatus('error');
        setLiveHistory([{ sender_role: 'system', message: res?.error || 'Koneksi gagal.' }]);
      }
    });
  }, [user]);

  const sendLiveMessage = (e) => {
    e.preventDefault();
    if (!liveMsg.trim() || !chatId || liveStatus !== 'open') return;
    const socket = getSocket();
    socket.emit('customer:message', { chatId, message: liveMsg.trim(), userName: user.name });
    setLiveMsg('');
  };

  // Casbot AI 
  const handleBotSend = async (e) => {
    e.preventDefault();
    if (!botMessage.trim()) return;
    const userMsg = botMessage.trim();
    setBotMessage('');
    const newHistory = [...botHistory, { role: 'user', text: userMsg }];
    setBotHistory(newHistory);
    setBotLoading(true);
    try {
      const res = await fetch(`${SOCKET_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: botHistory.slice(1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setBotHistory([...newHistory, { role: 'model', text: data.reply }]);
      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      setBotHistory([...newHistory, { role: 'model', text: `Error: ${err.message}` }]);
    } finally {
      setBotLoading(false);
    }
  };

  // Resize 
  const onResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    resizing.current = true;
    startPos.current  = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = 'nwse-resize';
  }, [size]);

  useEffect(() => {
    const onMove = (e) => {
      if (!resizing.current) return;
      const newW = Math.min(MAX_W, Math.max(MIN_W, startSize.current.w + (startPos.current.x - e.clientX)));
      const newH = Math.min(MAX_H, Math.max(MIN_H, startSize.current.h + (startPos.current.y - e.clientY)));
      setSize({ w: newW, h: newH });
      setIsMaximized(false);
    };
    const onUp = () => { resizing.current = false; document.body.style.userSelect = ''; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const toggleMaximize = () => {
    if (isMaximized) { setSize({ w: DEFAULT_W, h: DEFAULT_H }); }
    else { setSize({ w: Math.min(680, window.innerWidth - 48), h: Math.min(700, window.innerHeight - 100) }); }
    setIsMaximized(p => !p);
  };

  const toggleChat = () => {
    setIsOpen(p => { if (!p) { setHasNewMessage(false); setUnreadLive(0); } return !p; });
  };

  const goBack = () => {
    setMode(null);
    if (mode === 'live') { setLiveHistory([]); setChatId(null); setLiveStatus('idle'); }
  };

  // Render helpers 
  const headerTitle = mode === 'bot' ? 'Casbot AI' : mode === 'live' ? 'Live Admin Chat' : 'Casmart Support';
  const headerSub   = mode === 'bot' ? 'Asisten virtual' : mode === 'live'
    ? (liveStatus === 'open' ? 'Admin online' : liveStatus === 'connecting' ? 'Menghubungkan...' : liveStatus === 'closed' ? 'Sesi selesai' : '')
    : 'Pilih cara bantuan';

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, fontFamily: 'Jost, sans-serif' }}>

      {/* Chat Window ── */}
      <div style={{
        position: 'absolute', bottom: '80px', right: 0,
        width: `${size.w}px`, height: `${size.h}px`,
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 16px 56px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: resizing.current ? 'none' : 'opacity 0.3s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: 'bottom right',
      }}>

        {/* Resize grip */}
        <div onMouseDown={onResizeMouseDown} title="Drag to resize" style={{ position: 'absolute', top: 0, left: 0, width: '22px', height: '22px', cursor: 'nwse-resize', zIndex: 10, padding: '5px', borderRadius: '16px 0 8px 0', display: 'flex' }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="6" cy="2" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="2" cy="6" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="10" cy="2" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="6" cy="6" r="1.5" fill="rgba(255,255,255,0.5)"/><circle cx="2" cy="10" r="1.5" fill="rgba(255,255,255,0.5)"/></svg>
        </div>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', color: '#fff', padding: '14px 16px 14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {mode && (
              <button onClick={goBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '6px', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={16} />
              </button>
            )}
            <div style={{ width: '34px', height: '34px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {mode === 'live' ? <Headphones size={18} color="#333" /> : <Bot size={18} color="#333" />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{headerTitle}</h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#ccc' }}>{headerSub}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={toggleMaximize} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >{isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
            <button onClick={toggleChat} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            ><X size={14} /></button>
          </div>
        </div>

        {/* Body */}
        {!mode && (
          <ModeSelector
            onSelectBot={() => setMode('bot')}
            onSelectLive={() => { if (user) { setMode('live'); startLiveChat(); } }}
            isLoggedIn={!!user}
          />
        )}

        {mode === 'bot' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {botHistory.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? '#1a1a1a' : '#fff', color: msg.role === 'user' ? '#fff' : '#333', fontSize: '0.88rem', lineHeight: 1.5, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {botLoading && (
                <div style={{ display: 'flex' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div className="typing-dot" style={{ animationDelay: '0s' }} />
                    <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                    <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '12px 14px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
              <form onSubmit={handleBotSend} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={botMessage} onChange={e => setBotMessage(e.target.value)} placeholder="Ketik pesan..." disabled={botLoading}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '24px', outline: 'none', fontSize: '0.88rem', fontFamily: 'Jost,sans-serif' }} />
                <button type="submit" disabled={!botMessage.trim() || botLoading}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: (!botMessage.trim() || botLoading) ? '#ccc' : '#1a1a1a', color: '#fff', border: 'none', cursor: (!botMessage.trim() || botLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}

        {mode === 'live' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {liveStatus === 'connecting' && (
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.85rem', padding: '20px' }}>
                  <div className="typing-dot" style={{ display: 'inline-block', animationDelay: '0s', marginRight: '4px' }} />
                  <div className="typing-dot" style={{ display: 'inline-block', animationDelay: '0.2s', marginRight: '4px' }} />
                  <div className="typing-dot" style={{ display: 'inline-block', animationDelay: '0.4s' }} />
                  <p style={{ marginTop: '8px' }}>Menghubungkan ke admin...</p>
                </div>
              )}
              {liveHistory.map((msg, idx) => {
                if (msg.sender_role === 'system') return (
                  <div key={idx} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#bbb', padding: '4px 0' }}>{msg.message}</div>
                );
                const isMe = msg.sender_role === 'customer';
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#bbb' }}>{isMe ? 'You' : `Admin · ${msg.sender_name || 'Admin'}`}</span>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#1a1a1a' : '#fff', color: isMe ? '#fff' : '#333', fontSize: '0.88rem', lineHeight: 1.5, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              {liveStatus === 'closed' && (
                <div style={{ textAlign: 'center', background: '#fff3e0', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', color: '#e65100' }}>
                  Sesi chat telah ditutup oleh admin.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '12px 14px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
              <form onSubmit={sendLiveMessage} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={liveMsg} onChange={e => setLiveMsg(e.target.value)} placeholder={liveStatus === 'open' ? 'Ketik pesan ke admin...' : liveStatus === 'closed' ? 'Sesi sudah ditutup' : 'Menghubungkan...'} disabled={liveStatus !== 'open'}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '24px', outline: 'none', fontSize: '0.88rem', fontFamily: 'Jost,sans-serif', background: liveStatus !== 'open' ? '#f9f9f9' : '#fff' }} />
                <button type="submit" disabled={!liveMsg.trim() || liveStatus !== 'open'}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: (!liveMsg.trim() || liveStatus !== 'open') ? '#ccc' : '#1a1a1a', color: '#fff', border: 'none', cursor: (!liveMsg.trim() || liveStatus !== 'open') ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Toggle Button ── */}
      <button onClick={toggleChat} style={{
        width: '60px', height: '60px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        color: '#fff', border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s',
        transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'rotate(0) scale(1)',
        position: 'relative',
      }}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {(!isOpen && (hasNewMessage || unreadLive > 0)) && (
          <div style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px', background: '#e53935', borderRadius: '9px', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, padding: '0 3px' }}>
            {unreadLive > 0 ? unreadLive : ''}
          </div>
        )}
      </button>

      <style>{`
        .typing-dot { width:6px;height:6px;background:#bbb;border-radius:50%;display:inline-block;animation:typing 1s infinite alternate; }
        @keyframes typing { 0%{transform:translateY(0);opacity:0.5} 100%{transform:translateY(-4px);opacity:1} }
      `}</style>
    </div>
  );
}
