/**
 * MessagingPanel — Psikolog ↔ Danışan mesajlaşma bileşeni
 *
 * Özellikler:
 *   - Konuşma listesi (aktif / arşivlenmiş)
 *   - Konuşma arşivleme / arşivden çıkarma (kişi bazlı)
 *   - Mesaj geçmişi (tümü / yıldızlı)
 *   - Mesaj içi arama
 *   - Mesaj yıldızlama
 *   - İstatistik kartları
 *   - Okunmamış badge
 *
 * Props:
 *   currentUserEmail  {string}  — Giriş yapan kullanıcının e-postası
 *   role              {string}  — "psychologist" | "client"
 *   accentColor       {string}  — Tema rengi
 *   accentGradient    {string}  — Gradient string (örn: "135deg,#6366f1,#8b5cf6")
 */
import React, { useEffect, useState, useRef } from "react";
import { messageAPI } from "../services/api";

export default function MessagingPanel({
  currentUserEmail,
  role,
  accentColor = "#6366f1",
  accentGradient = "135deg,#6366f1,#8b5cf6",
}) {
  // ── Konuşma listesi ──────────────────────────────────────────────────────
  const [conversations,    setConversations]    = useState([]);
  const [convFilter,       setConvFilter]       = useState("active"); // active | archived
  const [convSearch,       setConvSearch]       = useState("");
  const [convLoading,      setConvLoading]      = useState(false);

  // ── Seçili konuşma & mesajlar ────────────────────────────────────────────
  const [selectedConv,     setSelectedConv]     = useState(null);
  const [messages,         setMessages]         = useState([]);
  const [msgFilter,        setMsgFilter]        = useState("all"); // all | starred
  const [msgSearch,        setMsgSearch]        = useState("");
  const [msgSearchInput,   setMsgSearchInput]   = useState("");
  const [msgLoading,       setMsgLoading]       = useState(false);

  // ── Gönderme ─────────────────────────────────────────────────────────────
  const [msgInput,         setMsgInput]         = useState("");
  const [msgSending,       setMsgSending]       = useState(false);

  // ── İstatistikler & hata ─────────────────────────────────────────────────
  const [msgStats,         setMsgStats]         = useState(null);
  const [msgError,         setMsgError]         = useState("");

  const messagesEndRef = useRef(null);

  // ── İlk yükleme ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations("active");
    messageAPI.stats().then(r => setMsgStats(r.data)).catch(() => {});
  }, []); // eslint-disable-line

  // ── Mesajlar güncellenince en alta kaydır ─────────────────────────────────
  useEffect(() => {
    if (msgFilter === "all" && !msgSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, msgFilter, msgSearch]);

  // ── Konuşma listesini yükle ───────────────────────────────────────────────
  const loadConversations = (show = convFilter) => {
    setConvLoading(true);
    messageAPI.conversations(show)
      .then(r => setConversations(r.data || []))
      .catch(() => setMsgError("Konuşmalar yüklenemedi."))
      .finally(() => setConvLoading(false));
  };

  // ── Konuşma filtresi değiştir ─────────────────────────────────────────────
  const handleConvFilterChange = (f) => {
    setConvFilter(f);
    setSelectedConv(null);
    setMessages([]);
    setMsgError("");
    loadConversations(f);
  };

  // ── Mesaj geçmişini yükle ─────────────────────────────────────────────────
  const loadThread = (conv, filter = "all", q = "") => {
    setSelectedConv(conv);
    setMsgError("");
    setMessages([]);
    setMsgLoading(true);
    messageAPI.thread(conv.user_id, filter, q)
      .then(r => {
        setMessages(r.data || []);
        if (filter === "all" && !q) {
          // Okunmamış sayısını sıfırla
          setConversations(prev => prev.map(c =>
            c.user_id === conv.user_id ? { ...c, unread_count: 0 } : c
          ));
        }
      })
      .catch(() => setMsgError("Mesajlar yüklenemedi."))
      .finally(() => setMsgLoading(false));
  };

  // ── Mesaj filtresi değiştir ───────────────────────────────────────────────
  const handleMsgFilterChange = (f) => {
    setMsgFilter(f);
    setMsgSearch("");
    setMsgSearchInput("");
    if (selectedConv) loadThread(selectedConv, f, "");
  };

  // ── Mesaj arama ───────────────────────────────────────────────────────────
  const handleMsgSearch = (e) => {
    e.preventDefault();
    const q = msgSearchInput.trim();
    setMsgSearch(q);
    if (selectedConv) loadThread(selectedConv, msgFilter, q);
  };

  // ── Mesaj gönder ──────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !selectedConv) return;
    setMsgSending(true);
    setMsgError("");
    try {
      const res = await messageAPI.send(selectedConv.user_id, msgInput.trim());
      setMessages(prev => [...prev, res.data]);
      setMsgInput("");
      setConversations(prev => prev.map(c =>
        c.user_id === selectedConv.user_id
          ? { ...c, last_message: { body: res.data.body, created_at: res.data.created_at, is_mine: true }, total_messages: (c.total_messages || 0) + 1 }
          : c
      ));
      setMsgStats(prev => prev ? { ...prev, total_sent: prev.total_sent + 1 } : prev);
    } catch {
      setMsgError("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setMsgSending(false);
    }
  };

  // ── Konuşmayı arşivle / arşivden çıkar ───────────────────────────────────
  const handleToggleArchiveConversation = async (conv) => {
    try {
      if (conv.is_archived) {
        await messageAPI.unarchiveConversation(conv.user_id);
      } else {
        await messageAPI.archiveConversation(conv.user_id);
      }
      // Listeden kaldır (filtre değişti)
      setConversations(prev => prev.filter(c => c.user_id !== conv.user_id));
      if (selectedConv?.user_id === conv.user_id) {
        setSelectedConv(null);
        setMessages([]);
      }
      // İstatistikleri güncelle
      setMsgStats(prev => {
        if (!prev) return prev;
        const delta = conv.is_archived ? -1 : 1;
        return { ...prev, total_archived: (prev.total_archived || 0) + delta };
      });
    } catch {
      setMsgError("İşlem başarısız. Lütfen tekrar deneyin.");
    }
  };

  // ── Mesajı yıldızla / yıldızı kaldır ─────────────────────────────────────
  const handleToggleStar = async (msg) => {
    try {
      const res = msg.is_starred
        ? await messageAPI.unstar(msg.id)
        : await messageAPI.star(msg.id);
      const updated = res.data.message;
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_starred: updated.is_starred } : m));
      if (msgFilter === "starred" && !updated.is_starred) {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
      }
      setMsgStats(prev => prev ? { ...prev, total_starred: prev.total_starred + (updated.is_starred ? 1 : -1) } : prev);
    } catch { /* sessiz */ }
  };

  // ── Yardımcılar ───────────────────────────────────────────────────────────
  const initials = (name) => name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const gradient = `linear-gradient(${accentGradient})`;

  const filteredConvs = conversations.filter(c =>
    !convSearch || c.name?.toLowerCase().includes(convSearch.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── İstatistik kartları ─────────────────────────────────────────── */}
      {msgStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: "0.6rem" }}>
          {[
            { label: "Gönderilen",  value: msgStats.total_sent,     icon: "📤", color: accentColor,  bg: accentColor + "18" },
            { label: "Alınan",       value: msgStats.total_received, icon: "📥", color: "#0ea5e9",    bg: "#e0f2fe" },
            { label: "Okunmamış",    value: msgStats.total_unread,   icon: "🔔", color: "#f59e0b",    bg: "#fef3c7" },
            { label: "Yıldızlı",     value: msgStats.total_starred,  icon: "⭐", color: "#eab308",    bg: "#fef9c3" },
            { label: "Arşivlenen",   value: msgStats.total_archived || 0, icon: "🗄️", color: "#64748b", bg: "#f1f5f9" },
            { label: "Konuşma",      value: msgStats.conversations,  icon: "💬", color: "#10b981",    bg: "#d1fae5" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "0.75rem", border: "1px solid #f1f5f9", padding: "0.7rem 0.85rem", display: "flex", alignItems: "center", gap: "0.55rem", boxShadow: "0 1px 3px rgba(0,0,0,.04)", borderTop: `3px solid ${s.color}` }}>
              <div style={{ width: 30, height: 30, borderRadius: "0.45rem", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.63rem", color: "#94a3b8", fontWeight: 500, marginTop: "0.1rem" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Ana mesajlaşma alanı ────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1rem", height: "560px" }}>

        {/* Sol: Konuşma listesi */}
        <div style={{ width: "265px", flexShrink: 0, background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Başlık + arama */}
          <div style={{ padding: "0.8rem 0.9rem", borderBottom: "1px solid #f1f5f9", background: "#fafbff" }}>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e293b", marginBottom: "0.4rem" }}>
              {role === "psychologist" ? "💬 Danışanlar" : "💬 Psikologum"}
            </div>
            {role === "psychologist" && (
              <input type="text" placeholder="Danışan ara..." value={convSearch} onChange={e => setConvSearch(e.target.value)}
                style={{ width: "100%", padding: "0.36rem 0.6rem", border: "1.5px solid #e2e8f0", borderRadius: "0.45rem", fontSize: "0.76rem", fontFamily: "inherit", color: "#1e293b", outline: "none", boxSizing: "border-box" }} />
            )}
          </div>

          {/* Aktif / Arşiv sekmeleri */}
          <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
            {[{ id: "active", label: "Aktif" }, { id: "archived", label: "🗄️ Arşiv" }].map(f => (
              <button key={f.id} onClick={() => handleConvFilterChange(f.id)}
                style={{ flex: 1, padding: "0.4rem", border: "none", background: convFilter === f.id ? accentColor + "15" : "transparent", color: convFilter === f.id ? accentColor : "#64748b", fontWeight: convFilter === f.id ? 700 : 500, fontSize: "0.72rem", cursor: "pointer", borderBottom: convFilter === f.id ? `2px solid ${accentColor}` : "2px solid transparent" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Konuşma listesi */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {convLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <div className="spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  {convFilter === "archived" ? "🗄️" : role === "psychologist" ? "👥" : "🩺"}
                </div>
                {convSearch ? "Bulunamadı" :
                 convFilter === "archived" ? "Arşivlenmiş konuşma yok" :
                 role === "psychologist" ? "Aktif danışan yok" : "Psikolog atanmamış"}
              </div>
            ) : (
              filteredConvs.map(conv => (
                <div key={conv.user_id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <button
                    onClick={() => { setMsgFilter("all"); setMsgSearch(""); setMsgSearchInput(""); loadThread(conv, "all", ""); }}
                    style={{ width: "100%", padding: "0.7rem 0.85rem", border: "none", background: selectedConv?.user_id === conv.user_id ? accentColor + "18" : "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "0.55rem", transition: "background .15s" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: gradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                        {initials(conv.name)}
                      </div>
                      {conv.unread_count > 0 && (
                        <span style={{ position: "absolute", top: -3, right: -3, background: "#ef4444", color: "#fff", borderRadius: "9999px", fontSize: "0.52rem", fontWeight: 800, padding: "0.1rem 0.28rem", border: "1.5px solid #fff" }}>{conv.unread_count}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.name}</div>
                      <div style={{ fontSize: "0.67rem", color: "#94a3b8", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.total_messages || 0} mesaj
                        {conv.last_message ? ` · ${conv.last_message.is_mine ? "Siz: " : ""}${conv.last_message.body}` : ""}
                      </div>
                    </div>
                  </button>

                  {/* Arşivle / Arşivden çıkar butonu */}
                  <div style={{ padding: "0 0.85rem 0.5rem", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleToggleArchiveConversation(conv)}
                      title={conv.is_archived ? "Arşivden çıkar" : "Konuşmayı arşivle"}
                      style={{ padding: "0.2rem 0.55rem", borderRadius: "0.35rem", border: `1px solid ${conv.is_archived ? accentColor + "40" : "#e2e8f0"}`, background: conv.is_archived ? accentColor + "10" : "#f8fafc", color: conv.is_archived ? accentColor : "#94a3b8", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      {conv.is_archived ? "📤 Arşivden Çıkar" : "🗄️ Arşivle"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ: Mesaj alanı */}
        <div style={{ flex: 1, background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selectedConv ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>💬</div>
              <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem", color: "#64748b" }}>
                {role === "psychologist" ? "Bir danışan seçin" : "Psikologunuzla konuşun"}
              </p>
              <p style={{ fontSize: "0.82rem" }}>
                {role === "psychologist" ? "Sol listeden danışan seçerek mesajlaşmaya başlayın." : "Sol panelden psikologunuzu seçin."}
              </p>
            </div>
          ) : (
            <>
              {/* Başlık */}
              <div style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbff" }}>
                <div style={{ padding: "0.7rem 1rem", display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: gradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 }}>
                    {initials(selectedConv.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e293b" }}>{selectedConv.name}</div>
                    <div style={{ fontSize: "0.67rem", color: "#94a3b8" }}>{selectedConv.email} · {selectedConv.total_messages || 0} mesaj</div>
                  </div>
                  {/* Arşivle butonu (başlıkta da) */}
                  <button
                    onClick={() => handleToggleArchiveConversation(selectedConv)}
                    title={selectedConv.is_archived ? "Arşivden çıkar" : "Bu konuşmayı arşivle"}
                    style={{ padding: "0.35rem 0.65rem", borderRadius: "0.45rem", border: `1.5px solid ${selectedConv.is_archived ? accentColor + "50" : "#e2e8f0"}`, background: selectedConv.is_archived ? accentColor + "12" : "#fff", color: selectedConv.is_archived ? accentColor : "#64748b", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {selectedConv.is_archived ? "📤 Arşivden Çıkar" : "🗄️ Arşivle"}
                  </button>
                </div>

                {/* Filtre sekmeleri */}
                <div style={{ display: "flex", borderTop: "1px solid #f1f5f9" }}>
                  {[{ id: "all", label: "📨 Tümü" }, { id: "starred", label: "⭐ Yıldızlı" }].map(f => (
                    <button key={f.id} onClick={() => handleMsgFilterChange(f.id)}
                      style={{ flex: 1, padding: "0.42rem", border: "none", background: msgFilter === f.id ? accentColor + "15" : "transparent", color: msgFilter === f.id ? accentColor : "#64748b", fontWeight: msgFilter === f.id ? 700 : 500, fontSize: "0.72rem", cursor: "pointer", borderBottom: msgFilter === f.id ? `2px solid ${accentColor}` : "2px solid transparent" }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Arama */}
                <form onSubmit={handleMsgSearch} style={{ padding: "0.42rem 0.9rem", display: "flex", gap: "0.35rem" }}>
                  <input type="text" placeholder="Mesajlarda ara..." value={msgSearchInput} onChange={e => setMsgSearchInput(e.target.value)}
                    style={{ flex: 1, padding: "0.36rem 0.6rem", border: "1.5px solid #e2e8f0", borderRadius: "0.45rem", fontSize: "0.76rem", fontFamily: "inherit", color: "#1e293b", outline: "none" }} />
                  <button type="submit" style={{ padding: "0.36rem 0.65rem", borderRadius: "0.45rem", border: "none", background: accentColor, color: "#fff", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>Ara</button>
                  {msgSearch && (
                    <button type="button" onClick={() => { setMsgSearch(""); setMsgSearchInput(""); loadThread(selectedConv, msgFilter, ""); }}
                      style={{ padding: "0.36rem 0.52rem", borderRadius: "0.45rem", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "0.72rem", cursor: "pointer" }}>✕</button>
                  )}
                </form>
                {msgSearch && (
                  <div style={{ padding: "0.15rem 0.9rem 0.4rem", fontSize: "0.68rem", color: accentColor, fontWeight: 600 }}>
                    🔍 "{msgSearch}" — {messages.length} sonuç
                  </div>
                )}
              </div>

              {/* Mesaj listesi */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {msgLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.82rem", marginTop: "2rem" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                      {msgFilter === "starred" ? "⭐" : msgSearch ? "🔍" : "✉️"}
                    </div>
                    {msgFilter === "starred" ? "Yıldızlı mesaj yok" :
                     msgSearch ? `"${msgSearch}" bulunamadı` :
                     "Henüz mesaj yok. İlk mesajı siz gönderin!"}
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_email === currentUserEmail;
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", gap: "0.3rem", alignItems: "flex-end" }}>
                        {!isMine && (
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: gradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0, marginBottom: "0.15rem" }}>
                            {initials(selectedConv.name)}
                          </div>
                        )}
                        <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: "0.12rem" }}>
                          <div style={{
                            padding: "0.55rem 0.85rem",
                            borderRadius: isMine ? "1rem 1rem 0.2rem 1rem" : "1rem 1rem 1rem 0.2rem",
                            background: isMine ? gradient : "#f1f5f9",
                            color: isMine ? "#fff" : "#1e293b",
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            boxShadow: "0 1px 2px rgba(0,0,0,.06)",
                          }}>
                            {msg.is_starred && <span style={{ fontSize: "0.65rem", marginRight: "0.25rem" }}>⭐</span>}
                            {msg.body}
                          </div>
                          {/* Zaman + yıldızla butonu */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.62rem", color: "#94a3b8" }}>
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                              {" · "}
                              {new Date(msg.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                            </span>
                            <button onClick={() => handleToggleStar(msg)} title={msg.is_starred ? "Yıldızı kaldır" : "Yıldızla"}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", padding: "0.08rem", opacity: msg.is_starred ? 1 : 0.35, lineHeight: 1, transition: "opacity .15s" }}>⭐</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Hata */}
              {msgError && (
                <div style={{ margin: "0 0.9rem", padding: "0.55rem 0.8rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.45rem", fontSize: "0.78rem", color: "#b91c1c" }}>
                  ⚠️ {msgError}
                </div>
              )}

              {/* Mesaj gönderme formu */}
              <form onSubmit={handleSendMessage} style={{ padding: "0.8rem 0.9rem", borderTop: "1px solid #f1f5f9", display: "flex", gap: "0.55rem", alignItems: "flex-end" }}>
                <textarea
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  placeholder="Mesajınızı yazın... (Enter gönder, Shift+Enter yeni satır)"
                  rows={2}
                  style={{ flex: 1, padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.75rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", resize: "none", outline: "none", lineHeight: 1.5 }}
                />
                <button type="submit" disabled={msgSending || !msgInput.trim()}
                  style={{ padding: "0.6rem 1rem", borderRadius: "0.75rem", border: "none", background: gradient, color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: msgSending || !msgInput.trim() ? "not-allowed" : "pointer", opacity: msgSending || !msgInput.trim() ? 0.6 : 1, flexShrink: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  {msgSending ? <span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "#fff" }} /> : "➤"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}