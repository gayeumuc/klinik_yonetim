# 🏥 Psikolog Klinik Yönetim Sistemi — Geliştirici Rehberi

## 👥 Görev Dağılımı

| Kişi | Alan | Görevler |
|------|------|----------|
| **Pervin YURUM** | Backend — Randevu Motoru | `apps/appointments/` Django uygulaması: randevu slotları, çakışma kontrolleri, rezervasyon ve iptal API'leri |
| **Furkan MANGÜ** | Backend — Klinik Veri | `apps/sessions/` seans notları, `apps/tasks/` ödev atama, `apps/tests/` test sonuçları sistemleri |
| **Semanur SEVİM** | Frontend — Psikolog Paneli | `PsychologistDashboard.js` içindeki eksik sekmeler: danışan listesi geliştirmeleri, takvim yönetimi arayüzü, klinik form arayüzleri |
| **Halis ÜNLÜ** | Frontend — Danışan Paneli | `ClientDashboard.js` içindeki eksik sekmeler: rezervasyon akışı, ödev takip sayfası; ayrıca giriş/kayıt ekranları iyileştirmeleri |

> 📖 Her kişi kendi modülüne başlamadan önce bu rehberin tamamını okumalıdır.
> Özellikle **Bölüm 8 (Yeni Modül Ekleme Adımları)** ve kendi modülünün detaylarına bakın.

---


> Bu belge, projeye yeni katılan geliştiricilerin sistemi hızlıca anlaması ve
> eksik modülleri doğru şekilde tamamlaması için hazırlanmıştır.
> Kodu değiştirmeden önce bu belgeyi baştan sona okuyun.

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Teknoloji Yığını](#2-teknoloji-yığını)
3. [Dizin Yapısı](#3-dizin-yapısı)
4. [Kurulum ve Çalıştırma](#4-kurulum-ve-çalıştırma)
5. [Mimari ve Tasarım Kararları](#5-mimari-ve-tasarım-kararları)
6. [Tamamlanan Modüller](#6-tamamlanan-modüller)
7. [Eksik Modüller — Görev Dağılımı](#7-eksik-modüller--görev-dağılımı)
8. [Yeni Modül Ekleme Adımları](#8-yeni-modül-ekleme-adımları)
9. [API Referansı (Mevcut)](#9-api-referansı-mevcut)
10. [Frontend Mimarisi](#10-frontend-mimarisi)
11. [Kimlik Doğrulama ve Yetkilendirme](#11-kimlik-doğrulama-ve-yetkilendirme)
12. [Veritabanı Modeli](#12-veritabanı-modeli)
13. [Sık Yapılan Hatalar](#13-sık-yapılan-hatalar)

---

## 1. Proje Genel Bakış

**ANKA Danışmanlık** için geliştirilmekte olan web tabanlı klinik yönetim sistemi.

### Kullanıcı Rolleri

| Rol | Açıklama | Giriş URL'i |
|-----|----------|-------------|
| `admin` | Sistem yöneticisi, Django admin paneli | `http://127.0.0.1:8000/admin/` |
| `psychologist` | Psikolog, klinik yönetimi | `/admin-giris` (React) |
| `client` | Danışan, sınırlı erişim | `/login` (React) |

### Sunucu Adresleri (Geliştirme)

```
Django Backend : http://127.0.0.1:8000
React Frontend : http://localhost:3001   (npm start)
API Docs       : http://127.0.0.1:8000/api/docs/
Admin Paneli   : http://127.0.0.1:8000/admin/
```

> ⚠️ **ÖNEMLİ:** Frontend port 3001'de çalışır. `/admin/` veya `/api/...` gibi
> linkleri her zaman `http://127.0.0.1:8000/...` şeklinde tam URL olarak yazın.
> Göreli URL yazarsanız React Router yakalar ve Django'ya ulaşamaz.

---

## 2. Teknoloji Yığını

### Backend
| Paket | Versiyon | Amaç |
|-------|----------|------|
| Django | 4.2.13 | Web framework |
| djangorestframework | 3.15.2 | REST API |
| djangorestframework-simplejwt | 5.3.1 | JWT kimlik doğrulama |
| django-cors-headers | 4.3.1 | CORS yönetimi |
| python-decouple | 3.8 | `.env` dosyası okuma |
| drf-spectacular | 0.29.0 | Swagger/OpenAPI dokümantasyonu |
| django-jazzmin | 3.0.4 | Admin panel teması |

### Frontend
| Paket | Amaç |
|-------|------|
| React 18 | UI framework |
| React Router v6 | Sayfa yönlendirme |
| Axios | HTTP istekleri |
| Context API | Global state (auth) |

---

## 3. Dizin Yapısı

```
klinik_yonetim/
│
├── .env                          # Hassas ayarlar (SECRET_KEY, e-posta vb.)
├── manage.py                     # Django yönetim komutu
├── requirements.txt              # Python bağımlılıkları
│
├── config/                       # Django proje ayarları
│   ├── settings.py               # Tüm ayarlar (.env'den okunur)
│   ├── urls.py                   # Ana URL yönlendirici
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/                         # Django uygulamaları
│   ├── accounts/                 # ✅ TAMAMLANDI — Kullanıcı & profil yönetimi
│   │   ├── models.py             #   CustomUser, PsychologistProfile, ClientProfile, WorkingHours
│   │   ├── serializers.py        #   Tüm serializer'lar
│   │   ├── views.py              #   Tüm API view'ları
│   │   ├── urls.py               #   URL tanımları
│   │   ├── permissions.py        #   IsPsychologist, IsClient, IsOwnerOrPsychologist
│   │   ├── admin.py              #   Admin panel kayıtları
│   │   └── migrations/           #   Veritabanı migration'ları
│   │
│   ├── messaging/                # ✅ TAMAMLANDI — Psikolog ↔ Danışan mesajlaşma
│   │   ├── models.py             #   Message, ConversationArchive
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── appointments/             # ❌ EKSİK — Randevu modülü (Backend: Pervin YURUM)
│   ├── sessions/                 # ❌ EKSİK — Seans notları (Backend: Furkan MANGÜ)
│   ├── tasks/                    # ❌ EKSİK — Ödev/görev modülü (Backend: Furkan MANGÜ)
│   └── tests/                    # ❌ EKSİK — Psikolojik testler (Backend: Furkan MANGÜ)
│
└── frontend/
    ├── package.json
    ├── build/                    # Production build (npm run build sonrası)
    └── src/
        ├── App.js                # ✅ Route tanımları
        ├── index.css             # Global stiller (spinner, tablo vb.)
        ├── context/
        │   └── AuthContext.js    # ✅ JWT auth state yönetimi
        ├── services/
        │   └── api.js            # ✅ Tüm API çağrıları (axios)
        ├── components/
        │   ├── Navbar.js         # ✅ Üst navigasyon
        │   └── MessagingPanel.js # ✅ Mesajlaşma bileşeni
        └── pages/
            ├── Home.js                  # ✅ Anasayfa
            ├── Login.js                 # ✅ Danışan girişi
            ├── AdminLogin.js            # ✅ Psikolog/Admin girişi
            ├── PasswordReset.js         # ✅ Şifre sıfırlama
            ├── InviteConfirm.js         # ✅ Danışan davet onayı
            ├── PsychologistDashboard.js # ✅ Psikolog paneli (sekme tabanlı)
            ├── ClientDashboard.js       # ✅ Danışan paneli (sekme tabanlı)
            ├── ClientList.js            # ✅ Danışan listesi
            ├── ClientForm.js            # ✅ Danışan oluştur/düzenle
            └── Register.js              # ✅ Kayıt sayfası
```

---

## 4. Kurulum ve Çalıştırma

### Backend

```bash
# 1. Sanal ortam oluştur ve aktif et
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

# 2. Bağımlılıkları yükle
pip install -r requirements.txt

# 3. Veritabanını oluştur
python manage.py migrate

# 4. Süper kullanıcı oluştur (admin paneli için)
python manage.py createsuperuser

# 5. Sunucuyu başlat
python manage.py runserver
# → http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3001
```

### İlk Kurulum Sonrası

1. `http://127.0.0.1:8000/admin/` adresine giriş yap
2. **Accounts → Kullanıcılar** bölümünden psikolog kullanıcısı oluştur (`role=psychologist`)
3. **Accounts → Psikolog Profilleri** bölümünden bu kullanıcıya profil ekle
4. React uygulamasında `/admin-giris` üzerinden psikolog olarak giriş yap

---

## 5. Mimari ve Tasarım Kararları

### Kimlik Doğrulama: JWT (SimpleJWT)

- Giriş → `POST /api/auth/login/` → `access` + `refresh` token döner
- `access` token: 60 dakika geçerli, her istekte `Authorization: Bearer <token>` header'ı ile gönderilir
- `refresh` token: 7 gün geçerli, `POST /api/auth/token/refresh/` ile yenilenir
- Çıkış → refresh token blacklist'e eklenir
- Token'lar `localStorage`'da saklanır (`AuthContext.js` yönetir)

### Rol Tabanlı Yetkilendirme

```python
# apps/accounts/permissions.py
IsPsychologist       # Yalnızca role="psychologist"
IsClient             # Yalnızca role="client"
IsOwnerOrPsychologist # Danışan kendi profiline, psikolog kendi danışanlarına erişir
```

Frontend'de `AuthContext`'ten gelen `user.role` ile kontrol edilir:
```js
// App.js — PrivateRoute
if (role && user.role !== role) {
  return <Navigate to={user.role === "psychologist" ? "/psikolog" : "/danisan"} replace />;
}
```

### Soft Delete (KVKK Uyumu)

Danışan profilleri kalıcı silinmez. `is_active=False` yapılır:
```python
# ClientProfile.soft_delete()
self.is_active = False
self.save(update_fields=["is_active"])
```

### E-posta Gönderimi

`.env` dosyasında `EMAIL_HOST_PASSWORD` dolu ise Gmail SMTP kullanılır.
Boşsa e-postalar terminale yazdırılır (geliştirme modu).

---

## 6. Tamamlanan Modüller

### ✅ accounts — Kullanıcı & Profil Yönetimi

**Modeller:** `CustomUser`, `PsychologistProfile`, `ClientProfile`, `WorkingHours`

**Özellikler:**
- E-posta tabanlı giriş (username yok)
- Psikolog profili (admin panelinden oluşturulur, psikolog güncelleyebilir)
- Danışan profili CRUD (psikolog yönetir)
- Danışan davet sistemi (e-posta ile şifre belirleme linki)
- Şifre sıfırlama (e-posta tabanlı)
- Çalışma saatleri yönetimi (7 gün, toplu güncelleme)
- CSV dışa aktarma
- Soft delete (KVKK)

**Önemli URL'ler:**
```
POST /api/auth/login/                    → Giriş
POST /api/auth/logout/                   → Çıkış
GET  /api/auth/me/                       → Mevcut kullanıcı
GET  /api/profiles/clients/              → Danışan listesi
POST /api/profiles/clients/              → Yeni danışan
GET  /api/profiles/clients/<id>/         → Danışan detayı
POST /api/profiles/clients/<id>/invite/  → Davet e-postası gönder
```

---

### ✅ messaging — Mesajlaşma

**Modeller:** `Message`, `ConversationArchive`

**Özellikler:**
- Psikolog ↔ Danışan bire-bir mesajlaşma
- Konuşma listesi (aktif / arşivlenmiş)
- Mesaj yıldızlama
- Mesaj içi arama
- Okunmamış mesaj sayacı (sidebar badge)
- Konuşma arşivleme (kişiye özel)
- Mesaj istatistikleri

**Frontend Bileşeni:** `frontend/src/components/MessagingPanel.js`
- Props: `currentUserEmail`, `role` ("psychologist" | "client"), `accentColor`, `accentGradient`
- Kendi state'ini tamamen kendi yönetir — dışarıdan state geçirmeye gerek yok

**Önemli URL'ler:**
```
GET  /api/messages/                          → Konuşma listesi
GET  /api/messages/stats/                    → İstatistikler
GET  /api/messages/unread-count/             → Okunmamış sayısı
GET  /api/messages/<user_id>/                → Mesaj geçmişi
POST /api/messages/<user_id>/send/           → Mesaj gönder
POST /api/messages/<user_id>/archive-conversation/   → Arşivle
POST /api/messages/<user_id>/unarchive-conversation/ → Arşivden çıkar
POST /api/messages/<msg_id>/star/            → Yıldızla
POST /api/messages/<msg_id>/unstar/          → Yıldızı kaldır
```

---

## 7. Eksik Modüller — Görev Dağılımı

> Her modül için hem **backend** (Django) hem **frontend** (React) geliştirilmesi gerekir.
> Aşağıdaki talimatları adım adım takip edin.

---

### ❌ appointments — Randevu Modülü
**Sorumlu Backend:** Pervin YURUM — randevu motoru, çakışma kontrolleri, slotlar, rezervasyon API'leri
**Sorumlu Frontend (Psikolog Paneli):** Semanur SEVİM — takvim yönetimi arayüzü
**Sorumlu Frontend (Danışan Paneli):** Halis ÜNLÜ — rezervasyon akışı, randevu takip sayfası

**Kullanım Senaryoları:**
- UC-01: Psikolog randevu slotu oluşturur (tarih/saat seçimi)
- UC-02: Danışan boş slotları görüntüler
- UC-03: Danışan rezervasyon yapar
- UC-04: Danışan kendi randevularını görüntüler
- UC-05: Danışan veya psikolog randevuyu iptal eder
- UC-06: Psikolog tüm randevuları görüntüler
- Çakışma kontrolü — aynı saatte iki slot oluşturulamaz

**Hedef API Endpoint'leri:**
```
GET    /api/appointments/slots/      → Boş slotları listele
POST   /api/appointments/slots/      → Yeni slot oluştur (Psikolog)
POST   /api/appointments/book/       → Randevu rezervasyonu yap (Danışan)
DELETE /api/appointments/<id>/       → Randevu iptal et
GET    /api/appointments/            → Tüm randevuları listele (Psikolog)
GET    /api/appointments/my/         → Danışanın kendi randevuları
```

**Backend Geliştirme Adımları:**

1. `apps/appointments/` dizini oluştur:
```bash
python manage.py startapp appointments
mv appointments apps/appointments
```

2. `apps/appointments/models.py` içine model yaz:
```python
from django.db import models
from django.conf import settings

class AppointmentSlot(models.Model):
    """Psikolog tarafından oluşturulan randevu slotu."""
    psychologist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appointment_slots",
        limit_choices_to={"role": "psychologist"}
    )
    start_time   = models.DateTimeField()
    end_time     = models.DateTimeField()
    is_available = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_time"]
        # Çakışma kontrolü için unique_together veya custom validation ekleyin

class Appointment(models.Model):
    """Danışanın bir slotu rezerve etmesi."""

    class Status(models.TextChoices):
        PENDING   = "pending",   "Bekliyor"
        CONFIRMED = "confirmed", "Onaylandı"
        CANCELLED = "cancelled", "İptal Edildi"
        COMPLETED = "completed", "Tamamlandı"

    slot         = models.OneToOneField(AppointmentSlot, on_delete=models.CASCADE)
    client       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appointments",
        limit_choices_to={"role": "client"}
    )
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
```

3. `config/settings.py` içinde `INSTALLED_APPS`'e ekle:
```python
"apps.appointments",
```

4. `config/urls.py` içine URL ekle:
```python
path("api/appointments/", include("apps.appointments.urls")),
```

5. Migration oluştur:
```bash
python manage.py makemigrations appointments
python manage.py migrate
```

**Frontend Geliştirme Adımları:**

1. `frontend/src/services/api.js` dosyasına API fonksiyonları ekle:
```js
// api.js içine ekle
export const appointmentAPI = {
  listSlots:    ()       => api.get("/appointments/slots/"),
  createSlot:   (data)   => api.post("/appointments/slots/", data),
  bookSlot:     (data)   => api.post("/appointments/book/", data),
  cancel:       (id)     => api.delete(`/appointments/${id}/`),
  listAll:      ()       => api.get("/appointments/"),
  myAppointments: ()     => api.get("/appointments/my/"),
};
```

2. `frontend/src/pages/PsychologistDashboard.js` içinde `activeTab === "appointments"` bloğunu bul ve `<ModuleComingSoon .../>` yerine gerçek bileşeni koy:
```jsx
{activeTab === "appointments" && (
  <AppointmentsPanel role="psychologist" />
)}
```

3. `frontend/src/pages/ClientDashboard.js` içinde `activeSection === "randevular"` bloğunu bul ve `<InfoSection .../>` yerine gerçek bileşeni koy:
```jsx
{activeSection === "randevular" && (
  <AppointmentsPanel role="client" />
)}
```

4. Yeni bileşen dosyası oluştur: `frontend/src/components/AppointmentsPanel.js`

---

### ❌ sessions — Seans Notları Modülü
**Sorumlu Backend + Frontend (Psikolog Paneli):** Furkan MANGÜ — klinik veri, seans notları sistemi
**Sorumlu Frontend (Danışan Paneli):** Halis ÜNLÜ — danışanın görebileceği notlar sayfası

**Kullanım Senaryoları:**
- UC-19: Psikolog seans notu oluşturur (klinik gözlem + duygu durumu puanı)
- UC-20: Psikolog geçmiş seans notlarını tarih sırasına göre görüntüler
- UC-21: Psikolog seans notunu günceller
- UC-22: Psikolog seans notunu siler (geri alınamaz)
- UC-23: Danışan psikologun paylaştığı notları görüntüler

**Hedef API Endpoint'leri:**
```
GET    /api/sessions/          → Seans notlarını listele
POST   /api/sessions/          → Yeni seans notu ekle
PATCH  /api/sessions/<id>/     → Seans notunu güncelle
DELETE /api/sessions/<id>/     → Seans notunu sil
GET    /api/sessions/client/   → Danışanın görebileceği notlar
```

**Backend Model Önerisi:**
```python
class SessionNote(models.Model):
    psychologist   = models.ForeignKey(CustomUser, ..., limit_choices_to={"role": "psychologist"})
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="session_notes")
    session_date   = models.DateField()
    content        = models.TextField(verbose_name="Klinik Gözlem")
    mood_score     = models.IntegerField(
        null=True, blank=True,
        help_text="1-10 arası duygu durumu puanı"
    )
    is_shared      = models.BooleanField(
        default=False,
        help_text="True ise danışan da görebilir"
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
```

**Frontend:** `PsychologistDashboard.js` içinde `activeTab === "sessions"` bloğunu,
`ClientDashboard.js` içinde `activeSection === "notlar"` bloğunu doldurun.

---

### ❌ tasks — Ödev / Görev Modülü
**Sorumlu Backend + Frontend (Psikolog Paneli):** Furkan MANGÜ — ödev atama sistemi
**Sorumlu Frontend (Danışan Paneli):** Halis ÜNLÜ — ödev takip sayfası

**Kullanım Senaryoları:**
- UC-13: Psikolog danışana ödev/görev atar (başlık, açıklama, son tarih)
- UC-14: Danışan atanan görevleri görüntüler (bekleyen + tamamlanan)
- UC-15: Danışan veya psikolog görevi tamamlandı olarak işaretler
- UC-16: Psikolog danışanın tüm görevlerini görüntüler
- UC-17: Psikolog görevi günceller (tarih veya içerik)
- UC-18: Psikolog görevi siler

**Hedef API Endpoint'leri:**
```
GET    /api/tasks/                   → Görevleri listele
POST   /api/tasks/                   → Yeni görev ata (Psikolog)
PATCH  /api/tasks/<id>/complete/     → Görevi tamamlandı işaretle
PATCH  /api/tasks/<id>/              → Görevi güncelle (Psikolog)
DELETE /api/tasks/<id>/              → Görevi sil (Psikolog)
GET    /api/tasks/my/                → Danışanın kendi görevleri
```

**Backend Model Önerisi:**
```python
class Task(models.Model):
    class Status(models.TextChoices):
        PENDING    = "pending",    "Bekliyor"
        COMPLETED  = "completed",  "Tamamlandı"
        OVERDUE    = "overdue",    "Gecikmiş"

    psychologist   = models.ForeignKey(CustomUser, ..., limit_choices_to={"role": "psychologist"})
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="tasks")
    title          = models.CharField(max_length=200)
    description    = models.TextField(blank=True)
    due_date       = models.DateField(null=True, blank=True)
    status         = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    completed_at   = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
```

**Frontend:** `PsychologistDashboard.js` içinde `activeTab === "tasks"` bloğunu,
`ClientDashboard.js` içinde `activeSection === "gorevler"` bloğunu doldurun.

---

### ❌ tests — Psikolojik Test Modülü
**Sorumlu Backend + Frontend (Psikolog Paneli):** Furkan MANGÜ — test oluşturma, atama, sonuç sistemi
**Sorumlu Frontend (Danışan Paneli):** Halis ÜNLÜ — test çözme ve sonuç görüntüleme sayfası

**Kullanım Senaryoları:**
- UC-24: Psikolog dijital psikolojik ölçek oluşturur (başlık + yönerge)
- UC-25: Psikolog teste soru ekler (çoktan seçmeli, likert ölçeği)
- UC-26: Psikolog danışana test atar
- UC-27: Danışan kendisine atanan testleri görüntüler
- UC-28: Danışan testi çevrimiçi doldurur ve gönderir
- UC-29/30: Sistem otomatik puanlar; psikolog ve danışan sonuçları görür

**Hedef API Endpoint'leri:**
```
GET    /api/tests/                    → Testleri listele
POST   /api/tests/                    → Yeni test oluştur (Psikolog)
POST   /api/tests/<id>/questions/     → Teste soru ekle
POST   /api/tests/assign/             → Danışana test ata
GET    /api/tests/my/                 → Danışanın atanan testleri
POST   /api/tests/<id>/submit/        → Test yanıtlarını gönder
GET    /api/tests/<id>/results/       → Test sonuçlarını görüntüle
```

**Backend Model Önerisi:**
```python
class PsychTest(models.Model):
    psychologist = models.ForeignKey(CustomUser, ..., limit_choices_to={"role": "psychologist"})
    title        = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

class TestQuestion(models.Model):
    class QuestionType(models.TextChoices):
        MULTIPLE_CHOICE = "multiple", "Çoktan Seçmeli"
        LIKERT          = "likert",   "Likert Ölçeği"
        TEXT            = "text",     "Açık Uçlu"

    test          = models.ForeignKey(PsychTest, on_delete=models.CASCADE, related_name="questions")
    text          = models.TextField()
    question_type = models.CharField(max_length=20, choices=QuestionType.choices)
    order         = models.PositiveIntegerField(default=0)
    options       = models.JSONField(default=list, blank=True,
                                     help_text='[{"text": "Seçenek", "score": 1}]')

class TestAssignment(models.Model):
    test           = models.ForeignKey(PsychTest, on_delete=models.CASCADE)
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE)
    assigned_at    = models.DateTimeField(auto_now_add=True)
    completed_at   = models.DateTimeField(null=True, blank=True)
    total_score    = models.IntegerField(null=True, blank=True)
    answers        = models.JSONField(default=dict, blank=True)

class TestAnswer(models.Model):
    assignment = models.ForeignKey(TestAssignment, on_delete=models.CASCADE, related_name="test_answers")
    question   = models.ForeignKey(TestQuestion, on_delete=models.CASCADE)
    answer     = models.TextField()
    score      = models.IntegerField(default=0)
```

**Frontend:** `PsychologistDashboard.js` içinde `activeTab === "tests"` bloğunu,
`ClientDashboard.js` içinde `activeSection === "testler"` bloğunu doldurun.

---

## 8. Yeni Modül Ekleme Adımları

Yeni bir modül eklerken şu sırayı takip edin:

### Adım 1 — Django Uygulaması Oluştur

```bash
# Proje kök dizininde
python manage.py startapp <modul_adi>
# Oluşturulan klasörü apps/ altına taşı
move <modul_adi> apps/<modul_adi>
```

`apps/<modul_adi>/apps.py` içinde `name` alanını güncelle:
```python
class AppointmentsConfig(AppConfig):
    name = "apps.appointments"   # ← "appointments" değil, "apps.appointments"
```

### Adım 2 — settings.py'ye Ekle

```python
# config/settings.py → INSTALLED_APPS
"apps.appointments",
```

### Adım 3 — Model Yaz

`apps/<modul_adi>/models.py` içine modeli yaz.
Diğer modellere bağlanmak için:
```python
from apps.accounts.models import ClientProfile, CustomUser
# veya
from django.conf import settings
# settings.AUTH_USER_MODEL → "accounts.CustomUser"
```

### Adım 4 — Serializer Yaz

`apps/<modul_adi>/serializers.py` içine serializer'ları yaz.
Mevcut serializer'ları örnek al: `apps/accounts/serializers.py`

### Adım 5 — View Yaz

`apps/<modul_adi>/views.py` içine view'ları yaz.
Permission sınıflarını import et:
```python
from apps.accounts.permissions import IsPsychologist, IsClient
```

### Adım 6 — URL Tanımla

`apps/<modul_adi>/urls.py` dosyası oluştur:
```python
from django.urls import path
from . import views

urlpatterns = [
    path("", views.MyListView.as_view(), name="my-list"),
    path("<int:pk>/", views.MyDetailView.as_view(), name="my-detail"),
]
```

`config/urls.py` içine ekle:
```python
path("api/<modul_adi>/", include("apps.<modul_adi>.urls")),
```

### Adım 7 — Migration Oluştur

```bash
python manage.py makemigrations <modul_adi>
python manage.py migrate
```

### Adım 8 — Admin Paneline Kaydet

`apps/<modul_adi>/admin.py` içine ekle:
```python
from django.contrib import admin
from .models import MyModel

@admin.register(MyModel)
class MyModelAdmin(admin.ModelAdmin):
    list_display  = ["__str__", "created_at"]
    list_filter   = ["status"]
    search_fields = ["title"]
```

### Adım 9 — Frontend API Fonksiyonları

`frontend/src/services/api.js` dosyasına yeni API nesnesi ekle:
```js
export const myModuleAPI = {
  list:   ()       => api.get("/my-module/"),
  create: (data)   => api.post("/my-module/", data),
  update: (id, d)  => api.patch(`/my-module/${id}/`, d),
  remove: (id)     => api.delete(`/my-module/${id}/`),
};
```

### Adım 10 — Dashboard Sekmesini Doldur

**PsychologistDashboard.js** içinde ilgili `activeTab` bloğunu bul:
```jsx
{/* ── RANDEVULAR ──────────────────────────────────────── */}
{activeTab === "appointments" && (
  // <ModuleComingSoon ... /> satırını SİL, kendi bileşenini yaz:
  <AppointmentsPanel role="psychologist" />
)}
```

**ClientDashboard.js** içinde ilgili `activeSection` bloğunu bul:
```jsx
{activeSection === "randevular" && (
  // <InfoSection ... /> satırını SİL, kendi bileşenini yaz:
  <AppointmentsPanel role="client" />
)}
```

---

## 9. API Referansı (Mevcut)

Tüm endpoint'leri interaktif olarak test etmek için:
- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **ReDoc:** `http://127.0.0.1:8000/api/redoc/`

### Kimlik Doğrulama

```
POST /api/auth/register/               → Kayıt ol
POST /api/auth/login/                  → Giriş (access + refresh token)
POST /api/auth/token/refresh/          → Token yenile
POST /api/auth/logout/                 → Çıkış (refresh blacklist)
GET  /api/auth/me/                     → Mevcut kullanıcı bilgisi
POST /api/auth/change-password/        → Şifre değiştir
POST /api/auth/password-reset/         → Şifre sıfırlama isteği
POST /api/auth/password-reset/confirm/ → Şifre sıfırlama onayı
POST /api/auth/invite/confirm/         → Danışan davet onayı
```

### Psikolog Profili

```
GET   /api/profiles/psychologists/public/ → Herkese açık profil listesi
GET   /api/profiles/psychologist/         → Kendi profili
PATCH /api/profiles/psychologist/         → Profil güncelle
```

### Çalışma Saatleri

```
GET    /api/profiles/working-hours/        → Çalışma saatlerini listele
POST   /api/profiles/working-hours/        → Yeni saat ekle
POST   /api/profiles/working-hours/bulk/   → Toplu güncelle (7 gün)
PATCH  /api/profiles/working-hours/<id>/   → Tek gün güncelle
DELETE /api/profiles/working-hours/<id>/   → Sil
```

### Danışan Profili

```
GET    /api/profiles/clients/                     → Aktif danışan listesi
POST   /api/profiles/clients/                     → Yeni danışan oluştur
GET    /api/profiles/clients/all/                 → Tüm danışanlar (aktif+pasif)
GET    /api/profiles/clients/export/              → CSV indir
GET    /api/profiles/clients/<id>/                → Danışan detayı
PATCH  /api/profiles/clients/<id>/                → Danışan güncelle
DELETE /api/profiles/clients/<id>/                → Soft delete (pasife al)
POST   /api/profiles/clients/<id>/activate/       → Tekrar aktif yap
DELETE /api/profiles/clients/<id>/hard-delete/    → Kalıcı sil ⚠️
POST   /api/profiles/clients/<id>/reset-password/ → Şifre sıfırla
POST   /api/profiles/clients/<id>/invite/         → Davet e-postası gönder
GET    /api/profiles/my-profile/                  → Danışan kendi profili
PATCH  /api/profiles/my-profile/                  → Danışan profil güncelle
```

### Mesajlaşma

```
GET  /api/messages/                                  → Konuşma listesi (?show=active|archived)
GET  /api/messages/unread-count/                     → Okunmamış sayısı
GET  /api/messages/stats/                            → İstatistikler
GET  /api/messages/<user_id>/                        → Mesaj geçmişi (?filter=all|starred&q=arama)
POST /api/messages/<user_id>/send/                   → Mesaj gönder
POST /api/messages/<user_id>/archive-conversation/   → Konuşmayı arşivle
POST /api/messages/<user_id>/unarchive-conversation/ → Arşivden çıkar
POST /api/messages/<msg_id>/star/                    → Yıldızla
POST /api/messages/<msg_id>/unstar/                  → Yıldızı kaldır
```

---

## 10. Frontend Mimarisi

### Sayfa Yönlendirme (App.js)

```
/                    → Home.js           (herkese açık)
/login               → Login.js          (danışan girişi)
/admin-giris         → AdminLogin.js     (psikolog/admin girişi)
/sifre-sifirla       → PasswordReset.js
/davet/:uid/:token   → InviteConfirm.js
/psikolog            → PsychologistDashboard.js  (role=psychologist zorunlu)
/psikolog/danisanlar → ClientList.js             (role=psychologist zorunlu)
/psikolog/danisanlar/yeni  → ClientForm.js
/psikolog/danisanlar/:id   → ClientForm.js
/danisan             → ClientDashboard.js         (role=client zorunlu)
```

### AuthContext (frontend/src/context/AuthContext.js)

Tüm sayfalarda kullanılabilir:
```js
import { useAuth } from "../context/AuthContext";

const { user, loading, login, logout } = useAuth();
// user.email, user.role ("psychologist" | "client" | "admin")
```

### API Servisi (frontend/src/services/api.js)

```js
import { clientAPI, psychologistAPI, messageAPI, workingHoursAPI, authAPI } from "../services/api";

// Örnek kullanım
const res = await clientAPI.listAll();
const clients = res.data;
```

Token yönetimi otomatiktir — axios interceptor her isteğe `Authorization: Bearer <token>` ekler
ve token süresi dolunca otomatik yeniler.

### Dashboard Sekme Yapısı

**PsychologistDashboard.js** — `activeTab` state'i ile yönetilir:
```
"overview"      → Genel bakış (istatistikler, son danışanlar)
"clients"       → Danışan tablosu
"messages"      → MessagingPanel bileşeni ✅
"appointments"  → ❌ EKSİK — AppointmentsPanel eklenecek
"sessions"      → ❌ EKSİK — SessionsPanel eklenecek
"tasks"         → ❌ EKSİK — TasksPanel eklenecek
"tests"         → ❌ EKSİK — TestsPanel eklenecek
"profile"       → Profil düzenleme formu ✅
"working-hours" → Çalışma saatleri formu ✅
"tools"         → Araçlar (Swagger, Admin vb.) ✅
```

**ClientDashboard.js** — `activeSection` state'i ile yönetilir:
```
"profil"      → Profil görüntüleme/düzenleme ✅
"sifre"       → Şifre değiştirme ✅
"mesajlar"    → MessagingPanel bileşeni ✅
"randevular"  → ❌ EKSİK — AppointmentsPanel eklenecek
"gorevler"    → ❌ EKSİK — TasksPanel eklenecek
"testler"     → ❌ EKSİK — TestsPanel eklenecek
"notlar"      → ❌ EKSİK — SessionNotesPanel eklenecek
```

### Yeni Bileşen Yazarken Dikkat Edilecekler

1. **Stil:** Inline style kullanılıyor (CSS dosyası yok). Mevcut bileşenlerdeki `const S = { ... }` pattern'ini takip edin.
2. **Renk teması:**
   - Psikolog: `#6366f1` (mor/indigo), gradient: `"135deg,#6366f1,#8b5cf6"`
   - Danışan: `#0ea5e9` (mavi), gradient: `"135deg,#0ea5e9,#10b981"`
3. **Spinner:** `<div className="spinner" style={{ width: "1.5rem", height: "1.5rem" }} />`
4. **Hata kutusu:** `S.errorBox` stilini kullanın (veya aynı stili kopyalayın)
5. **Başarı kutusu:** `S.successBox` stilini kullanın
6. **API çağrıları:** Her zaman try/catch ile sarın
7. **Build:** Değişiklik sonrası `cd frontend && npm run build` çalıştırın

---

## 11. Kimlik Doğrulama ve Yetkilendirme

### JWT Token Akışı

```
1. Kullanıcı giriş yapar → POST /api/auth/login/
2. Backend access + refresh token döner
3. Frontend localStorage'a kaydeder
4. Her API isteğinde: Authorization: Bearer <access_token>
5. 401 alınırsa: POST /api/auth/token/refresh/ ile yenile
6. Refresh da geçersizse: logout → /login'e yönlendir
```

### Backend Permission Sınıfları

```python
# apps/accounts/permissions.py

IsPsychologist        # → request.user.role == "psychologist"
IsClient              # → request.user.role == "client"
IsOwnerOrPsychologist # → Danışan kendi profiline, psikolog kendi danışanlarına
```

Yeni view'larda kullanım:
```python
from apps.accounts.permissions import IsPsychologist, IsClient
from rest_framework.permissions import IsAuthenticated, AllowAny

class MyView(generics.ListAPIView):
    permission_classes = [IsPsychologist]   # Yalnızca psikolog
    # veya
    permission_classes = [IsAuthenticated]  # Giriş yapmış herkes
    # veya
    permission_classes = [AllowAny]         # Herkese açık
```

---

## 12. Veritabanı Modeli

```
CustomUser (accounts.CustomUser)
│   email, role, is_active, is_staff, created_at
│
├── PsychologistProfile (1:1)
│   │   first_name, last_name, specialization, license_number,
│   │   phone, bio, is_public
│   │
│   └── WorkingHours (1:N)
│           day, start_time, end_time, is_active
│
└── ClientProfile (1:1, role=client)
    │   psychologist (FK → CustomUser[role=psychologist])
    │   first_name, last_name, phone, birth_date, address
    │   emergency_contact, emergency_phone
    │   medical_history, notes  ← gizli, yalnızca psikolog görür
    │   is_active               ← soft delete
    │
    ├── Message (N:N via sender/recipient)
    │       body, is_read, is_starred_*, is_archived_*
    │
    ├── ConversationArchive
    │       user, other_user
    │
    ├── [❌] Appointment → AppointmentSlot
    ├── [❌] SessionNote
    ├── [❌] Task
    └── [❌] TestAssignment → PsychTest → TestQuestion → TestAnswer
```

---

## 13. Sık Yapılan Hatalar

### ❌ Admin paneli açılmıyor
**Neden:** React uygulaması port 3001'de çalışırken `/admin/` linki React Router'a gidiyor.
**Çözüm:** Admin linklerini her zaman tam URL ile yaz:
```js
// YANLIŞ
href="/admin/"

// DOĞRU
href="http://127.0.0.1:8000/admin/"
```

### ❌ "setSelectedConv is not defined" hatası
**Neden:** `MessagingPanel` kendi state'ini yönetir. Dışarıdan `setSelectedConv` çağrılamaz.
**Çözüm:** Dashboard'daki sekme onClick handler'larında `MessagingPanel`'e ait state fonksiyonlarını çağırmayın.

### ❌ Migration hatası — "No module named 'apps.appointments'"
**Neden:** `apps.py` içinde `name = "appointments"` yazılmış, `"apps.appointments"` olmalı.
**Çözüm:**
```python
# apps/appointments/apps.py
class AppointmentsConfig(AppConfig):
    name = "apps.appointments"  # ← Tam yol zorunlu
```

### ❌ CORS hatası
**Neden:** Frontend'in çalıştığı port `settings.py`'deki `CORS_ALLOWED_ORIGINS`'de yok.
**Çözüm:** `config/settings.py` içine ekle:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",   # ← npm start genellikle 3001 kullanır
    "http://127.0.0.1:8000",
]
```

### ❌ "Authentication credentials were not provided"
**Neden:** API isteğinde token gönderilmiyor.
**Çözüm:** `api.js` üzerinden çağrı yapın — axios interceptor token'ı otomatik ekler.
Doğrudan `fetch` veya başka bir axios instance kullanmayın.

### ❌ Psikolog profili bulunamadı (404)
**Neden:** Psikolog kullanıcısı oluşturulmuş ama profil kaydı yok.
**Çözüm:** `http://127.0.0.1:8000/admin/accounts/psychologistprofile/add/` adresinden profil oluştur.

### ❌ E-posta gönderilmiyor
**Neden:** `.env` dosyasında `EMAIL_HOST_PASSWORD` boş veya yanlış.
**Çözüm:** Gmail uygulama şifresi oluştur ve `.env`'e ekle. Geliştirme sırasında terminale yazdırılan e-postaları kontrol et.

### ❌ npm start sonrası beyaz ekran
**Neden:** JavaScript hatası var.
**Çözüm:** Tarayıcı konsolunu aç (F12 → Console), hatayı oku. Genellikle tanımsız değişken veya import hatası.

### ❌ Build sonrası değişiklikler görünmüyor
**Neden:** Django eski build dosyalarını sunuyor.
**Çözüm:**
```bash
cd frontend && npm run build
# Ardından Django sunucusunu yeniden başlat
```

---

## 📞 Kaynaklar

- **API Dokümantasyonu (Swagger):** `http://127.0.0.1:8000/api/docs/`
- **API Dokümantasyonu (ReDoc):** `http://127.0.0.1:8000/api/redoc/`
- **Admin Paneli:** `http://127.0.0.1:8000/admin/`
- **Django 4.2 Docs:** https://docs.djangoproject.com/en/4.2/
- **DRF Docs:** https://www.django-rest-framework.org/
- **SimpleJWT Docs:** https://django-rest-framework-simplejwt.readthedocs.io/
- **React Router v6:** https://reactrouter.com/en/main

---

*Son güncelleme: Mayıs 2026 — Altyapı ekibi tarafından hazırlanmıştır.*