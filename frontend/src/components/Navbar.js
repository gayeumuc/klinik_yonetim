import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPsychologist = user?.role === "psychologist";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems = isPsychologist
    ? [
        { to: "/psikolog",            label: "Dashboard",  icon: "📊" },
        { to: "/psikolog/danisanlar", label: "Danışanlar", icon: "👥" },
      ]
    : [
        { to: "/danisan", label: "Dashboard", icon: "📊" },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to={isPsychologist ? "/psikolog" : "/danisan"} style={styles.logo}>
          <span style={styles.logoIcon}>🏥</span>
          <span style={styles.logoText}>KlinikYönetim</span>
        </Link>

        {/* Navigasyon — masaüstü */}
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                ...styles.navLink,
                ...(isActive(item.to) ? styles.navLinkActive : {}),
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Sağ — kullanıcı (masaüstü) */}
        <div style={styles.right}>
          {/* Hızlı eylemler */}
          {isPsychologist && (
            <Link to="/psikolog/danisanlar/yeni" className="btn btn-primary btn-sm hide-mobile">
              + Danışan Ekle
            </Link>
          )}

          {/* Kullanıcı dropdown */}
          <div style={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
            <div className="avatar avatar-sm">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={styles.userInfo} className="hide-mobile">
              <span style={styles.userEmail}>{user?.email}</span>
              <span style={styles.userRole}>
                {isPsychologist ? "🩺 Psikolog" : "👤 Danışan"}
              </span>
            </div>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ color: "#94a3b8", transition: "transform .2s", transform: menuOpen ? "rotate(180deg)" : "none" }}>
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Dropdown menü */}
          {menuOpen && (
            <>
              <div style={styles.overlay} onClick={() => setMenuOpen(false)} />
              <div style={styles.dropdown}>
                <div style={styles.dropdownHeader}>
                  <div className="avatar avatar-md">{user?.email?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={styles.dropdownEmail}>{user?.email}</div>
                    <div style={styles.dropdownRole}>
                      {isPsychologist ? "🩺 Psikolog" : "👤 Danışan"}
                    </div>
                  </div>
                </div>
                <div style={styles.dropdownDivider} />
                {isPsychologist && (
                  <>
                    <Link to="/psikolog" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      <span>📊</span> Dashboard
                    </Link>
                    <Link to="/psikolog/danisanlar" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      <span>👥</span> Danışanlar
                    </Link>
                    <Link to="/psikolog/danisanlar/yeni" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      <span>➕</span> Yeni Danışan
                    </Link>
                    <div style={styles.dropdownDivider} />
                  </>
                )}
                <a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer" style={styles.dropdownItem}>
                  <span>📖</span> API Dokümantasyonu
                </a>
                {isPsychologist && (
                  <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer" style={styles.dropdownItem}>
                    <span>⚙️</span> Admin Paneli
                  </a>
                )}
                <div style={styles.dropdownDivider} />
                <button onClick={handleLogout} style={styles.dropdownLogout}>
                  <span>🚪</span> Çıkış Yap
                </button>
              </div>
            </>
          )}

          {/* Hamburger — mobil */}
          <button
            className="hamburger-btn show-mobile"
            style={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menü"
          >
            <span style={styles.hamburgerLine} />
            <span style={styles.hamburgerLine} />
            <span style={styles.hamburgerLine} />
          </button>
        </div>
      </div>

      {/* Mobil menü */}
      {mobileOpen && (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileUser}>
            <div className="avatar avatar-sm">{user?.email?.[0]?.toUpperCase()}</div>
            <div>
              <div style={styles.mobileEmail}>{user?.email}</div>
              <div style={styles.mobileRole}>{isPsychologist ? "🩺 Psikolog" : "👤 Danışan"}</div>
            </div>
          </div>
          <div style={styles.mobileDivider} />
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                ...styles.mobileNavItem,
                ...(isActive(item.to) ? styles.mobileNavItemActive : {}),
              }}
              onClick={() => setMobileOpen(false)}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
          {isPsychologist && (
            <Link
              to="/psikolog/danisanlar/yeni"
              style={styles.mobileNavItem}
              onClick={() => setMobileOpen(false)}
            >
              <span>➕</span> Yeni Danışan Ekle
            </Link>
          )}
          <div style={styles.mobileDivider} />
          <button onClick={handleLogout} style={styles.mobileLogout}>
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    background: "rgba(255,255,255,.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #f1f5f9",
    position: "sticky",
    top: 0,
    zIndex: 200,
    boxShadow: "0 1px 3px rgba(0,0,0,.04)",
  },
  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 1.5rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
    flexShrink: 0,
  },
  logoIcon: { fontSize: "1.4rem" },
  logoText: { fontWeight: 800, fontSize: "1rem", color: "#6366f1", letterSpacing: "-.02em" },
  navLinks: { display: "flex", gap: "0.15rem", flex: 1 },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.45rem 0.85rem",
    borderRadius: "0.5rem",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#64748b",
    transition: "all .15s",
  },
  navLinkActive: {
    background: "#ede9fe",
    color: "#6366f1",
    fontWeight: 700,
  },
  right: { display: "flex", alignItems: "center", gap: "0.75rem", position: "relative", flexShrink: 0 },
  userBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.4rem 0.75rem 0.4rem 0.4rem",
    borderRadius: "0.625rem",
    cursor: "pointer",
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    transition: "all .15s",
    userSelect: "none",
  },
  userInfo: { display: "flex", flexDirection: "column" },
  userEmail: { fontSize: "0.78rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 },
  userRole: { fontSize: "0.68rem", color: "#94a3b8" },
  overlay: { position: "fixed", inset: 0, zIndex: 199 },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    background: "#fff",
    borderRadius: "0.875rem",
    boxShadow: "0 20px 40px rgba(0,0,0,.12)",
    border: "1px solid #f1f5f9",
    minWidth: "220px",
    zIndex: 300,
    overflow: "hidden",
  },
  dropdownHeader: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem" },
  dropdownEmail: { fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" },
  dropdownRole: { fontSize: "0.72rem", color: "#94a3b8" },
  dropdownDivider: { height: "1px", background: "#f1f5f9" },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.7rem 1rem",
    fontSize: "0.875rem",
    color: "#475569",
    textDecoration: "none",
    transition: "background .1s",
    cursor: "pointer",
  },
  dropdownLogout: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.7rem 1rem",
    fontSize: "0.875rem",
    color: "#ef4444",
    background: "none",
    border: "none",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    fontWeight: 600,
  },

  /* Hamburger */
  hamburger: {
    display: "none",
    flexDirection: "column",
    gap: "4px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.4rem",
    borderRadius: "0.375rem",
    "@media (max-width: 768px)": { display: "flex" },
  },
  hamburgerLine: {
    display: "block",
    width: "20px",
    height: "2px",
    background: "#475569",
    borderRadius: "9999px",
  },

  /* Mobil menü */
  mobileMenu: {
    background: "#fff",
    borderTop: "1px solid #f1f5f9",
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  mobileUser: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0 0.75rem" },
  mobileEmail: { fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" },
  mobileRole: { fontSize: "0.72rem", color: "#94a3b8" },
  mobileDivider: { height: "1px", background: "#f1f5f9", margin: "0.25rem 0" },
  mobileNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.65rem 0.75rem",
    borderRadius: "0.5rem",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#475569",
    transition: "all .15s",
  },
  mobileNavItemActive: {
    background: "#ede9fe",
    color: "#6366f1",
    fontWeight: 700,
  },
  mobileLogout: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.65rem 0.75rem",
    borderRadius: "0.5rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#ef4444",
    fontWeight: 600,
    textAlign: "left",
    width: "100%",
  },
};