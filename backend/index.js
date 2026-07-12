const express      = require('express');
const cors         = require('cors');
const dotenv       = require('dotenv');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const midtransClient = require('midtrans-client');
const Groq         = require('groq-sdk');

dotenv.config();

const db                    = require('./db');
const { verifyToken, verifyAdmin, JWT_SECRET } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// ── Midtrans Snap Client ────────────────────────────────────────────────────
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey:    process.env.MIDTRANS_SERVER_KEY || 'YOUR_SERVER_KEY',
  clientKey:    process.env.MIDTRANS_CLIENT_KEY || 'YOUR_CLIENT_KEY',
});

// ════════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── POST /api/auth/register ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    // Check duplicate email
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0)
      return res.status(409).json({ error: 'Email is already registered. Please login.' });

    // Hash password & insert
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hash]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, name: name.trim(), email: email.toLowerCase().trim(), role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: result.insertId, name: name.trim(), email: email.toLowerCase().trim(), role: 'user' },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Email or password is incorrect.' });

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch)
      return res.status(401).json({ error: 'Email or password is incorrect.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  PAYMENT ROUTES (Protected)
// ════════════════════════════════════════════════════════════════════════════

// ── POST /api/create-transaction ─────────────────────────────────────────
app.post('/api/create-transaction', verifyToken, async (req, res) => {
  const { order_id, gross_amount, customer_details, item_details, currency_display } = req.body;

  // Use logged-in user's name & email as customer details
  const customer = {
    first_name: req.user.name.split(' ')[0] || req.user.name,
    last_name:  req.user.name.split(' ').slice(1).join(' ') || '',
    email:      req.user.email,
    phone:      customer_details?.phone || '08111222333',
  };

  const midtransOrderId = order_id || ('CASMART-' + Date.now());

  try {
    const parameter = {
      transaction_details: {
        order_id:     midtransOrderId,
        gross_amount: gross_amount || 10000,
      },
      credit_card: { secure: true },
      customer_details: customer,
      ...(item_details ? { item_details } : {}),
    };

    const transaction = await snap.createTransaction(parameter);

    // Save order to DB
    const [orderResult] = await db.query(
      `INSERT INTO orders 
        (user_id, midtrans_order_id, gross_amount_idr, currency_display, status, snap_token)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [req.user.id, midtransOrderId, gross_amount, currency_display || 'IDR', transaction.token]
    );

    // Save order items
    if (item_details && item_details.length > 0) {
      const itemRows = item_details.map(i => [
        orderResult.insertId,
        i.id,
        i.name,
        i.price,
        i.quantity,
      ]);
      await db.query(
        'INSERT INTO order_items (order_id, product_id, product_name, price_idr, quantity) VALUES ?',
        [itemRows]
      );
    }

    return res.status(200).json({
      token:        transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (err) {
    console.error('Transaction error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders ───────────────────────────────────────────────────────
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.midtrans_order_id, o.gross_amount_idr, o.currency_display,
              o.status, o.created_at,
              GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ', ') AS items_summary
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({ orders });
  } catch (err) {
    console.error('Orders fetch error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/notification (Midtrans Webhook) ─────────────────────────────
app.post('/api/notification', async (req, res) => {
  try {
    const coreApi = new midtransClient.CoreApi({
      isProduction: false,
      serverKey:    process.env.MIDTRANS_SERVER_KEY || 'YOUR_SERVER_KEY',
      clientKey:    process.env.MIDTRANS_CLIENT_KEY || 'YOUR_CLIENT_KEY',
    });

    const statusResponse = await coreApi.transaction.notification(req.body);
    const { order_id, transaction_status, fraud_status } = statusResponse;

    console.log(`[Webhook] Order: ${order_id} | Status: ${transaction_status} | Fraud: ${fraud_status}`);

    let dbStatus = 'pending';
    if (transaction_status === 'capture') {
      dbStatus = fraud_status === 'challenge' ? 'pending' : 'success';
    } else if (transaction_status === 'settlement') {
      dbStatus = 'success';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      dbStatus = transaction_status === 'expire' ? 'expire' : 'failure';
    }

    await db.query(
      'UPDATE orders SET status = ? WHERE midtrans_order_id = ?',
      [dbStatus, order_id]
    );

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  PRODUCTS ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── GET /api/products (Public) ───────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY id ASC');
    return res.status(200).json({ products: rows });
  } catch (err) {
    console.error('Products fetch error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/products (Admin) ───────────────────────────────────────────
app.post('/api/products', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, price, original_price, image, badge_label, badge_color, categories, tags } = req.body;
    const [result] = await db.query(
      'INSERT INTO products (name, price, original_price, image, badge_label, badge_color, categories, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price, original_price || null, image, badge_label || null, badge_color || null, JSON.stringify(categories || []), JSON.stringify(tags || [])]
    );
    return res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (err) {
    console.error('Product create error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ── PUT /api/products/:id (Admin) ────────────────────────────────────────
app.put('/api/products/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, price, original_price, image, badge_label, badge_color, categories, tags } = req.body;
    await db.query(
      'UPDATE products SET name=?, price=?, original_price=?, image=?, badge_label=?, badge_color=?, categories=?, tags=? WHERE id=?',
      [name, price, original_price || null, image, badge_label || null, badge_color || null, JSON.stringify(categories || []), JSON.stringify(tags || []), req.params.id]
    );
    return res.status(200).json({ message: 'Product updated' });
  } catch (err) {
    console.error('Product update error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ── DELETE /api/products/:id (Admin) ─────────────────────────────────────
app.delete('/api/products/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
    return res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Product delete error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});
//  CHATBOT ROUTE (Groq AI)
// ════════════════════════════════════════════════════════════════════════════

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Groq API Key belum dikonfigurasi di backend.' });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const systemInstruction = `
Kamu adalah Casbot, asisten customer service virtual untuk toko e-commerce bernama "Casmart". 
Kamu ramah, sopan, dan sangat membantu. Bahasa utamamu adalah Bahasa Indonesia.
Berikut informasi tentang Casmart:
- Menjual barang fashion premium (tas kulit, kemeja, sepatu boots, polo, smart watch, kacamata).
- Harga produk menggunakan kurs dasar GBP (£), dan bisa dikonversi ke USD ($) atau IDR (Rp). (1 GBP = 1.27 USD = Rp 20.500)
- Kami memberikan GRATIS ONGKIR (Free Shipping) untuk pesanan di atas £599.
- Kami punya diskon khusus: Varsi Leather Bag diskon 25%.
- Kebijakan pengembalian barang 30 hari.
- Pembayaran 100% aman menggunakan payment gateway Midtrans.
- Wajib login dulu sebelum bisa checkout.

Jawab pertanyaan pelanggan secara singkat, ramah, dan profesional berdasarkan informasi di atas. Jika ditanya hal di luar fashion atau Casmart, tolak dengan sopan.
    `.trim();

    const messages = [];
    messages.push({ role: 'system', content: systemInstruction });
    
    // Convert frontend history to Groq (OpenAI format)
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.text
        });
      });
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return res.status(200).json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('Groq Chat Error:', err);
    let errorMessage = 'Mohon maaf, layanan chat sedang gangguan. Silakan coba lagi nanti.';
    
    if (err.status === 429) {
      errorMessage = 'Maaf, batas limit API (Rate Limit) Groq sedang penuh. Silakan coba beberapa detik lagi.';
    } else if (err.status === 401 || err.status === 403) {
      errorMessage = 'Maaf, API Key Groq Anda tidak valid.';
    }

    return res.status(500).json({ error: errorMessage });
  }
});

// ── GET / ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Casmart Payment Gateway API v2.0 — Auth + MySQL enabled' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
