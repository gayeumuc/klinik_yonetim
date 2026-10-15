import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, GlobalStyles } from "./components/UIComponents";

// Sayfalar
import Home                   from "./pages/Home";
import Login                  from "./pages/Login";
import AdminLogin             from "./pages/AdminLogin";
import { PasswordResetRequest, PasswordResetConfirm } from "./pages/PasswordReset";
import InviteConfirm          from "./pages/InviteConfirm";
import PsychologistDashboard  from "./pages/PsychologistDashboard";
import ClientDashboard        from "./pages/ClientDashboard";
import ClientList             from "./pages/ClientList";
import ClientForm             from "./pages/ClientForm";

import "./index.css";

// ── Yükleniyor Bileşeni ───────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "2rem" }}>🏥</div>
      <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
      <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Yükleniyor...</p>
    </div>
  );
}

// ── Korumalı Route ────────────────────────────────────────────────────────────
function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "psychologist" ? "/psikolog" : "/danisan"} replace />;
  }
  return children;
}

// ── Danışan-only Public Route (psikolog bu sayfaya erişebilir ama yönlendirilmez) ──
function ClientPublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  // Sadece danışan giriş yapmışsa yönlendir
  if (user && user.role === "client") {
    return <Navigate to="/danisan" replace />;
  }
  return children;
}

// ── Ana Uygulama ──────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Genel anasayfa — herkese açık */}
      <Route path="/" element={<Home />} />

      {/* Danışan giriş sayfası — yalnızca danışan girişi, psikolog /admin-giris kullanmalı */}
      <Route
        path="/login"
        element={
          <ClientPublicRoute>
            <Login />
          </ClientPublicRoute>
        }
      />

      {/* Admin / Psikolog giriş sayfası — yönlendirme AdminLogin içinde yönetiliyor */}
      <Route path="/admin-giris" element={<AdminLogin />} />

      {/* Şifre sıfırlama — giriş yapmadan erişilebilir */}
      <Route path="/sifre-sifirla" element={<PasswordResetRequest />} />
      <Route path="/sifre-sifirla/:uid/:token" element={<PasswordResetConfirm />} />
      <Route path="/sifre-sifirla/:uid/:token/" element={<PasswordResetConfirm />} />

      {/* Danışan davet onayı — psikolog tarafından gönderilen link */}
      <Route path="/davet/:uid/:token" element={<InviteConfirm />} />
      <Route path="/davet/:uid/:token/" element={<InviteConfirm />} />

      {/* ── Psikolog Rotaları ─────────────────────────────────────────────── */}
      <Route path="/psikolog" element={
        <PrivateRoute role="psychologist"><PsychologistDashboard /></PrivateRoute>
      } />
      <Route path="/psikolog/danisanlar" element={
        <PrivateRoute role="psychologist"><ClientList /></PrivateRoute>
      } />
      <Route path="/psikolog/danisanlar/yeni" element={
        <PrivateRoute role="psychologist"><ClientForm /></PrivateRoute>
      } />
      <Route path="/psikolog/danisanlar/:id" element={
        <PrivateRoute role="psychologist"><ClientForm /></PrivateRoute>
      } />

      {/* ── Danışan Rotaları ──────────────────────────────────────────────── */}
      <Route path="/danisan" element={
        <PrivateRoute role="client"><ClientDashboard /></PrivateRoute>
      } />

      {/* 404 → anasayfa */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <GlobalStyles />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
