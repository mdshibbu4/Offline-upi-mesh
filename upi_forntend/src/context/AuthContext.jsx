import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api.js";
import { ensureKeys } from "../lib/crypto.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const cached = () => { 
  try { 
    return JSON.parse(localStorage.getItem("user")); 
  }
 catch { 
  return null;
  } 
};

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [keyStatus, setKeyStatus] = useState("checking");

  const setUser = (u) => {
    setUserState(u);
    if (u) localStorage.setItem("user", JSON.stringify(u)); else localStorage.removeItem("user");
  };

  const setupKeys = (u) =>
    ensureKeys(u).then(setKeyStatus).catch(() => setKeyStatus("error"));

  // Restore session. If we are offline, keep the cached user instead of logging out.
  useEffect(() => {
    if (!getToken()) return;
    api("/api/auth/me")
      .then((d) => { setUser(d.user); setupKeys(d.user); })
      .catch((e) => {
        if (e.status === 401) { setToken(null); setUser(null); }
        else { const u = cached(); if (u) { setUserState(u); setupKeys(u); } }
      })
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (path, body) => {
    const d = await api(path, { method: "POST", body });
    setToken(d.token);
    setUser(d.user);
    setupKeys(d.user);
  };

  const value = {
    user, loading, keyStatus,
    login: (email, password) => authenticate("/api/auth/login", { email, password }),
    register: (name, email, password) => authenticate("/api/auth/register", { name, email, password }),
    logout: () => { setToken(null); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
