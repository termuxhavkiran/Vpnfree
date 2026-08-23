const express = require('express');
const bodyParser = require('body-parser');
const DB = require('./db');
const Xray = require('./xray-adapter');
const QRCode = require('qrcode');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const API_KEY = process.env.API_KEY || 'changeme';
const requireApiKey = (req, res, next) => {
  const key = req.header('x-api-key');
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// Health / status
app.get('/api/status', requireApiKey, async (req, res) => {
  const online = await Xray.isRunning();
  const stats = await DB.getStats();
  res.json({
    online,
    trafficUsed: stats.used,
    trafficRemaining: stats.remaining,
    expiration: stats.expiration
  });
});

// Users
app.get('/api/users', requireApiKey, async (req, res) => {
  const users = await DB.allUsers();
  res.json(users);
});

app.post('/api/users', requireApiKey, async (req, res) => {
  const { username, traffic_limit_mb = 1024, expires_at } = req.body;
  try {
    const user = await DB.createUser({ username, traffic_limit_mb, expires_at });
    // try to inform xray adapter
    await Xray.addUser(user).catch(()=>{});
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/users/:id', requireApiKey, async (req, res) => {
  const id = req.params.id;
  await DB.deleteUser(id);
  await Xray.removeUser(id).catch(()=>{});
  res.json({ ok: true });
});

app.patch('/api/users/:id/enable', requireApiKey, async (req, res) => {
  const id = req.params.id;
  const { enable } = req.body;
  await DB.setEnabled(id, !!enable);
  await Xray.updateUserEnabled(id, !!enable).catch(()=>{});
  res.json({ ok: true });
});

app.get('/api/users/:id/config', requireApiKey, async (req, res) => {
  const id = req.params.id;
  const cfg = await Xray.userConfig(id);
  res.json({ config: cfg });
});

app.get('/api/users/:id/qrcode', requireApiKey, async (req, res) => {
  const id = req.params.id;
  const cfg = await Xray.userConfig(id);
  const dataUrl = await QRCode.toDataURL(cfg);
  const base64 = dataUrl.split(',')[1];
  const img = Buffer.from(base64, 'base64');
  res.set('Content-Type', 'image/png');
  res.send(img);
});

// Logs (last N lines)
app.get('/api/logs', requireApiKey, async (req, res) => {
  const n = parseInt(req.query.n || '200', 10);
  const lines = await Xray.tailLogs(n);
  res.json({ lines });
});

// Restart
app.post('/api/restart', requireApiKey, async (req, res) => {
  await Xray.restart().catch(()=>{});
  res.json({ ok: true });
});

// Serve frontend if built
app.use(express.static('../web/dist'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on', PORT));
