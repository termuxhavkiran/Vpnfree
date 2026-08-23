const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const XRAY_BIN = process.env.XRAY_LOCAL_BIN || '/usr/local/bin/xray';
const XRAY_CONFIG = process.env.XRAY_CONFIG_PATH || '/etc/xray/config.json';
const LOG_PATH = process.env.XRAY_LOG_PATH || '/var/log/xray/access.log';
const XRAY_API_URL = process.env.XRAY_API_URL || null;

module.exports = {
  isRunning: async () => {
    if (XRAY_API_URL) return true; // assume remote node reachable for status
    try {
      execSync(`pgrep -f ${XRAY_BIN}`);
      return true;
    } catch (e) {
      return false;
    }
  },
  restart: async () => {
    if (XRAY_API_URL) {
      try {
        await fetch(`${XRAY_API_URL}/admin/restart`, { method: 'POST' });
      } catch (e) {}
      return;
    }
    try {
      execSync(`pkill -f ${XRAY_BIN} || true`);
      const child = spawn(XRAY_BIN, ['-config', XRAY_CONFIG], { detached: true, stdio: 'ignore' });
      child.unref();
    } catch (e) { console.error(e); }
  },
  addUser: async (user) => {
    // Minimal: do nothing or call XRAY API if present
    if (XRAY_API_URL) {
      try { await fetch(`${XRAY_API_URL}/admin/users`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user) }); } catch(e){}
    }
  },
  removeUser: async (id) => {
    if (XRAY_API_URL) {
      try { await fetch(`${XRAY_API_URL}/admin/users/${id}`, { method: 'DELETE' }); } catch(e){}
    }
  },
  updateUserEnabled: async (id, enabled) => {
    if (XRAY_API_URL) {
      try { await fetch(`${XRAY_API_URL}/admin/users/${id}/enable`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({enable: !!enabled}) }); } catch(e){}
    }
  },
  userConfig: async (id) => {
    // generate a placeholder config string (the UI can show/copy this)
    return `vmess://PLACEHOLDER_USER_${id}`;
  },
  tailLogs: async (n = 200) => {
    try {
      const out = execSync(`tail -n ${n} ${LOG_PATH}`).toString();
      return out.split('\n').filter(Boolean);
    } catch (e) {
      return [];
    }
  }
};
