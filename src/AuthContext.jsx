// src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext();

const demoUsers = [
  { username: "admin", password: "admin", role: "admin", name: "Admin User" },
  { username: "hr", password: "hr", role: "hr", name: "HR User" },
  { username: "recruit", password: "rec", role: "recruiter", name: "Recruiter" },
  { username: "viewer", password: "view", role: "viewer", name: "Viewer" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("pvara_user");
      if (stored) return JSON.parse(stored);
      // Auto-login as admin for demo
      const defaultUser = { username: "admin", role: "admin", name: "Admin User" };
      return defaultUser;
    } catch { 
      return { username: "admin", role: "admin", name: "Admin User" };
    }
  });

  useEffect(() => {
    localStorage.setItem("pvara_user", JSON.stringify(user));
  }, [user]);

  function login({ username, password }) {
    // Check demo users first
    let found = demoUsers.find(u => u.username === username && u.password === password);
    
    // If not found in demo users, check HR users from localStorage
    if (!found) {
      try {
        const stateData = localStorage.getItem('pvara_v3');
        if (stateData) {
          const state = JSON.parse(stateData);
          if (state.hrUsers) {
            found = state.hrUsers.find(u => u.username === username && u.password === password);
          }
        }
      } catch (err) {
        console.error('Error reading HR users:', err);
      }
    }
    
    if (!found) return { ok: false, message: "Invalid credentials" };
    const payload = { username: found.username, role: found.role, name: found.name };
    setUser(payload);
    return { ok: true, user: payload };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("pvara_user");
  }

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === "string") roles = [roles];
    return roles.includes(user.role);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
