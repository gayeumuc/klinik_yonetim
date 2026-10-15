"""
Psikolog Klinik Yönetim Sistemi — accounts URL Yapılandırması

Tüm endpoint'ler /api/ prefix'i ile erişilir (config/urls.py'de tanımlı).

Kimlik Doğrulama:
    POST   /api/auth/register/               → Yeni kullanıcı kaydı
    POST   /api/auth/login/                  → JWT token al (access + refresh)
    POST   /api/auth/token/refresh/          → Access token yenile
    POST   /api/auth/logout/                 → Refresh token'ı geçersiz kıl
    GET    /api/auth/me/                     → Giriş yapan kullanıcı bilgileri
    PATCH  /api/auth/me/                     → E-posta güncelle
    POST   /api/auth/change-password/        → Şifre değiştir
    POST   /api/auth/password-reset/         → Şifre sıfırlama isteği (e-posta gönder)
    POST   /api/auth/password-reset/confirm/ → Şifre sıfırlama onayı (token + yeni şifre)
    POST   /api/auth/invite/confirm/         → Danışan davet onayı (kendi şifresini belirler)

Psikolog Profili:
    GET    /api/profiles/psychologists/public/  → Herkese açık profil listesi
    GET    /api/profiles/psychologist/          → Psikolog kendi profilini görür
    PATCH  /api/profiles/psychologist/          → Psikolog kendi profilini günceller

Çalışma Saatleri:
    GET    /api/profiles/working-hours/         → Psikolog çalışma saatlerini görür
    POST   /api/profiles/working-hours/         → Psikolog çalışma saati ekler
    PATCH  /api/profiles/working-hours/{id}/    → Çalışma saati günceller
    DELETE /api/profiles/working-hours/{id}/    → Çalışma saati siler
    POST   /api/profiles/working-hours/bulk/    → Tüm saatleri toplu günceller

Danışan Profili:
    GET    /api/profiles/clients/                      → Psikolog danışan listesi (aktif)
    POST   /api/profiles/clients/                      → Psikolog yeni danışan oluşturur
    GET    /api/profiles/clients/all/                  → Psikolog tüm danışanları görür (aktif+pasif)
    GET    /api/profiles/clients/export/               → Danışan listesini CSV olarak indir
    GET    /api/profiles/clients/<int:pk>/             → Danışan detayı
    PATCH  /api/profiles/clients/<int:pk>/             → Danışan güncelle
    DELETE /api/profiles/clients/<int:pk>/             → Danışan soft-delete (pasife al)
    POST   /api/profiles/clients/<int:pk>/activate/    → Danışanı tekrar aktif yap
    DELETE /api/profiles/clients/<int:pk>/hard-delete/ → Danışan kalıcı silme
    POST   /api/profiles/clients/<int:pk>/reset-password/ → Danışan şifre sıfırla
    POST   /api/profiles/clients/<int:pk>/invite/      → Danışana davet e-postası gönder
    GET    /api/profiles/my-profile/                   → Danışan kendi profilini görür
    PATCH  /api/profiles/my-profile/                   → Danışan kendi profilini günceller
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    # ── Kimlik Doğrulama ──────────────────────────────────────────────────────
    path(
        "auth/register/",
        views.RegisterView.as_view(),
        name="auth-register"
    ),
    path(
        "auth/login/",
        TokenObtainPairView.as_view(),
        name="auth-login"
    ),
    path(
        "auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="auth-token-refresh"
    ),
    path(
        "auth/logout/",
        views.LogoutView.as_view(),
        name="auth-logout"
    ),
    path(
        "auth/me/",
        views.MeView.as_view(),
        name="auth-me"
    ),
    path(
        "auth/change-password/",
        views.ChangePasswordView.as_view(),
        name="auth-change-password"
    ),
    # FR-05: Şifre sıfırlama (e-posta tabanlı)
    path(
        "auth/password-reset/",
        views.PasswordResetRequestView.as_view(),
        name="auth-password-reset"
    ),
    path(
        "auth/password-reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm"
    ),
    # Danışan davet onayı
    path(
        "auth/invite/confirm/",
        views.ClientInviteConfirmView.as_view(),
        name="auth-invite-confirm"
    ),

    # ── Psikolog Profili ──────────────────────────────────────────────────────
    path(
        "profiles/psychologists/public/",
        views.PublicPsychologistListView.as_view(),
        name="psychologist-public-list"
    ),
    path(
        "profiles/psychologist/",
        views.PsychologistProfileView.as_view(),
        name="psychologist-profile"
    ),

    # ── Çalışma Saatleri ──────────────────────────────────────────────────────
    path(
        "profiles/working-hours/",
        views.WorkingHoursListCreateView.as_view(),
        name="working-hours-list"
    ),
    path(
        "profiles/working-hours/bulk/",
        views.WorkingHoursBulkUpdateView.as_view(),
        name="working-hours-bulk"
    ),
    path(
        "profiles/working-hours/<int:pk>/",
        views.WorkingHoursDetailView.as_view(),
        name="working-hours-detail"
    ),

    # ── Danışan Profili ───────────────────────────────────────────────────────
    path(
        "profiles/clients/",
        views.ClientProfileListCreateView.as_view(),
        name="client-list-create"
    ),
    path(
        "profiles/clients/all/",
        views.ClientProfileAllListView.as_view(),
        name="client-list-all"
    ),
    path(
        "profiles/clients/export/",
        views.ClientExportCSVView.as_view(),
        name="client-export-csv"
    ),
    path(
        "profiles/clients/<int:pk>/",
        views.ClientProfileDetailView.as_view(),
        name="client-detail"
    ),
    path(
        "profiles/clients/<int:pk>/activate/",
        views.ClientProfileActivateView.as_view(),
        name="client-activate"
    ),
    path(
        "profiles/clients/<int:pk>/hard-delete/",
        views.ClientProfileHardDeleteView.as_view(),
        name="client-hard-delete"
    ),
    path(
        "profiles/clients/<int:pk>/reset-password/",
        views.ClientPasswordResetByPsychologistView.as_view(),
        name="client-reset-password"
    ),
    path(
        "profiles/clients/<int:pk>/invite/",
        views.ClientInviteView.as_view(),
        name="client-invite"
    ),
    path(
        "profiles/my-profile/",
        views.MyClientProfileView.as_view(),
        name="client-my-profile"
    ),
]