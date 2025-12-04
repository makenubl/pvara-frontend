// src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

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
      return JSON.parse(localStorage.getItem("pvara_user")) || null;
    } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem("pvara_user", JSON.stringify(user));
  }, [user]);

  const login = useCallback(({ username, password }) => {
    const found = demoUsers.find(u => u.username === username && u.password === password);
    if (!found) return { ok: false, message: "Invalid credentials" };
    const payload = { username: found.username, role: found.role, name: found.name };
    setUser(payload);
    return { ok: true, user: payload };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("pvara_user");
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (typeof roles === "string") roles = [roles];
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo(() => ({ user, login, logout, hasRole }), [user, login, logout, hasRole]);

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
