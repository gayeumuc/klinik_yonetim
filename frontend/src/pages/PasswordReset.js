/**
 * PasswordReset.js — Şifre Sıfırlama Sayfası
 *
 * FR-05: Şifre sıfırlama işlemi e-posta üzerinden gerçekleştirilebilmelidir.
 *
 * İki aşamalı:
 *   1. /sifre-sifirla/         → E-posta gir, link gönder
 *   2. /sifre-sifirla/:uid/:token → Yeni şifre belirle
 */
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import config from "../config";

/* ── Aşama 1: E-posta ile sıfırlama isteği ──────────────────────────────── */
export function PasswordResetRequest() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authAPI.passwordResetRequest(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        "İşlem başarısız. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Logo */}
        <Link to="/" style={S.logoWrap}>
          <div style={S.logoBox}><span style={S.logoLetter}>A</span></div>
          <div>
            <div style={S.logoName}>{config.KLINIK_ADI.split(" ")[0]}</div>
            <div style={S.logoSub}>{config.KLINIK_ADI.split(" ").slice(1).join(" ") || "Danışmanlık"}</div>
          </div>
        </Link>

        <div style={S.iconWrap}>🔐</div>
        <h1 style={S.title}>Şifre Sıfırla</h1>
        <p style={S.desc}>
          Kayıtlı e-posta adresinizi girin. Şifre sıfırlama bağlantısı gönderilecektir.
        </p>

        {success ? (
          <div style={S.successBox}>
            <div style={S.successIcon}>✅</div>
            <h3 style={S.successTitle}>E-posta Gönderildi!</h3>
            <p style={S.successDesc}>
              <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
              Gelen kutunuzu kontrol edin (spam klasörünü de kontrol etmeyi unutmayın).
            </p>
            <Link to="/login" style={S.btnPrimary}>
              Giriş Sayfasına Dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={S.form}>
            {error && (
              <div style={S.errorBox}><span>⚠️</span> {error}</div>
            )}

            <div style={S.formGroup}>
              <label style={S.label}>E-posta Adresi</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>✉️</span>
                <input
                  style={S.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? (
                <><span style={S.spinner} /> Gönderiliyor...</>
              ) : "Sıfırlama Bağlantısı Gönder →"}
            </button>
          </form>
        )}

        <div style={S.footer}>
          <Link to="/login" style={S.backLink}>← Giriş Sayfasına Dön</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Aşama 2: Yeni şifre belirleme ──────────────────────────────────────── */
export function PasswordResetConfirm() {
  const { uid, token } = useParams();
  const navigate       = useNavigate();

  const [form, setForm] = useState({ new_password: "", new_password2: "" });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.new_password !== form.new_password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (form.new_password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.passwordResetConfirm({
        uid,
        token,
        new_password:  form.new_password,
        new_password2: form.new_password2,
      });
      setSuccess(true);
      // 3 saniye sonra login'e yönlendir
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const msg = Object.values(data).flat().join(" ");
        setError(msg);
      } else {
        setError("İşlem başarısız. Bağlantı geçersiz veya süresi dolmuş olabilir.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Logo */}
        <Link to="/" style={S.logoWrap}>
          <div style={S.logoBox}><span style={S.logoLetter}>A</span></div>
          <div>
            <div style={S.logoName}>{config.KLINIK_ADI.split(" ")[0]}</div>
            <div style={S.logoSub}>{config.KLINIK_ADI.split(" ").slice(1).join(" ") || "Danışmanlık"}</div>
          </div>
        </Link>

        <div style={S.iconWrap}>🔑</div>
        <h1 style={S.title}>Yeni Şifre Belirle</h1>
        <p style={S.desc}>
          Güçlü bir şifre seçin. En az 8 karakter olmalıdır.
        </p>

        {success ? (
          <div style={S.successBox}>
            <div style={S.successIcon}>✅</div>
            <h3 style={S.successTitle}>Şifre Güncellendi!</h3>
            <p style={S.successDesc}>
              Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.
              <br />
              <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                3 saniye içinde giriş sayfasına yönlendiriliyorsunuz...
              </span>
            </p>
            <Link to="/login" style={S.btnPrimary}>
              Hemen Giriş Yap →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={S.form}>
            {error && (
              <div style={S.errorBox}><span>⚠️</span> {error}</div>
            )}

            <div style={S.formGroup}>
              <label style={S.label}>Yeni Şifre</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🔑</span>
                <input
                  style={{ ...S.input, paddingRight: "3rem" }}
                  type={showPass ? "text" : "password"}
                  name="new_password"
                  value={form.new_password}
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

            <div style={S.formGroup}>
              <label style={S.label}>Yeni Şifre Tekrar</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🔑</span>
                <input
                  style={S.input}
                  type={showPass ? "text" : "password"}
                  name="new_password2"
                  value={form.new_password2}
                  onChange={handleChange}
                  placeholder="Şifrenizi tekrar girin"
                  required
                  minLength={8}
                />
              </div>
              {form.new_password && form.new_password2 && form.new_password !== form.new_password2 && (
                <p style={S.fieldError}>⚠ Şifreler eşleşmiyor</p>
              )}
            </div>

            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? (
                <><span style={S.spinner} /> Kaydediliyor...</>
              ) : "Şifremi Güncelle →"}
            </button>
          </form>
        )}

        <div style={S.footer}>
          <Link to="/login" style={S.backLink}>← Giriş Sayfasına Dön</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Stiller ─────────────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #f0f9ff 0%, #f0fdf4 60%, #faf5ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#fff",
    borderRadius: "1.5rem",
    boxShadow: "0 20px 60px rgba(0,0,0,.1)",
    padding: "2.5rem",
    border: "1px solid #f1f5f9",
  },

  logoWrap: { display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", marginBottom: "2rem" },
  logoBox: { width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg, #0ea5e9, #10b981)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoLetter: { color: "#fff", fontWeight: 900, fontSize: "1.2rem" },
  logoName: { fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" },
  logoSub: { fontSize: "0.65rem", color: "#64748b" },

  iconWrap: { fontSize: "2.5rem", textAlign: "center", marginBottom: "1rem" },
  title: { fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: "0.5rem" },
  desc: { fontSize: "0.875rem", color: "#64748b", textAlign: "center", lineHeight: 1.6, marginBottom: "1.75rem" },

  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },

  errorBox: { display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#b91c1c" },
  fieldError: { fontSize: "0.75rem", color: "#ef4444", marginTop: "0.2rem", fontWeight: 500 },

  label: { fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" },
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
    marginTop: "0.25rem",
  },
  spinner: { display: "inline-block", width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .65s linear infinite" },

  successBox: { textAlign: "center", padding: "1rem 0" },
  successIcon: { fontSize: "3rem", marginBottom: "1rem" },
  successTitle: { fontSize: "1.1rem", fontWeight: 800, color: "#065f46", marginBottom: "0.75rem" },
  successDesc: { fontSize: "0.875rem", color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem" },

  btnPrimary: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.7rem 1.5rem", borderRadius: "0.625rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #0ea5e9, #10b981)", boxShadow: "0 6px 20px rgba(14,165,233,.3)" },

  footer: { textAlign: "center", marginTop: "1.5rem" },
  backLink: { fontSize: "0.82rem", color: "#0ea5e9", textDecoration: "none", fontWeight: 600 },
};