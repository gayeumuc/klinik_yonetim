"""
Psikolog Klinik Yönetim Sistemi — Django Settings
Hassas değerler .env dosyasından okunur (python-decouple).
"""
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Güvenlik ────────────────────────────────────────────────────────────────
SECRET_KEY    = config("SECRET_KEY", default="django-insecure-change-me-in-production")
DEBUG         = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*", cast=Csv())

# ─── Klinik / Firma Bilgileri ─────────────────────────────────────────────────
# Tüm e-posta şablonları ve frontend config bu değerleri kullanır.
# Yeni bir müşteri için sadece .env dosyasını güncelleyin.
CLINIC_NAME            = config("CLINIC_NAME",            default="Klinik Yönetim Sistemi")
CLINIC_SLOGAN          = config("CLINIC_SLOGAN",          default="")
CLINIC_PHONE           = config("CLINIC_PHONE",           default="")
CLINIC_ADDRESS         = config("CLINIC_ADDRESS",         default="")
CLINIC_CONTACT_EMAIL   = config("CLINIC_CONTACT_EMAIL",   default="")
PSYCHOLOGIST_NAME      = config("PSYCHOLOGIST_NAME",      default="")
PSYCHOLOGIST_TITLE     = config("PSYCHOLOGIST_TITLE",     default="")
PSYCHOLOGIST_LICENSE   = config("PSYCHOLOGIST_LICENSE",   default="")

# ─── Frontend URL ─────────────────────────────────────────────────────────────
# E-postalardaki linklerde kullanılır (giriş, davet, şifre sıfırlama).
# Production'da gerçek domain adresini yazın: https://sizin-domain.com
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3001")

# ─── Uygulamalar ─────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    # "jazzmin",                                      # Python 3.14 ile uyumsuz — devre dışı
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # 3. Parti
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",                                # ← Swagger/ReDoc dokümantasyonu
    # Proje uygulamaları
    "apps.accounts",
    "apps.messaging",
    "apps.appointments",
    "apps.clinical",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",          # En üstte olmalı
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ─── Veritabanı ──────────────────────────────────────────────────────────────
# Geliştirme için SQLite (production'da PostgreSQL kullanın)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# PostgreSQL için (production):
# DATABASES = {
#     "default": {
#         "ENGINE": config("DB_ENGINE", default="django.db.backends.postgresql"),
#         "NAME":     config("DB_NAME",     default="klinik_db"),
#         "USER":     config("DB_USER",     default="postgres"),
#         "PASSWORD": config("DB_PASSWORD", default=""),
#         "HOST":     config("DB_HOST",     default="localhost"),
#         "PORT":     config("DB_PORT",     default="5432"),
#     }
# }

# ─── Custom User Modeli ───────────────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.CustomUser"

# ─── Şifre Doğrulama ─────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─── Uluslararasılaştırma ─────────────────────────────────────────────────────
LANGUAGE_CODE = "tr-tr"
TIME_ZONE     = "Europe/Istanbul"
USE_I18N      = True
USE_TZ        = True

# ─── Statik Dosyalar ──────────────────────────────────────────────────────────
STATIC_URL = "/static/"
MEDIA_URL  = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── E-posta (FR-05: Şifre Sıfırlama) ────────────────────────────────────────
# EMAIL_HOST_PASSWORD .env'de dolu ise SMTP kullanılır, boşsa console backend'e geçilir.
_email_password = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")

if _email_password and _email_password.strip():
    # Gerçek SMTP — Gmail uygulama şifresi girilmiş
    EMAIL_BACKEND       = config("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
    EMAIL_HOST          = config("EMAIL_HOST",    default="smtp.gmail.com")
    EMAIL_PORT          = config("EMAIL_PORT",    default=587, cast=int)
    EMAIL_USE_TLS       = config("EMAIL_USE_TLS", default=True, cast=bool)
    EMAIL_HOST_PASSWORD = _email_password
else:
    # Şifre girilmemiş — e-postalar terminale yazılır (geliştirme modu)
    EMAIL_BACKEND       = "django.core.mail.backends.console.EmailBackend"
    EMAIL_HOST          = config("EMAIL_HOST", default="smtp.gmail.com")
    EMAIL_PORT          = config("EMAIL_PORT", default=587, cast=int)
    EMAIL_USE_TLS       = config("EMAIL_USE_TLS", default=True, cast=bool)
    EMAIL_HOST_PASSWORD = ""

DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@klinik.com")

# ─── Django REST Framework ────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",  # ← Swagger şeması
}

# ─── drf-spectacular (Swagger / ReDoc) ───────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "Psikolog Klinik Yönetim Sistemi API",
    "DESCRIPTION": (
        "Web tabanlı klinik yönetim ve terapi süreç takip platformu. "
        "JWT ile kimlik doğrulama, rol tabanlı yetkilendirme (Psikolog / Danışan)."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "CONTACT": {"name": "Klinik Yönetim Ekibi"},
    "TAGS": [
        {"name": "Auth",             "description": "Kimlik doğrulama ve oturum yönetimi"},
        {"name": "Psikolog Profili", "description": "Psikolog profil işlemleri"},
        {"name": "Danışan Profili",  "description": "Danışan profil CRUD işlemleri"},
    ],
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,   # Sayfa yenilenince token kaybolmaz
        "displayOperationId": False,
    },
    "COMPONENT_SPLIT_REQUEST": True,
}

# ─── Jazzmin (Admin Teması) ───────────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    "site_title":   "Klinik Yönetim",
    "site_header":  "Psikolog Klinik Yönetim Sistemi",
    "site_brand":   "KlinikYönetim",
    "welcome_sign": "Klinik Yönetim Sistemine Hoş Geldiniz",
    "copyright":    "Klinik Yönetim Sistemi © 2024",
    "search_model": ["accounts.CustomUser", "accounts.ClientProfile"],
    "topmenu_links": [
        {"name": "Ana Sayfa", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "API Docs",  "url": "/api/docs/",  "new_window": True},
        {"name": "Swagger",   "url": "/api/schema/swagger-ui/", "new_window": True},
    ],
    "usermenu_links": [
        {"name": "API Docs", "url": "/api/docs/", "new_window": True},
    ],
    "show_sidebar":        True,
    "navigation_expanded": True,
    "icons": {
        "auth":                        "fas fa-users-cog",
        "accounts.customuser":         "fas fa-user",
        "accounts.psychologistprofile":"fas fa-user-md",
        "accounts.clientprofile":      "fas fa-user-injured",
    },
    "default_icon_parents":  "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active":  True,
    "custom_css":            None,
    "custom_js":             None,
    "use_google_fonts_cdn":  True,
    "show_ui_builder":       False,
    "changeform_format":     "horizontal_tabs",
    "language_chooser":      False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text":          False,
    "footer_small_text":          False,
    "body_small_text":            False,
    "brand_small_text":           False,
    "brand_colour":               "navbar-primary",
    "accent":                     "accent-primary",
    "navbar":                     "navbar-dark",
    "no_navbar_border":           False,
    "navbar_fixed":               True,
    "layout_boxed":               False,
    "footer_fixed":               False,
    "sidebar_fixed":              True,
    "sidebar":                    "sidebar-dark-primary",
    "sidebar_nav_small_text":     False,
    "sidebar_disable_expand":     False,
    "sidebar_nav_child_indent":   True,
    "sidebar_nav_compact_style":  False,
    "sidebar_nav_legacy_style":   False,
    "sidebar_nav_flat_style":     False,
    "theme":                      "default",
    "dark_mode_theme":            None,
    "button_classes": {
        "primary":   "btn-primary",
        "secondary": "btn-secondary",
        "info":      "btn-info",
        "warning":   "btn-warning",
        "danger":    "btn-danger",
        "success":   "btn-success",
    },
}

# ─── SimpleJWT ────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":    timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME":   timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":    True,   # Her refresh'te yeni refresh token üretilir
    "BLACKLIST_AFTER_ROTATION": True,   # Eski refresh token geçersiz olur (logout güvenliği)
    "UPDATE_LAST_LOGIN":        True,   # Giriş zamanını günceller
    "AUTH_HEADER_TYPES":        ("Bearer",),
    "AUTH_TOKEN_CLASSES":       ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM":         "token_type",
    "JTI_CLAIM":                "jti",
    "ALGORITHM":                "HS256",
    "SIGNING_KEY":              SECRET_KEY,
    "VERIFYING_KEY":            None,
    "AUDIENCE":                 None,
    "ISSUER":                   None,
    "USER_ID_FIELD":            "id",
    "USER_ID_CLAIM":            "user_id",
}

# ─── Logging ──────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "apps.accounts": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",   # React geliştirme sunucusu
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:8000",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]