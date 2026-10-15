/**
 * Register.js — Yeni Kullanıcı Kayıt Sayfası
 *
 * FR-01: Psikolog e-posta ve şifre ile sisteme kayıt olabilmelidir.
 * FR-02: Danışan e-posta ve şifre ile sisteme kayıt olabilmelidir.
 *
 * Kayıt sonrası otomatik giriş yapılır ve role göre dashboard'a yönlendirilir.
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import config from "../config";

export default function Register() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [form, setForm] = useState({
    email:     "",
    role:      "client",   // varsayılan: danışan
    password:  "",
    password2: "",
  });
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Ön doğrulama
    if (form.password !== form.password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      // 1. Kayıt ol
      await authAPI.register({
        email:     form.email,
        role:      form.role,
        password:  form.password,
        password2: form.password2,
      });

      // 2. Otomatik giriş yap
      const user = await login(form.email, form.password);

      // 3. Role göre yönlendir
      navigate(user.role === "psychologist" ? "/psikolog" : "/danisan");
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        // Alan bazlı hataları birleştir
        const messages = Object.entries(data)
          .map(([k, v]) => `${k === "email" ? "E-posta" : k === "password" ? "Şifre" : k}: ${Array.isArray(v) ? v.join(" ") : v}`)
          .join(" | ");
        setError(messages);
      } else {
        setError("Kayıt işlemi başarısız. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Sol panel */}
      <div style={S.left}>
        <div style={S.leftBlob1} />
        <div style={S.leftBlob2} />

        {/* Logo */}
        <Link to="/" style={S.logoWrap}>
          <div style={S.logoBox}><span style={S.logoLetter}>A</span></div>
          <div>
            <div style={S.logoName}>{config.KLINIK_ADI.split(" ")[0]}</div>
            <div style={S.logoSub}>{config.KLINIK_ADI.split(" ").slice(1).join(" ") || "Danışmanlık"}</div>
          </div>
        </Link>

        {/* Merkez içerik */}
        <div style={S.leftCenter}>
          <div style={S.leftQuote}>
            "Yardım istemek güçlülüğün, değişim ise cesaretin göstergesidir."
          </div>
          <div style={S.leftAuthor}>— {config.PSIKOLOG_ADI}, {config.PSIKOLOG_UNVAN.split(" ").slice(0,2).join(" ")}</div>

          <div style={S.leftFeatures}>
            {[
              { icon: "🔒", title: "Güvenli Kayıt",     desc: "Verileriniz KVKK uyumlu şekilde korunur" },
              { icon: "📅", title: "Randevu Takibi",    desc: "Seanslarınızı kolayca yönetin" },
              { icon: "📝", title: "Ödev & Testler",    desc: "Terapötik sürecinizi takip edin" },
              { icon: "🩺", title: "Uzman Destek",      desc: "Lisanslı klinisyen gözetiminde" },
            ].map((f, i) => (
              <div key={i} style={S.leftFeature}>
                <div style={S.leftFeatureIcon}>{f.icon}</div>
                <div>
                  <div style={S.leftFeatureTitle}>{f.title}</div>
                  <div style={S.leftFeatureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.leftFooter}>
          {config.TELIF}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div style={S.right}>
        <div style={S.formWrap}>
          {/* Üst */}
          <div style={S.formTop}>
            <div style={S.formAvatar}>GU</div>
            <div>
              <h1 style={S.formTitle}>Hesap Oluştur</h1>
              <p style={S.formSub}>{config.KLINIK_ADI} sistemine kayıt olun</p>
            </div>
          </div>

          {/* Hata */}
          {error && (
            <div style={S.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {/* Rol seçimi */}
            <div>
              <label style={S.label}>Hesap Türü</label>
              <div style={S.roleGrid}>
                {[
                  { value: "client",       icon: "👤", label: "Danışan",  desc: "Terapi sürecini takip et" },
                  { value: "psychologist", icon: "🩺", label: "Psikolog", desc: "Klinik yönetim paneli" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    style={{
                      ...S.roleBtn,
                      ...(form.role === r.value ? S.roleBtnActive : {}),
                    }}
                    onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                  >
                    <span style={S.roleBtnIcon}>{r.icon}</span>
                    <div>
                      <div style={S.roleBtnLabel}>{r.label}</div>
                      <div style={S.roleBtnDesc}>{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label style={S.label}>E-posta Adresi</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>✉️</span>
                <input
                  style={S.input}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ornek@mail.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label style={S.label}>Şifre</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🔑</span>
                <input
                  style={{ ...S.input, paddingRight: "3rem" }}
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="En az 8 karakter"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={S.eyeBtn}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Şifre tekrar */}
            <div>
              <label style={S.label}>Şifre Tekrar</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🔑</span>
                <input
                  style={S.input}
                  type={showPass ? "text" : "password"}
                  name="password2"
                  value={form.password2}
                  onChange={handleChange}
                  placeholder="Şifrenizi tekrar girin"
                  required
                  minLength={8}
                />
              </div>
              {form.password && form.password2 && form.password !== form.password2 && (
                <p style={S.fieldError}>⚠ Şifreler eşleşmiyor</p>
              )}
            </div>

            <button
              type="submit"
              style={S.submitBtn}
              disabled={loading || (form.password !== form.password2 && form.password2.length > 0)}
            >
              {loading ? (
                <><span style={S.spinner} /> Kayıt yapılıyor...</>
              ) : "Hesap Oluştur →"}
            </button>
          </form>

          {/* Divider */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>zaten hesabınız var mı?</span>
            <div style={S.dividerLine} />
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/login" style={S.loginLink}>Giriş Yap →</Link>
          </div>

          {/* Geri */}
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link to="/" style={S.backLink}>← Anasayfaya Dön</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },

  /* Sol */
  left: {
    flex: "0 0 420px",
    background: "linear-gradient(160deg, #0c4a6e 0%, #064e3b 100%)",
    display: "flex",
    flexDirection: "column",
    padding: "2rem",
    position: "relative",
    overflow: "hidden",
  },
  leftBlob1: { position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,.2) 0%, transparent 70%)", pointerEvents: "none" },
  leftBlob2: { position: "absolute", bottom: "-60px", right: "-60px", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,.15) 0%, transparent 70%)", pointerEvents: "none" },
  logoWrap: { display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", zIndex: 1 },
  logoBox: { width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg, #0ea5e9, #10b981)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoLetter: { color: "#fff", fontWeight: 900, fontSize: "1.3rem" },
  logoName: { fontWeight: 800, fontSize: "1rem", color: "#fff" },
  logoSub: { fontSize: "0.68rem", color: "rgba(255,255,255,.6)" },
  leftCenter: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 1, padding: "2rem 0" },
  leftQuote: { fontSize: "1.05rem", fontWeight: 600, color: "#fff", lineHeight: 1.7, marginBottom: "0.75rem", fontStyle: "italic" },
  leftAuthor: { fontSize: "0.8rem", color: "rgba(255,255,255,.6)", marginBottom: "2.5rem" },
  leftFeatures: { display: "flex", flexDirection: "column", gap: "1rem" },
  leftFeature: { display: "flex", alignItems: "center", gap: "0.85rem", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "0.75rem", padding: "0.85rem 1rem" },
  leftFeatureIcon: { fontSize: "1.3rem", flexShrink: 0 },
  leftFeatureTitle: { fontWeight: 700, fontSize: "0.875rem", color: "#fff" },
  leftFeatureDesc: { fontSize: "0.75rem", color: "rgba(255,255,255,.55)", marginTop: "0.1rem" },
  leftFooter: { fontSize: "0.72rem", color: "rgba(255,255,255,.35)", zIndex: 1 },

  /* Sağ */
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "2rem" },
  formWrap: { width: "100%", maxWidth: "460px", background: "#fff", borderRadius: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,.1)", padding: "2.5rem", border: "1px solid #f1f5f9" },
  formTop: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" },
  formAvatar: { width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #10b981)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", flexShrink: 0 },
  formTitle: { fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.2rem" },
  formSub: { fontSize: "0.82rem", color: "#64748b" },

  errorBox: { display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#b91c1c", marginBottom: "0.5rem" },
  fieldError: { fontSize: "0.75rem", color: "#ef4444", marginTop: "0.3rem", fontWeight: 500 },

  /* Rol seçimi */
  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: "0.4rem" },
  roleBtn: { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 0.85rem", borderRadius: "0.625rem", border: "1.5px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", textAlign: "left", transition: "all .15s" },
  roleBtnActive: { border: "1.5px solid #6366f1", background: "#ede9fe" },
  roleBtnIcon: { fontSize: "1.3rem", flexShrink: 0 },
  roleBtnLabel: { fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" },
  roleBtnDesc: { fontSize: "0.7rem", color: "#64748b", marginTop: "0.1rem" },

  label: { display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: ".04em" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "0.85rem", fontSize: "1rem", pointerEvents: "none" },
  input: { width: "100%", padding: "0.7rem 0.85rem 0.7rem 2.5rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.9rem", fontFamily: "inherit", color: "#0f172a", background: "#fff", outline: "none", transition: "all .15s" },
  eyeBtn: { position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" },

  submitBtn: {
    width: "100%",
    padding: "0.85rem",
    borderRadius: "0.625rem",
    border: "none",
    background: "linear-gradient(135deg, #0ea5e9, #10b981)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    boxShadow: "0 6px 20px rgba(14,165,233,.3)",
    transition: "all .2s",
    marginTop: "0.5rem",
  },
  spinner: { display: "inline-block", width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .65s linear infinite" },

  divider: { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" },
  dividerLine: { flex: 1, height: "1px", background: "#f1f5f9" },
  dividerText: { fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" },

  loginLink: { fontSize: "0.875rem", color: "#6366f1", textDecoration: "none", fontWeight: 700 },
  backLink:  { fontSize: "0.82rem", color: "#0ea5e9", textDecoration: "none", fontWeight: 600 },
};