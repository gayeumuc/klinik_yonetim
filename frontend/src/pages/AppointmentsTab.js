/**
 * Randevu Yönetimi Sekmesi — Geliştirilmiş Tasarım
 */
import React, { useState, useEffect, useCallback } from "react";
import { appointmentAPI } from "../services/api";

const STATUS_COLORS = {
  available: { bg: "#d1fae5", color: "#065f46", border: "#10b981" },
  pending:   { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" },
  booked:    { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" },
  completed: { bg: "#ede9fe", color: "#5b21b6", border: "#8b5cf6" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" },
  rejected:  { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" },
};
const STATUS_LABELS = {
  all: "Tümü", available: "Müsait", pending: "Onay Bekliyor",
  booked: "Onaylandı", completed: "Tamamlandı",
  cancelled: "İptal", rejected: "Reddedildi",
};
const NOTE_TYPE_LABELS = {
  general:  "📋 Genel Not",
  clinical: "🔬 Klinik Gözlem",
  homework: "📚 Ödev / Görev",
  followup: "🔄 Takip Notu",
  risk:     "⚠️ Risk Değerlendirmesi",
};
const NOTE_TYPE_COLORS = {
  general:  { bg: "#f1f5f9", color: "#475569" },
  clinical: { bg: "#ede9fe", color: "#5b21b6" },
  homework: { bg: "#d1fae5", color: "#065f46" },
  followup: { bg: "#dbeafe", color: "#1e40af" },
  risk:     { bg: "#fee2e2", color: "#991b1b" },
};
const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalISO(date) {
  const p = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}`;
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

/* ── Randevu Detay Modal ─────────────────────────────────────────────── */
function AppointmentModal({ appt, onClose, onComplete, onCancel, toast }) {
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteForm, setNoteForm] = useState({ note_type: "general", content: "", is_private: true });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    setNotesLoading(true);
    appointmentAPI.notes.list(appt.id)
      .then(r => setNotes(r.data))
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, [appt.id]);

  const handleAddNote = async () => {
    if (!noteForm.content.trim()) return;
    setSaving(true); setMsg("");
    try {
      const r = await appointmentAPI.notes.create(appt.id, noteForm);
      setNotes(prev => [r.data, ...prev]);
      setNoteForm({ note_type: "general", content: "", is_private: true });
      setShowNoteForm(false);
      setMsg("success:Not eklendi.");
      toast && toast.success("📝 Not eklendi.");
    } catch (e) {
      setMsg("error:" + (e.response?.data?.detail || "Not eklenemedi."));
    } finally { setSaving(false); }
  };

  const handleUpdateNote = async (noteId) => {
    setSaving(true);
    try {
      const r = await appointmentAPI.notes.update(noteId, editForm);
      setNotes(prev => prev.map(n => n.id === noteId ? r.data : n));
      setEditingId(null); setEditForm({});
      setMsg("success:Not güncellendi.");
    } catch { setMsg("error:Güncelleme başarısız."); }
    finally { setSaving(false); }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Bu notu silmek istiyor musunuz?")) return;
    try {
      await appointmentAPI.notes.delete(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setMsg("success:Not silindi.");
    } catch { setMsg("error:Silme başarısız."); }
  };

  const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.available;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "1.25rem", width: "100%", maxWidth: 660, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderTop: `4px solid ${sc.border}` }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", marginBottom: "0.25rem" }}>
              {appt.client_name || "Boş Slot"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
              {fmtDate(appt.start_time)} · {fmtTime(appt.start_time)} — {fmtTime(appt.end_time)} · {appt.duration_minutes} dk
            </div>
            <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: sc.bg, color: sc.color }}>
                {STATUS_LABELS[appt.status]}
              </span>
              {appt.client_email && <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{appt.client_email}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#94a3b8", padding: "0.2rem 0.4rem", lineHeight: 1 }}>✕</button>
        </div>

        {/* Genel not */}
        {appt.notes && (
          <div style={{ margin: "1rem 1.5rem 0", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "0.625rem", fontSize: "0.85rem", color: "#475569", borderLeft: "3px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Genel Not</span>
            {appt.notes}
          </div>
        )}

        {/* İptal nedeni */}
        {appt.cancellation_reason && (
          <div style={{ margin: "0.75rem 1.5rem 0", padding: "0.75rem 1rem", background: "#fef2f2", borderRadius: "0.625rem", fontSize: "0.85rem", color: "#b91c1c", borderLeft: "3px solid #ef4444" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>İptal Nedeni</span>
            {appt.cancellation_reason}
          </div>
        )}

        {/* İşlem butonları */}
        {(appt.status === "booked" || appt.status === "available" || appt.status === "pending") && (
          <div style={{ padding: "0.75rem 1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {appt.status === "booked" && (
              <button
                onClick={() => { onComplete(appt.id); onClose(); }}
                style={{ padding: "0.45rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #10b981", color: "#10b981", background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
              >
                ✓ Tamamlandı İşaretle
              </button>
            )}
            <button
              onClick={() => { onCancel(appt.id); onClose(); }}
              style={{ padding: "0.45rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #ef4444", color: "#ef4444", background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
            >
              ✕ İptal Et
            </button>
          </div>
        )}

        {/* Klinik Notlar — tamamlanan randevular dahil her durumda */}
        <div style={{ padding: "1rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
              📝 Klinik Notlar ({notes.length})
              {appt.status === "completed" && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", background: "#ede9fe", color: "#5b21b6", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 600, textTransform: "none" }}>
                  Tamamlanan Görüşme
                </span>
              )}
            </h3>
            {!showNoteForm && (
              <button
                onClick={() => setShowNoteForm(true)}
                style={{ padding: "0.3rem 0.75rem", borderRadius: "0.45rem", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
              >
                + Not Ekle
              </button>
            )}
          </div>

          {msg && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: msg.startsWith("success:") ? "#f0fdf4" : "#fef2f2", color: msg.startsWith("success:") ? "#065f46" : "#b91c1c", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              {msg.startsWith("success:") ? "✅" : "⚠️"} {msg.replace(/^(success:|error:)/, "")}
            </div>
          )}

          {/* Not ekleme formu */}
          {showNoteForm && (
            <div style={{ background: "#f8fafc", borderRadius: "0.75rem", border: "1.5px solid #6366f1", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                📝 Yeni Not Ekle
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={noteForm.note_type}
                  onChange={e => setNoteForm(p => ({ ...p, note_type: e.target.value }))}
                  style={{ padding: "0.4rem 0.6rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.8rem", background: "#fff", flex: 1, minWidth: 160 }}
                >
                  {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "#475569", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={noteForm.is_private} onChange={e => setNoteForm(p => ({ ...p, is_private: e.target.checked }))} />
                  🔒 Gizli
                </label>
              </div>
              <textarea
                value={noteForm.content}
                onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                rows={3}
                placeholder="Not içeriğini yazın..."
                style={{ width: "100%", padding: "0.6rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => { setShowNoteForm(false); setNoteForm({ note_type: "general", content: "", is_private: true }); }}
                  style={{ padding: "0.4rem 0.85rem", borderRadius: "0.45rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.78rem", color: "#64748b" }}
                >
                  İptal
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={saving || !noteForm.content.trim()}
                  style={{ padding: "0.45rem 1rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, opacity: (!noteForm.content.trim() || saving) ? 0.6 : 1 }}
                >
                  {saving ? "Ekleniyor..." : "📝 Not Ekle"}
                </button>
              </div>
            </div>
          )}

          {/* Mevcut notlar */}
          {notesLoading ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: "0.82rem" }}>Notlar yükleniyor...</div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: "0.82rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</div>
              Henüz not eklenmemiş.
              {!showNoteForm && (
                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setShowNoteForm(true)}
                    style={{ padding: "0.35rem 0.85rem", borderRadius: "0.45rem", border: "1.5px solid #6366f1", color: "#6366f1", background: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                  >
                    İlk Notu Ekle
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {notes.map(n => (
                <div key={n.id} style={{ background: "#fafbff", borderRadius: "0.625rem", border: "1px solid #f1f5f9", padding: "0.75rem 1rem", borderLeft: `3px solid ${NOTE_TYPE_COLORS[n.note_type]?.color || "#e2e8f0"}` }}>
                  {editingId === n.id ? (
                    <div>
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <select
                          value={editForm.note_type ?? n.note_type}
                          onChange={e => setEditForm(p => ({ ...p, note_type: e.target.value }))}
                          style={{ padding: "0.3rem 0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "0.4rem", fontSize: "0.78rem", background: "#fff" }}
                        >
                          {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", cursor: "pointer" }}>
                          <input type="checkbox" checked={editForm.is_private ?? n.is_private} onChange={e => setEditForm(p => ({ ...p, is_private: e.target.checked }))} />
                          🔒 Gizli
                        </label>
                      </div>
                      <textarea
                        value={editForm.content ?? n.content}
                        onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))}
                        rows={3}
                        style={{ width: "100%", padding: "0.5rem", border: "1.5px solid #e2e8f0", borderRadius: "0.4rem", fontSize: "0.82rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", marginTop: "0.4rem" }}>
                        <button onClick={() => { setEditingId(null); setEditForm({}); }} style={{ padding: "0.3rem 0.65rem", borderRadius: "0.4rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.75rem", color: "#64748b" }}>İptal</button>
                        <button onClick={() => handleUpdateNote(n.id)} disabled={saving} style={{ padding: "0.3rem 0.65rem", borderRadius: "0.4rem", border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>{saving ? "..." : "💾 Kaydet"}</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: NOTE_TYPE_COLORS[n.note_type]?.bg, color: NOTE_TYPE_COLORS[n.note_type]?.color }}>
                            {NOTE_TYPE_LABELS[n.note_type] || n.note_type}
                          </span>
                          {n.is_private && <span style={{ fontSize: "0.65rem", background: "#fef3c7", color: "#92400e", padding: "0.1rem 0.35rem", borderRadius: "9999px", fontWeight: 600 }}>🔒 Gizli</span>}
                          <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                            {new Date(n.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.2rem" }}>
                          <button onClick={() => { setEditingId(n.id); setEditForm({ note_type: n.note_type, content: n.content, is_private: n.is_private }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "0.8rem", padding: "0.1rem 0.25rem" }}>✏️</button>
                          <button onClick={() => handleDeleteNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.8rem", padding: "0.1rem 0.25rem" }}>🗑️</button>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{n.content}</p>
                      {n.author_name && <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.3rem" }}>— {n.author_name}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Haftalık Takvim ─────────────────────────────────────────────────── */
function WeeklyCalendar({ clients, onComplete, onCancel, toast }) {
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [calData, setCalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const loadCalendar = useCallback((ws) => {
    setLoading(true);
    appointmentAPI.calendar(toLocalISO(ws))
      .then(r => setCalData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCalendar(weekStart); }, [weekStart, loadCalendar]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday  = () => setWeekStart(getMondayOfWeek(new Date()));

  const weekDates = getWeekDates(weekStart);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const handleComplete = async (id) => { await onComplete(id); loadCalendar(weekStart); };
  const handleCancel   = async (id) => { await onCancel(id);   loadCalendar(weekStart); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Navigasyon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "0.85rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={prevWeek} style={{ padding: "0.4rem 0.75rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>‹ Önceki</button>
          <button onClick={goToday}  style={{ padding: "0.4rem 0.75rem", borderRadius: "0.5rem", border: "1.5px solid #6366f1", background: "#ede9fe", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, color: "#6366f1" }}>Bugün</button>
          <button onClick={nextWeek} style={{ padding: "0.4rem 0.75rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Sonraki ›</button>
        </div>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
          {weekDates[0].toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
          {" — "}
          {weekDates[6].toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
        {calData && <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{calData.total_count} randevu</div>}
      </div>

      {loading ? (
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "3rem", textAlign: "center" }}>
          <div className="spinner" style={{ width: "2rem", height: "2rem", margin: "0 auto" }} />
          <p style={{ color: "#94a3b8", marginTop: "1rem", fontSize: "0.875rem" }}>Takvim yükleniyor...</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden" }}>
          {/* Gün başlıkları */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "2px solid #f1f5f9" }}>
            {weekDates.map((d, i) => {
              const isToday = d.getTime() === today.getTime();
              const count = calData?.days?.[i]?.appointments?.length || 0;
              return (
                <div key={i} style={{ padding: "0.75rem 0.5rem", textAlign: "center", borderRight: i < 6 ? "1px solid #f1f5f9" : "none", background: isToday ? "#ede9fe" : "#fafbff" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: isToday ? "#6366f1" : "#94a3b8", textTransform: "uppercase", marginBottom: "0.2rem" }}>
                    {DAY_LABELS[i]}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: isToday ? "#6366f1" : "#1e293b", lineHeight: 1 }}>
                    {d.getDate()}
                  </div>
                  {count > 0 && (
                    <div style={{ marginTop: "0.2rem", fontSize: "0.65rem", background: isToday ? "#6366f1" : "#e2e8f0", color: isToday ? "#fff" : "#64748b", borderRadius: "9999px", padding: "0.05rem 0.35rem", display: "inline-block", fontWeight: 700 }}>
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Randevu içerikleri */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: 300 }}>
            {weekDates.map((d, i) => {
              const isToday = d.getTime() === today.getTime();
              const appts = calData?.days?.[i]?.appointments || [];
              return (
                <div key={i} style={{ borderRight: i < 6 ? "1px solid #f1f5f9" : "none", padding: "0.5rem", background: isToday ? "#faf9ff" : "#fff", minHeight: 200 }}>
                  {appts.length === 0 ? (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>—</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {appts.map(a => {
                        const sc = STATUS_COLORS[a.status] || STATUS_COLORS.available;
                        return (
                          <button
                            key={a.id}
                            onClick={() => setSelectedAppt(a)}
                            style={{ width: "100%", textAlign: "left", padding: "0.4rem 0.5rem", borderRadius: "0.4rem", border: `1.5px solid ${sc.border}`, background: sc.bg, cursor: "pointer", transition: "opacity .15s" }}
                          >
                            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: sc.color, marginBottom: "0.1rem" }}>{fmtTime(a.start_time)}</div>
                            <div style={{ fontSize: "0.68rem", color: sc.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{a.client_name || "Boş"}</div>
                            <div style={{ fontSize: "0.62rem", color: sc.color, opacity: 0.8 }}>{a.duration_minutes} dk</div>
                            {a.notes_count > 0 && <div style={{ fontSize: "0.6rem", color: sc.color, marginTop: "0.1rem" }}>📝 {a.notes_count}</div>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedAppt && (
        <AppointmentModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onComplete={handleComplete}
          onCancel={handleCancel}
          toast={toast}
        />
      )}
    </div>
  );
}

/* ── Direkt Randevu Formu ─────────────────────────────────────────────── */
function DirectAppointmentForm({ clients, onCreated, toast }) {
  const [form, setForm] = useState({ client_id: "", start_time: "", end_time: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Başlangıç saati değişince bitiş saatini 1 saat sonraya ayarla
  const handleStartChange = (val) => {
    setForm(p => {
      const newForm = { ...p, start_time: val };
      if (val) {
        const start = new Date(val);
        start.setHours(start.getHours() + 1);
        const pad = n => String(n).padStart(2, "0");
        newForm.end_time = `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;
      }
      return newForm;
    });
  };

  // Hızlı tarih seçenekleri
  const setQuickDate = (offsetDays, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    const pad = n => String(n).padStart(2, "0");
    const fmt = dt => `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    const startVal = fmt(d);
    const endD = new Date(d); endD.setHours(endD.getHours() + 1);
    setForm(p => ({ ...p, start_time: startVal, end_time: fmt(endD) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.start_time || !form.end_time) {
      setMsg("error:Danışan, başlangıç ve bitiş zamanı zorunludur.");
      return;
    }
    setSaving(true); setMsg("");
    try {
      const payload = {
        client_id: parseInt(form.client_id),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        notes: form.notes,
      };
      const res = await appointmentAPI.createDirect(payload);
      setMsg("success:Randevu başarıyla oluşturuldu.");
      setForm({ client_id: "", start_time: "", end_time: "", notes: "" });
      toast && toast.success("📅 Randevu oluşturuldu.");
      onCreated && onCreated(res.data);
    } catch (err) {
      const d = err.response?.data;
      const m = d?.detail || d?.client_id?.[0] || d?.start_time?.[0] || d?.end_time?.[0] || "Randevu oluşturulamadı.";
      setMsg("error:" + (typeof m === "object" ? JSON.stringify(m) : m));
      toast && toast.error(typeof m === "object" ? "Randevu oluşturulamadı." : m);
    } finally { setSaving(false); }
  };

  const activeClients = clients.filter(c => c.is_active);
  const diffMin = form.start_time && form.end_time ? (new Date(form.end_time) - new Date(form.start_time)) / 60000 : 0;

  return (
    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1.5px solid #f1f5f9" }}>
        ➕ Yeni Randevu Oluştur
      </h3>

      {msg && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: "0.625rem", background: msg.startsWith("success:") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.startsWith("success:") ? "#bbf7d0" : "#fecaca"}`, color: msg.startsWith("success:") ? "#065f46" : "#b91c1c", fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>
          {msg.startsWith("success:") ? "✅" : "⚠️"} {msg.replace(/^(success:|error:)/, "")}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Danışan */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.4rem" }}>Danışan *</label>
          <select
            value={form.client_id}
            onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
            required
            style={{ width: "100%", padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff", color: form.client_id ? "#1e293b" : "#94a3b8" }}
          >
            <option value="">— Danışan seçin —</option>
            {activeClients.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>
            ))}
          </select>
          {activeClients.length === 0 && <p style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.3rem" }}>⚠️ Aktif danışan bulunamadı.</p>}
        </div>

        {/* Hızlı tarih seçenekleri */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.4rem" }}>Hızlı Seçim</label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { label: "Bugün 09:00", days: 0, hour: 9 },
              { label: "Bugün 14:00", days: 0, hour: 14 },
              { label: "Yarın 10:00", days: 1, hour: 10 },
              { label: "Yarın 15:00", days: 1, hour: 15 },
              { label: "+2 Gün 10:00", days: 2, hour: 10 },
              { label: "+3 Gün 10:00", days: 3, hour: 10 },
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuickDate(q.days, q.hour)}
                style={{ padding: "0.3rem 0.65rem", borderRadius: "0.45rem", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tarih/Saat */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.4rem" }}>Başlangıç *</label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={e => handleStartChange(e.target.value)}
              required
              style={{ width: "100%", padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.4rem" }}>Bitiş *</label>
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
              required
              style={{ width: "100%", padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Süre göstergesi */}
        {diffMin > 0 && (
          <div style={{ marginBottom: "1rem", padding: "0.5rem 0.85rem", background: "#e0f2fe", borderRadius: "0.5rem", fontSize: "0.8rem", color: "#0369a1", fontWeight: 600 }}>
            ⏱️ Süre: {diffMin >= 60 ? `${Math.floor(diffMin/60)} saat${diffMin%60 > 0 ? ` ${diffMin%60} dk` : ""}` : `${diffMin} dakika`}
          </div>
        )}

        {/* Not */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.4rem" }}>Not (Opsiyonel)</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3}
            placeholder="Randevu hakkında genel not..."
            style={{ width: "100%", padding: "0.65rem 0.95rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "0.65rem 1.5rem", borderRadius: "0.625rem", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, boxShadow: "0 4px 14px rgba(99,102,241,.3)", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Oluşturuluyor..." : "📅 Randevu Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Randevu Listesi ─────────────────────────────────────────────────── */
function AppointmentList({ clients, appointments, apptLoading, onComplete, onCancel, onDelete, toast }) {
  const [filter, setFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");
  const [selectedAppt, setSelectedAppt] = useState(null);

  const filtered = appointments.filter(a => {
    if (filter !== "all" && a.status !== filter) return false;
    if (clientFilter && a.client_id !== parseInt(clientFilter)) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Filtreler */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {["all","pending","booked","completed","cancelled","rejected","available"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "0.35rem 0.85rem", borderRadius: "9999px", border: "1.5px solid", borderColor: filter===f?"#6366f1":"#e2e8f0", background: filter===f?"#ede9fe":"#fff", color: filter===f?"#6366f1":"#64748b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
              {STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          style={{ padding: "0.35rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.8rem", background: "#fff", color: clientFilter ? "#1e293b" : "#94a3b8" }}>
          <option value="">Tüm Danışanlar</option>
          {clients.filter(c => c.is_active).map(c => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </select>
      </div>

      {apptLoading ? (
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "3rem", textAlign: "center" }}>
          <div className="spinner" style={{ width: "2rem", height: "2rem", margin: "0 auto" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📅</div>
          <p style={{ fontSize: "0.875rem" }}>Randevu bulunamadı</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tarih / Saat</th>
                  <th>Süre</th>
                  <th>Danışan</th>
                  <th>Durum</th>
                  <th>Not</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const sc = STATUS_COLORS[a.status] || STATUS_COLORS.available;
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        {new Date(a.start_time).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{a.duration_minutes} dk</td>
                      <td>
                        {a.client_name
                          ? <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.client_name}</span>
                          : <span style={{ color: "#94a3b8" }}>Boş</span>
                        }
                      </td>
                      <td>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700, background: sc.bg, color: sc.color }}>
                          {STATUS_LABELS[a.status]}
                        </span>
                      </td>
                      <td>
                        {a.notes_count > 0
                          ? <span style={{ fontSize: "0.72rem", background: "#ede9fe", color: "#5b21b6", padding: "0.15rem 0.45rem", borderRadius: "9999px", fontWeight: 600 }}>📝 {a.notes_count}</span>
                          : <span style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>—</span>
                        }
                      </td>
                      <td style={{ display: "flex", gap: "0.35rem", flexWrap: "nowrap" }}>
                        <button onClick={() => setSelectedAppt(a)}
                          style={{ padding: "0.2rem 0.5rem", borderRadius: "0.375rem", border: "1.5px solid #6366f1", color: "#6366f1", background: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}>
                          📝 Detay
                        </button>
                        {a.status === "booked" && (
                          <button onClick={() => onComplete(a.id)}
                            style={{ padding: "0.2rem 0.5rem", borderRadius: "0.375rem", border: "1.5px solid #10b981", color: "#10b981", background: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}>
                            ✓
                          </button>
                        )}
                        {(a.status === "available" || a.status === "booked" || a.status === "pending") && (
                          <button onClick={() => onCancel(a.id)}
                            style={{ padding: "0.2rem 0.5rem", borderRadius: "0.375rem", border: "1.5px solid #ef4444", color: "#ef4444", background: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}>
                            ✕
                          </button>
                        )}
                        {(a.status === "cancelled" || a.status === "rejected" || a.status === "available") && (
                          <button onClick={() => { if (window.confirm("Kalıcı olarak silinsin mi?")) onDelete(a.id); }}
                            style={{ padding: "0.2rem 0.5rem", borderRadius: "0.375rem", border: "1.5px solid #94a3b8", color: "#94a3b8", background: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}>
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedAppt && (
        <AppointmentModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onComplete={onComplete}
          onCancel={onCancel}
          toast={toast}
        />
      )}
    </div>
  );
}

/* ── Ana Bileşen ─────────────────────────────────────────────────────── */
export default function AppointmentsTab({
  clients, appointments, apptLoading,
  handleApptComplete, handleApptCancel, handleApptDelete,
  toast,
}) {
  const [subTab, setSubTab] = useState("calendar");
  const [localAppts, setLocalAppts] = useState(appointments);

  useEffect(() => { setLocalAppts(appointments); }, [appointments]);

  const onCreated  = (newAppt) => { setLocalAppts(prev => [newAppt, ...prev]); setSubTab("calendar"); };
  const onComplete = async (id) => { await handleApptComplete(id); setLocalAppts(prev => prev.map(a => a.id === id ? { ...a, status: "completed" } : a)); };
  const onCancel   = async (id) => { await handleApptCancel(id);   setLocalAppts(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a)); };
  const onDelete   = async (id) => { if (handleApptDelete) { await handleApptDelete(id); setLocalAppts(prev => prev.filter(a => a.id !== id)); } };

  const subTabs = [
    { id: "calendar", icon: "📅", label: "Takvim" },
    { id: "list",     icon: "📋", label: "Liste" },
    { id: "new",      icon: "➕", label: "Yeni Randevu" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Başlık */}
      <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "1.25rem 1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: "4px solid #0ea5e9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#e0f2fe", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>📅</div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Randevu Yönetimi</h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Takvim görünümü, liste ve yeni randevu oluşturma</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", background: "#f8fafc", borderRadius: "0.75rem", padding: "0.3rem" }}>
            {subTabs.map(t => (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                style={{ padding: "0.45rem 0.9rem", borderRadius: "0.5rem", border: "none", background: subTab === t.id ? "#fff" : "transparent", color: subTab === t.id ? "#0ea5e9" : "#64748b", fontWeight: subTab === t.id ? 700 : 500, fontSize: "0.82rem", cursor: "pointer", boxShadow: subTab === t.id ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .15s", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subTab === "calendar" && (
        <WeeklyCalendar clients={clients} onComplete={onComplete} onCancel={onCancel} toast={toast} />
      )}
      {subTab === "list" && (
        <AppointmentList clients={clients} appointments={localAppts} apptLoading={apptLoading} onComplete={onComplete} onCancel={onCancel} onDelete={onDelete} toast={toast} />
      )}
      {subTab === "new" && (
        <DirectAppointmentForm clients={clients} onCreated={onCreated} toast={toast} />
      )}
    </div>
  );
}