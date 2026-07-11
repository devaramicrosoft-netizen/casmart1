import React, { useState, useEffect, useRef } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen]     = useState(false);
  const [message, setMessage]   = useState('');
  const [history, setHistory]   = useState([
    { role: 'model', text: 'Halo! Saya Casbot, customer service Casmart. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewMessage(false);
    }
  }, [history, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setHasNewMessage(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = message.trim();
    setMessage('');
    
    // Add user message to history
    const newHistory = [...history, { role: 'user', text: userMsg }];
    setHistory(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: history.slice(1) // exclude the first greeting from history sent to API if desired, but we can just send it all
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setHistory([...newHistory, { role: 'model', text: data.reply }]);
      if (!isOpen) setHasNewMessage(true);

    } catch (err) {
      setHistory([...newHistory, { role: 'model', text: `⚠️ Error: ${err.message}` }]);
      if (!isOpen) setHasNewMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, fontFamily: 'Jost, sans-serif' }}>
      
      {/* Chat Window */}
      <div style={{
        position: 'absolute', bottom: '80px', right: 0,
        width: '350px', height: '480px',
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: 'bottom right'
      }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', color: '#fff',
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              🤖
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Casbot</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#ccc' }}>Customer Service AI</p>
            </div>
          </div>
          <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#1a1a1a' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#333',
                fontSize: '0.9rem', lineHeight: 1.4,
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                display: 'flex', gap: '4px', alignItems: 'center'
              }}>
                <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #eee' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ketik pesan..."
              style={{
                flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '24px',
                outline: 'none', fontSize: '0.9rem', fontFamily: 'Jost, sans-serif'
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: (!message.trim() || isLoading) ? '#ccc' : '#1a1a1a',
                color: '#fff', border: 'none', cursor: (!message.trim() || isLoading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              ➤
            </button>
          </form>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          color: '#fff', border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', transition: 'transform 0.3s',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'rotate(0) scale(1)'
        }}
      >
        {isOpen ? '✕' : '💬'}
        {(!isOpen && hasNewMessage) && (
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '16px', height: '16px', background: '#e53935',
            borderRadius: '50%', border: '2px solid #fff'
          }} />
        )}
      </button>

      <style>{`
        .typing-dot {
          width: 6px; height: 6px; background: #999; borderRadius: 50%;
          animation: typing 1s infinite alternate;
        }
        @keyframes typing {
          0% { transform: translateY(0); opacity: 0.5; }
          100% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
