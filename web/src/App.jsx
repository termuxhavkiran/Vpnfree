import React, { useEffect, useState } from 'react'
import UserTable from './components/UserTable'

const API = (path, opts={}) => {
  const base = process.env.VITE_API_BASE || '';
  const headers = { 'Content-Type':'application/json', 'x-api-key': localStorage.getItem('api_key') || '' };
  return fetch(base + path, Object.assign({ headers }, opts)).then(r=>r.json());
}

export default function App(){
  const [users,setUsers] = useState([]);
  const [status,setStatus] = useState({});

  const load = async ()=>{
    try{
      const s = await API('/api/status');
      setStatus(s);
      const u = await API('/api/users');
      setUsers(u);
    }catch(e){ console.error(e); }
  }

  useEffect(()=>{ load(); },[]);

  const onAction = async (act,user)=>{
    if(act==='view'){
      const cfg = await API(`/api/users/${user.id}/config`);
      alert(cfg.config);
    }
    if(act==='qrcode'){
      window.open(`/api/users/${user.id}/qrcode`,'_blank');
    }
    if(act==='toggle'){
      await API(`/api/users/${user.id}/enable`, { method:'PATCH', body: JSON.stringify({ enable: !user.enabled }) });
      load();
    }
    if(act==='delete'){
      if(!confirm('Delete user?')) return;
      await API(`/api/users/${user.id}`, { method:'DELETE' });
      load();
    }
  }

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-gray-100">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Vpnfree — Panel</h1>
          <div className="text-sm">
            Status: {status.online? 'Online':'Offline'}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 border rounded">Traffic Used<br/><strong>{status.trafficUsed || 0} MB</strong></div>
          <div className="p-3 border rounded">Traffic Remaining<br/><strong>{status.trafficRemaining || 0} MB</strong></div>
          <div className="p-3 border rounded">Expiration<br/><strong>{status.expiration || '-'}</strong></div>
          <div className="p-3 border rounded">Users<br/><strong>{users.length}</strong></div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg">Users</h2>
            <button onClick={async ()=>{
              const name = prompt('username?'); if(!name) return;
              await fetch('/api/users',{ method:'POST', headers:{'Content-Type':'application/json','x-api-key': localStorage.getItem('api_key')||''}, body: JSON.stringify({ username: name }) }); load();
            }} className="px-3 py-1 bg-gray-800 rounded">New</button>
          </div>
          <UserTable users={users} onAction={onAction} />
        </section>
      </div>
    </div>
  )
}
