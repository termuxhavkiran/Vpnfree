const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = process.env.JSON_DB_PATH || path.join(__dirname, '..', 'data', 'db.json');

function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

async function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  allUsers: async () => {
    const db = await readDb();
    return db.users.sort((a,b)=>b.created_at.localeCompare(a.created_at));
  },
  createUser: async ({ username, traffic_limit_mb = 1024, expires_at = null }) => {
    const db = await readDb();
    if (db.users.find(u=>u.username===username)) throw new Error('username exists');
    const user = {
      id: uuidv4(),
      username,
      enabled: true,
      traffic_used: 0,
      traffic_limit_mb,
      expires_at,
      config: null,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    await writeDb(db);
    return user;
  },
  deleteUser: async (id) => {
    const db = await readDb();
    db.users = db.users.filter(u=>u.id!==id);
    await writeDb(db);
  },
  setEnabled: async (id, enabled) => {
    const db = await readDb();
    const u = db.users.find(x=>x.id===id);
    if (u) u.enabled = enabled;
    await writeDb(db);
  },
  getStats: async () => {
    const db = await readDb();
    const used = db.users.reduce((s,u)=>s+(u.traffic_used||0),0);
    const limit = db.users.reduce((s,u)=>s+(u.traffic_limit_mb||0),0);
    return { used, remaining: Math.max(0, limit-used), expiration: null };
  },
  getUserById: async (id) => {
    const db = await readDb();
    return db.users.find(u=>u.id===id);
  }
};
