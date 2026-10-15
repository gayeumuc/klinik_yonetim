"""
Psikolog Klinik Yönetim Sistemi — Kullanıcı Modelleri

Bu modül projenin temelini oluşturur. Diğer tüm modüller
(Randevu, Seans Notu, Ödev, Test) bu modeldeki User'a bağlanır.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ─── Custom User Manager ──────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    """
    E-posta ile giriş yapılabilen özelleştirilmiş kullanıcı yöneticisi.
    Django'nun varsayılan username tabanlı yöneticisinin yerini alır.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("E-posta adresi zorunludur.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Şifreyi bcrypt ile hashler
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", CustomUser.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser için is_staff=True olmalıdır.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser için is_superuser=True olmalıdır.")

        return self.create_user(email, password, **extra_fields)


# ─── Custom User Modeli ───────────────────────────────────────────────────────

class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    E-posta ile giriş yapılabilen özelleştirilmiş kullanıcı modeli.

    Roller:
        - admin:        Sistem yöneticisi (tüm erişim)
        - psychologist: Psikolog (klinik yönetimi)
        - client:       Danışan (sınırlı erişim)

    Diğer modüller bu modele FK ile bağlanır:
        Appointment.psychologist → CustomUser (role=psychologist)
        Appointment.client       → ClientProfile → CustomUser
        SessionNote              → Appointment → CustomUser
        Task.client              → ClientProfile → CustomUser
        TestAssignment           → ClientProfile → CustomUser
    """

    class Role(models.TextChoices):
        ADMIN        = "admin",        "Admin"
        PSYCHOLOGIST = "psychologist", "Psikolog"
        CLIENT       = "client",       "Danışan"

    # Temel alanlar
    email      = models.EmailField(unique=True, verbose_name="E-posta")
    role       = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name="Rol"
    )
    is_active  = models.BooleanField(default=True, verbose_name="Aktif mi?")
    is_staff   = models.BooleanField(default=False, verbose_name="Personel mi?")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Kayıt tarihi")
    # last_login AbstractBaseUser'dan otomatik gelir

    # E-posta ile giriş için USERNAME_FIELD ayarı
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["role"]  # createsuperuser komutu için

    objects = UserManager()

    class Meta:
        verbose_name        = "Kullanıcı"
        verbose_name_plural = "Kullanıcılar"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    # ── Yardımcı property'ler (permission sınıflarında kullanılır) ──

    @property
    def is_psychologist(self):
        """Kullanıcı psikolog mu?"""
        return self.role == self.Role.PSYCHOLOGIST

    @property
    def is_client(self):
        """Kullanıcı danışan mı?"""
        return self.role == self.Role.CLIENT

    @property
    def is_admin_user(self):
        """Kullanıcı admin mi?"""
        return self.role == self.Role.ADMIN

    def get_full_name(self):
        """Profil varsa tam adı döndürür."""
        if self.is_psychologist and hasattr(self, "psychologist_profile"):
            p = self.psychologist_profile
            return f"{p.first_name} {p.last_name}"
        if self.is_client and hasattr(self, "client_profile"):
            c = self.client_profile
            return f"{c.first_name} {c.last_name}"
        return self.email


# ─── Psikolog Profili ─────────────────────────────────────────────────────────

class PsychologistProfile(models.Model):
    """
    Psikolog'a ait klinik ve kişisel bilgiler.

    Ziyaretçiler is_public=True olan profilleri görebilir (UC-31).
    Psikolog kendi profilini güncelleyebilir.
    """

    user           = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="psychologist_profile",
        limit_choices_to={"role": CustomUser.Role.PSYCHOLOGIST},
        verbose_name="Kullanıcı"
    )
    first_name     = models.CharField(max_length=50, verbose_name="Ad")
    last_name      = models.CharField(max_length=50, verbose_name="Soyad")
    specialization = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Uzmanlık Alanı"
    )
    license_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Lisans / Diploma No"
    )
    phone          = models.CharField(max_length=15, blank=True, verbose_name="Telefon")
    bio            = models.TextField(blank=True, verbose_name="Biyografi (Herkese Açık)")
    experience_years = models.PositiveSmallIntegerField(default=0, verbose_name="Deneyim Yılı")
    photo_url      = models.URLField(blank=True, verbose_name="Fotoğraf URL")
    is_public      = models.BooleanField(
        default=True,
        verbose_name="Herkese Açık Profil",
        help_text="Ziyaretçiler bu profili görebilir mi?"
    )
    created_at     = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma")
    updated_at     = models.DateTimeField(auto_now=True, verbose_name="Güncelleme")

    class Meta:
        verbose_name        = "Psikolog Profili"
        verbose_name_plural = "Psikolog Profilleri"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"Psikolog: {self.first_name} {self.last_name}"


# ─── Danışan Profili ──────────────────────────────────────────────────────────

class ClientProfile(models.Model):
    """
    Danışana ait kişisel ve klinik bilgiler.

    Erişim kuralları:
        - Psikolog: Kendi danışanlarının tüm alanlarını görebilir/düzenleyebilir
        - Danışan:  Yalnızca kendi profilinin genel alanlarını görebilir
                    (medical_history ve notes gizlidir)
        - Silme:    Soft-delete (is_active=False) — veri korunur (KVKK)

    Diğer modüller bu modele FK ile bağlanır:
        Appointment.client_profile → ClientProfile
        SessionNote                → Appointment → ClientProfile
        Task.client_profile        → ClientProfile
        TestAssignment.client      → ClientProfile
    """

    user              = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="client_profile",
        limit_choices_to={"role": CustomUser.Role.CLIENT},
        verbose_name="Kullanıcı"
    )
    psychologist      = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clients",
        limit_choices_to={"role": CustomUser.Role.PSYCHOLOGIST},
        verbose_name="Atandığı Psikolog"
    )

    # Kişisel bilgiler
    first_name        = models.CharField(max_length=50, verbose_name="Ad")
    last_name         = models.CharField(max_length=50, verbose_name="Soyad")
    phone             = models.CharField(max_length=15, verbose_name="Telefon")
    birth_date        = models.DateField(verbose_name="Doğum Tarihi")
    address           = models.TextField(blank=True, verbose_name="Adres")

    # Acil durum bilgileri
    emergency_contact = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Acil Durum Kişisi"
    )
    emergency_phone   = models.CharField(
        max_length=15,
        blank=True,
        verbose_name="Acil Durum Telefonu"
    )

    # Gizli klinik alanlar (yalnızca psikolog görebilir)
    medical_history   = models.TextField(
        blank=True,
        verbose_name="Tıbbi Geçmiş",
        help_text="Yalnızca psikolog görebilir."
    )
    notes             = models.TextField(
        blank=True,
        verbose_name="Genel Notlar",
        help_text="Yalnızca psikolog görebilir."
    )

    # Durum
    is_active         = models.BooleanField(
        default=True,
        verbose_name="Aktif mi?",
        help_text="False yapıldığında soft-delete gerçekleşir."
    )
    created_at        = models.DateTimeField(auto_now_add=True, verbose_name="Kayıt Tarihi")
    updated_at        = models.DateTimeField(auto_now=True, verbose_name="Güncelleme")

    class Meta:
        verbose_name        = "Danışan Profili"
        verbose_name_plural = "Danışan Profilleri"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"Danışan: {self.first_name} {self.last_name}"

    def soft_delete(self):
        """Danışanı aktif listeden kaldırır, veriyi korur (KVKK uyumu)."""
        self.is_active = False
        self.save(update_fields=["is_active"])


# ─── Psikolog Çalışma Saatleri ────────────────────────────────────────────────

class WorkingHours(models.Model):
    """
    Psikologun haftalık çalışma saatleri.
    Her gün için ayrı kayıt tutulur.
    Randevu modülü bu modeli kullanarak uygun slotları belirler.
    """

    class Day(models.IntegerChoices):
        PAZARTESI = 0, "Pazartesi"
        SALI      = 1, "Salı"
        CARSAMBA  = 2, "Çarşamba"
        PERSEMBE  = 3, "Perşembe"
        CUMA      = 4, "Cuma"
        CUMARTESI = 5, "Cumartesi"
        PAZAR     = 6, "Pazar"

    psychologist = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="working_hours",
        limit_choices_to={"role": CustomUser.Role.PSYCHOLOGIST},
        verbose_name="Psikolog"
    )
    day          = models.IntegerField(
        choices=Day.choices,
        verbose_name="Gün"
    )
    start_time   = models.TimeField(verbose_name="Başlangıç Saati")
    end_time     = models.TimeField(verbose_name="Bitiş Saati")
    is_active    = models.BooleanField(
        default=True,
        verbose_name="Aktif mi?",
        help_text="Bu günde çalışıyor mu?"
    )

    class Meta:
        verbose_name        = "Çalışma Saati"
        verbose_name_plural = "Çalışma Saatleri"
        ordering            = ["day", "start_time"]
        unique_together     = [("psychologist", "day")]

    def __str__(self):
        return f"{self.psychologist.email} — {self.get_day_display()} {self.start_time}-{self.end_time}"