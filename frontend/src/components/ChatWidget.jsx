import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, X, Send, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';

const MIN_W = 300;
const MIN_H = 360;
const MAX_W = 720;
const MAX_H = 800;
const DEFAULT_W = 350;
const DEFAULT_H = 480;

export default function ChatWidget() {
  const [isOpen, setIsOpen]         = useState(false);
  const [message, setMessage]       = useState('');
  const [history, setHistory]       = useState([
    { role: 'model', text: 'Halo! Saya Casbot, customer service Casmart. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [isLoading, setIsLoading]   = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Resize state
  const [size, setSize]         = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const resizing                = useRef(false);
  const startPos                = useRef({ x: 0, y: 0 });
  const startSize               = useRef({ w: DEFAULT_W, h: DEFAULT_H });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) { scrollToBottom(); setHasNewMessage(false); }
  }, [history, isOpen]);

  const toggleChat = () => {
    setIsOpen(prev => { if (!prev) setHasNewMessage(false); return !prev; });
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setSize({ w: DEFAULT_W, h: DEFAULT_H });
    } else {
      setSize({ w: Math.min(680, window.innerWidth - 48), h: Math.min(700, window.innerHeight - 100) });
    }
    setIsMaximized(prev => !prev);
  };

  // ── Resize handlers ──────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    resizing.current = true;
    startPos.current  = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = 'nwse-resize';
  }, [size]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!resizing.current) return;
      const dx = startPos.current.x - e.clientX;  // dragging left = grow width
      const dy = startPos.current.y - e.clientY;  // dragging up   = grow height
      const newW = Math.min(MAX_W, Math.max(MIN_W, startSize.current.w + dx));
      const newH = Math.min(MAX_H, Math.max(MIN_H, startSize.current.h + dy));
      setSize({ w: newW, h: newH });
      setIsMaximized(false);
    };
    const onMouseUp = () => {
      resizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor     = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = message.trim();
    setMessage('');
    const newHistory = [...history, { role: 'user', text: userMsg }];
    setHistory(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: history.slice(1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');
      setHistory([...newHistory, { role: 'model', text: data.reply }]);
      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      setHistory([...newHistory, { role: 'model', text: `Error: ${err.message}` }]);
      if (!isOpen) setHasNewMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, fontFamily: 'Jost, sans-serif' }}>

      {/* ── Chat Window ────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        right: 0,
        width:  `${size.w}px`,
        height: `${size.h}px`,
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: resizing.current ? 'none' : 'opacity 0.3s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: 'bottom right',
      }}>

        {/* ── Resize handle (top-left corner) ── */}
        <div
          onMouseDown={onResizeMouseDown}
          title="Drag to resize"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '22px', height: '22px',
            cursor: 'nwse-resize',
            zIndex: 10,
            borderRadius: '16px 0 8px 0',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
            padding: '5px',
          }}
        >
          {/* Visual grip dots */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="6" cy="2" r="1.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="2" cy="6" r="1.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="10" cy="2" r="1.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="6" cy="6" r="1.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="2" cy="10" r="1.5" fill="rgba(255,255,255,0.6)" />
          </svg>
        </div>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          color: '#fff', padding: '14px 16px 14px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={18} color="#333" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Casbot</h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#ccc' }}>Customer Service AI</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Maximize / Restore button */}
            <button
              onClick={toggleMaximize}
              title={isMaximized ? 'Restore' : 'Maximize'}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            {/* Close button */}
            <button
              onClick={toggleChat}
              title="Close"
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#1a1a1a' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#333',
                fontSize: '0.88rem', lineHeight: 1.5,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div className="typing-dot" style={{ animationDelay: '0s' }} />
                <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div style={{ padding: '12px 14px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ketik pesan..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '24px', outline: 'none', fontSize: '0.88rem', fontFamily: 'Jost, sans-serif' }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: (!message.trim() || isLoading) ? '#ccc' : '#1a1a1a', color: '#fff', border: 'none', cursor: (!message.trim() || isLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Floating Toggle Button ── */}
      <button
        onClick={toggleChat}
        style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          color: '#fff', border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.3s',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'rotate(0) scale(1)',
          position: 'relative',
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {(!isOpen && hasNewMessage) && (
          <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: '#e53935', borderRadius: '50%', border: '2px solid #fff' }} />
        )}
      </button>

      <style>{`
        .typing-dot {
          width: 6px; height: 6px; background: #bbb; border-radius: 50%;
          animation: typing 1s infinite alternate;
        }
        @keyframes typing {
          0%   { transform: translateY(0);   opacity: 0.5; }
          100% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
