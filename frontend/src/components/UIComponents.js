/**
 * Paylaşılan UI Bileşenleri
 * Toast, Skeleton, EmptyState, hover efektleri
 */
import React, { useEffect, useState, useCallback, createContext, useContext, useRef } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   TOAST SİSTEMİ
══════════════════════════════════════════════════════════════════════════════ */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error:   (msg, dur) => addToast(msg, "error", dur),
    info:    (msg, dur) => addToast(msg, "info", dur),
    warning: (msg, dur) => addToast(msg, "warning", dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_STYLES = {
  success: { bg: "#f0fdf4", border: "#86efac", color: "#166534", icon: "✅" },
  error:   { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", icon: "❌" },
  warning: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", icon: "⚠️" },
  info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af", icon: "ℹ️" },
};

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem",
      display: "flex", flexDirection: "column", gap: "0.6rem",
      zIndex: 9999, maxWidth: "360px", width: "100%",
    }}>
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: "0.75rem",
            background: s.bg, border: `1.5px solid ${s.border}`,
            borderRadius: "0.875rem", padding: "0.85rem 1rem",
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            color: s.color, fontSize: "0.875rem", fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            transform: t.leaving ? "translateX(120%)" : "translateX(0)",
            opacity: t.leaving ? 0 : 1,
            transition: "transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease",
            cursor: "pointer",
          }} onClick={() => onRemove(t.id)}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "0.05rem" }}>{s.icon}</span>
            <span style={{ flex: 1, lineHeight: 1.5 }}>{t.message}</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: s.color, opacity: 0.6, fontSize: "1rem", padding: 0, flexShrink: 0 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SKELETON LOADING
══════════════════════════════════════════════════════════════════════════════ */

export function Skeleton({ width = "100%", height = "1rem", borderRadius = "0.5rem", style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "skeleton-shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <Skeleton width="40px" height="40px" borderRadius="0.75rem" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="0.875rem" style={{ marginBottom: "0.4rem" }} />
          <Skeleton width="40%" height="0.75rem" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "70%" : "100%"} height="0.75rem" style={{ marginBottom: "0.5rem" }} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, lines = 2 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 4 }) {
  return (
    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0", padding: "0.75rem 1.25rem", background: "#fafbff", borderBottom: "1px solid #f1f5f9" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width="60%" height="0.7rem" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0", padding: "0.85rem 1.25rem", borderBottom: "1px solid #f8fafc" }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} width={ci === 0 ? "80%" : "50%"} height="0.75rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   EMPTY STATE İLLÜSTRASYONLARI
══════════════════════════════════════════════════════════════════════════════ */

const EMPTY_PRESETS = {
  appointments: {
    emoji: "📅",
    title: "Henüz randevu yok",
    desc: "Psikologunuz müsait slotlar eklediğinde burada görünecek.",
    color: "#0ea5e9",
    bg: "#e0f2fe",
  },
  tasks: {
    emoji: "✅",
    title: "Görev bulunamadı",
    desc: "Psikologunuz size ödev atadığında burada görünecek.",
    color: "#10b981",
    bg: "#d1fae5",
  },
  tests: {
    emoji: "🧪",
    title: "Test bulunamadı",
    desc: "Psikologunuz size test atadığında burada çözebileceksiniz.",
    color: "#8b5cf6",
    bg: "#ede9fe",
  },
  notes: {
    emoji: "📖",
    title: "Paylaşılan not yok",
    desc: "Psikologunuz bir notu sizinle paylaştığında burada görünecek.",
    color: "#f59e0b",
    bg: "#fef3c7",
  },
  clients: {
    emoji: "👥",
    title: "Danışan bulunamadı",
    desc: "Henüz danışan kaydı yok.",
    color: "#6366f1",
    bg: "#ede9fe",
  },
  messages: {
    emoji: "💬",
    title: "Mesaj yok",
    desc: "Henüz bir konuşma başlatılmamış.",
    color: "#6366f1",
    bg: "#ede9fe",
  },
  generic: {
    emoji: "📭",
    title: "Veri bulunamadı",
    desc: "Gösterilecek içerik yok.",
    color: "#94a3b8",
    bg: "#f1f5f9",
  },
};

export function EmptyState({ preset = "generic", title, desc, action, actionLabel, emoji, color, bg }) {
  const p = EMPTY_PRESETS[preset] || EMPTY_PRESETS.generic;
  const finalEmoji = emoji || p.emoji;
  const finalTitle = title || p.title;
  const finalDesc  = desc  || p.desc;
  const finalColor = color || p.color;
  const finalBg    = bg    || p.bg;

  return (
    <div style={{
      background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9",
      padding: "3rem 2rem", textAlign: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,.06)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "1.25rem",
        background: finalBg, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "2rem", marginBottom: "0.25rem",
      }}>
        {finalEmoji}
      </div>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{finalTitle}</h3>
      <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, maxWidth: "280px", margin: 0 }}>{finalDesc}</p>
      {action && (
        <button onClick={action} style={{
          marginTop: "0.5rem", padding: "0.55rem 1.25rem", borderRadius: "0.625rem",
          background: `linear-gradient(135deg, ${finalColor}, ${finalColor}cc)`,
          color: "#fff", fontWeight: 700, fontSize: "0.82rem", border: "none",
          cursor: "pointer", boxShadow: `0 4px 12px ${finalColor}40`,
        }}>
          {actionLabel || "Başla"}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOVER BUTTON — tıklanabilir kart/buton için hover state
══════════════════════════════════════════════════════════════════════════════ */

export function HoverCard({ children, style = {}, onClick, hoverStyle = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        transition: "box-shadow 0.2s ease, transform 0.15s ease",
        cursor: onClick ? "pointer" : "default",
        ...(hovered ? {
          boxShadow: "0 8px 24px rgba(0,0,0,.10)",
          transform: "translateY(-1px)",
          ...hoverStyle,
        } : {}),
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function HoverButton({ children, style = {}, hoverStyle = {}, onClick, disabled, type = "button" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: "all 0.15s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        ...(hovered && !disabled ? hoverStyle : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   BADGE — durum rozeti
══════════════════════════════════════════════════════════════════════════════ */

const BADGE_VARIANTS = {
  green:  { bg: "#d1fae5", color: "#065f46" },
  red:    { bg: "#fee2e2", color: "#991b1b" },
  blue:   { bg: "#dbeafe", color: "#1e40af" },
  yellow: { bg: "#fef3c7", color: "#92400e" },
  purple: { bg: "#ede9fe", color: "#5b21b6" },
  gray:   { bg: "#f1f5f9", color: "#64748b" },
  cyan:   { bg: "#e0f2fe", color: "#0369a1" },
};

export function Badge({ children, variant = "gray", style = {} }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "0.2rem 0.65rem", borderRadius: "9999px",
      fontSize: "0.7rem", fontWeight: 700,
      background: v.bg, color: v.color,
      ...style,
    }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════════════════════════ */

export function ProgressBar({ value, max, color = "#6366f1", label, showPercent = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ width: "100%" }}>
      {(label || showPercent) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
          {label && <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{label}</span>}
          {showPercent && <span style={{ fontSize: "0.75rem", color: color, fontWeight: 700 }}>{pct}%</span>}
        </div>
      )}
      <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: "9999px",
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   COUNTDOWN — randevu geri sayımı
══════════════════════════════════════════════════════════════════════════════ */

export function Countdown({ targetDate }) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    const calc = () => {
      const ms = new Date(targetDate) - new Date();
      if (ms <= 0) { setDiff(null); return; }
      const days    = Math.floor(ms / 86400000);
      const hours   = Math.floor((ms % 86400000) / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      setDiff({ days, hours, minutes });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (!diff) return null;

  const parts = [];
  if (diff.days > 0)    parts.push(`${diff.days} gün`);
  if (diff.hours > 0)   parts.push(`${diff.hours} saat`);
  if (diff.minutes > 0) parts.push(`${diff.minutes} dk`);

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "0.72rem", color: "#0369a1", fontWeight: 700,
      background: "#e0f2fe", padding: "0.15rem 0.55rem", borderRadius: "9999px",
    }}>
      ⏱ {parts.join(" ")} kaldı
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   GLOBAL CSS — skeleton animasyonu + hover geçişleri
══════════════════════════════════════════════════════════════════════════════ */

export function GlobalStyles() {
  return (
    <style>{`
      @keyframes skeleton-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes toast-in {
        from { transform: translateX(120%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .ui-fade-in { animation: fade-in 0.25s ease forwards; }

      /* Hover geçişleri — tüm interaktif kartlar */
      .hover-card {
        transition: box-shadow 0.2s ease, transform 0.15s ease;
      }
      .hover-card:hover {
        box-shadow: 0 8px 24px rgba(0,0,0,.10) !important;
        transform: translateY(-1px);
      }
      .hover-row {
        transition: background 0.12s ease;
      }
      .hover-row:hover {
        background: #f8fafc !important;
      }
      .hover-btn {
        transition: all 0.15s ease;
      }
      .hover-btn:hover:not(:disabled) {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,.15);
      }
      .hover-btn:active:not(:disabled) {
        transform: translateY(0);
      }
      .hover-nav-item {
        transition: background 0.12s ease, color 0.12s ease;
      }
      .hover-nav-item:hover {
        background: #f1f5f9 !important;
        color: #1e293b !important;
      }
      /* Tablo satırları */
      table tbody tr {
        transition: background 0.1s ease;
      }
      table tbody tr:hover {
        background: #f8fafc;
      }
      /* Sidebar nav butonları */
      nav button:hover:not([style*="background: linear-gradient"]) {
        background: #f1f5f9 !important;
      }
      /* Scrollbar */
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #f8fafc; }
      ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
      ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `}</style>
  );
}