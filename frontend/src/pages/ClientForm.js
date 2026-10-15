import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clientAPI } from "../services/api";
import Navbar from "../components/Navbar";

export default function ClientForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm] = useState({
    email: "", password: "",
    first_name: "", last_name: "",
    phone: "", birth_date: "",
    address: "", emergency_contact: "",
    emergency_phone: "", medical_history: "", notes: "",
  });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    if (!isEdit) return;
    clientAPI.get(id)
      .then(res => setForm(prev => ({ ...prev, ...res.data })))
      .catch(() => setError("Danışan bilgileri yüklenemedi."))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (isEdit) {
        await clientAPI.update(id, form);
        setSuccess("Danışan bilgileri başarıyla güncellendi.");
      } else {
        await clientAPI.create(form);
        setSuccess("Danışan başarıyla oluşturuldu. Yönlendiriliyor...");
        setTimeout(() => navigate("/psikolog/danisanlar"), 1500);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setError(msgs);
      } else {
        setError("İşlem başarısız. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
        <p style={{ color: "#94a3b8" }}>Danışan bilgileri yükleniyor...</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <Navbar />
      <main style={S.main}>

        {/* Başlık */}
        <div style={S.header}>
          <button onClick={() => navigate(-1)} style={S.backBtn}>
            ← Geri
          </button>
          <div>
            <h1 style={S.title}>
              {isEdit ? "✏️ Danışan Düzenle" : "➕ Yeni Danışan Ekle"}
            </h1>
            <p style={S.subtitle}>
              {isEdit ? "Danışan bilgilerini güncelleyin" : "Yeni danışan kaydı oluşturun"}
            </p>
          </div>
        </div>

        {/* Bildirimler */}
        {error   && <div style={S.errorBox}>⚠️ {error}</div>}
        {success && <div style={S.successBox}>✅ {success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Hesap Bilgileri */}
          <div style={S.section}>
            <h2 style={S.sectionTitle}>🔐 Hesap Bilgileri</h2>
            <div className="grid-2">
              <Field label="E-posta *" name="email" type="email"
                value={form.email} onChange={handleChange} required={!isEdit}
                placeholder="danisan@ornek.com"
                disabled={isEdit}
              />
              {!isEdit && (
                <Field label="Şifre (boş = otomatik)" name="password" type="password"
                  value={form.password} onChange={handleChange}
                  placeholder="En az 8 karakter" />
              )}
            </div>
            {isEdit && (
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                ℹ️ E-posta adresi değiştirilemez. Şifre değişikliği için danışanın kendi hesabından yapması gerekir.
              </p>
            )}
          </div>

          {/* Kişisel Bilgiler */}
          <div style={S.section}>
            <h2 style={S.sectionTitle}>👤 Kişisel Bilgiler</h2>
            <div className="grid-2">
              <Field label="Ad *"           name="first_name"  value={form.first_name}  onChange={handleChange} required />
              <Field label="Soyad *"        name="last_name"   value={form.last_name}   onChange={handleChange} required />
              <Field label="Telefon *"      name="phone"       value={form.phone}       onChange={handleChange} required placeholder="05001234567" />
              <Field label="Doğum Tarihi *" name="birth_date"  type="date" value={form.birth_date} onChange={handleChange} required />
            </div>
            <Field label="Adres" name="address" value={form.address} onChange={handleChange} textarea />
          </div>

          {/* Acil Durum */}
          <div style={S.section}>
            <h2 style={S.sectionTitle}>🚨 Acil Durum Bilgileri</h2>
            <div className="grid-2">
              <Field label="Acil Durum Kişisi"    name="emergency_contact" value={form.emergency_contact} onChange={handleChange} />
              <Field label="Acil Durum Telefonu"  name="emergency_phone"   value={form.emergency_phone}   onChange={handleChange} placeholder="05001234567" />
            </div>
          </div>

          {/* Klinik Notlar */}
          <div style={S.section}>
            <h2 style={S.sectionTitle}>🩺 Klinik Notlar <span style={S.privateTag}>Gizli</span></h2>
            <Field label="Tıbbi Geçmiş" name="medical_history" value={form.medical_history} onChange={handleChange} textarea rows={3} />
            <Field label="Genel Notlar" name="notes"           value={form.notes}           onChange={handleChange} textarea rows={3} />
          </div>

          {/* Butonlar */}
          <div style={S.actions}>
            <button type="button" style={S.cancelBtn} onClick={() => navigate(-1)}>
              İptal
            </button>
            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ borderTopColor: "#fff", width: "1rem", height: "1rem" }} /> Kaydediliyor...</>
              ) : (isEdit ? "💾 Güncelle" : "✅ Danışan Oluştur")}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

/* ── Alan Bileşeni ───────────────────────────────────────────────────────── */
function Field({ label, name, value, onChange, type = "text", required, placeholder, textarea, rows = 4, disabled }) {
  return (
    <div style={F.group}>
      <label style={F.label}>{label}</label>
      {textarea ? (
        <textarea
          style={F.textarea}
          name={name}
          value={value || ""}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <input
          style={{ ...F.input, ...(disabled ? F.inputDisabled : {}) }}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}

/* ── Stiller ─────────────────────────────────────────────────────────────── */
const S = {
  page:    { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  main:    { maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },

  header:   { display: "flex", alignItems: "center", gap: "1rem" },
  backBtn:  { background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", padding: "0.25rem 0", flexShrink: 0 },
  title:    { fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" },
  subtitle: { fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" },

  errorBox:   { display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#b91c1c" },
  successBox: { display: "flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#065f46", fontWeight: 600 },

  section:      { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  sectionTitle: { fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: "0.5rem" },
  privateTag:   { display: "inline-block", background: "#fee2e2", color: "#991b1b", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.68rem", fontWeight: 700 },

  actions:   { display: "flex", gap: "0.75rem", justifyContent: "flex-end" },
  cancelBtn: { padding: "0.65rem 1.5rem", borderRadius: "0.625rem", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", transition: "all .15s" },
  submitBtn: { display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.75rem", borderRadius: "0.625rem", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,.3)", transition: "all .2s" },
};

const F = {
  group:         { display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" },
  label:         { fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" },
  input:         { padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.9rem", fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none", transition: "all .15s", width: "100%" },
  inputDisabled: { background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed", borderColor: "#f1f5f9" },
  textarea:      { padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.9rem", fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none", transition: "all .15s", width: "100%", resize: "vertical" },
};