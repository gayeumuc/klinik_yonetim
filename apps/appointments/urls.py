"""
Psikolog Klinik Yönetim Sistemi — Randevu URL Yapılandırması

Tüm endpoint'ler /api/appointments/ prefix'i ile erişilir.

Psikolog:
    GET    /api/appointments/                          → Kendi tüm randevuları (filtreli)
    POST   /api/appointments/slots/                    → Yeni müsait slot oluştur
    GET    /api/appointments/<id>/                     → Randevu detayı (notlarla)
    PATCH  /api/appointments/<id>/                     → Slot güncelle (yalnızca available)
    DELETE /api/appointments/<id>/                     → Slot sil (yalnızca available)
    POST   /api/appointments/<id>/complete/            → Tamamlandı işaretle
    GET    /api/appointments/<id>/notes/               → Randevunun notları
    POST   /api/appointments/<id>/notes/               → Randevuya not ekle
    PATCH  /api/appointments/notes/<note_id>/          → Notu güncelle
    DELETE /api/appointments/notes/<note_id>/          → Notu sil
    GET    /api/appointments/client/<client_id>/history/ → Danışan randevu geçmişi

Danışan:
    GET    /api/appointments/available/    → Müsait slotları gör
    GET    /api/appointments/my/           → Kendi randevuları
    POST   /api/appointments/<id>/book/    → Rezervasyon yap

Ortak:
    POST   /api/appointments/<id>/cancel/  → İptal et (psikolog veya danışan)
"""
from django.urls import path
from . import views

urlpatterns = [
    # ── Psikolog: Slot yönetimi ───────────────────────────────────────────────
    path(
        "",
        views.PsychologistAppointmentListView.as_view(),
        name="appointment-list",
    ),
    path(
        "slots/",
        views.SlotCreateView.as_view(),
        name="appointment-slot-create",
    ),

    # ── Psikolog: Direkt randevu oluştur (danışan seçerek) ────────────────────
    path(
        "direct/",
        views.DirectAppointmentView.as_view(),
        name="appointment-direct",
    ),

    # ── Psikolog: Haftalık takvim ─────────────────────────────────────────────
    path(
        "calendar/",
        views.WeeklyCalendarView.as_view(),
        name="appointment-calendar",
    ),

    # ── Danışan: Müsait slotlar ve kendi randevuları ──────────────────────────
    path(
        "available/",
        views.AvailableSlotsView.as_view(),
        name="appointment-available",
    ),
    path(
        "my/",
        views.ClientAppointmentListView.as_view(),
        name="appointment-my",
    ),

    # ── Not yönetimi (note_id bazlı) ──────────────────────────────────────────
    path(
        "notes/<int:note_id>/",
        views.AppointmentNoteDetailView.as_view(),
        name="appointment-note-detail",
    ),

    # ── Danışan randevu geçmişi ───────────────────────────────────────────────
    path(
        "client/<int:client_id>/history/",
        views.ClientAppointmentHistoryView.as_view(),
        name="appointment-client-history",
    ),

    # ── Detay ve işlemler ─────────────────────────────────────────────────────
    path(
        "<int:pk>/",
        views.AppointmentDetailView.as_view(),
        name="appointment-detail",
    ),
    path(
        "<int:pk>/book/",
        views.BookAppointmentView.as_view(),
        name="appointment-book",
    ),
    path(
        "<int:pk>/confirm/",
        views.ConfirmAppointmentView.as_view(),
        name="appointment-confirm",
    ),
    path(
        "<int:pk>/reject/",
        views.RejectAppointmentView.as_view(),
        name="appointment-reject",
    ),
    path(
        "<int:pk>/cancel/",
        views.CancelAppointmentView.as_view(),
        name="appointment-cancel",
    ),
    path(
        "<int:pk>/complete/",
        views.AppointmentCompleteView.as_view(),
        name="appointment-complete",
    ),
    path(
        "<int:pk>/notes/",
        views.AppointmentNoteListCreateView.as_view(),
        name="appointment-notes",
    ),
]