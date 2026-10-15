"""
Mesajlaşma Modülü — URL Yapılandırması

Tüm endpoint'ler /api/messages/ prefix'i ile erişilir.

    GET  /api/messages/                                  → Konuşma listesi (?show=active|archived)
    GET  /api/messages/unread-count/                     → Okunmamış mesaj sayısı
    GET  /api/messages/stats/                            → Mesaj istatistikleri
    GET  /api/messages/{user_id}/                        → Mesaj geçmişi (?filter=all|starred&q=arama)
    POST /api/messages/{user_id}/send/                   → Mesaj gönder
    POST /api/messages/{user_id}/archive-conversation/   → Konuşmayı arşivle
    POST /api/messages/{user_id}/unarchive-conversation/ → Konuşmayı arşivden çıkar
    POST /api/messages/{msg_id}/star/                    → Mesajı yıldızla
    POST /api/messages/{msg_id}/unstar/                  → Yıldızı kaldır
"""
from django.urls import path
from . import views

urlpatterns = [
    # ── Genel ────────────────────────────────────────────────────────────────
    path(
        "",
        views.ConversationListView.as_view(),
        name="message-conversation-list"
    ),
    path(
        "unread-count/",
        views.UnreadCountView.as_view(),
        name="message-unread-count"
    ),
    path(
        "stats/",
        views.MessageStatsView.as_view(),
        name="message-stats"
    ),

    # ── Tek mesaj işlemleri (msg_id) ─────────────────────────────────────────
    path(
        "<int:msg_id>/star/",
        views.StarMsgView.as_view(),
        name="message-star"
    ),
    path(
        "<int:msg_id>/unstar/",
        views.UnstarMsgView.as_view(),
        name="message-unstar"
    ),

    # ── Konuşma işlemleri (user_id) ──────────────────────────────────────────
    path(
        "<int:user_id>/send/",
        views.SendMessageView.as_view(),
        name="message-send"
    ),
    path(
        "<int:user_id>/archive-conversation/",
        views.ArchiveConversationView.as_view(),
        name="message-archive-conversation"
    ),
    path(
        "<int:user_id>/unarchive-conversation/",
        views.UnarchiveConversationView.as_view(),
        name="message-unarchive-conversation"
    ),
    path(
        "<int:user_id>/",
        views.MessageThreadView.as_view(),
        name="message-thread"
    ),
]