import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI, clientAPI, psychologistAPI, workingHoursAPI, messageAPI, appointmentAPI, clinicalAPI } from "../services/api";
import Navbar from "../components/Navbar";
import MessagingPanel from "../components/MessagingPanel";
import { useToast, SkeletonList } from "../components/UIComponents";
import AppointmentsTab from "./AppointmentsTab";

export default function PsychologistDashboard() {
  const { user }  = useAuth();
  const toast     = useToast();
  const [clients,  setClients]    = useState([]);
  const [profile,  setProfile]    = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Profil düzenleme state
  const [profileForm,  setProfileForm]  = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,   setProfileMsg]   = useState("");

  useEffect(() => {
    Promise.all([
      clientAPI.listAll().catch(() => ({ data: [] })),
      psychologistAPI.getMyProfile().catch(() => ({ data: null })),
    ]).then(([cRes, pRes]) => {
      const list = cRes.data?.results || cRes.data || [];
      setClients(Array.isArray(list) ? list : []);
      setProfile(pRes.data);
      if (pRes.data) setProfileForm(pRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const activeClients   = clients.filter(c => c.is_active);
  const inactiveClients = clients.filter(c => !c.is_active);
  const thisMonth       = clients.filter(c => {
    const d = new Date(c.created_at);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split("@")[0] || "Psikolog";

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  const stats = [
    { label: "Toplam Danışan",  value: clients.length,         icon: "👥", color: "#6366f1", bg: "#ede9fe" },
    { label: "Aktif Danışan",   value: activeClients.length,   icon: "✅", color: "#10b981", bg: "#d1fae5" },
    { label: "Pasif Danışan",   value: inactiveClients.length, icon: "⏸️", color: "#f59e0b", bg: "#fef3c7" },
    { label: "Bu Ay Eklenen",   value: thisMonth.length,       icon: "📈", color: "#3b82f6", bg: "#dbeafe" },
  ];

  // Çalışma saatleri state
  const [workingHours,    setWorkingHours]    = useState([]);
  const [whLoading,       setWhLoading]       = useState(false);
  const [whSaving,        setWhSaving]        = useState(false);
  const [whMsg,           setWhMsg]           = useState("");

  const DAYS = [
    { id: 0, label: "Pazartesi" },
    { id: 1, label: "Salı" },
    { id: 2, label: "Çarşamba" },
    { id: 3, label: "Perşembe" },
    { id: 4, label: "Cuma" },
    { id: 5, label: "Cumartesi" },
    { id: 6, label: "Pazar" },
  ];

  // Çalışma saatleri formu — 7 gün için başlangıç değerleri
  const defaultWH = DAYS.map(d => ({
    day: d.id,
    start_time: "09:00",
    end_time:   "17:00",
    is_active:  d.id < 5, // Pazartesi-Cuma varsayılan aktif
  }));
  const [whForm, setWhForm] = useState(defaultWH);

  const tabs = [
    { id: "overview",      icon: "📊", label: "Genel Bakış" },
    { id: "clients",       icon: "👥", label: "Danışanlar" },
    { id: "messages",      icon: "💬", label: "Mesajlar" },
    { id: "appointments",  icon: "📅", label: "Randevular" },
    { id: "sessions",      icon: "📝", label: "Seans Notları" },
    { id: "tasks",         icon: "✅", label: "Ödevler" },
    { id: "tests",         icon: "🧪", label: "Testler" },
    { id: "profile",       icon: "🩺", label: "Profilim" },
    { id: "working-hours", icon: "🕐", label: "Çalışma Saatleri" },
    { id: "security",      icon: "🔒", label: "Güvenlik" },
    { id: "tools",         icon: "🛠️", label: "Araçlar" },
  ];

  // ── Randevu state ─────────────────────────────────────────────────────────
  const [appointments,  setAppointments] = useState([]);
  const [apptLoading,   setApptLoading]  = useState(false);

  // ── Seans Notu state ──────────────────────────────────────────────────────
  const [notes,              setNotes]              = useState([]);
  const [notesLoading,       setNotesLoading]       = useState(false);
  const [notesMsg,           setNotesMsg]           = useState("");
  const [noteForm,           setNoteForm]           = useState({ client: "", session_date: new Date().toISOString().split("T")[0], content: "", mood_score: "", is_shared: false });
  const [noteSaving,         setNoteSaving]         = useState(false);
  const [showNoteForm,       setShowNoteForm]       = useState(false);
  const [editingNote,        setEditingNote]        = useState(null);
  const [completedAppts,     setCompletedAppts]     = useState([]);
  const [completedApptLoading, setCompletedApptLoading] = useState(false);
  const [sessionSubTab,      setSessionSubTab]      = useState("appointments"); // "appointments" | "notes"
  const [writingNoteFor,     setWritingNoteFor]     = useState(null); // tamamlanan randevu objesi

  // ── Ödev state ────────────────────────────────────────────────────────────
  const [tasks,           setTasks]           = useState([]);
  const [tasksLoading,    setTasksLoading]    = useState(false);
  const [tasksMsg,        setTasksMsg]        = useState("");
  const [taskForm,        setTaskForm]        = useState({ client: "", title: "", description: "", due_date: "", priority: "medium" });
  const [taskSaving,      setTaskSaving]      = useState(false);
  const [showTaskForm,    setShowTaskForm]    = useState(false);
  const [taskFilter,      setTaskFilter]      = useState("all");
  const [taskClientFilter, setTaskClientFilter] = useState(null);
  const [editingTask,     setEditingTask]     = useState(null);

  // ── Test state ────────────────────────────────────────────────────────────
  const [tests,           setTests]           = useState([]);
  const [testsLoading,    setTestsLoading]    = useState(false);
  const [testsMsg,        setTestsMsg]        = useState("");
  // Test oluşturma formu
  const [testForm,        setTestForm]        = useState({ title: "", description: "" });
  const [testSaving,      setTestSaving]      = useState(false);
  const [showTestForm,    setShowTestForm]    = useState(false);
  // Soru ekleme
  const [expandedTest,    setExpandedTest]    = useState(null); // hangi testin soruları açık
  const [questionForm,    setQuestionForm]    = useState({ question_text: "", question_type: "likert", options: "", weight: 1 });
  const [questionSaving,  setQuestionSaving]  = useState(false);
  const [questionMsg,     setQuestionMsg]     = useState("");
  // Test atama
  const [assignForm,      setAssignForm]      = useState({ test: "", client: "", due_date: "" });
  const [assignSaving,    setAssignSaving]    = useState(false);
  const [showAssignForm,  setShowAssignForm]  = useState(false);
  const [assignMsg,       setAssignMsg]       = useState("");
  // Atamalar listesi
  const [assignments,     setAssignments]     = useState([]);
  const [assignsLoading,  setAssignsLoading]  = useState(false);
  const [testSubTab,      setTestSubTab]      = useState("tests"); // "tests" | "assignments"
  // Yorum
  const [commentingId,    setCommentingId]    = useState(null);
  const [commentText,     setCommentText]     = useState("");
  const [commentSaving,   setCommentSaving]   = useState(false);
  // Yanıt detayları
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  // Yüklenen atama detayları (answers dahil) — { [assignmentId]: detailData }
  const [assignmentDetails, setAssignmentDetails] = useState({});
  const [assignmentDetailsLoading, setAssignmentDetailsLoading] = useState(null);

  // ── Şifre değiştirme state ────────────────────────────────────────────────
  const [pwForm,    setPwForm]    = useState({ old_password: "", new_password: "", new_password2: "" });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwMsg,     setPwMsg]     = useState("");

  const handlePwChange = (e) =>
    setPwForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password2) {
      setPwMsg("error:Yeni şifreler eşleşmiyor.");
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwMsg("error:Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }
    setPwSaving(true);
    setPwMsg("");
    try {
      await authAPI.changePassword({
        old_password:  pwForm.old_password,
        new_password:  pwForm.new_password,
        new_password2: pwForm.new_password2,
      });
      setPwMsg("success:Şifreniz başarıyla değiştirildi.");
      setPwForm({ old_password: "", new_password: "", new_password2: "" });
    } catch (err) {
      const data = err.response?.data;
      const msg  = data?.old_password?.[0]
        || data?.new_password?.[0]
        || data?.new_password2?.[0]
        || data?.detail
        || "Şifre değiştirme başarısız.";
      setPwMsg("error:" + msg);
    } finally {
      setPwSaving(false);
    }
  };

  // ── Mesajlaşma: yalnızca okunmamış sayısı sidebar badge için ─────────────
  const [unreadCount, setUnreadCount] = useState(0);

  // Okunmamış sayısını periyodik güncelle (sidebar badge)
  useEffect(() => {
    const fetchUnread = () => {
      messageAPI.unreadCount().then(r => setUnreadCount(r.data.unread_count)).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sekme değişikliği — çalışma saatleri ve mesajlar sekmesi açıldığında yükle
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setProfileMsg("");
    setWhMsg("");
    setPwMsg("");
    if (tabId === "working-hours" && workingHours.length === 0) {
      setWhLoading(true);
      workingHoursAPI.list()
        .then(res => {
          const data = res.data?.results || res.data || [];
          if (data.length > 0) {
            const merged = defaultWH.map(def => {
              const existing = data.find(d => d.day === def.day);
              return existing ? { ...existing } : def;
            });
            setWhForm(merged);
            setWorkingHours(data);
          }
        })
        .catch(() => {})
        .finally(() => setWhLoading(false));
    }
    // Randevular sekmesi
    if (tabId === "appointments" && appointments.length === 0) {
      setApptLoading(true);
      appointmentAPI.list().then(r => {
        const data = r.data?.results || r.data || [];
        setAppointments(Array.isArray(data) ? data : []);
      }).catch(() => {}).finally(() => setApptLoading(false));
    }
    // Seans Notları sekmesi
    if (tabId === "sessions") {
      setCompletedApptLoading(true);
      clinicalAPI.notes.completedAppointments().then(r => {
        const data = r.data || [];
        setCompletedAppts(Array.isArray(data) ? data : []);
      }).catch(() => {}).finally(() => setCompletedApptLoading(false));
      if (notes.length === 0) {
        setNotesLoading(true);
        clinicalAPI.notes.list().then(r => {
          const data = r.data?.results || r.data || [];
          setNotes(Array.isArray(data) ? data : []);
        }).catch(() => {}).finally(() => setNotesLoading(false));
      }
    }
    // Ödevler sekmesi
    if (tabId === "tasks" && tasks.length === 0) {
      setTasksLoading(true);
      clinicalAPI.tasks.list().then(r => {
        const data = r.data?.results || r.data || [];
        setTasks(Array.isArray(data) ? data : []);
      }).catch(() => {}).finally(() => setTasksLoading(false));
    }
    // Testler sekmesi
    if (tabId === "tests") {
      setTestsLoading(true);
      clinicalAPI.tests.list().then(r => {
        const data = r.data?.results || r.data || [];
        setTests(Array.isArray(data) ? data : []);
      }).catch(() => {}).finally(() => setTestsLoading(false));
    }
    // Mesajlar sekmesi: MessagingPanel kendi state'ini yönetiyor, burada bir şey yapmaya gerek yok
  };

  // ── Randevu işlemleri (AppointmentsTab bileşeni tarafından kullanılır) ────
  const handleApptCancel = async (id) => {
    if (!window.confirm("Bu randevuyu iptal etmek istiyor musunuz?")) return;
    try {
      await appointmentAPI.cancel(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
      toast.info("Randevu iptal edildi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "İptal başarısız.";
      toast.error(msg);
    }
  };

  const handleApptComplete = async (id) => {
    if (!window.confirm("Bu randevuyu tamamlandı olarak işaretlemek istiyor musunuz?")) return;
    try {
      await appointmentAPI.complete(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "completed" } : a));
      toast.success("✅ Randevu tamamlandı olarak işaretlendi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "İşlem başarısız.";
      toast.error(msg);
    }
  };

  const handleApptDelete = async (id) => {
    try {
      await appointmentAPI.delete(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      toast.info("🗑️ Randevu silindi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Silme başarısız.";
      toast.error(msg);
    }
  };

  // ── Seans Notu işlemleri ──────────────────────────────────────────────────
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    setNoteSaving(true);
    setNotesMsg("");
    try {
      if (editingNote) {
        const res = await clinicalAPI.notes.update(editingNote.id, noteForm);
        setNotes(prev => prev.map(n => n.id === editingNote.id ? res.data : n));
        // Tamamlanan randevular listesini de güncelle
        if (writingNoteFor) {
          setCompletedAppts(prev => prev.map(a =>
            a.appointment_id === writingNoteFor.appointment_id
              ? { ...a, session_note: res.data }
              : a
          ));
        }
        setNotesMsg("success:Not güncellendi.");
        toast.success("📝 Seans notu güncellendi.");
      } else {
        const res = await clinicalAPI.notes.create(noteForm);
        setNotes(prev => [res.data, ...prev]);
        // Tamamlanan randevular listesini de güncelle
        if (writingNoteFor) {
          setCompletedAppts(prev => prev.map(a =>
            a.appointment_id === writingNoteFor.appointment_id
              ? { ...a, session_note: res.data }
              : a
          ));
        }
        setNotesMsg("success:Not oluşturuldu.");
        toast.success("📝 Seans notu oluşturuldu.");
      }
      setNoteForm({ client: "", session_date: new Date().toISOString().split("T")[0], content: "", mood_score: "", is_shared: false });
      setShowNoteForm(false);
      setEditingNote(null);
      setWritingNoteFor(null);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.detail || d?.content?.[0] || "Not kaydedilemedi.";
      setNotesMsg("error:" + msg);
      toast.error(msg);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleNoteDelete = async (id) => {
    if (!window.confirm("Bu notu silmek istiyor musunuz?")) return;
    try {
      await clinicalAPI.notes.delete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      setNotesMsg("success:Not silindi.");
      toast.info("Seans notu silindi.");
    } catch {
      setNotesMsg("error:Silme başarısız.");
      toast.error("Silme başarısız.");
    }
  };

  // ── Ödev işlemleri ────────────────────────────────────────────────────────
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskSaving(true);
    setTasksMsg("");
    try {
      if (editingTask) {
        const res = await clinicalAPI.tasks.update(editingTask.id, taskForm);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data : t));
        setTasksMsg("success:Ödev güncellendi.");
        toast.success("✅ Ödev başarıyla güncellendi.");
        setEditingTask(null);
      } else {
        const res = await clinicalAPI.tasks.create(taskForm);
        setTasks(prev => [res.data, ...prev]);
        setTasksMsg("success:Ödev atandı.");
        toast.success("✅ Ödev başarıyla atandı.");
      }
      setTaskForm({ client: "", title: "", description: "", due_date: "", priority: "medium" });
      setShowTaskForm(false);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.detail || d?.title?.[0] || "Ödev kaydedilemedi.";
      setTasksMsg("error:" + msg);
      toast.error(msg);
    } finally {
      setTaskSaving(false);
    }
  };

  const handleTaskComplete = async (id) => {
    try {
      await clinicalAPI.tasks.complete(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: true } : t));
      setTasksMsg("success:Ödev tamamlandı.");
      toast.success("✅ Ödev tamamlandı olarak işaretlendi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "İşlem başarısız.";
      setTasksMsg("error:" + msg);
      toast.error(msg);
    }
  };

  const handleTaskDelete = async (id) => {
    if (!window.confirm("Bu ödevi silmek istiyor musunuz?\n\nHatalı gönderdiyseniz veya iptal etmek istiyorsanız silebilirsiniz.")) return;
    try {
      await clinicalAPI.tasks.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (expandedTask === id) setExpandedTask(null);
      setTasksMsg("success:Ödev silindi.");
      toast.info("🗑️ Ödev silindi.");
    } catch {
      setTasksMsg("error:Silme başarısız.");
      toast.error("Silme başarısız.");
    }
  };

  // ── Hazır Test Şablonları ─────────────────────────────────────────────────
  const HAZIR_TESTLER = [
    {
      key: "bdi",
      baslik: "Beck Depresyon Ölçeği (BDI)",
      aciklama: "Depresyon belirtilerinin şiddetini ölçen 21 soruluk standart ölçek.",
      ikon: "😔",
      renk: "#6366f1",
      sorular: [
        { question_text: "Üzüntü: Kendinizi nasıl hissediyorsunuz?", question_type: "likert", weight: 1 },
        { question_text: "Karamsarlık: Geleceğe bakışınız nasıl?", question_type: "likert", weight: 1 },
        { question_text: "Geçmişteki başarısızlık duygusu", question_type: "likert", weight: 1 },
        { question_text: "Zevk alamama: Eskiden zevk aldığınız şeylerden ne kadar zevk alıyorsunuz?", question_type: "likert", weight: 1 },
        { question_text: "Suçluluk duygusu", question_type: "likert", weight: 1 },
        { question_text: "Cezalandırılma duygusu", question_type: "likert", weight: 1 },
        { question_text: "Kendinizden memnuniyet", question_type: "likert", weight: 1 },
        { question_text: "Kendini eleştirme / suçlama", question_type: "likert", weight: 1 },
        { question_text: "İntihar düşünceleri", question_type: "likert", weight: 1 },
        { question_text: "Ağlama", question_type: "likert", weight: 1 },
        { question_text: "Ajitasyon / huzursuzluk", question_type: "likert", weight: 1 },
        { question_text: "İlgi kaybı", question_type: "likert", weight: 1 },
        { question_text: "Kararsızlık", question_type: "likert", weight: 1 },
        { question_text: "Değersizlik duygusu", question_type: "likert", weight: 1 },
        { question_text: "Enerji kaybı", question_type: "likert", weight: 1 },
        { question_text: "Uyku değişiklikleri", question_type: "likert", weight: 1 },
        { question_text: "Sinirlilik / tahriş olma", question_type: "likert", weight: 1 },
        { question_text: "İştah değişiklikleri", question_type: "likert", weight: 1 },
        { question_text: "Konsantrasyon güçlüğü", question_type: "likert", weight: 1 },
        { question_text: "Yorgunluk", question_type: "likert", weight: 1 },
        { question_text: "Cinsel ilgi kaybı", question_type: "likert", weight: 1 },
      ],
    },
    {
      key: "bai",
      baslik: "Beck Anksiyete Ölçeği (BAI)",
      aciklama: "Anksiyete belirtilerinin sıklığını ve şiddetini değerlendiren 21 maddelik ölçek.",
      ikon: "😰",
      renk: "#f59e0b",
      sorular: [
        { question_text: "Uyuşma veya karıncalanma", question_type: "likert", weight: 1 },
        { question_text: "Sıcak basması", question_type: "likert", weight: 1 },
        { question_text: "Bacaklarda titreme, sarsılma", question_type: "likert", weight: 1 },
        { question_text: "Gevşeyememe", question_type: "likert", weight: 1 },
        { question_text: "En kötü şeylerin olacağı korkusu", question_type: "likert", weight: 1 },
        { question_text: "Baş dönmesi veya sersemlik", question_type: "likert", weight: 1 },
        { question_text: "Kalp çarpıntısı", question_type: "likert", weight: 1 },
        { question_text: "Dengesizlik hissi", question_type: "likert", weight: 1 },
        { question_text: "Dehşete kapılma", question_type: "likert", weight: 1 },
        { question_text: "Sinirlilik", question_type: "likert", weight: 1 },
        { question_text: "Boğuluyormuş gibi hissetme", question_type: "likert", weight: 1 },
        { question_text: "Ellerde titreme", question_type: "likert", weight: 1 },
        { question_text: "Titreme, sarsılma", question_type: "likert", weight: 1 },
        { question_text: "Kontrolü kaybetme korkusu", question_type: "likert", weight: 1 },
        { question_text: "Ölüm korkusu", question_type: "likert", weight: 1 },
        { question_text: "Korkuya kapılma", question_type: "likert", weight: 1 },
        { question_text: "Mide bulantısı veya karın ağrısı", question_type: "likert", weight: 1 },
        { question_text: "Bayılacakmış gibi hissetme", question_type: "likert", weight: 1 },
        { question_text: "Yüzde kızarma", question_type: "likert", weight: 1 },
        { question_text: "Terleme (sıcaktan değil)", question_type: "likert", weight: 1 },
        { question_text: "Genel anksiyete düzeyi", question_type: "likert", weight: 1 },
      ],
    },
    {
      key: "rosenberg",
      baslik: "Rosenberg Benlik Saygısı Ölçeği",
      aciklama: "Bireyin genel benlik saygısını ölçen 10 maddelik kısa ölçek.",
      ikon: "🌟",
      renk: "#10b981",
      sorular: [
        { question_text: "Kendimi değerli bir insan olarak görüyorum.", question_type: "likert", weight: 1 },
        { question_text: "Bazı iyi özelliklerim olduğunu düşünüyorum.", question_type: "likert", weight: 1 },
        { question_text: "Genel olarak başarısız biri olduğumu hissediyorum.", question_type: "likert", weight: 1 },
        { question_text: "Çoğu insan kadar iyi işler yapabiliyorum.", question_type: "likert", weight: 1 },
        { question_text: "Övünecek fazla bir şeyim olmadığını hissediyorum.", question_type: "likert", weight: 1 },
        { question_text: "Kendimden olumlu bir şekilde söz edebiliyorum.", question_type: "likert", weight: 1 },
        { question_text: "Kendimden genel olarak memnunum.", question_type: "likert", weight: 1 },
        { question_text: "Kendime daha fazla saygı duyabilmeyi istiyorum.", question_type: "likert", weight: 1 },
        { question_text: "Bazen kendimi işe yaramaz hissediyorum.", question_type: "likert", weight: 1 },
        { question_text: "Zaman zaman hiçbir işe yaramadığımı düşünüyorum.", question_type: "likert", weight: 1 },
      ],
    },
    {
      key: "stres",
      baslik: "Stres Algı Ölçeği (SAÖ-14)",
      aciklama: "Bireyin yaşamındaki durumları ne ölçüde stresli algıladığını değerlendiren 14 maddelik ölçek.",
      ikon: "🧠",
      renk: "#ef4444",
      sorular: [
        { question_text: "Beklenmedik bir şeyin olması nedeniyle ne sıklıkla rahatsız oldunuz?", question_type: "likert", weight: 1 },
        { question_text: "Hayatınızdaki önemli şeyleri kontrol edemediğinizi ne sıklıkla hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Ne sıklıkla sinirli ve stresli hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Kişisel problemlerinizle başa çıkma yeteneğinize ne sıklıkla güvendiniz?", question_type: "likert", weight: 1 },
        { question_text: "İşlerin istediğiniz gibi gittiğini ne sıklıkla hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Yapmanız gereken her şeyle başa çıkamayacağınızı ne sıklıkla hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Hayatınızdaki sinir bozucu şeyleri kontrol edebildiğinizi ne sıklıkla hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Ne sıklıkla her şeyin üstesinden geldiğinizi hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Kontrolünüz dışında gelişen şeyler nedeniyle ne sıklıkla öfkelendiniz?", question_type: "likert", weight: 1 },
        { question_text: "Biriken sorunların üstesinden gelemeyeceğinizi ne sıklıkla hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Küçük şeylerin sizi ne sıklıkla rahatsız ettiğini hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Zamanınızı ne sıklıkla verimli kullandığınızı hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Sorunlarınızı çözmek için ne sıklıkla yeterli enerjiniz olduğunu hissettiniz?", question_type: "likert", weight: 1 },
        { question_text: "Genel stres düzeyinizi nasıl değerlendirirsiniz?", question_type: "likert", weight: 1 },
      ],
    },
    {
      key: "mindfulness",
      baslik: "Mindfulness Farkındalık Ölçeği",
      aciklama: "Günlük yaşamda bilinçli farkındalık düzeyini ölçen 15 maddelik ölçek.",
      ikon: "🧘",
      renk: "#06b6d4",
      sorular: [
        { question_text: "Bir şey yaparken dikkatim dağılıyor ve ne yaptığımı unutuyorum.", question_type: "likert", weight: 1 },
        { question_text: "Dikkatimi vermediğim için bir şeyleri kırıyor veya döküyorum.", question_type: "likert", weight: 1 },
        { question_text: "Bir yerden bir yere giderken neden gittiğimi unutuyorum.", question_type: "likert", weight: 1 },
        { question_text: "Bir şeyi söyleyip söylemediğimi hatırlamakta güçlük çekiyorum.", question_type: "likert", weight: 1 },
        { question_text: "Otomatik pilot modunda hareket ediyorum.", question_type: "likert", weight: 1 },
        { question_text: "Şu anda ne yaptığımın farkında olmadan işler yapıyorum.", question_type: "likert", weight: 1 },
        { question_text: "Dikkatimi vermeden dinliyorum.", question_type: "likert", weight: 1 },
        { question_text: "Nereye gittiğimi düşünmeden yürüyorum.", question_type: "likert", weight: 1 },
        { question_text: "Gelecek veya geçmiş hakkında düşünürken şimdiki anı kaçırıyorum.", question_type: "likert", weight: 1 },
        { question_text: "Dikkatimi vermeden yemek yiyorum.", question_type: "likert", weight: 1 },
        { question_text: "Bir görevi bitirip bitirmediğimi hatırlamıyorum.", question_type: "likert", weight: 1 },
        { question_text: "Düşüncelerim dağınık.", question_type: "likert", weight: 1 },
        { question_text: "Şu anda ne hissettiğimin farkında değilim.", question_type: "likert", weight: 1 },
        { question_text: "Bedenimin nasıl hissettiğine dikkat etmiyorum.", question_type: "likert", weight: 1 },
        { question_text: "Genel farkındalık düzeyinizi nasıl değerlendirirsiniz?", question_type: "likert", weight: 1 },
      ],
    },
  ];

  // ── Hazır Testi Hızlı Oluştur ve Ata ─────────────────────────────────────
  const [quickTestLoading, setQuickTestLoading] = useState(null); // hangi key yükleniyor

  const handleQuickTestAssign = async (hazirTest) => {
    // 1. Aynı isimde test zaten var mı kontrol et
    const existing = tests.find(t => t.title === hazirTest.baslik);
    if (existing) {
      // Zaten var — direkt atama formuna geç
      setAssignForm(p => ({ ...p, test: existing.id }));
      setShowAssignForm(true);
      setTestSubTab("assignments");
      if (assignments.length === 0) loadAssignments();
      toast.info(`"${hazirTest.baslik}" zaten mevcut. Atama formuna yönlendirildiniz.`);
      return;
    }

    // 2. Yeni test oluştur
    setQuickTestLoading(hazirTest.key);
    setTestsMsg("");
    try {
      const testRes = await clinicalAPI.tests.create({
        title: hazirTest.baslik,
        description: hazirTest.aciklama,
      });
      const newTest = testRes.data;

      // 3. Soruları sırayla ekle
      const questions = [];
      for (const q of hazirTest.sorular) {
        try {
          const qRes = await clinicalAPI.tests.addQuestion(newTest.id, q);
          questions.push(qRes.data);
        } catch {}
      }

      // 4. State'e ekle
      setTests(prev => [{ ...newTest, questions }, ...prev]);
      setTestsMsg(`success:"${hazirTest.baslik}" oluşturuldu (${questions.length} soru). Şimdi danışana atayabilirsiniz.`);
      toast.success(`🧪 "${hazirTest.baslik}" oluşturuldu!`);

      // 5. Atama formuna geç
      setAssignForm(p => ({ ...p, test: newTest.id }));
      setShowAssignForm(true);
      setTestSubTab("assignments");
      if (assignments.length === 0) loadAssignments();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.title?.[0] || "Test oluşturulamadı.";
      setTestsMsg("error:" + msg);
      toast.error(msg);
    } finally {
      setQuickTestLoading(null);
    }
  };

  // ── Test işlemleri ────────────────────────────────────────────────────────
  const handleTestCreate = async (e) => {
    e.preventDefault();
    setTestSaving(true);
    setTestsMsg("");
    try {
      const res = await clinicalAPI.tests.create(testForm);
      setTests(prev => [res.data, ...prev]);
      setTestForm({ title: "", description: "" });
      setShowTestForm(false);
      setTestsMsg("success:Test oluşturuldu.");
      toast.success("🧪 Test başarıyla oluşturuldu.");
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.detail || d?.title?.[0] || "Test oluşturulamadı.";
      setTestsMsg("error:" + msg);
      toast.error(msg);
    } finally {
      setTestSaving(false);
    }
  };

  const handleTestDelete = async (id) => {
    if (!window.confirm("Bu testi silmek istiyor musunuz? Tüm sorular ve atamalar da silinecek.")) return;
    try {
      await clinicalAPI.tests.delete(id);
      setTests(prev => prev.filter(t => t.id !== id));
      setTestsMsg("success:Test silindi.");
      toast.info("Test silindi.");
    } catch {
      setTestsMsg("error:Silme başarısız.");
      toast.error("Silme başarısız.");
    }
  };

  const handleAddQuestion = async (testId) => {
    setQuestionSaving(true);
    setQuestionMsg("");
    try {
      const payload = {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        weight: parseFloat(questionForm.weight) || 1,
        options: questionForm.question_type === "multiple" && questionForm.options
          ? questionForm.options.split("\n").map(s => s.trim()).filter(Boolean)
          : null,
      };
      const res = await clinicalAPI.tests.addQuestion(testId, payload);
      setTests(prev => prev.map(t =>
        t.id === testId
          ? { ...t, questions: [...(t.questions || []), res.data] }
          : t
      ));
      setQuestionForm({ question_text: "", question_type: "likert", options: "", weight: 1 });
      setQuestionMsg("success:Soru eklendi.");
    } catch (err) {
      const d = err.response?.data;
      setQuestionMsg("error:" + (d?.detail || d?.question_text?.[0] || "Soru eklenemedi."));
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (testId, qId) => {
    if (!window.confirm("Bu soruyu silmek istiyor musunuz?")) return;
    try {
      await clinicalAPI.tests.deleteQuestion(qId);
      setTests(prev => prev.map(t =>
        t.id === testId
          ? { ...t, questions: (t.questions || []).filter(q => q.id !== qId) }
          : t
      ));
      setQuestionMsg("success:Soru silindi.");
    } catch {
      setQuestionMsg("error:Silme başarısız.");
    }
  };

  const handleTestExpand = async (testId) => {
    if (expandedTest === testId) { setExpandedTest(null); return; }
    setExpandedTest(testId);
    // Soruları yükle (eğer henüz yüklenmemişse)
    const test = tests.find(t => t.id === testId);
    if (!test?.questions) {
      try {
        const res = await clinicalAPI.tests.get(testId);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, questions: res.data.questions || [] } : t));
      } catch {}
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignSaving(true);
    setAssignMsg("");
    try {
      const res = await clinicalAPI.tests.assign(assignForm);
      setAssignments(prev => [res.data, ...prev]);
      setAssignForm({ test: "", client: "", due_date: "" });
      setShowAssignForm(false);
      setAssignMsg("success:Test atandı.");
      toast.success("📤 Test danışana başarıyla atandı.");
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.detail || d?.non_field_errors?.[0] || "Atama başarısız.";
      setAssignMsg("error:" + msg);
      toast.error(msg);
    } finally {
      setAssignSaving(false);
    }
  };

  const loadAssignments = () => {
    setAssignsLoading(true);
    clinicalAPI.tests.assignments().then(r => {
      const data = r.data?.results || r.data || [];
      setAssignments(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setAssignsLoading(false));
  };

  const handleSaveComment = async (assignId) => {
    setCommentSaving(true);
    try {
      await clinicalAPI.tests.comment(assignId, commentText);
      setAssignments(prev => prev.map(a =>
        a.id === assignId ? { ...a, psychologist_comment: commentText } : a
      ));
      setCommentingId(null);
      setCommentText("");
      setAssignMsg("success:Yorum kaydedildi.");
      toast.success("💬 Yorum başarıyla kaydedildi.");
    } catch {
      setAssignMsg("error:Yorum kaydedilemedi.");
      toast.error("Yorum kaydedilemedi.");
    } finally {
      setCommentSaving(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Bu test atamasını silmek istiyor musunuz?\n\nHatalı gönderdiyseniz veya iptal etmek istiyorsanız silebilirsiniz. Danışanın yanıtları da silinecek.")) return;
    try {
      await clinicalAPI.tests.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      setAssignMsg("success:Atama silindi.");
      toast.info("🗑️ Test ataması silindi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Silme başarısız.";
      setAssignMsg("error:" + msg);
      toast.error(msg);
    }
  };

  const [expandedAssignmentQuestions, setExpandedAssignmentQuestions] = useState(null);
  const [assignmentQuestionsLoading, setAssignmentQuestionsLoading] = useState(false);

  // Atama kartındaki "Sorular" butonuna tıklandığında test sorularını yükle
  const handleExpandAssignmentQuestions = async (assignment) => {
    const aId = assignment.id;
    if (expandedAssignmentQuestions === aId) {
      setExpandedAssignmentQuestions(null);
      return;
    }
    setExpandedAssignmentQuestions(aId);
    // Test objesi zaten sorularla yüklüyse tekrar yükleme
    const testId = assignment.test?.id || assignment.test;
    const testObj = tests.find(t => t.id === testId);
    if (testObj?.questions && testObj.questions.length > 0) return;
    // Soruları API'den yükle
    setAssignmentQuestionsLoading(aId);
    try {
      const res = await clinicalAPI.tests.get(testId);
      setTests(prev => prev.map(t =>
        t.id === testId ? { ...t, questions: res.data.questions || [] } : t
      ));
    } catch {}
    finally { setAssignmentQuestionsLoading(null); }
  };

  // "Yanıtlar" butonuna tıklandığında atama detayını (answers dahil) yükle
  const handleExpandAnswers = async (assignment) => {
    const aId = assignment.id;
    if (expandedAssignment === aId) {
      setExpandedAssignment(null);
      return;
    }
    setExpandedAssignment(aId);
    // Zaten yüklüyse tekrar yükleme
    if (assignmentDetails[aId]) return;
    setAssignmentDetailsLoading(aId);
    try {
      const res = await clinicalAPI.tests.assignment(aId);
      setAssignmentDetails(prev => ({ ...prev, [aId]: res.data }));
    } catch {
      // Hata durumunda boş yanıt listesi göster
      setAssignmentDetails(prev => ({ ...prev, [aId]: { answers: [] } }));
    } finally {
      setAssignmentDetailsLoading(null);
    }
  };

  // Ödev detay paneli
  const [expandedTask, setExpandedTask] = useState(null);

  const handleWhChange = (dayId, field, value) => {
    setWhForm(prev => prev.map(d =>
      d.day === dayId ? { ...d, [field]: value } : d
    ));
  };

  const handleWhSave = async (e) => {
    e.preventDefault();
    setWhSaving(true);
    setWhMsg("");
    try {
      await workingHoursAPI.bulkUpdate(whForm);
      setWhMsg("success:Çalışma saatleri kaydedildi.");
      toast.success("🕐 Çalışma saatleri kaydedildi.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Kayıt başarısız.";
      setWhMsg("error:" + msg);
      toast.error(msg);
    } finally {
      setWhSaving(false);
    }
  };

  const handleProfileChange = (e) =>
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await psychologistAPI.updateProfile({
        first_name:     profileForm.first_name,
        last_name:      profileForm.last_name,
        specialization: profileForm.specialization,
        phone:          profileForm.phone,
        bio:            profileForm.bio,
      });
      setProfile(res.data);
      setProfileForm(res.data);
      setProfileMsg("Profil başarıyla güncellendi.");
      toast.success("✅ Profil başarıyla güncellendi.");
    } catch {
      setProfileMsg("Güncelleme başarısız. Lütfen tekrar deneyin.");
      toast.error("Profil güncellenemedi.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.layout}>

        {/* ── Sol Sidebar ─────────────────────────────────────────────── */}
        <aside style={S.sidebar}>
          {/* Profil kartı */}
          <div style={S.profileCard}>
            <div style={S.profileAvatar}>
              {(profile?.first_name?.[0] || user?.email?.[0] || "P").toUpperCase()}
            </div>
            <div style={S.profileName}>{displayName}</div>
            {profile?.specialization && (
              <div style={S.profileBadge}>{profile.specialization}</div>
            )}
            {profile?.license_number && (
              <div style={S.profileLicense}>🪪 {profile.license_number}</div>
            )}
            {!profile && (
              <div style={S.profileWarning}>
                ⚠️ Profil oluşturulmamış
                <button
                  style={{ ...S.profileWarningLink, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => setActiveTab("profile")}
                >
                  Profil Oluştur →
                </button>
              </div>
            )}
          </div>

          {/* Navigasyon */}
          <nav style={S.nav}>
            {tabs.map(t => (
              <button
                key={t.id}
                style={{ ...S.navItem, ...(activeTab === t.id ? S.navItemActive : {}) }}
                onClick={() => handleTabChange(t.id)}
              >
                <span>{t.icon}</span>
                {t.label}
                {t.id === "messages" && unreadCount > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: "9999px",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    padding: "0.1rem 0.45rem",
                    minWidth: "18px",
                    textAlign: "center",
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Hızlı linkler */}
          <div style={S.quickLinks}>
            <a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer" style={S.quickLink}>📖 Swagger</a>
            <a href="http://127.0.0.1:8000/admin/"    target="_blank" rel="noreferrer" style={S.quickLink}>⚙️ Admin</a>
          </div>
        </aside>

        {/* ── Ana İçerik ──────────────────────────────────────────────── */}
        <main style={S.main}>
          {/* Karşılama */}
          <div style={S.welcomeBar}>
            <div>
              <h1 style={S.welcomeTitle}>{greeting}, {displayName}! 👋</h1>
              <p style={S.welcomeSub}>
                {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <Link to="/psikolog/danisanlar/yeni" style={S.addBtn}>
              + Yeni Danışan
            </Link>
          </div>

          {loading ? (
            <div style={S.loadingBox}>
              <div className="spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
              <p style={{ color: "#94a3b8", marginTop: "1rem" }}>Yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* ── GENEL BAKIŞ ─────────────────────────────────────── */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* İstatistik kartları */}
                  <div style={S.statsGrid}>
                    {stats.map((s, i) => (
                      <div key={i} style={{ ...S.statCard, borderTop: `3px solid ${s.color}` }}>
                        <div style={{ ...S.statIcon, background: s.bg }}>{s.icon}</div>
                        <div>
                          <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
                          <div style={S.statLabel}>{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* İki kolon */}
                  <div style={S.twoCol}>
                    {/* Son danışanlar */}
                    <div style={S.card}>
                      <div style={S.cardHeader}>
                        <span style={S.cardTitle}>Son Danışanlar</span>
                        <Link to="/psikolog/danisanlar" style={S.seeAll}>Tümünü Gör →</Link>
                      </div>
                      {activeClients.length === 0 ? (
                        <div style={S.emptyState}>
                          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👥</div>
                          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>Henüz danışan yok</p>
                          <Link to="/psikolog/danisanlar/yeni" style={S.addBtn}>
                            İlk Danışanı Ekle
                          </Link>
                        </div>
                      ) : (
                        <div>
                          {activeClients.slice(0, 6).map(c => (
                            <Link key={c.id} to={`/psikolog/danisanlar/${c.id}`} style={S.clientRow}>
                              <div style={S.clientAvatar}>
                                {(c.first_name?.[0] || "?")}{(c.last_name?.[0] || "")}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={S.clientName}>{c.first_name} {c.last_name}</div>
                                <div style={S.clientEmail}>{c.email}</div>
                              </div>
                              <span style={S.badgeGreen}>Aktif</span>
                            </Link>
                          ))}
                          {activeClients.length > 6 && (
                            <div style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                              <Link to="/psikolog/danisanlar" style={S.seeAll}>
                                +{activeClients.length - 6} daha →
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sağ kolon */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Profil özeti */}
                      {profile ? (
                        <div style={S.card}>
                          <div style={S.cardHeader}>
                            <span style={S.cardTitle}>Profil Bilgileri</span>
                            <button style={S.seeAll} onClick={() => setActiveTab("profile")}>Düzenle →</button>
                          </div>
                          <div style={{ padding: "0.5rem 0" }}>
                            {[
                              { label: "Uzmanlık", value: profile.specialization },
                              { label: "Telefon",  value: profile.phone },
                              { label: "Lisans",   value: profile.license_number },
                            ].filter(r => r.value).map((row, i) => (
                              <div key={i} style={S.profileRow}>
                                <span style={S.profileRowLabel}>{row.label}</span>
                                <span style={S.profileRowValue}>{row.value}</span>
                              </div>
                            ))}
                            {profile.bio && (
                              <p style={S.profileBio}>{profile.bio}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ ...S.card, background: "#fffbeb", border: "1px solid #fde68a" }}>
                          <div style={{ textAlign: "center", padding: "1rem 0" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
                            <p style={{ fontSize: "0.875rem", color: "#92400e", fontWeight: 600, marginBottom: "0.5rem" }}>
                              Psikolog profili bulunamadı
                            </p>
                            <p style={{ fontSize: "0.78rem", color: "#b45309", marginBottom: "1rem" }}>
                              Profil sekmesinden oluşturabilirsiniz
                            </p>
                            <button
                              style={{ ...S.addBtn, fontSize: "0.8rem", padding: "0.5rem 1rem", border: "none", cursor: "pointer" }}
                              onClick={() => setActiveTab("profile")}
                            >
                              Profil Oluştur →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hızlı erişim */}
                      <div style={S.card}>
                        <div style={S.cardHeader}>
                          <span style={S.cardTitle}>Hızlı Erişim</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", paddingTop: "0.5rem" }}>
                          {[
                            { icon: "📖", label: "Swagger",    href: "http://127.0.0.1:8000/api/docs/",   external: true },
                            { icon: "📋", label: "ReDoc",      href: "http://127.0.0.1:8000/api/redoc/",  external: true },
                            { icon: "⚙️", label: "Admin",      href: "http://127.0.0.1:8000/admin/",      external: true },
                            { icon: "👥", label: "Danışanlar", to: "/psikolog/danisanlar" },
                          ].map((item, i) => (
                            item.external ? (
                              <a key={i} href={item.href} target="_blank" rel="noreferrer" style={S.quickBtn}>
                                <span>{item.icon}</span> {item.label}
                              </a>
                            ) : (
                              <Link key={i} to={item.to} style={S.quickBtn}>
                                <span>{item.icon}</span> {item.label}
                              </Link>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DANIŞANLAR ──────────────────────────────────────── */}
              {activeTab === "clients" && (
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <span style={S.cardTitle}>Tüm Danışanlar ({clients.length})</span>
                    <Link to="/psikolog/danisanlar/yeni" style={{ ...S.addBtn, fontSize: "0.8rem", padding: "0.45rem 0.9rem" }}>
                      + Ekle
                    </Link>
                  </div>
                  {clients.length === 0 ? (
                    <div style={S.emptyState}>
                      <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👥</div>
                      <p style={{ color: "#94a3b8" }}>Henüz danışan kaydı yok</p>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Ad Soyad</th>
                            <th>E-posta</th>
                            <th>Telefon</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clients.map(c => (
                            <tr key={c.id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                  <div style={S.clientAvatar}>{c.first_name?.[0]}{c.last_name?.[0]}</div>
                                  <strong>{c.first_name} {c.last_name}</strong>
                                </div>
                              </td>
                              <td style={{ color: "#64748b" }}>{c.email}</td>
                              <td>{c.phone}</td>
                              <td>
                                <span style={c.is_active ? S.badgeGreen : S.badgeRed}>
                                  {c.is_active ? "Aktif" : "Pasif"}
                                </span>
                              </td>
                              <td>
                                <Link to={`/psikolog/danisanlar/${c.id}`} style={S.editBtn}>
                                  Düzenle
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── PROFİL DÜZENLE ──────────────────────────────────── */}
              {activeTab === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Başlık */}
                  <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.3rem" }}>
                        {(profile?.first_name?.[0] || user?.email?.[0] || "P").toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{displayName}</h2>
                        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>{user?.email}</p>
                      </div>
                    </div>
                    {!profile && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#92400e" }}>
                        ⚠️ Henüz profil oluşturulmamış. Aşağıdaki formu doldurun veya{" "}
                        <a href="http://127.0.0.1:8000/admin/accounts/psychologistprofile/add/" target="_blank" rel="noreferrer" style={{ color: "#d97706", fontWeight: 700 }}>
                          Admin panelinden ekleyin →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Mesaj */}
                  {profileMsg && (
                    <div style={profileMsg.includes("başarıyla") ? S.successBox : S.errorBox}>
                      {profileMsg.includes("başarıyla") ? "✅" : "⚠️"} {profileMsg}
                    </div>
                  )}

                  {/* Form */}
                  {profile ? (
                    <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                        <h3 style={S.sectionTitle}>👤 Kişisel Bilgiler</h3>
                        <div className="grid-2">
                          <PField label="Ad *" name="first_name" value={profileForm.first_name} onChange={handleProfileChange} required />
                          <PField label="Soyad *" name="last_name" value={profileForm.last_name} onChange={handleProfileChange} required />
                          <PField label="Telefon" name="phone" value={profileForm.phone} onChange={handleProfileChange} placeholder="05001234567" />
                          <PField label="Uzmanlık Alanı" name="specialization" value={profileForm.specialization} onChange={handleProfileChange} placeholder="Bilişsel Davranışçı Terapi" />
                        </div>
                      </div>

                      <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                        <h3 style={S.sectionTitle}>📝 Biyografi (Herkese Açık)</h3>
                        <PField label="Biyografi" name="bio" value={profileForm.bio} onChange={handleProfileChange} textarea rows={4} placeholder="Kendinizi tanıtın..." />
                      </div>

                      <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                        <h3 style={S.sectionTitle}>🪪 Lisans Bilgisi (Salt Okunur)</h3>
                        <PField label="Lisans No" name="license_number" value={profileForm.license_number} onChange={() => {}} disabled placeholder="Admin panelinden güncellenir" />
                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                          ℹ️ Lisans numarası yalnızca admin panelinden değiştirilebilir.
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" style={S.addBtn} disabled={profileSaving}>
                          {profileSaving ? (
                            <><span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "#fff" }} /> Kaydediliyor...</>
                          ) : "💾 Profili Kaydet"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "2rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🩺</div>
                      <h3 style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>Profil Henüz Oluşturulmamış</h3>
                      <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.7 }}>
                        Psikolog profili Django admin panelinden oluşturulmalıdır.<br />
                        Profil oluşturulduktan sonra buradan düzenleyebilirsiniz.
                      </p>
                      <a
                        href="http://127.0.0.1:8000/admin/accounts/psychologistprofile/add/"
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...S.addBtn, textDecoration: "none", display: "inline-flex" }}
                      >
                        ⚙️ Admin Panelinden Profil Oluştur →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* ── RANDEVULAR ──────────────────────────────────────── */}
              {activeTab === "appointments" && (
                <AppointmentsTab
                  clients={clients}
                  appointments={appointments}
                  apptLoading={apptLoading}
                  handleApptComplete={handleApptComplete}
                  handleApptCancel={handleApptCancel}
                  handleApptDelete={handleApptDelete}
                  toast={toast}
                />
              )}

              {/* ── SEANS NOTLARI ───────────────────────────────────── */}
              {activeTab === "sessions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Başlık */}
                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: "4px solid #8b5cf6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#ede9fe", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>📝</div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Seans Notları</h2>
                        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Tamamlanan görüşmeler için klinik gözlemlerinizi kaydedin</p>
                      </div>
                    </div>
                    {/* Alt sekmeler */}
                    <div style={{ display: "flex", gap: "0.4rem", background: "#f8fafc", borderRadius: "0.75rem", padding: "0.3rem", width: "fit-content" }}>
                      {[
                        { id: "appointments", label: "📅 Tamamlanan Görüşmeler", count: completedAppts.length },
                        { id: "notes",        label: "📝 Tüm Notlar",            count: notes.length },
                      ].map(t => (
                        <button key={t.id} onClick={() => setSessionSubTab(t.id)}
                          style={{ padding: "0.45rem 0.9rem", borderRadius: "0.5rem", border: "none", background: sessionSubTab === t.id ? "#fff" : "transparent", color: sessionSubTab === t.id ? "#8b5cf6" : "#64748b", fontWeight: sessionSubTab === t.id ? 700 : 500, fontSize: "0.82rem", cursor: "pointer", boxShadow: sessionSubTab === t.id ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .15s", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {t.label}
                          {t.count > 0 && <span style={{ background: sessionSubTab === t.id ? "#8b5cf6" : "#e2e8f0", color: sessionSubTab === t.id ? "#fff" : "#64748b", borderRadius: "9999px", padding: "0 0.4rem", fontSize: "0.68rem", fontWeight: 700 }}>{t.count}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {notesMsg && <div style={notesMsg.startsWith("success:") ? S.successBox : S.errorBox}>{notesMsg.startsWith("success:") ? "✅" : "⚠️"} {notesMsg.replace(/^(success:|error:)/, "")}</div>}

                  {/* ── Alt sekme: Tamamlanan Görüşmeler ── */}
                  {sessionSubTab === "appointments" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {completedApptLoading ? (
                        <SkeletonList count={3} lines={2} />
                      ) : completedAppts.length === 0 ? (
                        <div style={{ ...S.card, ...S.emptyState }}>
                          <div style={{ fontSize: "3rem" }}>📅</div>
                          <p>Henüz tamamlanan görüşme yok</p>
                          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.25rem" }}>Randevular tamamlandıkça burada görünecek</p>
                        </div>
                      ) : (
                        completedAppts.map(appt => (
                          <div key={appt.appointment_id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)", borderLeft: `4px solid ${appt.session_note ? "#8b5cf6" : "#e2e8f0"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: appt.session_note || (writingNoteFor?.appointment_id === appt.appointment_id) ? "0.75rem" : 0 }}>
                              <div>
                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem", marginBottom: "0.2rem" }}>
                                  {appt.client_name}
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                  📅 {new Date(appt.start_time).toLocaleString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  {" · "}{appt.duration_minutes} dk
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                {appt.session_note ? (
                                  <span style={{ fontSize: "0.7rem", background: "#ede9fe", color: "#5b21b6", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700 }}>✓ Not Yazıldı</span>
                                ) : (
                                  <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#94a3b8", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 600 }}>Not Yok</span>
                                )}
                                <button
                                  onClick={() => {
                                    if (writingNoteFor?.appointment_id === appt.appointment_id) {
                                      setWritingNoteFor(null);
                                      setShowNoteForm(false);
                                    } else {
                                      setWritingNoteFor(appt);
                                      setShowNoteForm(true);
                                      setEditingNote(appt.session_note ? { id: appt.session_note.id } : null);
                                      setNoteForm({
                                        client: String(appt.client_id),
                                        session_date: appt.session_date,
                                        content: appt.session_note?.content || "",
                                        mood_score: appt.session_note?.mood_score || "",
                                        is_shared: appt.session_note?.is_shared || false,
                                        appointment: appt.appointment_id,
                                      });
                                      setNotesMsg("");
                                    }
                                  }}
                                  style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.25rem 0.65rem", borderColor: "#8b5cf6", color: "#8b5cf6" }}
                                >
                                  {writingNoteFor?.appointment_id === appt.appointment_id ? "✕ Kapat" : appt.session_note ? "✏️ Düzenle" : "📝 Not Yaz"}
                                </button>
                              </div>
                            </div>

                            {/* Mevcut not özeti */}
                            {appt.session_note && writingNoteFor?.appointment_id !== appt.appointment_id && (
                              <div style={{ background: "#f5f3ff", borderRadius: "0.5rem", padding: "0.65rem 0.85rem", fontSize: "0.82rem", color: "#475569", borderLeft: "3px solid #8b5cf6" }}>
                                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                                  {appt.session_note.mood_score && (
                                    <span style={{ fontSize: "0.68rem", background: "#ede9fe", color: "#5b21b6", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 600 }}>
                                      {appt.session_note.mood_score_display}
                                    </span>
                                  )}
                                  {appt.session_note.is_shared && (
                                    <span style={{ fontSize: "0.68rem", background: "#d1fae5", color: "#065f46", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 600 }}>Paylaşıldı</span>
                                  )}
                                </div>
                                <p style={{ lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0 }}>{appt.session_note.content}</p>
                              </div>
                            )}

                            {/* Not yazma formu */}
                            {writingNoteFor?.appointment_id === appt.appointment_id && (
                              <form onSubmit={handleNoteSubmit} style={{ background: "#f8fafc", borderRadius: "0.75rem", border: "1.5px solid #8b5cf6", padding: "1rem", marginTop: "0.5rem" }}>
                                <div className="grid-2">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Duygu Durumu</label>
                                    <select value={noteForm.mood_score} onChange={e => setNoteForm(p => ({ ...p, mood_score: e.target.value }))} style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff" }}>
                                      <option value="">Seçin...</option>
                                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {["Çok Kötü","Kötü","Orta","İyi","Çok İyi"][v-1]}</option>)}
                                    </select>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", paddingTop: "1.5rem" }}>
                                    <input type="checkbox" id={`is_shared_${appt.appointment_id}`} checked={noteForm.is_shared} onChange={e => setNoteForm(p => ({ ...p, is_shared: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                    <label htmlFor={`is_shared_${appt.appointment_id}`} style={{ fontSize: "0.875rem", color: "#475569", cursor: "pointer" }}>Danışanla paylaş</label>
                                  </div>
                                </div>
                                <PField label="Seans Notu *" name="content" textarea rows={4} value={noteForm.content} onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))} required placeholder="Bu görüşmede neler konuşuldu, gözlemleriniz neler..." />
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
                                  <button type="button" onClick={() => { setWritingNoteFor(null); setShowNoteForm(false); setEditingNote(null); }} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#64748b" }}>İptal</button>
                                  <button type="submit" style={{ ...S.addBtn, background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }} disabled={noteSaving}>
                                    {noteSaving ? "Kaydediliyor..." : editingNote ? "💾 Güncelle" : "💾 Notu Kaydet"}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ── Alt sekme: Tüm Notlar ── */}
                  {sessionSubTab === "notes" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button style={S.addBtn} onClick={() => { setShowNoteForm(v => !v); setEditingNote(null); setWritingNoteFor(null); setNoteForm({ client: "", session_date: new Date().toISOString().split("T")[0], content: "", mood_score: "", is_shared: false }); setNotesMsg(""); }}>
                          {showNoteForm && !writingNoteFor ? "✕ Kapat" : "+ Bağımsız Not"}
                        </button>
                      </div>
                      {showNoteForm && !writingNoteFor && (
                        <form onSubmit={handleNoteSubmit} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                          <h3 style={S.sectionTitle}>{editingNote ? "✏️ Notu Düzenle" : "📝 Yeni Seans Notu"}</h3>
                          <div className="grid-2">
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Danışan *</label>
                              <select value={noteForm.client} onChange={e => setNoteForm(p => ({ ...p, client: e.target.value }))} required style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff" }}>
                                <option value="">Danışan seçin...</option>
                                {activeClients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                              </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Seans Tarihi *</label>
                              <input type="date" value={noteForm.session_date} onChange={e => setNoteForm(p => ({ ...p, session_date: e.target.value }))} required style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none", width: "100%" }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Duygu Durumu</label>
                              <select value={noteForm.mood_score} onChange={e => setNoteForm(p => ({ ...p, mood_score: e.target.value }))} style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff" }}>
                                <option value="">Seçin...</option>
                                {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {["Çok Kötü","Kötü","Orta","İyi","Çok İyi"][v-1]}</option>)}
                              </select>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", paddingTop: "1.5rem" }}>
                              <input type="checkbox" id="is_shared" checked={noteForm.is_shared} onChange={e => setNoteForm(p => ({ ...p, is_shared: e.target.checked }))} style={{ width: 16, height: 16 }} />
                              <label htmlFor="is_shared" style={{ fontSize: "0.875rem", color: "#475569", cursor: "pointer" }}>Danışanla paylaş</label>
                            </div>
                          </div>
                          <PField label="Not İçeriği *" name="content" textarea rows={5} value={noteForm.content} onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))} required placeholder="Seans gözlemlerinizi yazın..." />
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                            <button type="button" onClick={() => { setShowNoteForm(false); setEditingNote(null); }} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.625rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.875rem", color: "#64748b" }}>İptal</button>
                            <button type="submit" style={S.addBtn} disabled={noteSaving}>{noteSaving ? "Kaydediliyor..." : editingNote ? "💾 Güncelle" : "💾 Kaydet"}</button>
                          </div>
                        </form>
                      )}
                      {notesLoading ? (
                        <SkeletonList count={3} lines={3} />
                      ) : notes.length === 0 ? (
                        <div style={{ ...S.card, ...S.emptyState }}><div style={{ fontSize: "3rem" }}>📝</div><p>Henüz seans notu yok</p></div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {notes.map(n => (
                            <div key={n.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)", borderLeft: `4px solid ${n.is_shared ? "#8b5cf6" : "#e2e8f0"}` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                                <div>
                                  <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>{n.client_name}</span>
                                  <span style={{ marginLeft: "0.75rem", fontSize: "0.78rem", color: "#94a3b8" }}>{n.session_date}</span>
                                  {n.mood_score && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", background: "#ede9fe", color: "#5b21b6", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>{n.mood_score_display}</span>}
                                  {n.is_shared && <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", background: "#d1fae5", color: "#065f46", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>Paylaşıldı</span>}
                                </div>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                  <button onClick={() => { setEditingNote(n); setNoteForm({ client: n.client, session_date: n.session_date, content: n.content, mood_score: n.mood_score||"", is_shared: n.is_shared }); setShowNoteForm(true); }} style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>✏️ Düzenle</button>
                                  <button onClick={() => handleNoteDelete(n.id)} style={{ ...S.editBtn, borderColor: "#ef4444", color: "#ef4444", fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>🗑️ Sil</button>
                                </div>
                              </div>
                              <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── ÖDEVLER ─────────────────────────────────────────── */}
              {activeTab === "tasks" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Başlık */}
                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: "4px solid #10b981", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#d1fae5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>✅</div>
                      <div>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Ödevler</h2>
                        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Danışanlara ödev atayın ve takip edin</p>
                      </div>
                    </div>
                    <button style={S.addBtn} onClick={() => { setShowTaskForm(v => !v); setEditingTask(null); setTaskForm({ client: "", title: "", description: "", due_date: "", priority: "medium" }); setTasksMsg(""); }}>
                      {showTaskForm ? "✕ Kapat" : "+ Ödev Ata"}
                    </button>
                  </div>

                  {/* İstatistik Kartları */}
                  {(() => {
                    const today = new Date().toISOString().split("T")[0];
                    const overdueList = tasks.filter(t => !t.is_completed && t.due_date && t.due_date < today);
                    const pendingList = tasks.filter(t => !t.is_completed);
                    const completedList = tasks.filter(t => t.is_completed);
                    const rate = tasks.length > 0 ? Math.round((completedList.length / tasks.length) * 100) : 0;
                    return (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
                          {[
                            { label: "Toplam", value: tasks.length, icon: "📋", color: "#6366f1", bg: "#ede9fe", light: "#f5f3ff" },
                            { label: "Bekleyen", value: pendingList.length, icon: "⏳", color: "#f59e0b", bg: "#fef3c7", light: "#fffbeb" },
                            { label: "Tamamlanan", value: completedList.length, icon: "✅", color: "#10b981", bg: "#d1fae5", light: "#f0fdf4" },
                            { label: "Gecikmiş", value: overdueList.length, icon: "🚨", color: "#ef4444", bg: "#fee2e2", light: "#fff5f5" },
                          ].map(s => (
                            <div key={s.label} style={{ background: s.light, borderRadius: "1rem", border: `1px solid ${s.bg}`, padding: "1rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
                                <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>
                              </div>
                              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
                            </div>
                          ))}
                        </div>
                        {tasks.length > 0 && (
                          <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Genel Tamamlanma Oranı</span>
                              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: rate >= 70 ? "#10b981" : rate >= 40 ? "#f59e0b" : "#ef4444" }}>{rate}%</span>
                            </div>
                            <div style={{ height: 8, background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${rate}%`, background: rate >= 70 ? "linear-gradient(90deg,#10b981,#059669)" : rate >= 40 ? "linear-gradient(90deg,#f59e0b,#d97706)" : "linear-gradient(90deg,#ef4444,#dc2626)", borderRadius: "9999px", transition: "width 0.5s ease" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{completedList.length} tamamlandı</span>
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{pendingList.length} bekliyor</span>
                            </div>
                          </div>
                        )}
                        {overdueList.length > 0 && (
                          <div style={{ background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: "1rem", padding: "0.85rem 1.1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "1.2rem" }}>🚨</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991b1b" }}>{overdueList.length} gecikmiş ödev var!</span>
                              <span style={{ fontSize: "0.78rem", color: "#b91c1c", marginLeft: "0.5rem" }}>Son tarihi geçmiş ödevleri kontrol edin.</span>
                            </div>
                            <button onClick={() => setTaskFilter("overdue")} style={{ padding: "0.3rem 0.75rem", borderRadius: "0.5rem", border: "1.5px solid #ef4444", background: "#fff", color: "#ef4444", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Göster</button>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {tasksMsg && <div style={tasksMsg.startsWith("success:") ? S.successBox : S.errorBox}>{tasksMsg.startsWith("success:") ? "✅" : "⚠️"} {tasksMsg.replace(/^(success:|error:)/, "")}</div>}
                  {showTaskForm && (
                    <form onSubmit={handleTaskSubmit} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                      <h3 style={S.sectionTitle}>{editingTask ? "✏️ Ödevi Düzenle" : "📋 Yeni Ödev Ata"}</h3>
                      <div className="grid-2">
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Danışan *</label>
                          <select value={taskForm.client} onChange={e => setTaskForm(p => ({ ...p, client: e.target.value }))} required disabled={!!editingTask} style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: editingTask ? "#f8fafc" : "#fff", cursor: editingTask ? "not-allowed" : "default" }}>
                            <option value="">Danışan seçin...</option>
                            {activeClients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                          </select>
                        </div>
                        <PField label="Başlık *" name="title" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required placeholder="Ödev başlığı" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Son Tarih</label>
                          <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none", width: "100%" }} />
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                            {[
                              { label: "+3 Gün", offset: 3 },
                              { label: "+1 Hafta", offset: 7 },
                              { label: "+2 Hafta", offset: 14 },
                              { label: "+1 Ay", offset: 30 },
                            ].map(q => {
                              const d = new Date(); d.setDate(d.getDate() + q.offset);
                              const val = d.toISOString().split("T")[0];
                              return (
                                <button key={q.label} type="button" onClick={() => setTaskForm(p => ({ ...p, due_date: val }))}
                                  style={{ padding: "0.2rem 0.55rem", borderRadius: "0.35rem", border: `1.5px solid ${taskForm.due_date === val ? "#10b981" : "#e2e8f0"}`, background: taskForm.due_date === val ? "#d1fae5" : "#f8fafc", color: taskForm.due_date === val ? "#065f46" : "#64748b", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>
                                  {q.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Öncelik</label>
                          <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff" }}>
                            <option value="low">Düşük</option>
                            <option value="medium">Orta</option>
                            <option value="high">Yüksek</option>
                          </select>
                        </div>
                      </div>
                      <PField label="Açıklama" name="description" textarea rows={3} value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Ödev detayları..." />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                        <button type="button" onClick={() => { setShowTaskForm(false); setEditingTask(null); }} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.625rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.875rem", color: "#64748b" }}>İptal</button>
                        <button type="submit" style={S.addBtn} disabled={taskSaving}>{taskSaving ? "Kaydediliyor..." : editingTask ? "💾 Güncelle" : "💾 Ödev Ata"}</button>
                      </div>
                    </form>
                  )}
                  {/* Filtreler */}
                  {(() => {
                    const today = new Date().toISOString().split("T")[0];
                    const clientIds = [...new Set(tasks.map(t => t.client))];
                    const filteredTasks = tasks.filter(t => {
                      const isOverdue = !t.is_completed && t.due_date && t.due_date < today;
                      const statusOk = taskFilter === "all"
                        || (taskFilter === "overdue" && isOverdue)
                        || (taskFilter !== "overdue" && String(t.is_completed) === taskFilter);
                      const clientOk = !taskClientFilter || String(t.client) === taskClientFilter;
                      return statusOk && clientOk;
                    });
                    return (
                      <>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                            {[
                              { key: "all", label: "Tümü", count: tasks.length, activeColor: "#10b981", activeBg: "#d1fae5", activeText: "#065f46" },
                              { key: "false", label: "Bekleyen", count: tasks.filter(t => !t.is_completed).length, activeColor: "#f59e0b", activeBg: "#fef3c7", activeText: "#92400e" },
                              { key: "true", label: "Tamamlanan", count: tasks.filter(t => t.is_completed).length, activeColor: "#10b981", activeBg: "#d1fae5", activeText: "#065f46" },
                              { key: "overdue", label: "🚨 Gecikmiş", count: tasks.filter(t => !t.is_completed && t.due_date && t.due_date < today).length, activeColor: "#ef4444", activeBg: "#fee2e2", activeText: "#991b1b" },
                            ].map(f => (
                              <button key={f.key} onClick={() => setTaskFilter(f.key)}
                                style={{ padding: "0.35rem 0.85rem", borderRadius: "9999px", border: "1.5px solid", borderColor: taskFilter === f.key ? f.activeColor : "#e2e8f0", background: taskFilter === f.key ? f.activeBg : "#fff", color: taskFilter === f.key ? f.activeText : "#64748b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                {f.label}
                                <span style={{ background: "rgba(0,0,0,0.08)", borderRadius: "9999px", padding: "0 0.35rem", fontSize: "0.68rem", fontWeight: 800 }}>{f.count}</span>
                              </button>
                            ))}
                          </div>
                          {clientIds.length > 1 && (
                            <select value={taskClientFilter || ""} onChange={e => setTaskClientFilter(e.target.value || null)}
                              style={{ marginLeft: "auto", padding: "0.35rem 0.75rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", fontSize: "0.78rem", color: "#475569", background: "#fff", cursor: "pointer" }}>
                              <option value="">👤 Tüm Danışanlar</option>
                              {activeClients.filter(c => clientIds.includes(c.id)).map(c => (
                                <option key={c.id} value={String(c.id)}>{c.first_name} {c.last_name}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Ödev Listesi */}
                        {tasksLoading ? (
                          <SkeletonList count={3} lines={2} />
                        ) : filteredTasks.length === 0 ? (
                          <div style={{ ...S.card, ...S.emptyState }}>
                            <div style={{ fontSize: "3rem" }}>✅</div>
                            <p>{taskFilter === "overdue" ? "Gecikmiş ödev yok 🎉" : "Ödev bulunamadı"}</p>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {filteredTasks.map(t => {
                              const isOverdue = !t.is_completed && t.due_date && t.due_date < today;
                              const isTaskExpanded = expandedTask === t.id;
                              return (
                                <div key={t.id} style={{ background: "#fff", borderRadius: "1rem", border: `1px solid ${isOverdue ? "#fecaca" : isTaskExpanded ? "#10b981" : "#f1f5f9"}`, boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden", borderLeft: `4px solid ${t.is_completed ? "#10b981" : isOverdue ? "#ef4444" : t.priority === "high" ? "#ef4444" : t.priority === "medium" ? "#f59e0b" : "#94a3b8"}` }}>
                                  {/* Kart başlığı */}
                                  <div style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 700, color: t.is_completed ? "#94a3b8" : "#1e293b", textDecoration: t.is_completed ? "line-through" : "none", fontSize: "0.9rem" }}>{t.title}</span>
                                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600, background: { high: "#fee2e2", medium: "#fef3c7", low: "#f1f5f9" }[t.priority], color: { high: "#991b1b", medium: "#92400e", low: "#64748b" }[t.priority] }}>{t.priority_display}</span>
                                        {t.is_completed && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600, background: "#d1fae5", color: "#065f46" }}>✓ Tamamlandı</span>}
                                        {isOverdue && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600, background: "#fee2e2", color: "#991b1b" }}>🚨 Gecikmiş</span>}
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", color: "#94a3b8" }}>
                                        <span>👤 {t.client_name}</span>
                                        {t.due_date && (
                                          <span style={{ color: isOverdue ? "#ef4444" : "#94a3b8", fontWeight: isOverdue ? 700 : 400 }}>
                                            📅 Son: {t.due_date}
                                          </span>
                                        )}
                                        {t.is_completed && t.completed_at && (
                                          <span style={{ color: "#10b981" }}>
                                            ✅ {new Date(t.completed_at).toLocaleDateString("tr-TR")}
                                          </span>
                                        )}
                                      </div>
                                      {t.description && <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem", lineHeight: 1.5 }}>{t.description}</p>}
                                    </div>
                                    <div style={{ display: "flex", gap: "0.4rem", marginLeft: "1rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                      {/* Detay butonu — her zaman görünür */}
                                      <button
                                        onClick={() => setExpandedTask(isTaskExpanded ? null : t.id)}
                                        style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderColor: "#10b981", color: "#10b981" }}
                                      >
                                        {isTaskExpanded ? "▲ Kapat" : "📋 Detay"}
                                      </button>
                                      {!t.is_completed && (
                                        <button onClick={() => { setEditingTask(t); setTaskForm({ client: String(t.client), title: t.title, description: t.description || "", due_date: t.due_date || "", priority: t.priority || "medium" }); setShowTaskForm(true); setTasksMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                          style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>✏️ Düzenle</button>
                                      )}
                                      {!t.is_completed && (
                                        <button onClick={() => handleTaskComplete(t.id)} style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderColor: "#059669", color: "#059669" }}>✓ Tamamla</button>
                                      )}
                                      <button onClick={() => handleTaskDelete(t.id)} style={{ ...S.editBtn, borderColor: "#ef4444", color: "#ef4444", fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>🗑️ Sil</button>
                                    </div>
                                  </div>

                                  {/* Detay paneli */}
                                  {isTaskExpanded && (
                                    <div style={{ borderTop: "1px solid #d1fae5", background: "#f0fdf4", padding: "1rem 1.25rem" }}>
                                      <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
                                        📋 Ödev Detayları
                                      </h4>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {/* Açıklama */}
                                        <div style={{ background: "#fff", borderRadius: "0.5rem", border: "1px solid #bbf7d0", padding: "0.65rem 0.85rem" }}>
                                          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase", marginBottom: "0.3rem" }}>Açıklama</div>
                                          <p style={{ fontSize: "0.82rem", color: "#1e293b", lineHeight: 1.6, margin: 0 }}>
                                            {t.description || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Açıklama eklenmemiş</span>}
                                          </p>
                                        </div>
                                        {/* Tamamlanma bilgisi */}
                                        {t.is_completed && (
                                          <div style={{ background: "#fff", borderRadius: "0.5rem", border: "1px solid #bbf7d0", padding: "0.65rem 0.85rem" }}>
                                            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase", marginBottom: "0.3rem" }}>Tamamlanma Bilgisi</div>
                                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.82rem", color: "#1e293b" }}>
                                              {t.completed_at && (
                                                <span>🕐 {new Date(t.completed_at).toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                              )}
                                            </div>
                                            {t.completion_note ? (
                                              <div style={{ marginTop: "0.5rem", background: "#f0fdf4", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", borderLeft: "3px solid #10b981" }}>
                                                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#065f46", marginBottom: "0.2rem" }}>💬 Danışanın Notu</div>
                                                <p style={{ fontSize: "0.82rem", color: "#1e293b", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>{t.completion_note}</p>
                                              </div>
                                            ) : (
                                              <p style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic", marginTop: "0.35rem", margin: "0.35rem 0 0" }}>Danışan tamamlama notu eklememiş.</p>
                                            )}
                                          </div>
                                        )}
                                        {/* Bekleyen ödev için bilgi */}
                                        {!t.is_completed && (
                                          <div style={{ background: "#fff", borderRadius: "0.5rem", border: "1px solid #bbf7d0", padding: "0.65rem 0.85rem" }}>
                                            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase", marginBottom: "0.3rem" }}>Durum</div>
                                            <p style={{ fontSize: "0.82rem", color: isOverdue ? "#ef4444" : "#64748b", margin: 0 }}>
                                              {isOverdue
                                                ? `🚨 Son tarih geçti (${t.due_date}). Danışan henüz tamamlamadı.`
                                                : t.due_date
                                                  ? `⏳ Danışan henüz tamamlamadı. Son tarih: ${t.due_date}`
                                                  : "⏳ Danışan henüz tamamlamadı."}
                                            </p>
                                          </div>
                                        )}
                                        {/* Oluşturulma tarihi */}
                                        {t.created_at && (
                                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", textAlign: "right" }}>
                                            Atanma: {new Date(t.created_at).toLocaleDateString("tr-TR")}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ── TESTLER ─────────────────────────────────────────── */}
              {activeTab === "tests" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Başlık */}
                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: "4px solid #f59e0b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#fef3c7", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>🧪</div>
                      <div>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Psikolojik Testler</h2>
                        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Test oluşturun, soru ekleyin, danışanlara atayın</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        style={{ ...S.addBtn, background: testSubTab === "tests" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#fff", color: testSubTab === "tests" ? "#fff" : "#64748b", border: "1.5px solid #f59e0b", boxShadow: "none" }}
                        onClick={() => setTestSubTab("tests")}
                      >🧪 Testler</button>
                      <button
                        style={{ ...S.addBtn, background: testSubTab === "assignments" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#fff", color: testSubTab === "assignments" ? "#fff" : "#64748b", border: "1.5px solid #f59e0b", boxShadow: "none" }}
                        onClick={() => { setTestSubTab("assignments"); if (assignments.length === 0) loadAssignments(); }}
                      >📋 Atamalar</button>
                    </div>
                  </div>

                  {/* İstatistik Kartları */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
                    {[
                      { label: "Toplam Test", value: tests.length, icon: "🧪", color: "#f59e0b", bg: "#fef3c7", light: "#fffbeb" },
                      { label: "Toplam Atama", value: assignments.length, icon: "📋", color: "#6366f1", bg: "#ede9fe", light: "#f5f3ff" },
                      { label: "Tamamlanan", value: assignments.filter(a => a.status === "completed").length, icon: "✅", color: "#10b981", bg: "#d1fae5", light: "#f0fdf4" },
                      { label: "Bekleyen", value: assignments.filter(a => a.status === "pending").length, icon: "⏳", color: "#3b82f6", bg: "#dbeafe", light: "#eff6ff" },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.light, borderRadius: "1rem", border: `1px solid ${s.bg}`, padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
                          <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>
                        </div>
                        <span style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {testsMsg && <div style={testsMsg.startsWith("success:") ? S.successBox : S.errorBox}>{testsMsg.startsWith("success:") ? "✅" : "⚠️"} {testsMsg.replace(/^(success:|error:)/, "")}</div>}

                  {/* ── Alt sekme: Testler ── */}
                  {testSubTab === "tests" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                      {/* Hazır Testlerden Hızlı Ekle */}
                      <div style={{ background: "linear-gradient(135deg,#fffbeb,#fef9ec)", border: "1.5px solid #fde68a", borderRadius: "1.25rem", padding: "1.5rem", boxShadow: "0 2px 8px rgba(245,158,11,.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "0.625rem", background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>⚡</div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#92400e" }}>Hazır Test Şablonları</div>
                              <div style={{ fontSize: "0.72rem", color: "#b45309" }}>Tıkla → Test oluşturulsun → Danışana ata</div>
                            </div>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", padding: "0.25rem 0.65rem", borderRadius: "9999px", fontWeight: 700, border: "1px solid #fde68a" }}>
                            {HAZIR_TESTLER.filter(ht => tests.some(t => t.title === ht.baslik)).length}/{HAZIR_TESTLER.length} oluşturuldu
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
                          {HAZIR_TESTLER.map(ht => {
                            const alreadyExists = tests.some(t => t.title === ht.baslik);
                            const isLoading = quickTestLoading === ht.key;
                            return (
                              <div
                                key={ht.key}
                                style={{
                                  background: alreadyExists ? "#f0fdf4" : "#fff",
                                  borderRadius: "0.875rem",
                                  border: `1.5px solid ${alreadyExists ? "#a7f3d0" : "#f1f5f9"}`,
                                  padding: "1rem",
                                  display: "flex", flexDirection: "column", gap: "0.6rem",
                                  borderTop: `3px solid ${alreadyExists ? "#10b981" : ht.renk}`,
                                  opacity: isLoading ? 0.75 : 1,
                                  transition: "all .2s",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                                  <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: alreadyExists ? "#d1fae5" : ht.renk + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                                    {isLoading ? "⏳" : alreadyExists ? "✅" : ht.ikon}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1e293b", lineHeight: 1.3, marginBottom: "0.2rem" }}>{ht.baslik}</div>
                                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{ht.sorular.length} soru · Likert</div>
                                  </div>
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>{ht.aciklama}</p>
                                <button
                                  onClick={() => handleQuickTestAssign(ht)}
                                  disabled={isLoading}
                                  style={{
                                    padding: "0.5rem 0.85rem",
                                    borderRadius: "0.5rem",
                                    border: "none",
                                    background: alreadyExists
                                      ? "linear-gradient(135deg,#10b981,#059669)"
                                      : isLoading
                                        ? "#e2e8f0"
                                        : `linear-gradient(135deg,${ht.renk},${ht.renk}cc)`,
                                    color: isLoading ? "#94a3b8" : "#fff",
                                    fontSize: "0.78rem", fontWeight: 700,
                                    cursor: isLoading ? "wait" : "pointer",
                                    width: "100%",
                                    transition: "all .15s",
                                  }}
                                >
                                  {isLoading ? "⏳ Oluşturuluyor..." : alreadyExists ? "📤 Danışana Ata →" : "⚡ Oluştur ve Ata →"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>{tests.length} test</span>
                        <button style={S.addBtn} onClick={() => { setShowTestForm(v => !v); setTestsMsg(""); }}>
                          {showTestForm ? "✕ Kapat" : "+ Özel Test Oluştur"}
                        </button>
                      </div>

                      {showTestForm && (
                        <form onSubmit={handleTestCreate} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                          <h3 style={S.sectionTitle}>🧪 Yeni Test Oluştur</h3>
                          <PField label="Test Adı *" name="title" value={testForm.title} onChange={e => setTestForm(p => ({ ...p, title: e.target.value }))} required placeholder="Örn: Beck Depresyon Ölçeği" />
                          <PField label="Yönerge / Açıklama" name="description" textarea rows={3} value={testForm.description} onChange={e => setTestForm(p => ({ ...p, description: e.target.value }))} placeholder="Danışana gösterilecek yönerge..." />
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                            <button type="button" onClick={() => setShowTestForm(false)} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.625rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.875rem", color: "#64748b" }}>İptal</button>
                            <button type="submit" style={{ ...S.addBtn, background: "linear-gradient(135deg,#f59e0b,#d97706)" }} disabled={testSaving}>{testSaving ? "Kaydediliyor..." : "💾 Test Oluştur"}</button>
                          </div>
                        </form>
                      )}

                      {testsLoading ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ width: "2rem", height: "2rem", margin: "0 auto" }} /></div>
                      ) : tests.length === 0 ? (
                        <div style={{ ...S.card, ...S.emptyState }}><div style={{ fontSize: "3rem" }}>🧪</div><p>Henüz test oluşturulmamış</p></div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {tests.map(t => (
                            <div key={t.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: expandedTest === t.id ? "1px solid #f1f5f9" : "none" }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>{t.title}</span>
                                    <span style={{ fontSize: "0.7rem", background: t.is_active ? "#d1fae5" : "#fee2e2", color: t.is_active ? "#065f46" : "#991b1b", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>{t.is_active ? "Aktif" : "Pasif"}</span>
                                    <span style={{ fontSize: "0.7rem", background: "#fef3c7", color: "#92400e", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>{(t.questions?.length ?? t.question_count ?? 0)} soru</span>
                                  </div>
                                  {t.description && <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.25rem" }}>{t.description.slice(0, 80)}{t.description.length > 80 ? "…" : ""}</p>}
                                </div>
                                <div style={{ display: "flex", gap: "0.4rem", marginLeft: "1rem" }}>
                                  <button
                                    onClick={() => { setShowAssignForm(true); setAssignForm(p => ({ ...p, test: t.id })); setTestSubTab("assignments"); if (assignments.length === 0) loadAssignments(); }}
                                    style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderColor: "#f59e0b", color: "#f59e0b" }}
                                  >📤 Ata</button>
                                  <button onClick={() => handleTestExpand(t.id)} style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>
                                    {expandedTest === t.id ? "▲ Kapat" : "▼ Sorular"}
                                  </button>
                                  <button onClick={() => handleTestDelete(t.id)} style={{ ...S.editBtn, borderColor: "#ef4444", color: "#ef4444", fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>🗑️</button>
                                </div>
                              </div>

                              {expandedTest === t.id && (
                                <div style={{ padding: "1rem 1.25rem", background: "#fafbff" }}>
                                  {questionMsg && <div style={{ ...(questionMsg.startsWith("success:") ? S.successBox : S.errorBox), marginBottom: "0.75rem", fontSize: "0.8rem" }}>{questionMsg.startsWith("success:") ? "✅" : "⚠️"} {questionMsg.replace(/^(success:|error:)/, "")}</div>}
                                  {(t.questions || []).length === 0 ? (
                                    <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Henüz soru eklenmemiş.</p>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
                                      {(t.questions || []).map((q, idx) => (
                                        <div key={q.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.6rem 0.85rem", background: "#fff", borderRadius: "0.5rem", border: "1px solid #f1f5f9" }}>
                                          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fef3c7", color: "#92400e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>{idx + 1}</span>
                                          <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: "0.85rem", color: "#1e293b" }}>{q.question_text}</span>
                                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
                                              <span style={{ fontSize: "0.68rem", background: "#ede9fe", color: "#5b21b6", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>{{ likert: "Likert", multiple: "Çoktan Seçmeli", text: "Açık Uçlu" }[q.question_type]}</span>
                                              <span style={{ fontSize: "0.68rem", background: "#f1f5f9", color: "#64748b", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>Ağırlık: {q.weight}</span>
                                            </div>
                                          </div>
                                          <button onClick={() => handleDeleteQuestion(t.id, q.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.85rem", padding: "0.1rem 0.3rem" }}>🗑️</button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div style={{ background: "#fff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1rem" }}>
                                    <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569", marginBottom: "0.75rem", textTransform: "uppercase" }}>+ Soru Ekle</h4>
                                    <div className="grid-2">
                                      <PField label="Soru Metni *" name="question_text" value={questionForm.question_text} onChange={e => setQuestionForm(p => ({ ...p, question_text: e.target.value }))} placeholder="Soru metnini girin..." />
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Soru Tipi</label>
                                        <select value={questionForm.question_type} onChange={e => setQuestionForm(p => ({ ...p, question_type: e.target.value }))} style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff" }}>
                                          <option value="likert">Likert (1-5)</option>
                                          <option value="multiple">Çoktan Seçmeli</option>
                                          <option value="text">Açık Uçlu</option>
                                        </select>
                                      </div>
                                      <PField label="Puan Ağırlığı" name="weight" type="number" value={questionForm.weight} onChange={e => setQuestionForm(p => ({ ...p, weight: e.target.value }))} placeholder="1" />
                                      {questionForm.question_type === "multiple" && (
                                        <PField label="Seçenekler (her satıra bir)" name="options" textarea rows={3} value={questionForm.options} onChange={e => setQuestionForm(p => ({ ...p, options: e.target.value }))} placeholder={"A) Hiçbir zaman\nB) Bazen\nC) Sık sık\nD) Her zaman"} />
                                      )}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                      <button type="button" onClick={() => handleAddQuestion(t.id)} disabled={questionSaving || !questionForm.question_text.trim()} style={{ ...S.addBtn, background: "linear-gradient(135deg,#f59e0b,#d97706)", fontSize: "0.8rem", padding: "0.5rem 1rem" }}>{questionSaving ? "Ekleniyor..." : "➕ Soru Ekle"}</button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Alt sekme: Atamalar ── */}
                  {testSubTab === "assignments" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {assignMsg && <div style={assignMsg.startsWith("success:") ? S.successBox : S.errorBox}>{assignMsg.startsWith("success:") ? "✅" : "⚠️"} {assignMsg.replace(/^(success:|error:)/, "")}</div>}
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button style={S.addBtn} onClick={() => { setShowAssignForm(v => !v); setAssignMsg(""); }}>
                          {showAssignForm ? "✕ Kapat" : "📤 Test Ata"}
                        </button>
                      </div>
                      {showAssignForm && (
                        <form onSubmit={handleAssign} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                          <h3 style={S.sectionTitle}>📤 Danışana Test Ata</h3>
                          <div className="grid-2">
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Test *</label>
                              <select value={assignForm.test} onChange={e => setAssignForm(p => ({ ...p, test: e.target.value }))} required style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff" }}>
                                <option value="">Test seçin...</option>
                                {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                              </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Danışan *</label>
                              <select value={assignForm.client} onChange={e => setAssignForm(p => ({ ...p, client: e.target.value }))} required style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff" }}>
                                <option value="">Danışan seçin...</option>
                                {activeClients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                              </select>
                            </div>
                            <PField label="Son Tarih" name="due_date" type="date" value={assignForm.due_date} onChange={e => setAssignForm(p => ({ ...p, due_date: e.target.value }))} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                            <button type="button" onClick={() => setShowAssignForm(false)} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.625rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.875rem", color: "#64748b" }}>İptal</button>
                            <button type="submit" style={{ ...S.addBtn, background: "linear-gradient(135deg,#f59e0b,#d97706)" }} disabled={assignSaving}>{assignSaving ? "Atanıyor..." : "📤 Ata"}</button>
                          </div>
                        </form>
                      )}
                      {assignsLoading ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ width: "2rem", height: "2rem", margin: "0 auto" }} /></div>
                      ) : assignments.length === 0 ? (
                        <div style={{ ...S.card, ...S.emptyState }}><div style={{ fontSize: "3rem" }}>📋</div><p>Henüz test ataması yok</p></div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {assignments.map(a => {
                            const statusColors = { pending: { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" }, completed: { bg: "#d1fae5", color: "#065f46", border: "#10b981" }, expired: { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" } };
                            const sc = statusColors[a.status] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
                            const isExpanded = expandedAssignment === a.id;
                            const detail = assignmentDetails[a.id];
                            const answers = detail?.answers || [];
                            return (
                              <div key={a.id} style={{ background: "#fff", borderRadius: "1rem", border: `1px solid ${(isExpanded || expandedAssignmentQuestions === a.id) ? sc.border : "#f1f5f9"}`, boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden", borderLeft: `4px solid ${sc.border}` }}>
                                {/* Kart Başlığı */}
                                <div style={{ padding: "1.1rem 1.25rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>{a.test_title || a.test?.title}</span>
                                        <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontWeight: 700, background: sc.bg, color: sc.color }}>
                                          {{ pending: "⏳ Bekliyor", completed: "✅ Tamamlandı", expired: "⌛ Süresi Doldu" }[a.status]}
                                        </span>
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>👤 {a.client_name || a.client?.first_name}</span>
                                        {a.due_date && <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>📅 Son: {a.due_date}</span>}
                                        {a.completed_at && <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>🕐 {new Date(a.completed_at).toLocaleDateString("tr-TR")}</span>}
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
                                      {a.status === "completed" && a.total_score != null && (
                                        <div style={{ textAlign: "center", background: "#fffbeb", border: "1.5px solid #fef3c7", borderRadius: "0.75rem", padding: "0.4rem 0.85rem" }}>
                                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Puan</div>
                                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b", lineHeight: 1.1 }}>{a.total_score}</div>
                                        </div>
                                      )}
                                      {/* Sil butonu — her zaman görünür */}
                                      <button
                                        onClick={() => handleDeleteAssignment(a.id)}
                                        style={{ ...S.editBtn, fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderColor: "#ef4444", color: "#ef4444" }}
                                        title="Atamayı sil"
                                      >🗑️ Sil</button>
                                    </div>
                                  </div>

                                  {/* Yorum alanı */}
                                  {commentingId === a.id ? (
                                    <div style={{ marginTop: "0.75rem", background: "#f8fafc", borderRadius: "0.625rem", padding: "0.75rem" }}>
                                      <textarea value={commentText} onChange={e => setCommentText(e.target.value)} rows={3} placeholder="Psikolog yorumunuzu yazın..." style={{ width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                        <button onClick={() => { setCommentingId(null); setCommentText(""); }} style={{ padding: "0.4rem 0.85rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.8rem", color: "#64748b" }}>İptal</button>
                                        <button onClick={() => handleSaveComment(a.id)} disabled={commentSaving} style={{ ...S.editBtn, fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}>{commentSaving ? "Kaydediliyor..." : "💾 Kaydet"}</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                                      {a.psychologist_comment ? (
                                        <p style={{ fontSize: "0.8rem", color: "#475569", fontStyle: "italic", flex: 1, background: "#f8fafc", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", margin: 0 }}>💬 {a.psychologist_comment}</p>
                                      ) : (
                                        <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>Henüz yorum eklenmedi</span>
                                      )}
                                      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                                        {/* Test sorularını görüntüle */}
                                        <button
                                          onClick={() => handleExpandAssignmentQuestions(a)}
                                          style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderColor: "#8b5cf6", color: "#8b5cf6" }}
                                        >
                                          {assignmentQuestionsLoading === a.id ? "⏳ Yükleniyor..." : expandedAssignmentQuestions === a.id ? "▲ Kapat" : "📋 Sorular"}
                                        </button>
                                        {a.status === "completed" && (
                                          <button
                                            onClick={() => handleExpandAnswers(a)}
                                            style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderColor: "#6366f1", color: "#6366f1" }}
                                          >
                                            {assignmentDetailsLoading === a.id ? "⏳ Yükleniyor..." : isExpanded ? "▲ Yanıtlar" : "📊 Yanıtlar"}
                                          </button>
                                        )}
                                        {a.status === "completed" && (
                                          <button onClick={() => { setCommentingId(a.id); setCommentText(a.psychologist_comment || ""); }} style={{ ...S.editBtn, fontSize: "0.72rem", padding: "0.2rem 0.55rem", flexShrink: 0 }}>✏️ Yorum</button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Test Soruları Paneli */}
                                {expandedAssignmentQuestions === a.id && (() => {
                                  const testObj = tests.find(t => t.id === (a.test?.id || a.test));
                                  const questions = testObj?.questions || [];
                                  return (
                                    <div style={{ borderTop: "1px solid #ede9fe", background: "#faf5ff", padding: "1rem 1.25rem" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                        <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                          📋 Test Soruları — {a.test_title || a.test?.title}
                                        </h4>
                                        <span style={{ fontSize: "0.7rem", background: "#ede9fe", color: "#5b21b6", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 700 }}>
                                          {questions.length} soru
                                        </span>
                                      </div>
                                      {assignmentQuestionsLoading === a.id ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                                          <div className="spinner" style={{ width: "1rem", height: "1rem" }} />
                                          <span style={{ fontSize: "0.8rem", color: "#8b5cf6" }}>Sorular yükleniyor...</span>
                                        </div>
                                      ) : questions.length === 0 ? (
                                        <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Bu test için soru bulunamadı.</p>
                                      ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                          {questions.map((q, idx) => (
                                            <div key={q.id || idx} style={{ background: "#fff", borderRadius: "0.5rem", border: "1px solid #ede9fe", padding: "0.6rem 0.85rem", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                                              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#8b5cf6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, flexShrink: 0, marginTop: "0.1rem" }}>{idx + 1}</span>
                                              <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: "0.82rem", color: "#1e293b" }}>{q.question_text}</span>
                                                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
                                                  <span style={{ fontSize: "0.65rem", background: "#ede9fe", color: "#5b21b6", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                                                    {{ likert: "Likert 1-5", multiple: "Çoktan Seçmeli", text: "Açık Uçlu" }[q.question_type] || q.question_type}
                                                  </span>
                                                  <span style={{ fontSize: "0.65rem", background: "#f1f5f9", color: "#64748b", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                                                    Ağırlık: {q.weight}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Yanıt Detayları (genişletilebilir) */}
                                {isExpanded && (
                                  <div style={{ borderTop: "1px solid #e0e7ff", background: "#f5f3ff", padding: "1rem 1.25rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                      <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.04em" }}>📊 Danışan Yanıtları</h4>
                                      {answers.length > 0 && (
                                        <span style={{ fontSize: "0.7rem", background: "#e0e7ff", color: "#4338ca", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 700 }}>
                                          {answers.length} yanıt
                                        </span>
                                      )}
                                    </div>
                                    {assignmentDetailsLoading === a.id ? (
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                                        <div className="spinner" style={{ width: "1rem", height: "1rem" }} />
                                        <span style={{ fontSize: "0.8rem", color: "#6366f1" }}>Yanıtlar yükleniyor...</span>
                                      </div>
                                    ) : answers.length === 0 ? (
                                      <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Bu atama için yanıt bulunamadı.</p>
                                    ) : (
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {answers
                                          .slice()
                                          .sort((a, b) => (a.question_order || 0) - (b.question_order || 0))
                                          .map((ans, idx) => {
                                            const displayValue = ans.text_value
                                              ? ans.text_value
                                              : ans.numeric_value != null
                                              ? String(ans.numeric_value)
                                              : "—";
                                            const score = ans.numeric_value != null ? ans.numeric_value : null;
                                            return (
                                              <div key={ans.id || idx} style={{ background: "#fff", borderRadius: "0.625rem", border: "1px solid #e0e7ff", padding: "0.65rem 0.85rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0, marginTop: "0.1rem" }}>
                                                  {ans.question_order || idx + 1}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                  <p style={{ fontSize: "0.82rem", color: "#475569", marginBottom: "0.3rem", lineHeight: 1.4 }}>
                                                    {ans.question_text || `Soru ${idx + 1}`}
                                                  </p>
                                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", background: "#f1f5f9", borderRadius: "0.35rem", padding: "0.2rem 0.6rem" }}>
                                                      {displayValue}
                                                    </span>
                                                    {ans.question_type === "likert" && score != null && (
                                                      <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, background: "#fffbeb", padding: "0.15rem 0.45rem", borderRadius: "0.35rem", border: "1px solid #fef3c7" }}>
                                                        {score}/5 puan
                                                      </span>
                                                    )}
                                                    {ans.question_type && (
                                                      <span style={{ fontSize: "0.65rem", color: "#8b5cf6", background: "#ede9fe", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                                                        {{ likert: "Likert", multiple: "Çoktan Seçmeli", text: "Açık Uçlu" }[ans.question_type] || ans.question_type}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── ÇALIŞMA SAATLERİ ────────────────────────────────── */}
              {activeTab === "working-hours" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Başlık */}
                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: "4px solid #6366f1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                      <div style={{ width: 56, height: 56, borderRadius: "1rem", background: "#ede9fe", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🕐</div>
                      <div>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.2rem" }}>Çalışma Saatleri</h2>
                        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>Haftalık çalışma programınızı belirleyin. Randevu modülü bu bilgileri kullanacaktır.</p>
                      </div>
                    </div>
                  </div>

                  {/* Mesaj */}
                  {whMsg && (
                    <div style={whMsg.startsWith("success:") ? S.successBox : S.errorBox}>
                      {whMsg.startsWith("success:") ? "✅" : "⚠️"} {whMsg.replace(/^(success:|error:)/, "")}
                    </div>
                  )}

                  {whLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                      <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
                    </div>
                  ) : (
                    <form onSubmit={handleWhSave} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                      {/* Tablo başlığı */}
                      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 80px", gap: "0", padding: "0.75rem 1.25rem", background: "#fafbff", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Gün</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Başlangıç</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Bitiş</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Aktif</span>
                      </div>

                      {/* Günler */}
                      {whForm.map((wh) => {
                        const dayLabel = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"][wh.day];
                        return (
                          <div
                            key={wh.day}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "140px 1fr 1fr 80px",
                              gap: "0",
                              padding: "0.85rem 1.25rem",
                              borderBottom: "1px solid #f8fafc",
                              alignItems: "center",
                              opacity: wh.is_active ? 1 : 0.45,
                              background: wh.is_active ? "#fff" : "#f8fafc",
                            }}
                          >
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>{dayLabel}</span>
                            <input
                              type="time"
                              value={wh.start_time}
                              onChange={e => handleWhChange(wh.day, "start_time", e.target.value)}
                              disabled={!wh.is_active}
                              style={{ padding: "0.45rem 0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", background: wh.is_active ? "#fff" : "#f1f5f9", outline: "none", width: "120px" }}
                            />
                            <input
                              type="time"
                              value={wh.end_time}
                              onChange={e => handleWhChange(wh.day, "end_time", e.target.value)}
                              disabled={!wh.is_active}
                              style={{ padding: "0.45rem 0.65rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", background: wh.is_active ? "#fff" : "#f1f5f9", outline: "none", width: "120px" }}
                            />
                            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={wh.is_active}
                                onChange={e => handleWhChange(wh.day, "is_active", e.target.checked)}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                              />
                              <span style={{ fontSize: "0.78rem", color: wh.is_active ? "#065f46" : "#94a3b8", fontWeight: 600 }}>
                                {wh.is_active ? "Açık" : "Kapalı"}
                              </span>
                            </label>
                          </div>
                        );
                      })}

                      {/* Kaydet */}
                      <div style={{ padding: "1.25rem", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9" }}>
                        <button type="submit" style={S.addBtn} disabled={whSaving}>
                          {whSaving
                            ? <><span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "#fff" }} /> Kaydediliyor...</>
                            : "💾 Çalışma Saatlerini Kaydet"
                          }
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ── MESAJLAR ────────────────────────────────────────── */}
              {activeTab === "messages" && (
                <MessagingPanel
                  currentUserEmail={user?.email}
                  role="psychologist"
                  accentColor="#6366f1"
                  accentGradient="135deg,#6366f1,#8b5cf6"
                />
              )}

              {/* ── GÜVENLİK / ŞİFRE DEĞİŞTİR ─────────────────────── */}
              {activeTab === "security" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Başlık */}
                  <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: "4px solid #6366f1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 56, height: 56, borderRadius: "1rem", background: "#ede9fe", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🔒</div>
                      <div>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.2rem" }}>Güvenlik Ayarları</h2>
                        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>Hesap şifrenizi buradan değiştirebilirsiniz.</p>
                      </div>
                    </div>
                  </div>

                  {/* Mesaj */}
                  {pwMsg && (
                    <div style={pwMsg.startsWith("success:") ? S.successBox : S.errorBox}>
                      {pwMsg.startsWith("success:") ? "✅" : "⚠️"} {pwMsg.replace(/^(success:|error:)/, "")}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handlePwSave} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                    <h3 style={S.sectionTitle}>🔑 Şifre Değiştir</h3>
                    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <PField
                        label="Mevcut Şifre *"
                        name="old_password"
                        type="password"
                        value={pwForm.old_password}
                        onChange={handlePwChange}
                        required
                        placeholder="Mevcut şifrenizi girin"
                      />
                      <PField
                        label="Yeni Şifre *"
                        name="new_password"
                        type="password"
                        value={pwForm.new_password}
                        onChange={handlePwChange}
                        required
                        placeholder="En az 8 karakter"
                      />
                      <PField
                        label="Yeni Şifre (Tekrar) *"
                        name="new_password2"
                        type="password"
                        value={pwForm.new_password2}
                        onChange={handlePwChange}
                        required
                        placeholder="Yeni şifreyi tekrar girin"
                      />
                      <div style={{ marginTop: "0.5rem", padding: "0.75rem 1rem", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "0.5rem", fontSize: "0.78rem", color: "#0369a1" }}>
                        💡 Şifreniz en az 8 karakter olmalı, çok basit veya yaygın bir şifre olmamalıdır.
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                      <button type="submit" style={S.addBtn} disabled={pwSaving}>
                        {pwSaving ? (
                          <><span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "#fff" }} /> Kaydediliyor...</>
                        ) : "🔒 Şifreyi Değiştir"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── ARAÇLAR ─────────────────────────────────────────── */}
              {activeTab === "tools" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                  {[
                    { icon: "📖", title: "Swagger UI",    desc: "Tüm API endpoint'lerini interaktif olarak test edin.", href: "http://127.0.0.1:8000/api/docs/",    color: "#6366f1" },
                    { icon: "📋", title: "ReDoc",         desc: "Temiz ve okunabilir API dokümantasyonu.",              href: "http://127.0.0.1:8000/api/redoc/",   color: "#8b5cf6" },
                    { icon: "⚙️", title: "Admin Paneli",  desc: "Django admin panelinden sistem yönetimi yapın.",       href: "http://127.0.0.1:8000/admin/",       color: "#10b981" },
                    { icon: "🔗", title: "API Schema",    desc: "OpenAPI şemasını JSON/YAML olarak indirin.",           href: "http://127.0.0.1:8000/api/schema/",  color: "#f59e0b" },
                  ].map((tool, i) => (
                    <a key={i} href={tool.href} target="_blank" rel="noreferrer" style={{ ...S.card, textDecoration: "none", display: "block", borderTop: `3px solid ${tool.color}` }}>
                      <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: tool.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "1rem" }}>
                        {tool.icon}
                      </div>
                      <h3 style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem", fontSize: "0.95rem" }}>{tool.title}</h3>
                      <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>{tool.desc}</p>
                      <div style={{ marginTop: "1rem", color: tool.color, fontSize: "0.85rem", fontWeight: 600 }}>Aç →</div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Modül Placeholder Bileşeni ─────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
function ModuleComingSoon({ icon, title, color, owner, features, apiEndpoints }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Başlık kartı */}
      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: `4px solid ${color}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: "1rem", background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", flexShrink: 0 }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.3rem" }}>{title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#fef3c7", color: "#92400e", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700, border: "1px solid #fde68a" }}>
                🚧 Geliştirme Aşamasında
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#ede9fe", color: "#5b21b6", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700, border: "1px solid #ddd6fe" }}>
                👤 Sorumlu: {owner}
              </span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.7 }}>
          Bu modül henüz geliştirilme aşamasındadır. Aşağıdaki kullanım senaryoları ve API endpoint'leri referans olarak verilmiştir.
          Sorumlu geliştirici bu bölümü tamamladığında içerik aktif hale gelecektir.
        </p>
      </div>

      {/* İki kolon: Özellikler + API */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Kullanım senaryoları */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: "#fafbff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📋</span>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e293b" }}>Kullanım Senaryoları (Use Cases)</span>
          </div>
          <div style={{ padding: "0.75rem" }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.6rem 0.5rem", borderBottom: i < features.length - 1 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: color + "20", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0, marginTop: "0.1rem" }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API endpoint'leri */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: "#fafbff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🔌</span>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e293b" }}>API Endpoint'leri</span>
          </div>
          <div style={{ padding: "0.75rem" }}>
            {apiEndpoints.map((ep, i) => (
              <div key={i} style={{ padding: "0.5rem 0.75rem", marginBottom: "0.35rem", background: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #f1f5f9" }}>
                <code style={{ fontSize: "0.75rem", color: "#1e293b", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{ep}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geliştirici notu */}
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.75rem", padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#065f46", marginBottom: "0.25rem" }}>Geliştirici Notu — {owner}</p>
          <p style={{ fontSize: "0.8rem", color: "#047857", lineHeight: 1.6 }}>
            <strong>Backend:</strong> <code style={{ background: "#dcfce7", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>apps/</code> altında yeni Django uygulaması oluşturun.
            Detaylı talimatlar için <code style={{ background: "#dcfce7", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>GELISTIRICI_REHBERI.md</code> dosyasını okuyun.
            {" "}<strong>Psikolog paneli (frontend):</strong> Bu dosyada ilgili{" "}
            <code style={{ background: "#dcfce7", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>activeTab</code> bloğunu bulun — <strong>Semanur SEVİM</strong> sorumludur.
            {" "}<strong>Danışan paneli (frontend):</strong>{" "}
            <code style={{ background: "#dcfce7", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>ClientDashboard.js</code> içindeki ilgili{" "}
            <code style={{ background: "#dcfce7", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>activeSection</code> bloğunu bulun — <strong>Halis ÜNLÜ</strong> sorumludur.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Alan Bileşeni ───────────────────────────────────────────────────────── */
function PField({ label, name, value, onChange, type = "text", required, placeholder, textarea, rows = 4, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
      {textarea ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1e293b", background: "#fff", outline: "none", resize: "vertical", width: "100%" }}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          style={{ padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", color: disabled ? "#94a3b8" : "#1e293b", background: disabled ? "#f8fafc" : "#fff", outline: "none", width: "100%", cursor: disabled ? "not-allowed" : "text" }}
        />
      )}
    </div>
  );
}

/* ── Stiller ─────────────────────────────────────────────────────────────── */
const S = {
  page:   { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  layout: { display: "flex", maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", gap: "1.5rem", alignItems: "flex-start" },

  /* Sidebar */
  sidebar: { width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem", position: "sticky", top: "80px" },
  profileCard: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.25rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  profileAvatar: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", margin: "0 auto 0.75rem" },
  profileName: { fontWeight: 800, fontSize: "0.9rem", color: "#1e293b", marginBottom: "0.3rem" },
  profileBadge: { display: "inline-block", background: "#ede9fe", color: "#5b21b6", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.4rem" },
  profileLicense: { fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" },
  profileWarning: { fontSize: "0.72rem", color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.5rem", padding: "0.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" },
  profileWarningLink: { color: "#d97706", fontWeight: 700, textDecoration: "none" },

  nav: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "0.4rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: "0.1rem" },
  navItem: { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.8rem", borderRadius: "0.5rem", border: "none", background: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, color: "#64748b", width: "100%", textAlign: "left", transition: "all .15s" },
  navItemActive: { background: "#ede9fe", color: "#6366f1", fontWeight: 700 },

  quickLinks: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  quickLink: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.7rem", borderRadius: "0.5rem", textDecoration: "none", fontSize: "0.78rem", color: "#94a3b8", transition: "all .15s" },

  /* Main */
  main: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1.25rem" },
  welcomeBar: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" },
  welcomeTitle: { fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" },
  welcomeSub: { fontSize: "0.82rem", color: "#94a3b8", marginTop: "0.2rem" },
  addBtn: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", borderRadius: "0.625rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(99,102,241,.3)", transition: "all .2s" },

  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" },
  successBox: { display: "flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#065f46", fontWeight: 600 },
  errorBox:   { display: "flex", alignItems: "center", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#b91c1c" },

  /* İstatistik */
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" },
  statCard: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  statIcon: { width: 48, height: 48, borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 },
  statValue: { fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem", fontWeight: 500 },

  /* İki kolon */
  twoCol: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem", alignItems: "flex-start" },

  /* Kart */
  card: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9" },
  cardTitle: { fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" },
  seeAll: { color: "#6366f1", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer" },

  /* Danışan satırı */
  clientRow: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.25rem", borderBottom: "1px solid #f8fafc", textDecoration: "none", transition: "background .1s" },
  clientAvatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 },
  clientName: { fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" },
  clientEmail: { fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  emptyState: { padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" },

  /* Profil satırı */
  profileRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1.25rem", borderBottom: "1px solid #f8fafc" },
  profileRowLabel: { fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" },
  profileRowValue: { fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 },
  profileBio: { fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, padding: "0.75rem 1.25rem", fontStyle: "italic" },

  /* Profil formu */
  sectionTitle: { fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1.5px solid #f1f5f9" },

  /* Hızlı buton */
  quickBtn: { display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", background: "#f8fafc", border: "1px solid #f1f5f9", textDecoration: "none", fontSize: "0.78rem", fontWeight: 600, color: "#475569", transition: "all .15s" },

  /* Badge */
  badgeGreen: { display: "inline-block", background: "#d1fae5", color: "#065f46", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 },
  badgeRed:   { display: "inline-block", background: "#fee2e2", color: "#991b1b", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 },

  /* Tablo düzenle butonu */
  editBtn: { display: "inline-flex", alignItems: "center", padding: "0.35rem 0.75rem", borderRadius: "0.375rem", border: "1.5px solid #6366f1", color: "#6366f1", textDecoration: "none", fontSize: "0.78rem", fontWeight: 600, transition: "all .15s" },
};