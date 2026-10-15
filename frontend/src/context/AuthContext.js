/**
 * Auth Context — JWT token ve kullanıcı bilgisini global olarak yönetir.
 * Tüm bileşenler useAuth() hook'u ile kullanıcı bilgisine erişebilir.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Sayfa yenilenince localStorage'dan kullanıcıyı yükle
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.me();
      if (res && res.data) {
        setUser(res.data);
      } else {
        localStorage.clear();
        setUser(null);
      }
    } catch {
      // Token geçersizse temizle
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    // Önce mevcut token'ları temizle
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem("access_token",  res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      const me = await authAPI.me();
      if (!me || !me.data) {
        // me başarısız olursa token'ları temizle
        localStorage.clear();
        throw new Error("Kullanıcı bilgileri alınamadı.");
      }
      setUser(me.data);
      return me.data;
    } catch (err) {
      // Hata durumunda token'ları temizle, user state'i null yap
      localStorage.clear();
      setUser(null);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) await authAPI.logout(refresh);
    } catch {
      // Token zaten geçersizse sessizce geç
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}