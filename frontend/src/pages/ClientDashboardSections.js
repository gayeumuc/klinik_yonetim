/**
 * ClientDashboard — Sekme İçerikleri
 * Randevular, Görevler, Testler, Seans Notları bileşenleri
 */
import React, { useState } from "react";
import {
  SkeletonList,
  EmptyState, HoverCard, Badge, Countdown, ProgressBar,
} from "../components/UIComponents";

const MOOD_LABELS = { 1: "Çok Kötü 😞", 2: "Kötü 😕", 3: "Orta 😐", 4: "İyi 🙂", 5: "Çok İyi 😊" };

const CS = {
  successBox: { display: "flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#065f46", fontWeight: 600 },
  errorBox:   { display: "flex", alignItems: "center", gap: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#b91c1c" },
  actionBtn:  { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.1rem", borderRadius: "0.625rem", background: "linear-gradient(135deg,#0ea5e9,#10b981)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(14,165,233,.25)", transition: "all 0.15s ease" },
  dangerBtn:  { display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.7rem", borderRadius: "0.5rem", border: "1.5px solid #ef4444", color: "#ef4444", background: "#fff", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", transition: "all 0.15s ease" },
  cancelBtn:  { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#64748b", transition: "all 0.15s ease" },
  tabBtn: (active, color) => ({
    padding: "0.35rem 0.85rem", borderRadius: "9999px", border: "1.5px solid",
    borderColor: active ? color : "#e2e8f0",
    background: active ? color + "20" : "#fff",
    color: active ? color : "#64748b",
    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s ease",
  }),
  sectionHeader: (color) => ({
    background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9",
    padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: `4px solid ${color}`,
  }),
  card: {
    background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9",
    padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.06)",
    transition: "box-shadow 0.2s ease, transform 0.15s ease",
  },
};

function MsgBox({ msg }) {
  if (!msg) return null;
  const ok = msg.startsWith("success:");
  return (
    <div className="ui-fade-in" style={ok ? CS.successBox : CS.errorBox}>
      {ok ? "✅" : "⚠️"} {msg.replace(/^(success:|error:)/, "")}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   RANDEVULAR
══════════════════════════════════════════════════════════════════════════════ */
export function AppointmentsSection({
  myAppts, availAppts, apptLoading, apptMsg,
  onBook, onCancel, onConfirm, onReject, onDelete,
}) {
  const [apptTab, setApptTab] = useState("pending");
  const [bookingId, setBookingId] = useState(null);
  const [bookNote, setBookNote] = useState("");
  const [bookSaving, setBookSaving] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSaving, setRejectSaving] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);

  const now = new Date();
  const pendingAppts  = myAppts.filter(a => a.status === "pending");
  const upcomingAppts = myAppts.filter(a => a.status === "booked" && new Date(a.start_time) >= now);
  const pastAppts     = myAppts.filter(a =>
    a.status === "completed" || a.status === "cancelled" || a.status === "rejected" ||
    (a.status === "booked" && new Date(a.start_time) < now)
  );

  const tabs = [
    { id: "pending",  label: "Onay Bekleyen",  count: pendingAppts.length,  color: "#f59e0b" },
    { id: "upcoming", label: "Yaklaşan",        count: upcomingAppts.length, color: "#0ea5e9" },
    { id: "book",     label: "Rezervasyon Yap", count: availAppts.length,    color: "#10b981" },
    { id: "past",     label: "Geçmiş",          count: pastAppts.length,     color: "#94a3b8" },
  ];

  const accentColor = tabs.find(t => t.id === apptTab)?.color || "#0ea5e9";

  const handleBook = async (id) => {
    setBookSaving(true);
    await onBook(id, bookNote);
    setBookSaving(false);
    setBookingId(null);
    setBookNote("");
  };

  const handleReject = async (id) => {
    setRejectSaving(true);
    await onReject(id, rejectReason);
    setRejectSaving(false);
    setRejectId(null);
    setRejectReason("");
  };

  const handleCancel = async (id) => {
    setCancelSaving(true);
    await onCancel(id, cancelReason);
    setCancelSaving(false);
    setCancelId(null);
    setCancelReason("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={CS.sectionHeader(accentColor)}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#e0f2fe", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>📅</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Randevularım</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Randevularınızı görüntüleyin, onaylayın veya reddedin</p>
          </div>
          {pendingAppts.length > 0 && (
            <Badge variant="yellow">⏳ {pendingAppts.length} onay bekliyor</Badge>
          )}
          {upcomingAppts.length > 0 && pendingAppts.length === 0 && (
            <Badge variant="cyan">📅 {upcomingAppts.length} yaklaşan</Badge>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setApptTab(tab.id)} style={CS.tabBtn(apptTab === tab.id, tab.color)}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: apptTab === tab.id ? tab.color : "#e2e8f0",
                  color: apptTab === tab.id ? "#fff" : "#64748b",
                  borderRadius: "9999px", padding: "0 0.4rem",
                  fontSize: "0.68rem", marginLeft: "0.3rem",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <MsgBox msg={apptMsg} />

      {apptLoading ? (
        <SkeletonList count={3} lines={2} />
      ) : (
        <div className="ui-fade-in">

          {/* ONAY BEKLEYENLEr */}
          {apptTab === "pending" && (
            pendingAppts.length === 0 ? (
              <EmptyState
                preset="appointments"
                title="Onay bekleyen randevu yok"
                desc="Psikologunuz size randevu atadığında burada görünecek."
                emoji="⏳"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ fontSize: "0.82rem", color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "0.625rem", padding: "0.65rem 1rem" }}>
                  ⚠️ Aşağıdaki randevular psikologunuz tarafından atandı. Lütfen onaylayın veya reddedin.
                </div>
                {pendingAppts.map(a => (
                  <HoverCard key={a.id} style={{ ...CS.card, borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                          📅 {new Date(a.start_time).toLocaleString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>⏱ {a.duration_minutes} dakika</span>
                          <Countdown targetDate={a.start_time} />
                        </div>
                        {a.notes && (
                          <div style={{ fontSize: "0.78rem", color: "#92400e", marginTop: "0.4rem", fontStyle: "italic", background: "#fef9c3", padding: "0.3rem 0.6rem", borderRadius: "0.4rem" }}>
                            📝 "{a.notes}"
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end", flexShrink: 0 }}>
                        <Badge variant="yellow">⏳ Onay Bekliyor</Badge>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            onClick={() => onConfirm(a.id)}
                            style={{ ...CS.actionBtn, background: "linear-gradient(135deg,#10b981,#059669)", fontSize: "0.78rem", padding: "0.35rem 0.85rem" }}
                            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
                          >
                            ✅ Onayla
                          </button>
                          <button
                            onClick={() => setRejectId(rejectId === a.id ? null : a.id)}
                            style={{ ...CS.dangerBtn, fontSize: "0.78rem", padding: "0.35rem 0.85rem" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                          >
                            ✕ Reddet
                          </button>
                        </div>
                      </div>
                    </div>

                    {rejectId === a.id && (
                      <div className="ui-fade-in" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                          Red Nedeni (opsiyonel)
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={2}
                          placeholder="Neden reddettiğinizi belirtebilirsiniz..."
                          style={{ width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #fecaca", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", marginBottom: "0.75rem", outline: "none" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button onClick={() => { setRejectId(null); setRejectReason(""); }} style={CS.cancelBtn}>Vazgeç</button>
                          <button
                            onClick={() => handleReject(a.id)}
                            disabled={rejectSaving}
                            style={{ ...CS.dangerBtn, opacity: rejectSaving ? 0.7 : 1, padding: "0.45rem 1rem" }}
                          >
                            {rejectSaving ? "Gönderiliyor..." : "✕ Reddet"}
                          </button>
                        </div>
                      </div>
                    )}
                  </HoverCard>
                ))}
              </div>
            )
          )}

          {/* YAKLAŞAN */}
          {apptTab === "upcoming" && (
            upcomingAppts.length === 0 ? (
              <EmptyState
                preset="appointments"
                action={() => setApptTab("book")}
                actionLabel="Rezervasyon Yap →"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {upcomingAppts.map(a => (
                  <HoverCard key={a.id} style={{ ...CS.card, borderLeft: "4px solid #0ea5e9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                          📅 {new Date(a.start_time).toLocaleString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>⏱ {a.duration_minutes} dakika</span>
                          <Countdown targetDate={a.start_time} />
                        </div>
                        {a.notes && <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.35rem", fontStyle: "italic" }}>"{a.notes}"</div>}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginLeft: "1rem" }}>
                        <Badge variant="blue">✓ Onaylandı</Badge>
                        <button
                          onClick={() => setCancelId(cancelId === a.id ? null : a.id)}
                          style={CS.dangerBtn}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                        >
                          ✕ İptal
                        </button>
                      </div>
                    </div>

                    {cancelId === a.id && (
                      <div className="ui-fade-in" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                          İptal Nedeni (opsiyonel)
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          rows={2}
                          placeholder="İptal nedeninizi belirtebilirsiniz..."
                          style={{ width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #fecaca", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", marginBottom: "0.75rem", outline: "none" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button onClick={() => { setCancelId(null); setCancelReason(""); }} style={CS.cancelBtn}>Vazgeç</button>
                          <button
                            onClick={() => handleCancel(a.id)}
                            disabled={cancelSaving}
                            style={{ ...CS.dangerBtn, opacity: cancelSaving ? 0.7 : 1, padding: "0.45rem 1rem" }}
                          >
                            {cancelSaving ? "İptal ediliyor..." : "✕ İptal Et"}
                          </button>
                        </div>
                      </div>
                    )}
                  </HoverCard>
                ))}
              </div>
            )
          )}

          {/* REZERVASYON YAP */}
          {apptTab === "book" && (
            availAppts.length === 0 ? (
              <EmptyState
                preset="appointments"
                title="Müsait slot yok"
                desc="Psikologunuz yeni slotlar eklediğinde burada görünecek."
                emoji="🗓️"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ fontSize: "0.82rem", color: "#64748b", padding: "0.25rem 0" }}>
                  {availAppts.length} müsait slot bulundu
                </div>
                {availAppts.map(a => (
                  <HoverCard key={a.id} style={{ ...CS.card, borderLeft: "4px solid #10b981" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                          🟢 {new Date(a.start_time).toLocaleString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>⏱ {a.duration_minutes} dakika</span>
                          <Countdown targetDate={a.start_time} />
                        </div>
                      </div>
                      <button
                        onClick={() => setBookingId(bookingId === a.id ? null : a.id)}
                        style={CS.actionBtn}
                        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
                      >
                        {bookingId === a.id ? "✕ Vazgeç" : "📅 Rezerve Et"}
                      </button>
                    </div>
                    {bookingId === a.id && (
                      <div className="ui-fade-in" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Not (opsiyonel)</label>
                        <textarea
                          value={bookNote}
                          onChange={e => setBookNote(e.target.value)}
                          rows={2}
                          placeholder="Randevu için not ekleyin..."
                          style={{ width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", marginBottom: "0.75rem", outline: "none", transition: "border-color 0.15s" }}
                          onFocus={e => { e.target.style.borderColor = "#0ea5e9"; }}
                          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button onClick={() => { setBookingId(null); setBookNote(""); }} style={CS.cancelBtn}>İptal</button>
                          <button
                            onClick={() => handleBook(a.id)}
                            disabled={bookSaving}
                            style={{ ...CS.actionBtn, opacity: bookSaving ? 0.7 : 1 }}
                          >
                            {bookSaving ? <><span className="spinner" style={{ width: "0.9rem", height: "0.9rem", borderTopColor: "#fff" }} /> Rezerve ediliyor...</> : "✅ Onayla"}
                          </button>
                        </div>
                      </div>
                    )}
                  </HoverCard>
                ))}
              </div>
            )
          )}

          {/* GEÇMİŞ */}
          {apptTab === "past" && (
            pastAppts.length === 0 ? (
              <EmptyState
                preset="appointments"
                title="Geçmiş randevu yok"
                desc="Tamamlanan, iptal edilen veya reddedilen randevular burada görünecek."
                emoji="📋"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {pastAppts.map(a => {
                  const isRejected  = a.status === "rejected";
                  const isCancelled = a.status === "cancelled";
                  const isCompleted = a.status === "completed";
                  const borderColor = isCompleted ? "#10b981" : isCancelled ? "#ef4444" : isRejected ? "#f59e0b" : "#94a3b8";
                  return (
                    <HoverCard key={a.id} style={{ ...CS.card, borderLeft: `4px solid ${borderColor}`, opacity: 0.9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem", marginBottom: "0.2rem" }}>
                            {new Date(a.start_time).toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Süre: {a.duration_minutes} dk</div>
                          {a.cancellation_reason && (
                            <div style={{ fontSize: "0.75rem", color: "#92400e", marginTop: "0.35rem", background: "#fef3c7", padding: "0.3rem 0.6rem", borderRadius: "0.4rem" }}>
                              💬 {a.cancellation_reason}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                          <Badge variant={isCompleted ? "green" : isCancelled ? "red" : isRejected ? "yellow" : "gray"}>
                            {isCompleted ? "✓ Tamamlandı" : isCancelled ? "✕ İptal" : isRejected ? "✕ Reddedildi" : a.status_display || a.status}
                          </Badge>
                          {(isCancelled || isRejected) && onDelete && (
                            <button
                              onClick={() => onDelete(a.id)}
                              style={{ fontSize: "0.7rem", color: "#94a3b8", background: "none", border: "1px solid #e2e8f0", borderRadius: "0.375rem", padding: "0.2rem 0.5rem", cursor: "pointer", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                            >
                              🗑️ Sil
                            </button>
                          )}
                        </div>
                      </div>
                    </HoverCard>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   GÖREVLER
══════════════════════════════════════════════════════════════════════════════ */
export function TasksSection({ myTasks, tasksLoading, tasksMsg, onComplete }) {
  const [taskFilter, setTaskFilter] = useState("all");
  const [completingId, setCompletingId] = useState(null);
  const [completeNote, setCompleteNote] = useState("");
  const [completeSaving, setCompleteSaving] = useState(false);

  const filtered = myTasks.filter(t =>
    taskFilter === "all" ? true : taskFilter === "pending" ? !t.is_completed : t.is_completed
  );

  const completedCount = myTasks.filter(t => t.is_completed).length;
  const totalCount = myTasks.length;

  const handleComplete = async (id) => {
    setCompleteSaving(true);
    await onComplete(id, completeNote);
    setCompleteSaving(false);
    setCompletingId(null);
    setCompleteNote("");
  };

  const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#94a3b8" };
  const PRIORITY_BADGE = { high: "red", medium: "yellow", low: "gray" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={CS.sectionHeader("#10b981")}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#d1fae5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>📝</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Görevlerim</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Psikologunuzun atadığı ödevleri takip edin</p>
          </div>
        </div>
        {totalCount > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <ProgressBar value={completedCount} max={totalCount} color="#10b981" label={`${completedCount}/${totalCount} tamamlandı`} />
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[{ id: "all", label: "Tümü" }, { id: "pending", label: "Bekleyen" }, { id: "completed", label: "Tamamlanan" }].map(f => (
            <button key={f.id} onClick={() => setTaskFilter(f.id)} style={CS.tabBtn(taskFilter === f.id, "#10b981")}>{f.label}</button>
          ))}
        </div>
      </div>

      <MsgBox msg={tasksMsg} />

      {tasksLoading ? (
        <SkeletonList count={3} lines={3} />
      ) : filtered.length === 0 ? (
        <EmptyState preset="tasks" />
      ) : (
        <div className="ui-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map(t => (
            <HoverCard key={t.id} style={{ ...CS.card, borderLeft: `4px solid ${t.is_completed ? "#10b981" : PRIORITY_COLOR[t.priority] || "#94a3b8"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: t.is_completed ? "#94a3b8" : "#1e293b", textDecoration: t.is_completed ? "line-through" : "none", fontSize: "0.9rem" }}>
                      {t.is_completed ? "✓ " : ""}{t.title}
                    </span>
                    <Badge variant={PRIORITY_BADGE[t.priority] || "gray"}>{t.priority_display || t.priority}</Badge>
                    {t.is_completed && <Badge variant="green">Tamamlandı</Badge>}
                  </div>
                  {t.due_date && (
                    <div style={{ fontSize: "0.78rem", color: new Date(t.due_date) < new Date() && !t.is_completed ? "#ef4444" : "#94a3b8" }}>
                      {new Date(t.due_date) < new Date() && !t.is_completed ? "⚠️ Gecikmiş: " : "📅 Son tarih: "}{t.due_date}
                    </div>
                  )}
                  {t.description && <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem", lineHeight: 1.5 }}>{t.description}</p>}
                  {t.is_completed && t.completion_note && (
                    <p style={{ fontSize: "0.78rem", color: "#10b981", marginTop: "0.4rem", fontStyle: "italic", background: "#f0fdf4", padding: "0.4rem 0.65rem", borderRadius: "0.5rem" }}>
                      💬 Notunuz: {t.completion_note}
                    </p>
                  )}
                </div>
                {!t.is_completed && (
                  <button
                    onClick={() => setCompletingId(completingId === t.id ? null : t.id)}
                    style={{ ...CS.actionBtn, marginLeft: "1rem", fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                    onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
                  >
                    {completingId === t.id ? "✕ Vazgeç" : "✓ Tamamla"}
                  </button>
                )}
              </div>
              {completingId === t.id && (
                <div className="ui-fade-in" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Tamamlama Notu (opsiyonel)</label>
                  <textarea
                    value={completeNote}
                    onChange={e => setCompleteNote(e.target.value)}
                    rows={2}
                    placeholder="Bu görevi nasıl tamamladığınızı yazın..."
                    style={{ width: "100%", padding: "0.6rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", marginBottom: "0.75rem", outline: "none", transition: "border-color 0.15s" }}
                    onFocus={e => { e.target.style.borderColor = "#10b981"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button onClick={() => { setCompletingId(null); setCompleteNote(""); }} style={CS.cancelBtn}>İptal</button>
                    <button
                      onClick={() => handleComplete(t.id)}
                      disabled={completeSaving}
                      style={{ ...CS.actionBtn, background: "linear-gradient(135deg,#10b981,#059669)", opacity: completeSaving ? 0.7 : 1 }}
                    >
                      {completeSaving ? <><span className="spinner" style={{ width: "0.9rem", height: "0.9rem", borderTopColor: "#fff" }} /> Kaydediliyor...</> : "✅ Tamamlandı Olarak İşaretle"}
                    </button>
                  </div>
                </div>
              )}
            </HoverCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TESTLER
══════════════════════════════════════════════════════════════════════════════ */
export function TestsSection({ myAssignments, assignsLoading, testsMsg, onStartTest, onSubmitTest, activeAssignment, setActiveAssignment, answers, setAnswers, submitSaving }) {
  const [testFilter, setTestFilter] = useState("all");

  const filtered = myAssignments.filter(a =>
    testFilter === "all" ? true : testFilter === "pending" ? a.status === "pending" : a.status === "completed"
  );

  const pendingCount = myAssignments.filter(a => a.status === "pending").length;
  // handleStartTest'te data.test = test_detail (sorularla birlikte) olarak set edilir.
  // test_detail fallback olarak da kontrol edilir.
  const activeTest = activeAssignment?.test_detail || activeAssignment?.test || {};
  const questions = Array.isArray(activeTest?.questions) ? activeTest.questions : [];
  const answeredCount = Object.keys(answers).length;

  if (activeAssignment) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={CS.sectionHeader("#8b5cf6")}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#ede9fe", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>🧪</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{activeTest?.title || activeAssignment.test_title || "Test"}</h2>
              {activeTest?.description && <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.25rem" }}>{activeTest.description}</p>}
            </div>
            <button onClick={() => setActiveAssignment(null)} style={CS.cancelBtn}>✕ Geri</button>
          </div>
          {questions.length > 0 && (
            <ProgressBar value={answeredCount} max={questions.length} color="#8b5cf6" label={`${answeredCount}/${questions.length} soru cevaplandı`} />
          )}
        </div>

        <MsgBox msg={testsMsg} />

        {questions.map((q, idx) => (
          <div key={q.id} className="ui-fade-in" style={{ ...CS.card, borderLeft: answers[q.id] !== undefined ? "4px solid #8b5cf6" : "4px solid #e2e8f0" }}>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: answers[q.id] !== undefined ? "#8b5cf6" : "#ede9fe", color: answers[q.id] !== undefined ? "#fff" : "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0, transition: "all 0.2s" }}>{idx + 1}</span>
              <p style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: 600, lineHeight: 1.5 }}>{q.question_text}</p>
            </div>

            {q.question_type === "likert" && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                    style={{
                      flex: 1, minWidth: "60px", padding: "0.6rem 0.5rem",
                      borderRadius: "0.625rem", border: "2px solid",
                      borderColor: answers[q.id] === v ? "#8b5cf6" : "#e2e8f0",
                      background: answers[q.id] === v ? "#8b5cf6" : "#fff",
                      color: answers[q.id] === v ? "#fff" : "#64748b",
                      fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                      textAlign: "center", transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { if (answers[q.id] !== v) { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.background = "#f5f3ff"; } }}
                    onMouseLeave={e => { if (answers[q.id] !== v) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; } }}
                  >
                    {v}<br /><span style={{ fontSize: "0.65rem", fontWeight: 500 }}>{["Hiç", "Az", "Orta", "Çok", "Tam"][v - 1]}</span>
                  </button>
                ))}
              </div>
            )}

            {q.question_type === "multiple" && Array.isArray(q.options) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi + 1 }))}
                    style={{
                      padding: "0.65rem 1rem", borderRadius: "0.625rem", border: "2px solid",
                      borderColor: answers[q.id] === oi + 1 ? "#8b5cf6" : "#e2e8f0",
                      background: answers[q.id] === oi + 1 ? "#8b5cf6" : "#fff",
                      color: answers[q.id] === oi + 1 ? "#fff" : "#475569",
                      fontWeight: answers[q.id] === oi + 1 ? 700 : 500,
                      fontSize: "0.875rem", cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { if (answers[q.id] !== oi + 1) { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.background = "#f5f3ff"; } }}
                    onMouseLeave={e => { if (answers[q.id] !== oi + 1) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; } }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.question_type === "text" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                rows={3}
                placeholder="Cevabınızı yazın..."
                style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", outline: "none", transition: "border-color 0.15s" }}
                onFocus={e => { e.target.style.borderColor = "#8b5cf6"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
              />
            )}
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>{answeredCount}/{questions.length} soru cevaplandı</span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => setActiveAssignment(null)} style={CS.cancelBtn}>Vazgeç</button>
            <button
              onClick={onSubmitTest}
              disabled={submitSaving}
              style={{ ...CS.actionBtn, background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", padding: "0.65rem 1.5rem", fontSize: "0.9rem", opacity: submitSaving ? 0.7 : 1 }}
              onMouseEnter={e => { if (!submitSaving) { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
            >
              {submitSaving ? <><span className="spinner" style={{ width: "0.9rem", height: "0.9rem", borderTopColor: "#fff" }} /> Gönderiliyor...</> : "📤 Testi Gönder"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={CS.sectionHeader("#8b5cf6")}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#ede9fe", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>🧪</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Psikolojik Testlerim</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Psikologunuzun atadığı testleri çözün</p>
          </div>
          {pendingCount > 0 && <Badge variant="purple">🧪 {pendingCount} bekleyen</Badge>}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[{ id: "all", label: "Tümü" }, { id: "pending", label: "Bekleyen" }, { id: "completed", label: "Tamamlanan" }].map(f => (
            <button key={f.id} onClick={() => setTestFilter(f.id)} style={CS.tabBtn(testFilter === f.id, "#8b5cf6")}>{f.label}</button>
          ))}
        </div>
      </div>

      <MsgBox msg={testsMsg} />

      {assignsLoading ? (
        <SkeletonList count={3} lines={2} />
      ) : filtered.length === 0 ? (
        <EmptyState preset="tests" />
      ) : (
        <div className="ui-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map(a => (
            <HoverCard key={a.id} style={{ ...CS.card, borderLeft: `4px solid ${{ pending: "#8b5cf6", completed: "#10b981", expired: "#ef4444" }[a.status] || "#e2e8f0"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem", marginBottom: "0.35rem" }}>{a.test_title || a.test_detail?.title || a.test?.title || "—"}</div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    {a.due_date && <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>📅 Son: {a.due_date}</span>}
                    {a.status === "pending" && a.due_date && <Countdown targetDate={a.due_date + "T23:59:59"} />}
                  </div>
                  {a.status === "completed" && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.82rem", color: "#475569" }}>Puanınız:</span>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#8b5cf6" }}>{a.total_score ?? "—"}</span>
                      </div>
                      {a.psychologist_comment && (
                        <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "0.625rem", padding: "0.6rem 0.85rem" }}>
                          <p style={{ fontSize: "0.78rem", color: "#5b21b6", fontWeight: 600, marginBottom: "0.2rem" }}>💬 Psikolog Yorumu</p>
                          <p style={{ fontSize: "0.82rem", color: "#475569", fontStyle: "italic" }}>{a.psychologist_comment}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", marginLeft: "1rem" }}>
                  <Badge variant={{ pending: "purple", completed: "green", expired: "red" }[a.status] || "gray"}>
                    {{ pending: "⏳ Bekliyor", completed: "✓ Tamamlandı", expired: "⚠️ Süresi Doldu" }[a.status]}
                  </Badge>
                  {a.status === "pending" && (
                    <button
                      onClick={() => onStartTest(a)}
                      style={{ ...CS.actionBtn, background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", fontSize: "0.78rem", padding: "0.35rem 0.85rem" }}
                      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
                    >
                      ▶ Testi Başlat
                    </button>
                  )}
                </div>
              </div>
            </HoverCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SEANS NOTLARI
══════════════════════════════════════════════════════════════════════════════ */
export function SessionNotesSection({ myNotes, notesLoading, notesMsg }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={CS.sectionHeader("#f59e0b")}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: "1rem", background: "#fef3c7", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>📖</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Seans Notları</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Psikologunuzun sizinle paylaştığı notlar</p>
          </div>
          {myNotes.length > 0 && <Badge variant="yellow">{myNotes.length} not</Badge>}
        </div>
      </div>

      <MsgBox msg={notesMsg} />

      {notesLoading ? (
        <SkeletonList count={3} lines={3} />
      ) : myNotes.length === 0 ? (
        <EmptyState preset="notes" />
      ) : (
        <div className="ui-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {myNotes.map(n => (
            <HoverCard key={n.id} style={{ ...CS.card, borderLeft: "4px solid #f59e0b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem", marginBottom: "0.3rem" }}>
                    {new Date(n.session_date).toLocaleDateString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                  {n.mood_score && (
                    <Badge variant="yellow">{MOOD_LABELS[n.mood_score] || `Duygu: ${n.mood_score}`}</Badge>
                  )}
                </div>
                <Badge variant="green">✓ Paylaşıldı</Badge>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{n.content}</p>
            </HoverCard>
          ))}
        </div>
      )}
    </div>
  );
}