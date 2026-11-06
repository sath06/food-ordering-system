const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

// Load local .env values without an extra dependency. Existing process variables take priority.
const fs = require('fs');
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['\"])(.*)\1$/, '$2');
  }
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sweety',
  database: process.env.DB_NAME || 'food_ordering',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function validateFood(body) {
  const food_name = String(body.food_name || '').trim();
  const category = String(body.category || '').trim();
  const price = Number(body.price);
  if (!food_name || !category || body.price === '' || !Number.isFinite(price) || price < 0) {
    return { error: 'Food name, category and a valid non-negative price are required.' };
  }
  return { value: { food_name, category, price, description: String(body.description || '').trim(), availability: body.availability === false || body.availability === 'false' || body.availability === 0 ? 0 : 1 } };
}

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: process.env.DB_NAME || 'food_ordering' }); }
  catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.get('/api/food', async (_req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM food_items ORDER BY food_id DESC'); res.json(rows); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Could not load menu.' }); }
});
app.get('/api/food/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM food_items WHERE food_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Food item not found.' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load food item.' }); }
});
app.post('/api/food', async (req, res) => {
  const checked = validateFood(req.body); if (checked.error) return res.status(400).json({ error: checked.error });
  try {
    const f = checked.value;
    const [result] = await pool.execute('INSERT INTO food_items (food_name,category,price,description,availability) VALUES (?,?,?,?,?)', [f.food_name,f.category,f.price,f.description,f.availability]);
    const [rows] = await pool.execute('SELECT * FROM food_items WHERE food_id=?', [result.insertId]);
    res.status(201).json({ message: 'Food item added to MySQL.', food: rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not add food item.' }); }
});
app.put('/api/food/:id', async (req, res) => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid food ID.' });
  const checked = validateFood(req.body); if (checked.error) return res.status(400).json({ error: checked.error });
  try {
    const f = checked.value;
    const [result] = await pool.execute('UPDATE food_items SET food_name=?,category=?,price=?,description=?,availability=? WHERE food_id=?', [f.food_name,f.category,f.price,f.description,f.availability,id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Food item not found.' });
    const [rows] = await pool.execute('SELECT * FROM food_items WHERE food_id=?', [id]);
    res.json({ message: 'Changes saved to MySQL.', food: rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not update food item.' }); }
});
app.delete('/api/food/:id', async (req, res) => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid food ID.' });
  try {
    const [result] = await pool.execute('DELETE FROM food_items WHERE food_id=?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Food item not found.' });
    res.json({ message: 'Food item deleted from MySQL.' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not delete food item.' }); }
});

app.post('/api/checkout', async (req, res) => {
  const { customerName, phone, address, payment, items } = req.body;
  if (!String(customerName || '').trim() || !String(phone || '').trim() || !String(address || '').trim() || !payment || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Enter customer details and add at least one food item.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const quantities = new Map();
    for (const item of items) {
      const id = Number(item.food_id), qty = Number.parseInt(item.quantity, 10);
      if (Number.isInteger(id) && id > 0 && Number.isInteger(qty) && qty > 0 && qty <= 99) quantities.set(id, (quantities.get(id) || 0) + qty);
    }
    const ids = [...quantities.keys()];
    if (!ids.length) throw new Error('Cart contains no valid items.');
    const [foods] = await connection.query(`SELECT food_id,food_name,price,availability FROM food_items WHERE food_id IN (${ids.map(() => '?').join(',')}) FOR UPDATE`, ids);
    const byId = new Map(foods.map(f => [f.food_id, f]));
    const selected = ids.map(id => {
      const food = byId.get(id), quantity = quantities.get(id);
      if (!food || !food.availability) throw new Error('A selected food item is missing or unavailable. Refresh your menu and try again.');
      return { ...food, quantity, subtotal: Number(food.price) * quantity };
    });
    const total = selected.reduce((sum, f) => sum + f.subtotal, 0);
    const [order] = await connection.execute('INSERT INTO orders (customer_name,phone,delivery_address,payment_method,total_amount) VALUES (?,?,?,?,?)', [String(customerName).trim(),String(phone).trim(),String(address).trim(),String(payment),total]);
    for (const f of selected) await connection.execute('INSERT INTO order_items (order_id,food_id,food_name,unit_price,quantity,subtotal) VALUES (?,?,?,?,?,?)', [order.insertId,f.food_id,f.food_name,f.price,f.quantity,f.subtotal]);
    await connection.commit();
    res.status(201).json({ message: 'Order saved successfully in MySQL.', order_id: order.insertId, total });
  } catch (e) {
    await connection.rollback(); console.error(e);
    res.status(400).json({ error: e.message || 'Could not place order.' });
  } finally { connection.release(); }
});
app.get('/api/orders', async (_req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM orders ORDER BY order_id DESC'); res.json(rows); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Could not load orders.' }); }
});
app.get('/api/orders/:id', async (req, res) => {
  try {
    const [orders] = await pool.execute('SELECT * FROM orders WHERE order_id=?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found.' });
    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load order.' }); }
});

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(PORT, () => console.log(`Sathvika's Restaurant running at http://localhost:${PORT}`));
  } catch (e) {
    console.error('MySQL connection failed:', e.message);
    console.error('Check MySQL is running, database.sql was executed, and .env credentials are correct.');
    process.exit(1);
  }
}
start();
