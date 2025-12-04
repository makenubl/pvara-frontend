import React, { useState } from "react";

export default function LoginInline({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="space-y-2">
      <input placeholder="username" className="border p-1 rounded w-full text-xs" value={username} onChange={e=>setUsername(e.target.value)} />
      <input placeholder="password" type="password" className="border p-1 rounded w-full text-xs" value={password} onChange={e=>setPassword(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={()=>onLogin({username,password})} className="bg-white text-green-700 px-2 py-1 rounded text-xs">Login</button>
      </div>
    </div>
  );
}
