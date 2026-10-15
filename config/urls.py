"""
Psikolog Klinik Yönetim Sistemi — Ana URL Yapılandırması
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # ── Admin Paneli (Jazzmin temalı) ─────────────────────────────────────────
    path("admin/", admin.site.urls),

    # ── API Endpoint'leri ──────────────────────────────────────────────────────
    path("api/", include("apps.accounts.urls")),
    path("api/messages/", include("apps.messaging.urls")),
    path("api/appointments/", include("apps.appointments.urls")),
    path("api/clinical/", include("apps.clinical.urls")),

    # ── API Dokümantasyonu (drf-spectacular) ───────────────────────────────────
    path("api/schema/",          SpectacularAPIView.as_view(),        name="schema"),
    path("api/docs/",            SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/",           SpectacularRedocView.as_view(url_name="schema"),   name="redoc"),
]

# Geliştirme ortamında medya dosyalarını sun
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)