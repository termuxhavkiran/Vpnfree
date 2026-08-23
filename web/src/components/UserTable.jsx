import React from 'react'

export default function UserTable({ users, onAction }){
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-gray-400">
        <tr>
          <th className="p-2">Username</th>
          <th className="p-2">Status</th>
          <th className="p-2">Traffic</th>
          <th className="p-2">Expiration</th>
          <th className="p-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u=> (
          <tr key={u.id} className="border-t border-gray-700">
            <td className="p-2">{u.username}</td>
            <td className="p-2">{u.enabled? 'Online':'Disabled'}</td>
            <td className="p-2">{u.traffic_used}/{u.traffic_limit_mb} MB</td>
            <td className="p-2">{u.expires_at || '-'}</td>
            <td className="p-2 text-right">
              <button onClick={()=>onAction('view',u)} className="mx-1 text-sm">View</button>
              <button onClick={()=>onAction('qrcode',u)} className="mx-1 text-sm">QR</button>
              <button onClick={()=>onAction('toggle',u)} className="mx-1 text-sm">{u.enabled? 'Disable':'Enable'}</button>
              <button onClick={()=>onAction('delete',u)} className="mx-1 text-sm text-red-400">Del</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
