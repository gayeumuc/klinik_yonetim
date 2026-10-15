import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { clientAPI, authAPI, messageAPI, appointmentAPI, clinicalAPI } from "../services/api";
import Navbar from "../components/Navbar";
import MessagingPanel from "../components/MessagingPanel";
import config from "../config";
import { useToast } from "../components/UIComponents";
import {
  AppointmentsSection,
  TasksSection,
  TestsSection,
  SessionNotesSection,
} from "./ClientDashboardSections";

export default function ClientDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setSection] = useState("profil");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [passForm, setPassForm] = useState({ old_password: "", new_password: "", new_password2: "" });
  const [passMsg, setPassMsg] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showNewPass2, setShowNewPass2] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const fn = () => messageAPI.unreadCount().then(r => setUnreadCount(r.data.unread_count)).catch(() => {});
    fn();
    const t = setInterval(fn, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    clientAPI.myProfile()
      .then(res => { setProfile(res.data); setEditForm(res.data); })
      .catch(() => setError("Profil bilgileri yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  // ── Randevu ────────────────────────────────────────────────────────────────
  const [myAppts, setMyAppts] = useState([]);
  const [availAppts, setAvailAppts] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptMsg, setApptMsg] = useState("");

  const loadMyAppts = useCallback(() => {
    setApptLoading(true);
    appointmentAPI.myList().then(r => {
      const d = r.data?.results || r.data || [];
      setMyAppts(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setApptLoading(false));
  }, []);

  const loadAvailAppts = useCallback(() => {
    appointmentAPI.available().then(r => {
      const d = r.data?.results || r.data || [];
      setAvailAppts(Array.isArray(d) ? d : []);
    }).catch(() => {});
  }, []);

  const handleBook = async (id, note) => {
    setApptMsg("");
    try {
      await appointmentAPI.book(id, note ? { notes: note } : {});
      setApptMsg("success:Randevu rezervasyonu yapıldı!");
      toast.success("📅 Randevu rezervasyonu yapıldı!");
      loadMyAppts();
      loadAvailAppts();
    } catch (err) {
      const msg = err.response?.data?.detail || "Rezervasyon başarısız.";
      setApptMsg("error:" + msg);
      toast.error(msg);
    }
  };

  const handleCancelAppt = async (id, reason = "") => {
    if (!window.confirm("Bu randevuyu iptal etmek istiyor musunuz?")) return;
    try {
      await appointmentAPI.cancel(id, reason);
      setMyAppts(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
      setApptMsg("success:Randevu iptal edildi.");
      toast.info("Randevu iptal edildi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "İptal başarısız.";
      setApptMsg("error:" + msg);
      toast.error(msg);
    }
  };

  const handleConfirmAppt = async (id) => {
    try {
      await appointmentAPI.confirm(id);
      setMyAppts(prev => prev.map(a => a.id === id ? { ...a, status: "booked" } : a));
      setApptMsg("success:Randevu onaylandı!");
      toast.success("✅ Randevu onaylandı!");
    } catch (err) {
      const msg = err.response?.data?.detail || "Onaylama başarısız.";
      setApptMsg("error:" + msg);
      toast.error(msg);
    }
  };

  const handleRejectAppt = async (id, reason = "") => {
    try {
      await appointmentAPI.reject(id, reason);
      setMyAppts(prev => prev.map(a => a.id === id ? { ...a, status: "rejected", cancellation_reason: reason } : a));
      setApptMsg("success:Randevu reddedildi.");
      toast.info("Randevu reddedildi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Red işlemi başarısız.";
      setApptMsg("error:" + msg);
      toast.error(msg);
    }
  };

  const handleDeleteAppt = async (id) => {
    if (!window.confirm("Bu randevuyu kalıcı olarak silmek istiyor musunuz?")) return;
    try {
      await appointmentAPI.delete(id);
      setMyAppts(prev => prev.filter(a => a.id !== id));
      setApptMsg("success:Randevu silindi.");
      toast.info("Randevu silindi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Silme başarısız.";
      setApptMsg("error:" + msg);
      toast.error(msg);
    }
  };

  // ── Görevler ───────────────────────────────────────────────────────────────
  const [myTasks, setMyTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksMsg, setTasksMsg] = useState("");

  const loadMyTasks = useCallback(() => {
    setTasksLoading(true);
    clinicalAPI.tasks.myList().then(r => {
      const d = r.data?.results || r.data || [];
      setMyTasks(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setTasksLoading(false));
  }, []);

  const handleCompleteTask = async (id, note) => {
    setTasksMsg("");
    try {
      await clinicalAPI.tasks.complete(id, note);
      setMyTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: true, completion_note: note } : t));
      setTasksMsg("success:Ödev tamamlandı olarak işaretlendi!");
      toast.success("✅ Ödev tamamlandı olarak işaretlendi!");
    } catch (err) {
      const msg = err.response?.data?.detail || "İşlem başarısız.";
      setTasksMsg("error:" + msg);
      toast.error(msg);
    }
  };

  // ── Testler ────────────────────────────────────────────────────────────────
  const [myAssignments, setMyAssignments] = useState([]);
  const [assignsLoading, setAssignsLoading] = useState(false);
  const [testsMsg, setTestsMsg] = useState("");
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitSaving, setSubmitSaving] = useState(false);

  const loadMyAssignments = useCallback(() => {
    setAssignsLoading(true);
    clinicalAPI.tests.myAssignments().then(r => {
      const d = r.data?.results || r.data || [];
      setMyAssignments(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setAssignsLoading(false));
  }, []);

  const handleStartTest = async (assignment) => {
    setTestsMsg("");
    try {
      const res = await clinicalAPI.tests.assignment(assignment.id);
      // res.data'yı spread ile kopyala (immutable proxy sorununu önle)
      const data = { ...res.data };
      // test_detail alanı sorularla birlikte test nesnesini içerir.
      // test alanı integer FK olduğu için test_detail'i kullan.
      const testWithQuestions = data.test_detail || {};
      data.test = testWithQuestions;
      setActiveAssignment(data);
      setAnswers({});
    } catch (err) {
      const msg = err?.response?.data?.detail || "Test yüklenemedi.";
      setTestsMsg("error:" + msg);
    }
  };

  const handleSubmitTest = async () => {
    if (!activeAssignment) return;
    // handleStartTest'te data.test = test_detail olarak set edildi
    const activeTest = activeAssignment.test_detail || activeAssignment.test || {};
    const questions = Array.isArray(activeTest?.questions) ? activeTest.questions : [];
    const unanswered = questions.filter(q => q.question_type !== "text" && answers[q.id] === undefined);
    if (unanswered.length > 0) {
      const msg = `Lütfen tüm soruları cevaplayın (${unanswered.length} soru eksik).`;
      setTestsMsg("error:" + msg);
      toast.warning(msg);
      return;
    }
    setSubmitSaving(true);
    setTestsMsg("");
    try {
      const payload = Object.entries(answers).map(([qId, val]) => ({
        question: parseInt(qId),
        ...(typeof val === "number" ? { numeric_value: val } : { text_value: String(val) }),
      }));
      await clinicalAPI.tests.submit(activeAssignment.id, payload);
      setTestsMsg("success:Test başarıyla gönderildi! Sonuçlarınız psikologunuz tarafından değerlendirilecek.");
      toast.success("🧪 Test başarıyla gönderildi!");
      setActiveAssignment(null);
      setAnswers({});
      loadMyAssignments();
    } catch (err) {
      const msg = err.response?.data?.detail || "Gönderme başarısız.";
      setTestsMsg("error:" + msg);
      toast.error(msg);
    } finally {
      setSubmitSaving(false);
    }
  };

  // ── Seans Notları ──────────────────────────────────────────────────────────
  const [myNotes, setMyNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesMsg, setNotesMsg] = useState("");

  const loadMyNotes = useCallback(() => {
    setNotesLoading(true);
    clinicalAPI.notes.myList().then(r => {
      const d = r.data?.results || r.data || [];
      setMyNotes(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setNotesLoading(false));
  }, []);

  // ── Yardımcı ───────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
  const firstName = profile?.first_name || user?.email?.split("@")[0] || "Danışan";

  const handleEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await clientAPI.updateMyProfile({
        first_name: editForm.first_name, last_name: editForm.last_name,
        phone: editForm.phone, address: editForm.address,
        emergency_contact: editForm.emergency_contact, emergency_phone: editForm.emergency_phone,
      });
      setProfile(res.data); setEditForm(res.data);
      setSaveMsg("Profil başarıyla güncellendi."); setEditMode(false);
      toast.success("✅ Profil başarıyla güncellendi.");
    } catch {
      setSaveMsg("Güncelleme başarısız. Lütfen tekrar deneyin.");
      toast.error("Profil güncellenemedi.");
    }
    finally { setSaving(false); }
  };

  const handlePassChange = (e) => setPassForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    setPassMsg("");
    if (passForm.new_password !== passForm.new_password2) { setPassMsg("error:Yeni şifreler eşleşmiyor."); return; }
    if (passForm.new_password.length < 8) { setPassMsg("error:Yeni şifre en az 8 karakter olmalıdır."); return; }
    setPassSaving(true);
    try {
      await authAPI.changePassword({ old_password: passForm.old_password, new_password: passForm.new_password, new_password2: passForm.new_password2 });
      setPassMsg("success:Şifreniz başarıyla güncellendi.");
      setPassForm({ old_password: "", new_password: "", new_password2: "" });
      toast.success("🔑 Şifreniz başarıyla güncellendi.");
    } catch (err) {
      const d = err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || err.response?.data?.detail || "Şifre güncellenemedi.";
      setPassMsg("error:" + d);
      toast.error(d);
    } finally { setPassSaving(false); }
  };

  const handleSectionChange = (id) => {
    setSection(id); setEditMode(false); setSaveMsg(""); setPassMsg("");
    setApptMsg(""); setTasksMsg(""); setTestsMsg(""); setNotesMsg(""); setActiveAssignment(null);
    if (id === "randevular") { loadMyAppts(); loadAvailAppts(); }
    if (id === "gorevler") loadMyTasks();
    if (id === "testler") loadMyAssignments();
    if (id === "notlar") loadMyNotes();
  };

  const menuItems = [
    { id: "profil", icon: "👤", label: "Profilim" },
    { id: "sifre", icon: "🔑", label: "Şifre Değiştir" },
    { id: "mesajlar", icon: "💬", label: "Mesajlar" },
    { id: "randevular", icon: "📅", label: "Randevularım" },
    { id: "gorevler", icon: "📝", label: "Görevlerim" },
    { id: "testler", icon: "🧪", label: "Testlerim" },
    { id: "notlar", icon: "📖", label: "Seans Notları" },
  ];

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.layout}>

        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={S.sideProfile}>
            <div style={S.sideAvatar}>{(profile?.first_name?.[0] || user?.email?.[0] || "D").toUpperCase()}</div>
            <div style={S.sideName}>{profile ? `${profile.first_name} ${profile.last_name}` : user?.email}</div>
            <div style={S.sideRole}>👤 Danışan</div>
            <span style={S.sideBadge}>✓ Aktif</span>
          </div>

          <nav style={S.sideNav}>
            {menuItems.map(item => (
              <button key={item.id} style={{ ...S.sideNavItem, ...(activeSection === item.id ? S.sideNavActive : {}) }} onClick={() => handleSectionChange(item.id)}>
                <span>{item.icon}</span>
                {item.label}
                {item.id === "mesajlar" && unreadCount > 0 && (
                  <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 800, padding: "0.1rem 0.45rem", minWidth: "18px", textAlign: "center" }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {activeSection === item.id && item.id !== "mesajlar" && <span style={S.dot} />}
              </button>
            ))}
          </nav>

          <div style={S.psychCard}>
            <div style={S.psychTitle}>🩺 Psikologunuz</div>
            <div style={S.psychName}>{config.PSIKOLOG_ADI}</div>
            <div style={S.psychSpec}>{config.PSIKOLOG_UNVAN.split(" ").slice(0, 2).join(" ")}</div>
            <a href={`tel:${config.TELEFON.replace(/\s/g, "")}`} style={S.psychPhone}>📞 {config.TELEFON}</a>
          </div>
        </aside>

        {/* Ana İçerik */}
        <main style={S.main}>
          <div style={S.welcomeBar}>
            <div>
              <h1 style={S.welcomeTitle}>{greeting}, {firstName}! 👋</h1>
              <p style={S.welcomeSub}>{new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          {loading ? (
            <div style={S.loadingBox}>
              <div className="spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
              <p style={{ color: "#94a3b8", marginTop: "1rem" }}>Yükleniyor...</p>
            </div>
          ) : error ? (
            <div style={S.errorBox}><span>⚠️</span> {error}</div>
          ) : (
            <>
              {/* PROFİL */}
              {activeSection === "profil" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={S.profileHero}>
                    <div style={S.profileHeroBg} />
                    <div style={S.profileHeroContent}>
                      <div style={S.profileHeroAvatar}>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</div>
                      <div style={{ flex: 1 }}>
                        <h2 style={S.profileHeroName}>{profile?.first_name} {profile?.last_name}</h2>
                        <p style={S.profileHeroEmail}>{user?.email}</p>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={S.badgeGreen}>✓ Aktif Danışan</span>
                          <span style={S.badgeBlue}>🔒 KVKK Korumalı</span>
                        </div>
                      </div>
                      <button style={S.editBtn} onClick={() => { setEditMode(!editMode); setSaveMsg(""); }}>
                        {editMode ? "✕ İptal" : "✏️ Düzenle"}
                      </button>
                    </div>
                  </div>

                  {saveMsg && <div style={saveMsg.includes("başarıyla") ? S.successBox : S.errorBox}>{saveMsg.includes("başarıyla") ? "✅" : "⚠️"} {saveMsg}</div>}

                  {editMode ? (
                    <form onSubmit={handleSave} style={S.editForm}>
                      <h3 style={S.editFormTitle}>✏️ Profil Düzenle</h3>
                      <div className="grid-2">
                        <EditField label="Ad" name="first_name" value={editForm.first_name} onChange={handleEditChange} required />
                        <EditField label="Soyad" name="last_name" value={editForm.last_name} onChange={handleEditChange} required />
                        <EditField label="Telefon" name="phone" value={editForm.phone} onChange={handleEditChange} />
                        <EditField label="Doğum Tarihi" name="birth_date" type="date" value={editForm.birth_date} onChange={handleEditChange} />
                      </div>
                      <EditField label="Adres" name="address" value={editForm.address} onChange={handleEditChange} textarea />
                      <div className="grid-2">
                        <EditField label="Acil Durum Kişisi" name="emergency_contact" value={editForm.emergency_contact} onChange={handleEditChange} />
                        <EditField label="Acil Durum Telefonu" name="emergency_phone" value={editForm.emergency_phone} onChange={handleEditChange} />
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                        <button type="button" style={S.cancelBtn} onClick={() => { setEditMode(false); setEditForm(profile); }}>İptal</button>
                        <button type="submit" style={S.saveBtn} disabled={saving}>
                          {saving ? <><span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "#fff" }} /> Kaydediliyor...</> : "💾 Kaydet"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={S.infoGrid}>
                      <InfoCard title="Kişisel Bilgiler" icon="👤">
                        <InfoRow label="Ad" value={profile?.first_name} />
                        <InfoRow label="Soyad" value={profile?.last_name} />
                        <InfoRow label="Telefon" value={profile?.phone} />
                        <InfoRow label="Doğum Tarihi" value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString("tr-TR") : null} />
                      </InfoCard>
                      <InfoCard title="İletişim & Adres" icon="📍">
                        <InfoRow label="E-posta" value={user?.email} />
                        <InfoRow label="Adres" value={profile?.address || "—"} />
                        <InfoRow label="Acil Kişi" value={profile?.emergency_contact || "—"} />
                        <InfoRow label="Acil Tel" value={profile?.emergency_phone || "—"} />
                      </InfoCard>
                    </div>
                  )}
                </div>
              )}

              {/* ŞİFRE */}
              {activeSection === "sifre" && (
                <div style={S.passSection}>
                  <div style={S.passSectionHeader}>
                    <div style={S.passSectionIcon}>🔑</div>
                    <div>
                      <h2 style={S.passSectionTitle}>Şifre Değiştir</h2>
                      <p style={S.passSectionDesc}>Hesabınızın güvenliği için güçlü bir şifre kullanın.</p>
                    </div>
                  </div>
                  {passMsg && <div style={passMsg.startsWith("success:") ? S.successBox : S.errorBox}>{passMsg.startsWith("success:") ? "✅" : "⚠️"} {passMsg.replace(/^(success:|error:)/, "")}</div>}
                  <form onSubmit={handlePassSubmit} style={S.passForm}>
                    <div style={S.passField}>
                      <label style={S.passLabel}>Mevcut Şifre</label>
                      <div style={S.passInputWrap}>
                        <input type={showOldPass ? "text" : "password"} name="old_password" value={passForm.old_password} onChange={handlePassChange} placeholder="Mevcut şifrenizi girin" required style={S.passInput} />
                        <button type="button" style={S.eyeBtn} onClick={() => setShowOldPass(!showOldPass)}>{showOldPass ? "🙈" : "👁️"}</button>
                      </div>
                    </div>
                    <div style={S.passField}>
                      <label style={S.passLabel}>Yeni Şifre</label>
                      <div style={S.passInputWrap}>
                        <input type={showNewPass ? "text" : "password"} name="new_password" value={passForm.new_password} onChange={handlePassChange} placeholder="En az 8 karakter" required minLength={8} style={S.passInput} />
                        <button type="button" style={S.eyeBtn} onClick={() => setShowNewPass(!showNewPass)}>{showNewPass ? "🙈" : "👁️"}</button>
                      </div>
                    </div>
                    <div style={S.passField}>
                      <label style={S.passLabel}>Yeni Şifre (Tekrar)</label>
                      <div style={S.passInputWrap}>
                        <input type={showNewPass2 ? "text" : "password"} name="new_password2" value={passForm.new_password2} onChange={handlePassChange} placeholder="Yeni şifrenizi tekrar girin" required style={{ ...S.passInput, borderColor: passForm.new_password2 && passForm.new_password !== passForm.new_password2 ? "#ef4444" : undefined }} />
                        <button type="button" style={S.eyeBtn} onClick={() => setShowNewPass2(!showNewPass2)}>{showNewPass2 ? "🙈" : "👁️"}</button>
                      </div>
                      {passForm.new_password2 && passForm.new_password !== passForm.new_password2 && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.3rem" }}>Şifreler eşleşmiyor</p>}
                    </div>
                    <div style={S.passTips}>
                      <p style={S.passTipsTitle}>💡 Güçlü şifre için:</p>
                      {[
                        { ok: passForm.new_password.length >= 8, text: "En az 8 karakter" },
                        { ok: /[A-Z]/.test(passForm.new_password), text: "En az bir büyük harf" },
                        { ok: /[0-9]/.test(passForm.new_password), text: "En az bir rakam" },
                        { ok: /[^A-Za-z0-9]/.test(passForm.new_password), text: "En az bir özel karakter (!@#$...)" },
                      ].map((tip, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: tip.ok ? "#065f46" : "#94a3b8" }}>
                          <span>{tip.ok ? "✅" : "○"}</span> {tip.text}
                        </div>
                      ))}
                    </div>
                    <button type="submit" style={S.passSubmitBtn} disabled={passSaving || passForm.new_password !== passForm.new_password2}>
                      {passSaving ? <><span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "#fff" }} /> Güncelleniyor...</> : "🔑 Şifreyi Güncelle"}
                    </button>
                  </form>
                </div>
              )}

              {/* MESAJLAR */}
              {activeSection === "mesajlar" && (
                <MessagingPanel currentUserEmail={user?.email} role="client" accentColor="#0ea5e9" accentGradient="135deg,#0ea5e9,#10b981" />
              )}

              {/* RANDEVULAR */}
              {activeSection === "randevular" && (
                <AppointmentsSection
                  myAppts={myAppts}
                  availAppts={availAppts}
                  apptLoading={apptLoading}
                  apptMsg={apptMsg}
                  onBook={handleBook}
                  onCancel={handleCancelAppt}
                  onConfirm={handleConfirmAppt}
                  onReject={handleRejectAppt}
                  onDelete={handleDeleteAppt}
                />
              )}

              {/* GÖREVLER */}
              {activeSection === "gorevler" && (
                <TasksSection
                  myTasks={myTasks}
                  tasksLoading={tasksLoading}
                  tasksMsg={tasksMsg}
                  onComplete={handleCompleteTask}
                />
              )}

              {/* TESTLER */}
              {activeSection === "testler" && (
                <TestsSection
                  myAssignments={myAssignments}
                  assignsLoading={assignsLoading}
                  testsMsg={testsMsg}
                  onStartTest={handleStartTest}
                  onSubmitTest={handleSubmitTest}
                  activeAssignment={activeAssignment}
                  setActiveAssignment={setActiveAssignment}
                  answers={answers}
                  setAnswers={setAnswers}
                  submitSaving={submitSaving}
                />
              )}

              {/* SEANS NOTLARI */}
              {activeSection === "notlar" && (
                <SessionNotesSection
                  myNotes={myNotes}
                  notesLoading={notesLoading}
                  notesMsg={notesMsg}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Yardımcı Bileşenler ─────────────────────────────────────────────────── */
function InfoCard({ title, icon, children }) {
  return (
    <div style={IC.card}>
      <div style={IC.header}><span>{icon}</span><span style={IC.title}>{title}</span></div>
      <div>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={IC.row}>
      <span style={IC.label}>{label}</span>
      <span style={IC.value}>{value}</span>
    </div>
  );
}

function EditField({ label, name, value, onChange, type = "text", required, textarea }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
      {textarea ? (
        <textarea name={name} value={value || ""} onChange={onChange} rows={3} style={{ padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", outline: "none", resize: "vertical", width: "100%" }} />
      ) : (
        <input type={type} name={name} value={value || ""} onChange={onChange} required={required} style={{ padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", outline: "none", width: "100%" }} />
      )}
    </div>
  );
}

/* ── Stiller ─────────────────────────────────────────────────────────────── */
const S = {
  page:   { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  layout: { display: "flex", maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", gap: "1.5rem", alignItems: "flex-start" },

  sidebar: { width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem", position: "sticky", top: "80px" },
  sideProfile: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.25rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  sideAvatar: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #10b981)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", margin: "0 auto 0.75rem" },
  sideName: { fontWeight: 800, fontSize: "0.875rem", color: "#0f172a", marginBottom: "0.2rem" },
  sideRole: { fontSize: "0.75rem", color: "#64748b", marginBottom: "0.4rem" },
  sideBadge: { display: "inline-block", background: "#d1fae5", color: "#065f46", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 },

  sideNav: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "0.4rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: "0.1rem" },
  sideNavItem: { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.8rem", borderRadius: "0.5rem", border: "none", background: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, color: "#64748b", width: "100%", textAlign: "left", transition: "all .15s", position: "relative" },
  sideNavActive: { background: "linear-gradient(135deg, #e0f2fe, #d1fae5)", color: "#0369a1", fontWeight: 700 },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginLeft: "auto" },

  psychCard: { background: "linear-gradient(135deg, #0c4a6e, #064e3b)", borderRadius: "1rem", padding: "1.25rem", textAlign: "center" },
  psychTitle: { fontSize: "0.68rem", color: "rgba(255,255,255,.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "0.5rem" },
  psychName: { fontWeight: 800, fontSize: "0.875rem", color: "#fff", marginBottom: "0.2rem" },
  psychSpec: { fontSize: "0.72rem", color: "rgba(255,255,255,.6)", marginBottom: "0.6rem" },
  psychPhone: { display: "block", fontSize: "0.75rem", color: "#7dd3fc", textDecoration: "none", fontWeight: 600 },

  main: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1.25rem" },
  welcomeBar: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" },
  welcomeTitle: { fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" },
  welcomeSub: { fontSize: "0.82rem", color: "#94a3b8", marginTop: "0.2rem" },

  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" },
  errorBox:   { display: "flex", alignItems: "center", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#b91c1c" },
  successBox: { display: "flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#065f46", fontWeight: 600 },

  profileHero: { position: "relative", background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "2rem", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  profileHeroBg: { position: "absolute", top: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(135deg, #0c4a6e, #064e3b)" },
  profileHeroContent: { position: "relative", display: "flex", alignItems: "flex-end", gap: "1.25rem", paddingTop: "1rem" },
  profileHeroAvatar: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #10b981)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.5rem", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,.15)", flexShrink: 0 },
  profileHeroName: { fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.2rem" },
  profileHeroEmail: { fontSize: "0.82rem", color: "#64748b", marginBottom: "0.5rem" },

  editBtn: { marginLeft: "auto", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #0ea5e9", background: "#f0f9ff", color: "#0ea5e9", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", flexShrink: 0, alignSelf: "flex-end" },
  editForm: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  editFormTitle: { fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1.5px solid #f1f5f9" },
  cancelBtn: { padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" },
  saveBtn:   { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.5rem", borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #0ea5e9, #10b981)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(14,165,233,.3)" },

  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  badgeGreen: { display: "inline-block", background: "#d1fae5", color: "#065f46", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700 },
  badgeBlue:  { display: "inline-block", background: "#dbeafe", color: "#1e40af", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700 },

  passSection: { background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: "3px solid #6366f1" },
  passSectionHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" },
  passSectionIcon: { width: 56, height: 56, borderRadius: "1rem", background: "#ede9fe", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 },
  passSectionTitle: { fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" },
  passSectionDesc: { fontSize: "0.875rem", color: "#64748b" },
  passForm: { display: "flex", flexDirection: "column", gap: "1.1rem", maxWidth: "480px" },
  passField: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  passLabel: { fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" },
  passInputWrap: { position: "relative", display: "flex", alignItems: "center" },
  passInput: { width: "100%", padding: "0.7rem 3rem 0.7rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.9rem", fontFamily: "inherit", color: "#0f172a", background: "#fff", outline: "none", transition: "all .15s" },
  eyeBtn: { position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" },
  passTips: { background: "#f8fafc", borderRadius: "0.75rem", padding: "1rem", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "0.4rem" },
  passTipsTitle: { fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" },
  passSubmitBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", borderRadius: "0.625rem", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,.3)", transition: "all .2s", marginTop: "0.5rem" },
};

const IC = {
  card:   { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  header: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem 1.25rem", borderBottom: "1px solid #f8fafc", background: "#fafbff" },
  title:  { fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" },
  row:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 1.25rem", borderBottom: "1px solid #f8fafc" },
  label:  { fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" },
  value:  { fontSize: "0.875rem", color: "#1e293b", fontWeight: 500 },
};