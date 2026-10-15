"""
Psikolog Klinik Yönetim Sistemi — Randevu Modelleri

İş akışı:
  1. Psikolog danışana randevu atar → status=pending
  2. Danışan onaylar → status=booked
  3. Danışan reddeder → status=rejected
  4. Psikolog tamamlar → status=completed
  5. Psikolog/Danışan iptal eder → status=cancelled
  6. Psikolog iptal/rejected randevuyu siler

Eski akış (boş slot) hâlâ desteklenir:
  1. Psikolog slot oluşturur → status=available
  2. Danışan rezerve eder → status=booked
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Appointment(models.Model):
    """Randevu modeli."""

    class Status(models.TextChoices):
        AVAILABLE  = "available",  "Müsait"
        PENDING    = "pending",    "Onay Bekliyor"
        BOOKED     = "booked",     "Onaylandı"
        REJECTED   = "rejected",   "Reddedildi"
        CANCELLED  = "cancelled",  "İptal Edildi"
        COMPLETED  = "completed",  "Tamamlandı"

    # ── İlişkiler ──────────────────────────────────────────────────────────────
    psychologist = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="appointments_as_psychologist",
        limit_choices_to={"role": "psychologist"},
        verbose_name="Psikolog",
    )
    client = models.ForeignKey(
        "accounts.ClientProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
        verbose_name="Danışan",
    )

    # ── Zaman ─────────────────────────────────────────────────────────────────
    start_time = models.DateTimeField(verbose_name="Başlangıç Zamanı")
    end_time   = models.DateTimeField(verbose_name="Bitiş Zamanı")

    # ── Durum ─────────────────────────────────────────────────────────────────
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
        verbose_name="Durum",
    )

    # ── Notlar ────────────────────────────────────────────────────────────────
    notes = models.TextField(
        blank=True,
        verbose_name="Randevu Notu",
        help_text="Psikolog veya danışan tarafından eklenebilir.",
    )
    cancellation_reason = models.TextField(
        blank=True,
        verbose_name="İptal / Red Nedeni",
    )

    # ── Zaman damgaları ───────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma")
    updated_at = models.DateTimeField(auto_now=True,     verbose_name="Güncelleme")

    class Meta:
        verbose_name        = "Randevu"
        verbose_name_plural = "Randevular"
        ordering            = ["-start_time"]
        indexes = [
            models.Index(fields=["psychologist", "start_time"]),
            models.Index(fields=["client", "start_time"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        client_str = str(self.client) if self.client else "Boş Slot"
        return (
            f"{self.psychologist.email} | "
            f"{self.start_time.strftime('%d.%m.%Y %H:%M')} | "
            f"{client_str} | {self.get_status_display()}"
        )

    # ── Doğrulama ─────────────────────────────────────────────────────────────

    def clean(self):
        errors = {}

        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                errors["end_time"] = _("Bitiş zamanı başlangıç zamanından sonra olmalıdır.")

        if not self.pk and self.start_time:
            if self.start_time < timezone.now():
                errors["start_time"] = _("Geçmiş bir tarihe randevu oluşturulamaz.")

        if self.start_time and self.end_time and self.psychologist_id:
            conflict = self._get_conflicting_appointments()
            if conflict.exists():
                errors["start_time"] = _(
                    "Bu zaman diliminde psikologun başka bir randevusu var: "
                    f"{conflict.first()}"
                )

        if errors:
            raise ValidationError(errors)

    def _get_conflicting_appointments(self):
        """Çakışan randevuları döndürür. İptal/red/tamamlananlar sayılmaz."""
        qs = Appointment.objects.filter(
            psychologist=self.psychologist_id,
            status__in=[
                self.Status.AVAILABLE,
                self.Status.PENDING,
                self.Status.BOOKED,
            ],
            start_time__lt=self.end_time,
            end_time__gt=self.start_time,
        )
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        return qs

    def save(self, *args, **kwargs):
        # update_fields ile kısmi güncelleme yapılıyorsa (durum değişikliği gibi)
        # sadece ilgili alanlar güncelleniyorsa full_clean'i atla
        if kwargs.get("update_fields"):
            super().save(*args, **kwargs)
        else:
            self.full_clean()
            super().save(*args, **kwargs)

    # ── Property'ler ──────────────────────────────────────────────────────────

    @property
    def is_available(self):
        return self.status == self.Status.AVAILABLE

    @property
    def is_pending(self):
        return self.status == self.Status.PENDING

    @property
    def is_booked(self):
        return self.status == self.Status.BOOKED

    @property
    def duration_minutes(self):
        if self.start_time and self.end_time:
            return int((self.end_time - self.start_time).total_seconds() / 60)
        return 0

    # ── İş akışı metodları ────────────────────────────────────────────────────

    def book(self, client_profile):
        """Danışan boş slotu rezerve eder (eski akış)."""
        if self.status != self.Status.AVAILABLE:
            raise ValidationError(_("Bu slot müsait değil."))
        self.client = client_profile
        self.status = self.Status.BOOKED
        self.save(update_fields=["client", "status", "updated_at"])

    def assign_to_client(self, client_profile):
        """Psikolog danışana randevu atar → pending."""
        self.client = client_profile
        self.status = self.Status.PENDING
        self.save(update_fields=["client", "status", "updated_at"])

    def confirm(self):
        """Danışan randevuyu onaylar → booked."""
        if self.status != self.Status.PENDING:
            raise ValidationError(_("Yalnızca bekleyen randevular onaylanabilir."))
        self.status = self.Status.BOOKED
        self.save(update_fields=["status", "updated_at"])

    def reject(self, reason=""):
        """Danışan randevuyu reddeder → rejected."""
        if self.status != self.Status.PENDING:
            raise ValidationError(_("Yalnızca bekleyen randevular reddedilebilir."))
        self.status = self.Status.REJECTED
        self.cancellation_reason = reason
        self.save(update_fields=["status", "cancellation_reason", "updated_at"])

    def cancel(self, reason=""):
        """Randevuyu iptal eder."""
        if self.status == self.Status.COMPLETED:
            raise ValidationError(_("Tamamlanmış randevu iptal edilemez."))
        if self.status == self.Status.CANCELLED:
            raise ValidationError(_("Randevu zaten iptal edilmiş."))
        self.status = self.Status.CANCELLED
        self.cancellation_reason = reason
        self.save(update_fields=["status", "cancellation_reason", "updated_at"])

    def complete(self):
        """Randevuyu tamamlandı olarak işaretler."""
        if self.status != self.Status.BOOKED:
            raise ValidationError(_("Yalnızca onaylanmış randevular tamamlanabilir."))
        self.status = self.Status.COMPLETED
        self.save(update_fields=["status", "updated_at"])


class AppointmentNote(models.Model):
    """Randevuya eklenen klinik notlar."""

    class NoteType(models.TextChoices):
        GENERAL     = "general",     "Genel Not"
        CLINICAL    = "clinical",    "Klinik Gözlem"
        HOMEWORK    = "homework",    "Ödev / Görev"
        FOLLOWUP    = "followup",    "Takip Notu"
        RISK        = "risk",        "Risk Değerlendirmesi"

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="appointment_notes",
        verbose_name="Randevu",
    )
    author = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="authored_appointment_notes",
        verbose_name="Yazan",
    )
    note_type = models.CharField(
        max_length=20,
        choices=NoteType.choices,
        default=NoteType.GENERAL,
        verbose_name="Not Türü",
    )
    content = models.TextField(verbose_name="Not İçeriği")
    is_private = models.BooleanField(
        default=True,
        verbose_name="Gizli",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma")
    updated_at = models.DateTimeField(auto_now=True,     verbose_name="Güncelleme")

    class Meta:
        verbose_name        = "Randevu Notu"
        verbose_name_plural = "Randevu Notları"
        ordering            = ["-created_at"]
        indexes = [
            models.Index(fields=["appointment"]),
            models.Index(fields=["author"]),
        ]

    def __str__(self):
        return (
            f"{self.get_note_type_display()} | "
            f"{self.appointment} | "
            f"{self.created_at.strftime('%d.%m.%Y %H:%M')}"
        )
