const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Extract body content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
let bodyContent = bodyMatch ? bodyMatch[1] : html;

// Remove scripts at the end
bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

// Fix self-closing tags
bodyContent = bodyContent.replace(/<(img|input|br|hr|ion-icon)([^>]*?)(?<!\/)>/g, '<$1$2 />');
// Fix class to className
bodyContent = bodyContent.replace(/class=/g, 'className=');
// Fix for to htmlFor
bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');
// Fix inline styles
bodyContent = bodyContent.replace(/style="([^"]*)"/g, (match, p1) => {
    const styleObj = {};
    p1.split(';').forEach(style => {
        if (!style.trim()) return;
        let [key, value] = style.split(':');
        if (key && value) {
            key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
            styleObj[key] = value.trim();
        }
    });
    return `style={${JSON.stringify(styleObj)}}`;
});
// Fix HTML comments
bodyContent = bodyContent.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// wrap in fragment
const jsxContent = `import React from 'react';
import './App.css';

function App() {
  const handlePayment = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: 'ORDER-' + Math.floor(Math.random() * 10000),
          gross_amount: 150000,
          customer_details: {
            first_name: "React",
            last_name: "User",
            email: "react@example.com",
            phone: "08112222333"
          }
        })
      });
      const data = await response.json();
      if (data.token) {
        window.snap.pay(data.token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Midtrans Snap script should be in frontend/index.html */}
      <div className="midtrans-demo-bar" style={{ background: '#ffeb3b', padding: '10px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
        <p><strong>Demo Mode:</strong> Click any 'Add to Cart' or 'Buy' button to test Midtrans Payment! <button onClick={handlePayment} style={{ background: '#333', color: '#fff', padding: '5px 15px', marginLeft: '10px', borderRadius: '5px', cursor: 'pointer' }}>Test Payment Now</button></p>
      </div>
      ${bodyContent}
    </>
  );
}

export default App;
`;

fs.writeFileSync('frontend/src/App.jsx', jsxContent);
console.log('Converted HTML to JSX in App.jsx');
