import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { inviteAPI } from "../services/api";
import config from "../config";

export default function InviteConfirm() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ new_password: "", new_password2: "" });
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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

    setSubmitting(true);
    try {
      await inviteAPI.confirm({
        uid,
        token,
        new_password:  form.new_password,
        new_password2: form.new_password2,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Davet bağlantısı geçersiz veya süresi dolmuş. Psikologunuzdan yeni davet isteyin."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.successIcon}>✅</div>
          <h1 style={S.title}>Şifreniz Belirlendi!</h1>
          <p style={S.desc}>
            Şifreniz başarıyla oluşturuldu. Artık sisteme giriş yapabilirsiniz.
          </p>
          <button
            style={S.submitBtn}
            onClick={() => navigate("/login")}
          >
            Giriş Sayfasına Git →
          </button>
        </div>
      </div>
    );
  }

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

        <div style={S.iconWrap}>
          <span style={{ fontSize: "2rem" }}>🔑</span>
        </div>
        <h1 style={S.title}>Şifrenizi Belirleyin</h1>
        <p style={S.desc}>
          Psikologunuz sizi sisteme davet etti. Aşağıya giriş şifrenizi belirleyin.
        </p>

        {error && (
          <div style={S.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Yeni Şifre</label>
            <div style={S.inputWrap}>
              <input
                type={showPass ? "text" : "password"}
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="En az 8 karakter"
                required
                minLength={8}
                style={S.input}
              />
              <button type="button" style={S.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Şifre Tekrar</label>
            <div style={S.inputWrap}>
              <input
                type={showPass2 ? "text" : "password"}
                name="new_password2"
                value={form.new_password2}
                onChange={handleChange}
                placeholder="Şifrenizi tekrar girin"
                required
                style={{
                  ...S.input,
                  borderColor: form.new_password2 && form.new_password !== form.new_password2
                    ? "#ef4444" : undefined
                }}
              />
              <button type="button" style={S.eyeBtn} onClick={() => setShowPass2(!showPass2)}>
                {showPass2 ? "🙈" : "👁️"}
              </button>
            </div>
            {form.new_password2 && form.new_password !== form.new_password2 && (
              <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.3rem" }}>Şifreler eşleşmiyor</p>
            )}
          </div>

          {/* Şifre gücü */}
          <div style={S.tips}>
            {[
              { ok: form.new_password.length >= 8,          text: "En az 8 karakter" },
              { ok: /[A-Z]/.test(form.new_password),        text: "En az bir büyük harf" },
              { ok: /[0-9]/.test(form.new_password),        text: "En az bir rakam" },
              { ok: /[^A-Za-z0-9]/.test(form.new_password), text: "En az bir özel karakter" },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: tip.ok ? "#065f46" : "#94a3b8" }}>
                <span>{tip.ok ? "✅" : "○"}</span> {tip.text}
              </div>
            ))}
          </div>

          <button
            type="submit"
            style={S.submitBtn}
            disabled={submitting || form.new_password !== form.new_password2}
          >
            {submitting
              ? <><span style={S.spinner} /> Kaydediliyor...</>
              : "🔑 Şifremi Belirle →"
            }
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link to="/login" style={{ fontSize: "0.82rem", color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
            ← Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'Inter', sans-serif" },
  card: { width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,.1)", padding: "2.5rem", border: "1px solid #f1f5f9" },

  logoWrap:   { display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", marginBottom: "1.5rem" },
  logoBox:    { width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoLetter: { color: "#fff", fontWeight: 900, fontSize: "1.2rem" },
  logoName:   { fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" },
  logoSub:    { fontSize: "0.65rem", color: "#94a3b8" },

  iconWrap:    { width: 64, height: 64, borderRadius: "1rem", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" },
  successIcon: { fontSize: "3rem", textAlign: "center", marginBottom: "1rem" },
  title:       { fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: "0.5rem" },
  desc:        { fontSize: "0.875rem", color: "#64748b", textAlign: "center", lineHeight: 1.6, marginBottom: "1.5rem" },

  errorBox: { display: "flex", alignItems: "center", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#b91c1c", marginBottom: "1rem" },

  form:     { display: "flex", flexDirection: "column", gap: "1rem" },
  field:    { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label:    { fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" },
  inputWrap:{ position: "relative", display: "flex", alignItems: "center" },
  input:    { width: "100%", padding: "0.7rem 3rem 0.7rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.9rem", fontFamily: "inherit", color: "#0f172a", background: "#fff", outline: "none", transition: "all .15s" },
  eyeBtn:   { position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" },

  tips: { background: "#f8fafc", borderRadius: "0.625rem", padding: "0.85rem", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "0.35rem" },

  submitBtn: { width: "100%", padding: "0.85rem", borderRadius: "0.625rem", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 6px 20px rgba(99,102,241,.3)", transition: "all .2s", marginTop: "0.5rem" },
  spinner:   { display: "inline-block", width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .65s linear infinite" },
};