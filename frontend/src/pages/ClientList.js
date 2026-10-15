import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clientAPI } from "../services/api";
import Navbar from "../components/Navbar";

export default function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all"); // all | active | inactive
  const [error,   setError]   = useState("");
  const [actionMsg, setActionMsg] = useState({ text: "", type: "success" });

  useEffect(() => {
    clientAPI.listAll()
      .then(res => setClients(res.data?.results || res.data || []))
      .catch(() => setError("Danışan listesi yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (text, type = "success") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: "", type: "success" }), 4000);
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
    const matchFilter =
      filter === "all"      ? true :
      filter === "active"   ? c.is_active :
      filter === "inactive" ? !c.is_active : true;
    return matchSearch && matchFilter;
  });

  // Soft delete — pasife al
  const handleSoftDelete = async (id, name) => {
    if (!window.confirm(`"${name}" adlı danışanı pasife almak istediğinize emin misiniz?\n\nDanışan sisteme giriş yapamaz ancak verileri korunur.`)) return;
    try {
      await clientAPI.delete(id);
      setClients(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
      showMsg(`"${name}" pasife alındı.`);
    } catch {
      showMsg("İşlem başarısız. Lütfen tekrar deneyin.", "error");
    }
  };

  // Aktife al
  const handleActivate = async (id, name) => {
    if (!window.confirm(`"${name}" adlı danışanı tekrar aktif yapmak istediğinize emin misiniz?`)) return;
    try {
      await clientAPI.activate(id);
      setClients(prev => prev.map(c => c.id === id ? { ...c, is_active: true } : c));
      showMsg(`"${name}" tekrar aktif edildi.`);
    } catch (err) {
      showMsg(err.response?.data?.detail || "İşlem başarısız.", "error");
    }
  };

  // Hard delete — kalıcı sil
  const handleHardDelete = async (id, name) => {
    const confirmed = window.confirm(
      `⚠️ DİKKAT: "${name}" adlı danışanı KALICI OLARAK silmek istediğinize emin misiniz?\n\n` +
      `Bu işlem geri alınamaz. Danışanın tüm verileri ve hesabı silinecektir.`
    );
    if (!confirmed) return;
    const doubleConfirm = window.confirm(`Son onay: "${name}" kalıcı olarak silinsin mi?`);
    if (!doubleConfirm) return;
    try {
      await clientAPI.hardDelete(id);
      setClients(prev => prev.filter(c => c.id !== id));
      showMsg(`"${name}" kalıcı olarak silindi.`);
    } catch (err) {
      showMsg(err.response?.data?.detail || "Silme işlemi başarısız.", "error");
    }
  };

  // Davet gönder
  const handleInvite = async (id, name, email) => {
    if (!window.confirm(`"${name}" adlı danışana (${email}) davet e-postası gönderilsin mi?\n\nDanışan kendi şifresini belirleyebilecek.`)) return;
    try {
      const res = await clientAPI.invite(id);
      showMsg(res.data?.detail || `Davet e-postası ${email} adresine gönderildi.`);
    } catch (err) {
      showMsg(err.response?.data?.detail || "Davet gönderilemedi.", "error");
    }
  };

  // CSV export
  const handleExportCSV = async () => {
    try {
      const res = await clientAPI.exportCSV();
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `danisanlar_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMsg("CSV dosyası indirildi.");
    } catch {
      showMsg("CSV indirilemedi.", "error");
    }
  };

  const activeCount   = clients.filter(c => c.is_active).length;
  const inactiveCount = clients.filter(c => !c.is_active).length;

  return (
    <div style={S.page}>
      <Navbar />
      <main style={S.main}>

        {/* Başlık */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>👥 Danışan Yönetimi</h1>
            <p style={S.subtitle}>
              Toplam <strong>{clients.length}</strong> danışan ·
              <span style={{ color: "#10b981" }}> {activeCount} aktif</span> ·
              <span style={{ color: "#f59e0b" }}> {inactiveCount} pasif</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button style={S.csvBtn} onClick={handleExportCSV} title="Danışan listesini CSV olarak indir">
              📥 CSV İndir
            </button>
            <Link to="/psikolog/danisanlar/yeni" style={S.addBtn}>
              + Yeni Danışan Ekle
            </Link>
          </div>
        </div>

        {/* İşlem mesajı */}
        {actionMsg.text && (
          <div style={actionMsg.type === "error" ? S.errorBox : S.successBox}>
            {actionMsg.type === "error" ? "⚠️" : "✅"} {actionMsg.text}
          </div>
        )}

        {/* Arama + Filtre */}
        <div style={S.filterBar}>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input
              style={S.searchInput}
              type="text"
              placeholder="Ad, soyad, e-posta veya telefon ile ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <div style={S.filterBtns}>
            {[
              { id: "all",      label: `Tümü (${clients.length})` },
              { id: "active",   label: `Aktif (${activeCount})` },
              { id: "inactive", label: `Pasif (${inactiveCount})` },
            ].map(f => (
              <button
                key={f.id}
                style={{ ...S.filterBtn, ...(filter === f.id ? S.filterBtnActive : {}) }}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tablo */}
        <div style={S.tableCard}>
          {loading ? (
            <div style={S.loadingBox}>
              <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
              <p style={{ color: "#94a3b8", marginTop: "0.75rem" }}>Yükleniyor...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "1.5rem" }}>
              <div style={S.errorBox}>{error}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>👥</div>
              <h3 style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                {search ? "Sonuç bulunamadı" : "Henüz danışan yok"}
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                {search
                  ? `"${search}" için eşleşen danışan bulunamadı.`
                  : "İlk danışanınızı ekleyerek başlayın."}
              </p>
              {!search && (
                <Link to="/psikolog/danisanlar/yeni" style={S.addBtn}>
                  İlk Danışanı Ekle
                </Link>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ad Soyad</th>
                    <th>E-posta</th>
                    <th>Telefon</th>
                    <th>Doğum Tarihi</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id}>
                      <td style={{ color: "#94a3b8", fontWeight: 500 }}>{i + 1}</td>
                      <td>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}
                          onClick={() => navigate(`/psikolog/danisanlar/${c.id}`)}
                        >
                          <div style={{ ...S.avatar, opacity: c.is_active ? 1 : 0.5 }}>
                            {c.first_name?.[0]}{c.last_name?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#6366f1", textDecoration: "underline" }}>
                              {c.first_name} {c.last_name}
                            </div>
                            {c.birth_date && (
                              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                {new Date(c.birth_date).toLocaleDateString("tr-TR")}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "#64748b" }}>{c.email}</td>
                      <td style={{ color: "#64748b" }}>{c.phone}</td>
                      <td style={{ color: "#64748b" }}>{c.birth_date}</td>
                      <td>
                        <span style={c.is_active ? S.badgeGreen : S.badgeRed}>
                          {c.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                          <button
                            style={S.editBtn}
                            onClick={() => navigate(`/psikolog/danisanlar/${c.id}`)}
                            title="Danışan bilgilerini düzenle"
                          >
                            ✏️
                          </button>
                          <button
                            style={S.inviteBtn}
                            onClick={() => handleInvite(c.id, `${c.first_name} ${c.last_name}`, c.email)}
                            title="Danışana davet e-postası gönder (kendi şifresini belirlesin)"
                          >
                            ✉️
                          </button>
                          {c.is_active ? (
                            <button
                              style={S.softDeleteBtn}
                              onClick={() => handleSoftDelete(c.id, `${c.first_name} ${c.last_name}`)}
                              title="Danışanı pasife al (veri korunur)"
                            >
                              ⏸
                            </button>
                          ) : (
                            <button
                              style={S.activateBtn}
                              onClick={() => handleActivate(c.id, `${c.first_name} ${c.last_name}`)}
                              title="Danışanı tekrar aktif yap"
                            >
                              ▶
                            </button>
                          )}
                          <button
                            style={S.hardDeleteBtn}
                            onClick={() => handleHardDelete(c.id, `${c.first_name} ${c.last_name}`)}
                            title="Danışanı kalıcı olarak sil (geri alınamaz)"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alt bilgi + buton açıklamaları */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.72rem", color: "#94a3b8" }}>
              <span>✏️ Düzenle</span>
              <span>✉️ Davet Gönder</span>
              <span>⏸ Pasife Al</span>
              <span>▶ Aktife Al</span>
              <span>🗑 Kalıcı Sil</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              {filtered.length} / {clients.length} danışan gösteriliyor
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

const S = {
  page:  { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  main:  { maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },

  header:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  title:    { fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" },
  subtitle: { fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" },
  addBtn:   { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.65rem 1.35rem", borderRadius: "0.625rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(99,102,241,.3)", transition: "all .2s", border: "none", cursor: "pointer" },
  csvBtn:   { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.65rem 1.1rem", borderRadius: "0.625rem", background: "#fff", color: "#10b981", fontWeight: 700, fontSize: "0.875rem", border: "1.5px solid #10b981", cursor: "pointer", transition: "all .2s" },

  successBox: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#065f46", fontWeight: 600 },
  errorBox:   { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#b91c1c" },

  filterBar:   { display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" },
  searchWrap:  { flex: 1, minWidth: "240px", position: "relative", display: "flex", alignItems: "center" },
  searchIcon:  { position: "absolute", left: "0.85rem", fontSize: "0.9rem", pointerEvents: "none" },
  searchInput: { width: "100%", padding: "0.65rem 2.5rem 0.65rem 2.5rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none", transition: "all .15s" },
  clearBtn:    { position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.9rem", padding: "0.25rem" },
  filterBtns:  { display: "flex", gap: "0.4rem" },
  filterBtn:   { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all .15s" },
  filterBtnActive: { border: "1.5px solid #6366f1", background: "#ede9fe", color: "#6366f1" },

  tableCard: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden" },

  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" },
  emptyState: { padding: "4rem 2rem", textAlign: "center" },

  avatar:        { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 },
  badgeGreen:    { display: "inline-block", background: "#d1fae5", color: "#065f46", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 },
  badgeRed:      { display: "inline-block", background: "#fee2e2", color: "#991b1b", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 },

  editBtn:       { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "0.375rem", border: "1.5px solid #6366f1", color: "#6366f1", background: "none", fontSize: "0.85rem", cursor: "pointer" },
  inviteBtn:     { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "0.375rem", border: "1.5px solid #0ea5e9", color: "#0ea5e9", background: "none", fontSize: "0.85rem", cursor: "pointer" },
  softDeleteBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "0.375rem", border: "1.5px solid #f59e0b", color: "#b45309", background: "none", fontSize: "0.85rem", cursor: "pointer" },
  activateBtn:   { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "0.375rem", border: "1.5px solid #10b981", color: "#065f46", background: "none", fontSize: "0.85rem", cursor: "pointer" },
  hardDeleteBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "0.375rem", border: "1.5px solid #ef4444", color: "#ef4444", background: "none", fontSize: "0.85rem", cursor: "pointer" },
};