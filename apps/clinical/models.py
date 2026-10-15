"""
Psikolog Klinik Yönetim Sistemi — Klinik Kayıt Modelleri

SessionNote : Psikolog seans notu (danışandan gizli)
Task        : Psikolog → Danışan ödev/görev ataması
Test        : Psikolojik ölçek (sorular + atama + yanıt + puanlama)
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


# ─── Seans Notu ───────────────────────────────────────────────────────────────

class SessionNote(models.Model):
    """
    Psikolog her seans sonrası klinik gözlemlerini kaydeder.
    Danışan bu notları göremez (API katmanında kısıtlanır).

    UC-19: Psikolog seans notu oluşturur
    UC-20: Psikolog geçmiş notları listeler
    UC-21: Psikolog notu günceller
    UC-22: Psikolog notu siler
    UC-23: Danışan paylaşılan notları görür (is_shared=True olanlar)
    """

    class Mood(models.IntegerChoices):
        COK_KOTU  = 1, "Çok Kötü"
        KOTU      = 2, "Kötü"
        ORTA      = 3, "Orta"
        IYI       = 4, "İyi"
        COK_IYI   = 5, "Çok İyi"

    psychologist = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="session_notes",
        limit_choices_to={"role": "psychologist"},
        verbose_name="Psikolog",
    )
    client = models.ForeignKey(
        "accounts.ClientProfile",
        on_delete=models.CASCADE,
        related_name="session_notes",
        verbose_name="Danışan",
    )
    appointment = models.OneToOneField(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="session_note",
        verbose_name="İlgili Randevu",
    )

    session_date = models.DateField(verbose_name="Seans Tarihi")
    content      = models.TextField(verbose_name="Seans Notu")
    mood_score   = models.IntegerField(
        choices=Mood.choices,
        null=True,
        blank=True,
        verbose_name="Duygu Durumu Puanı",
        help_text="1=Çok Kötü … 5=Çok İyi",
    )
    is_shared = models.BooleanField(
        default=False,
        verbose_name="Danışanla Paylaşıldı mı?",
        help_text="True ise danışan bu notu görebilir.",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma")
    updated_at = models.DateTimeField(auto_now=True,     verbose_name="Güncelleme")

    class Meta:
        verbose_name        = "Seans Notu"
        verbose_name_plural = "Seans Notları"
        ordering            = ["-session_date", "-created_at"]
        indexes = [
            models.Index(fields=["psychologist", "client", "session_date"]),
        ]

    def __str__(self):
        return f"{self.client} | {self.session_date} | {self.psychologist.email}"


# ─── Ödev / Görev ─────────────────────────────────────────────────────────────

class Task(models.Model):
    """
    Psikolog danışana ödev/görev atar.
    Danışan görevi tamamlandı olarak işaretleyebilir.

    UC-13: Psikolog ödev atar
    UC-14: Danışan ödevleri listeler
    UC-15: Danışan veya psikolog tamamlandı işaretler
    UC-16: Psikolog danışanın tüm ödevlerini görür
    UC-17: Psikolog ödevi günceller
    UC-18: Psikolog ödevi siler
    """

    class Priority(models.TextChoices):
        LOW    = "low",    "Düşük"
        MEDIUM = "medium", "Orta"
        HIGH   = "high",   "Yüksek"

    psychologist = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="assigned_tasks",
        limit_choices_to={"role": "psychologist"},
        verbose_name="Psikolog",
    )
    client = models.ForeignKey(
        "accounts.ClientProfile",
        on_delete=models.CASCADE,
        related_name="tasks",
        verbose_name="Danışan",
    )

    title       = models.CharField(max_length=200, verbose_name="Başlık")
    description = models.TextField(blank=True, verbose_name="Açıklama")
    due_date    = models.DateField(null=True, blank=True, verbose_name="Son Tarih")
    priority    = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="Öncelik",
    )

    is_completed   = models.BooleanField(default=False, verbose_name="Tamamlandı mı?")
    completed_at   = models.DateTimeField(null=True, blank=True, verbose_name="Tamamlanma Zamanı")
    completion_note = models.TextField(
        blank=True,
        verbose_name="Tamamlama Notu",
        help_text="Danışan tamamlarken not ekleyebilir.",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma")
    updated_at = models.DateTimeField(auto_now=True,     verbose_name="Güncelleme")

    class Meta:
        verbose_name        = "Ödev"
        verbose_name_plural = "Ödevler"
        ordering            = ["is_completed", "due_date", "-created_at"]
        indexes = [
            models.Index(fields=["client", "is_completed"]),
            models.Index(fields=["psychologist", "client"]),
        ]

    def __str__(self):
        status = "✓" if self.is_completed else "○"
        return f"{status} {self.title} → {self.client}"

    def complete(self, note=""):
        """Görevi tamamlandı olarak işaretle."""
        from django.utils import timezone
        self.is_completed    = True
        self.completed_at    = timezone.now()
        self.completion_note = note
        self.save(update_fields=["is_completed", "completed_at", "completion_note", "updated_at"])

    def reopen(self):
        """Tamamlanmış görevi yeniden aç."""
        self.is_completed    = False
        self.completed_at    = None
        self.completion_note = ""
        self.save(update_fields=["is_completed", "completed_at", "completion_note", "updated_at"])


# ─── Psikolojik Test ──────────────────────────────────────────────────────────

class PsychTest(models.Model):
    """
    Psikolog tarafından oluşturulan psikolojik ölçek/test.

    UC-24: Psikolog test oluşturur
    UC-25: Psikolog teste soru ekler
    """
    psychologist = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="created_tests",
        limit_choices_to={"role": "psychologist"},
        verbose_name="Oluşturan Psikolog",
    )

    title        = models.CharField(max_length=200, verbose_name="Test Adı")
    description  = models.TextField(blank=True, verbose_name="Yönerge / Açıklama")
    is_active    = models.BooleanField(default=True, verbose_name="Aktif mi?")

    created_at   = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma")
    updated_at   = models.DateTimeField(auto_now=True,     verbose_name="Güncelleme")

    class Meta:
        verbose_name        = "Psikolojik Test"
        verbose_name_plural = "Psikolojik Testler"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.psychologist.email})"


class TestQuestion(models.Model):
    """
    Teste ait soru. Çoktan seçmeli veya Likert ölçeği.

    UC-25: Psikolog teste soru ekler
    """

    class QuestionType(models.TextChoices):
        LIKERT   = "likert",   "Likert (1-5)"
        MULTIPLE = "multiple", "Çoktan Seçmeli"
        TEXT     = "text",     "Açık Uçlu"

    test          = models.ForeignKey(
        PsychTest,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="Test",
    )
    order         = models.PositiveIntegerField(default=1, verbose_name="Sıra")
    question_text = models.TextField(verbose_name="Soru Metni")
    question_type = models.CharField(
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.LIKERT,
        verbose_name="Soru Tipi",
    )
    # Çoktan seçmeli için seçenekler (JSON: ["A", "B", "C", "D"])
    options       = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Seçenekler",
        help_text="Çoktan seçmeli sorular için seçenek listesi.",
    )
    # Doğru cevap veya puanlama ağırlığı
    weight        = models.FloatField(default=1.0, verbose_name="Puan Ağırlığı")

    class Meta:
        verbose_name        = "Test Sorusu"
        verbose_name_plural = "Test Soruları"
        ordering            = ["test", "order"]
        unique_together     = [("test", "order")]

    def __str__(self):
        return f"[{self.test.title}] S{self.order}: {self.question_text[:50]}"


class TestAssignment(models.Model):
    """
    Psikolog danışana test atar.

    UC-26: Psikolog danışana test atar
    UC-27: Danışan atanan testleri görür
    UC-28: Danışan testi doldurur
    UC-29/30: Sistem puanlar, psikolog ve danışan sonuçları görür
    """

    class Status(models.TextChoices):
        PENDING    = "pending",    "Bekliyor"
        COMPLETED  = "completed",  "Tamamlandı"
        EXPIRED    = "expired",    "Süresi Doldu"

    test         = models.ForeignKey(
        PsychTest,
        on_delete=models.CASCADE,
        related_name="assignments",
        verbose_name="Test",
    )
    client       = models.ForeignKey(
        "accounts.ClientProfile",
        on_delete=models.CASCADE,
        related_name="test_assignments",
        verbose_name="Danışan",
    )
    assigned_by  = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="test_assignments_given",
        limit_choices_to={"role": "psychologist"},
        verbose_name="Atayan Psikolog",
    )

    status       = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Durum",
    )
    due_date     = models.DateField(null=True, blank=True, verbose_name="Son Tarih")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Tamamlanma")

    # Otomatik hesaplanan toplam puan
    total_score  = models.FloatField(null=True, blank=True, verbose_name="Toplam Puan")
    # Psikolog yorumu
    psychologist_comment = models.TextField(
        blank=True,
        verbose_name="Psikolog Yorumu",
    )

    created_at   = models.DateTimeField(auto_now_add=True, verbose_name="Atanma Tarihi")

    class Meta:
        verbose_name        = "Test Ataması"
        verbose_name_plural = "Test Atamaları"
        ordering            = ["-created_at"]

    def __str__(self):
        return f"{self.test.title} → {self.client} [{self.get_status_display()}]"

    def calculate_score(self):
        """Yanıtlara göre toplam puanı hesapla ve kaydet."""
        answers = self.answers.select_related("question")
        total = 0.0
        for answer in answers:
            if answer.numeric_value is not None:
                total += answer.numeric_value * answer.question.weight
        self.total_score = total
        self.save(update_fields=["total_score"])
        return total


class TestAnswer(models.Model):
    """
    Danışanın test sorusuna verdiği yanıt.
    """
    assignment    = models.ForeignKey(
        TestAssignment,
        on_delete=models.CASCADE,
        related_name="answers",
        verbose_name="Test Ataması",
    )
    question      = models.ForeignKey(
        TestQuestion,
        on_delete=models.CASCADE,
        related_name="answers",
        verbose_name="Soru",
    )
    text_value    = models.TextField(blank=True, verbose_name="Metin Yanıtı")
    numeric_value = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Sayısal Yanıt",
        help_text="Likert veya çoktan seçmeli için puan değeri.",
    )

    class Meta:
        verbose_name        = "Test Yanıtı"
        verbose_name_plural = "Test Yanıtları"
        unique_together     = [("assignment", "question")]

    def __str__(self):
        return f"{self.assignment} | S{self.question.order}"
