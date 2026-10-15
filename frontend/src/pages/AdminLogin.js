import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import config from "../config";

export default function AdminLogin() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Zaten giriş yapmış psikolog varsa dashboard'a yönlendir
  useEffect(() => {
    if (!authLoading && user && user.role === "psychologist") {
      navigate("/psikolog", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Auth yükleniyorsa bekle
  if (authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
      </div>
    );
  }

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== "psychologist") {
        setError("Bu giriş yalnızca psikolog / yönetici hesapları içindir.");
        // Oturumu kapat — yanlış rol
        localStorage.clear();
        return;
      }
      navigate("/psikolog");
    } catch (err) {
      setError(err.response?.data?.detail || "E-posta veya şifre hatalı.");
    } finally {
      setSubmitting(false);
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
          <div style={S.adminBadge}>
            <span style={S.adminBadgeDot} />
            Yönetici Paneli
          </div>
          <div style={S.leftQuote}>
            "Danışanlarınızı yönetin, seanslarınızı takip edin, kliniğinizi büyütün."
          </div>
          <div style={S.leftAuthor}>— {config.KLINIK_ADI} Klinik Yönetim Sistemi</div>

          <div style={S.leftFeatures}>
            {[
              { icon: "👥", title: "Danışan Yönetimi",   desc: "Tüm danışanlarınızı tek ekranda görün" },
              { icon: "📅", title: "Randevu Takvimi",    desc: "Seans planlaması ve takibi" },
              { icon: "📊", title: "İlerleme Raporları", desc: "Test ve ödev sonuçlarını analiz edin" },
              { icon: "🔐", title: "Güvenli Erişim",     desc: "Yalnızca yetkili psikolog girişi" },
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

        {/* Alt */}
        <div style={S.leftFooter}>
          {config.TELIF}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div style={S.right}>
        <div style={S.formWrap}>
          {/* Üst */}
          <div style={S.formTop}>
            <div style={S.formAvatar}>
              <span style={{ fontSize: "1.4rem" }}>🔐</span>
            </div>
            <div>
              <h1 style={S.formTitle}>Yönetici Girişi</h1>
              <p style={S.formSub}>Psikolog / Klinik Yöneticisi hesabınızla giriş yapın</p>
            </div>
          </div>

          {/* Uyarı bandı */}
          <div style={S.warningBand}>
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <span>Bu alan yalnızca <strong>psikolog ve yönetici</strong> hesapları içindir.</span>
          </div>

          {/* Hata */}
          {error && (
            <div style={S.errorBox}>
              <span>⛔</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
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
                  placeholder="psikolog@klinik.com"
                  required
                  autoFocus
                />
              </div>
            </div>

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
                  placeholder="••••••••"
                  required
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

            <button type="submit" style={S.submitBtn} disabled={submitting}>
              {submitting ? (
                <><span style={S.spinner} /> Giriş yapılıyor...</>
              ) : "🔐 Yönetici Paneline Gir →"}
            </button>
          </form>

          {/* Şifremi unuttum */}
          <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
            <Link to="/sifre-sifirla" style={S.forgotLink}>Şifremi Unuttum?</Link>
          </div>

          {/* Ayırıcı */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>veya</span>
            <div style={S.dividerLine} />
          </div>

          {/* Danışan girişine yönlendirme */}
          <div style={S.switchBox}>
            <span style={S.switchText}>Danışan mısınız?</span>
            <Link to="/login" style={S.switchLink}>Danışan Girişi →</Link>
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
    background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)",
    display: "flex",
    flexDirection: "column",
    padding: "2rem",
    position: "relative",
    overflow: "hidden",
  },
  leftBlob1: { position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.25) 0%, transparent 70%)", pointerEvents: "none" },
  leftBlob2: { position: "absolute", bottom: "-60px", right: "-60px", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.2) 0%, transparent 70%)", pointerEvents: "none" },

  logoWrap: { display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", zIndex: 1 },
  logoBox: { width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoLetter: { color: "#fff", fontWeight: 900, fontSize: "1.3rem" },
  logoName: { fontWeight: 800, fontSize: "1rem", color: "#fff" },
  logoSub: { fontSize: "0.68rem", color: "rgba(255,255,255,.6)" },

  adminBadge: { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(139,92,246,.2)", border: "1px solid rgba(139,92,246,.4)", color: "#c4b5fd", padding: "0.35rem 0.9rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, marginBottom: "1.5rem" },
  adminBadgeDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#a78bfa", display: "inline-block" },

  leftCenter: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 1, padding: "2rem 0" },
  leftQuote: { fontSize: "1rem", fontWeight: 600, color: "#e0e7ff", lineHeight: 1.7, marginBottom: "0.75rem", fontStyle: "italic" },
  leftAuthor: { fontSize: "0.78rem", color: "rgba(255,255,255,.5)", marginBottom: "2.5rem" },
  leftFeatures: { display: "flex", flexDirection: "column", gap: "0.85rem" },
  leftFeature: { display: "flex", alignItems: "center", gap: "0.85rem", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "0.75rem", padding: "0.85rem 1rem" },
  leftFeatureIcon: { fontSize: "1.3rem", flexShrink: 0 },
  leftFeatureTitle: { fontWeight: 700, fontSize: "0.875rem", color: "#fff" },
  leftFeatureDesc: { fontSize: "0.75rem", color: "rgba(255,255,255,.5)", marginTop: "0.1rem" },
  leftFooter: { fontSize: "0.72rem", color: "rgba(255,255,255,.3)", zIndex: 1 },

  /* Sağ */
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f3ff", padding: "2rem" },
  formWrap: { width: "100%", maxWidth: "440px", background: "#fff", borderRadius: "1.5rem", boxShadow: "0 20px 60px rgba(99,102,241,.12)", padding: "2.5rem", border: "1px solid #ede9fe" },

  formTop: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  formAvatar: { width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", flexShrink: 0 },
  formTitle: { fontSize: "1.3rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.2rem" },
  formSub: { fontSize: "0.8rem", color: "#6b7280" },

  warningBand: { display: "flex", alignItems: "center", gap: "0.6rem", background: "#fefce8", border: "1px solid #fde68a", borderRadius: "0.625rem", padding: "0.65rem 1rem", fontSize: "0.8rem", color: "#92400e", marginBottom: "1.25rem" },

  errorBox: { display: "flex", alignItems: "center", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#b91c1c", marginBottom: "0.5rem" },

  label: { display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#4b5563", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: ".04em" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "0.85rem", fontSize: "1rem", pointerEvents: "none" },
  input: { width: "100%", padding: "0.7rem 0.85rem 0.7rem 2.5rem", border: "1.5px solid #ddd6fe", borderRadius: "0.625rem", fontSize: "0.9rem", fontFamily: "inherit", color: "#1e1b4b", background: "#fff", outline: "none", transition: "all .15s" },
  eyeBtn: { position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" },

  submitBtn: {
    width: "100%",
    padding: "0.85rem",
    borderRadius: "0.625rem",
    border: "none",
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    boxShadow: "0 6px 20px rgba(99,102,241,.35)",
    transition: "all .2s",
    marginTop: "0.5rem",
  },
  spinner: { display: "inline-block", width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .65s linear infinite" },

  divider: { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" },
  dividerLine: { flex: 1, height: "1px", background: "#ede9fe" },
  dividerText: { fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 },

  switchBox: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "#f5f3ff", borderRadius: "0.625rem", padding: "0.75rem", border: "1px solid #ede9fe" },
  switchText: { fontSize: "0.85rem", color: "#6b7280" },
  switchLink: { fontSize: "0.875rem", color: "#7c3aed", textDecoration: "none", fontWeight: 700 },

  forgotLink: { fontSize: "0.8rem", color: "#7c3aed", textDecoration: "none", fontWeight: 600 },
  backLink: { fontSize: "0.82rem", color: "#8b5cf6", textDecoration: "none", fontWeight: 600 },
};