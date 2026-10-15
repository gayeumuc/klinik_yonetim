"""
Mesajlaşma Modülü — Modeller

Psikolog ile danışan arasında bire-bir mesajlaşma.
- Message: tek bir mesaj kaydı
- ConversationArchive: kullanıcının bir konuşmayı arşivlemesi
"""
from django.db import models
from django.conf import settings


class Message(models.Model):
    """
    Psikolog ↔ Danışan arasındaki tek bir mesaj.

    Erişim kuralları:
        - Psikolog: Yalnızca kendi danışanlarıyla olan mesajları görebilir/gönderebilir.
        - Danışan:  Yalnızca kendi psikologuyla olan mesajları görebilir/gönderebilir.
        - Arşivleme: Her kullanıcı kendi tarafında arşivleyebilir (is_archived_by_sender / recipient).
        - Yıldızlama: Her kullanıcı kendi tarafında yıldızlayabilir (is_starred_by_sender / recipient).
        - Silme:    Mesajlar silinemez (klinik kayıt bütünlüğü).
    """

    sender    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
        verbose_name="Gönderen"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
        verbose_name="Alıcı"
    )
    body       = models.TextField(verbose_name="Mesaj İçeriği")
    is_read    = models.BooleanField(default=False, verbose_name="Okundu mu?")

    # Arşivleme — her taraf bağımsız arşivleyebilir
    is_archived_by_sender    = models.BooleanField(default=False, verbose_name="Gönderen Arşivledi")
    is_archived_by_recipient = models.BooleanField(default=False, verbose_name="Alıcı Arşivledi")

    # Yıldızlama — her taraf bağımsız yıldızlayabilir
    is_starred_by_sender    = models.BooleanField(default=False, verbose_name="Gönderen Yıldızladı")
    is_starred_by_recipient = models.BooleanField(default=False, verbose_name="Alıcı Yıldızladı")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Gönderilme Zamanı")

    class Meta:
        verbose_name        = "Mesaj"
        verbose_name_plural = "Mesajlar"
        ordering            = ["created_at"]

    def __str__(self):
        return f"{self.sender.email} → {self.recipient.email} ({self.created_at:%d.%m.%Y %H:%M})"

    def archive_for(self, user):
        """Kullanıcı tarafında arşivle."""
        if self.sender_id == user.id:
            self.is_archived_by_sender = True
        elif self.recipient_id == user.id:
            self.is_archived_by_recipient = True
        self.save(update_fields=["is_archived_by_sender", "is_archived_by_recipient"])

    def unarchive_for(self, user):
        """Kullanıcı tarafında arşivden çıkar."""
        if self.sender_id == user.id:
            self.is_archived_by_sender = False
        elif self.recipient_id == user.id:
            self.is_archived_by_recipient = False
        self.save(update_fields=["is_archived_by_sender", "is_archived_by_recipient"])

    def star_for(self, user):
        """Kullanıcı tarafında yıldızla."""
        if self.sender_id == user.id:
            self.is_starred_by_sender = True
        elif self.recipient_id == user.id:
            self.is_starred_by_recipient = True
        self.save(update_fields=["is_starred_by_sender", "is_starred_by_recipient"])

    def unstar_for(self, user):
        """Kullanıcı tarafında yıldızı kaldır."""
        if self.sender_id == user.id:
            self.is_starred_by_sender = False
        elif self.recipient_id == user.id:
            self.is_starred_by_recipient = False
        self.save(update_fields=["is_starred_by_sender", "is_starred_by_recipient"])

    def is_archived_for(self, user):
        if self.sender_id == user.id:
            return self.is_archived_by_sender
        return self.is_archived_by_recipient

    def is_starred_for(self, user):
        if self.sender_id == user.id:
            return self.is_starred_by_sender
        return self.is_starred_by_recipient


# ─── Konuşma Arşivi ───────────────────────────────────────────────────────────

class ConversationArchive(models.Model):
    """
    Bir kullanıcının belirli bir kişiyle olan konuşmayı arşivlemesi.

    Psikolog bir danışanla olan konuşmayı arşivleyebilir.
    Danışan da psikologuyla olan konuşmayı arşivleyebilir.
    Arşivleme kişiye özeldir — karşı tarafı etkilemez.

    unique_together: aynı kullanıcı aynı kişiyi yalnızca bir kez arşivleyebilir.
    """
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="archived_conversations",
        verbose_name="Arşivleyen Kullanıcı"
    )
    other_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="archived_by_others",
        verbose_name="Arşivlenen Konuşma Kişisi"
    )
    archived_at = models.DateTimeField(auto_now_add=True, verbose_name="Arşivlenme Zamanı")

    class Meta:
        verbose_name        = "Arşivlenmiş Konuşma"
        verbose_name_plural = "Arşivlenmiş Konuşmalar"
        unique_together     = [("user", "other_user")]
        ordering            = ["-archived_at"]

    def __str__(self):
        return f"{self.user.email} → {self.other_user.email} arşivlendi"
