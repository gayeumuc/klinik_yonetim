"""
Mesajlaşma Modülü — Serializer'lar
"""
from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    """
    Mesaj okuma serializer'ı.
    Kullanıcıya özel is_archived ve is_starred alanları context'teki request.user'a göre hesaplanır.
    """
    sender_email    = serializers.EmailField(source="sender.email",    read_only=True)
    recipient_email = serializers.EmailField(source="recipient.email", read_only=True)
    sender_name     = serializers.SerializerMethodField()
    recipient_name  = serializers.SerializerMethodField()
    is_archived     = serializers.SerializerMethodField()
    is_starred      = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = [
            "id",
            "sender",
            "sender_email",
            "sender_name",
            "recipient",
            "recipient_email",
            "recipient_name",
            "body",
            "is_read",
            "is_archived",
            "is_starred",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "is_read", "created_at"]

    def get_sender_name(self, obj):
        return self._get_full_name(obj.sender)

    def get_recipient_name(self, obj):
        return self._get_full_name(obj.recipient)

    def get_is_archived(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if not user or not user.is_authenticated:
            return False
        return obj.is_archived_for(user)

    def get_is_starred(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if not user or not user.is_authenticated:
            return False
        return obj.is_starred_for(user)

    def _get_full_name(self, user):
        if user.role == "psychologist" and hasattr(user, "psychologist_profile"):
            p = user.psychologist_profile
            return f"{p.first_name} {p.last_name}"
        if user.role == "client" and hasattr(user, "client_profile"):
            c = user.client_profile
            return f"{c.first_name} {c.last_name}"
        return user.email.split("@")[0]


class SendMessageSerializer(serializers.Serializer):
    """Yeni mesaj gönderme — yalnızca body alınır."""
    body = serializers.CharField(
        min_length=1,
        max_length=5000,
        error_messages={
            "blank":      "Mesaj içeriği boş olamaz.",
            "min_length": "Mesaj en az 1 karakter olmalıdır.",
            "max_length": "Mesaj en fazla 5000 karakter olabilir.",
        }
    )