"""
Psikolog Klinik Yönetim Sistemi — Randevu Serializer'ları
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Appointment, AppointmentNote


class AppointmentNoteSerializer(serializers.ModelSerializer):
    """
    Randevu notu serializer'ı.
    """
    author_name = serializers.SerializerMethodField()
    note_type_display = serializers.CharField(
        source="get_note_type_display", read_only=True
    )

    class Meta:
        model  = AppointmentNote
        fields = (
            "id",
            "appointment",
            "author",
            "author_name",
            "note_type",
            "note_type_display",
            "content",
            "is_private",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id", "author", "author_name",
            "note_type_display", "created_at", "updated_at",
        )

    def get_author_name(self, obj):
        try:
            profile = obj.author.psychologist_profile
            return f"{profile.first_name} {profile.last_name}"
        except Exception:
            return obj.author.email


class AppointmentNoteCreateSerializer(serializers.ModelSerializer):
    """
    Randevu notu oluşturma serializer'ı.
    """
    class Meta:
        model  = AppointmentNote
        fields = ("note_type", "content", "is_private")


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Randevu okuma serializer'ı — liste ve detay görünümleri için.
    """
    psychologist_email = serializers.EmailField(
        source="psychologist.email", read_only=True
    )
    client_name = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()
    client_id = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    duration_minutes = serializers.IntegerField(read_only=True)
    appointment_notes = AppointmentNoteSerializer(many=True, read_only=True)
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model  = Appointment
        fields = (
            "id",
            "psychologist",
            "psychologist_email",
            "client",
            "client_id",
            "client_name",
            "client_email",
            "start_time",
            "end_time",
            "duration_minutes",
            "status",
            "status_display",
            "notes",
            "cancellation_reason",
            "appointment_notes",
            "notes_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id", "psychologist", "psychologist_email",
            "client_id", "client_name", "client_email",
            "status_display", "duration_minutes",
            "appointment_notes", "notes_count",
            "created_at", "updated_at",
        )

    def get_client_name(self, obj):
        if obj.client:
            return f"{obj.client.first_name} {obj.client.last_name}"
        return None

    def get_client_email(self, obj):
        if obj.client:
            return obj.client.user.email
        return None

    def get_client_id(self, obj):
        if obj.client:
            return obj.client.id
        return None

    def get_notes_count(self, obj):
        return obj.appointment_notes.count()


class AppointmentListSerializer(serializers.ModelSerializer):
    """
    Randevu liste serializer'ı — notlar olmadan hafif versiyon.
    """
    psychologist_email = serializers.EmailField(
        source="psychologist.email", read_only=True
    )
    client_name = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()
    client_id = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    duration_minutes = serializers.IntegerField(read_only=True)
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model  = Appointment
        fields = (
            "id",
            "psychologist",
            "psychologist_email",
            "client",
            "client_id",
            "client_name",
            "client_email",
            "start_time",
            "end_time",
            "duration_minutes",
            "status",
            "status_display",
            "notes",
            "cancellation_reason",
            "notes_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id", "psychologist", "psychologist_email",
            "client_id", "client_name", "client_email",
            "status_display", "duration_minutes",
            "notes_count", "created_at", "updated_at",
        )

    def get_client_name(self, obj):
        if obj.client:
            return f"{obj.client.first_name} {obj.client.last_name}"
        return None

    def get_client_email(self, obj):
        if obj.client:
            return obj.client.user.email
        return None

    def get_client_id(self, obj):
        if obj.client:
            return obj.client.id
        return None

    def get_notes_count(self, obj):
        return obj.appointment_notes.count()


class SlotCreateSerializer(serializers.ModelSerializer):
    """
    Psikolog yeni slot oluşturur.
    POST /api/appointments/slots/
    {
        "start_time": "2024-06-10T09:00:00+03:00",
        "end_time":   "2024-06-10T10:00:00+03:00",
        "notes":      "Opsiyonel not"
    }
    """
    class Meta:
        model  = Appointment
        fields = ("id", "start_time", "end_time", "notes", "status",
                  "created_at", "updated_at")
        read_only_fields = ("id", "status", "created_at", "updated_at")

    def validate(self, data):
        start = data.get("start_time")
        end   = data.get("end_time")

        if start and end:
            if end <= start:
                raise serializers.ValidationError(
                    {"end_time": "Bitiş zamanı başlangıç zamanından sonra olmalıdır."}
                )
            if start < timezone.now():
                raise serializers.ValidationError(
                    {"start_time": "Geçmiş bir tarihe slot oluşturulamaz."}
                )
            # Süre kontrolü: en az 15 dakika, en fazla 4 saat
            duration = (end - start).total_seconds() / 60
            if duration < 15:
                raise serializers.ValidationError(
                    {"end_time": "Randevu süresi en az 15 dakika olmalıdır."}
                )
            if duration > 240:
                raise serializers.ValidationError(
                    {"end_time": "Randevu süresi en fazla 4 saat olabilir."}
                )

        return data


class BookAppointmentSerializer(serializers.Serializer):
    """
    Danışan slotu rezerve eder.
    POST /api/appointments/<id>/book/
    { "notes": "Opsiyonel not" }
    """
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class CancelAppointmentSerializer(serializers.Serializer):
    """
    Randevu iptali.
    POST /api/appointments/<id>/cancel/
    { "reason": "İptal nedeni" }
    """
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class AppointmentListQuerySerializer(serializers.Serializer):
    """
    Randevu listesi için query parametreleri.
    GET /api/appointments/?status=booked&date_from=2024-06-01&date_to=2024-06-30
    """
    status    = serializers.ChoiceField(
        choices=["available", "booked", "cancelled", "completed", "all"],
        required=False,
        default="all",
    )
    date_from = serializers.DateField(required=False)
    date_to   = serializers.DateField(required=False)
    client_id = serializers.IntegerField(required=False)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """
    Psikolog randevu günceller (tarih/saat/not).
    PATCH /api/appointments/<id>/
    """
    class Meta:
        model  = Appointment
        fields = ("start_time", "end_time", "notes")

    def validate(self, data):
        from django.utils import timezone as tz
        start = data.get("start_time", getattr(self.instance, "start_time", None))
        end   = data.get("end_time",   getattr(self.instance, "end_time",   None))
        if start and end:
            if end <= start:
                raise serializers.ValidationError(
                    {"end_time": "Bitiş zamanı başlangıç zamanından sonra olmalıdır."}
                )
            duration = (end - start).total_seconds() / 60
            if duration < 15:
                raise serializers.ValidationError(
                    {"end_time": "Randevu süresi en az 15 dakika olmalıdır."}
                )
            if duration > 480:
                raise serializers.ValidationError(
                    {"end_time": "Randevu süresi en fazla 8 saat olabilir."}
                )
        return data


class DirectAppointmentSerializer(serializers.Serializer):
    """
    Psikolog direkt randevu oluşturur — danışanı kendisi seçer, boş slot gerekmez.
    POST /api/appointments/direct/
    {
        "client_id":   3,
        "start_time":  "2024-06-10T09:00:00+03:00",
        "end_time":    "2024-06-10T10:00:00+03:00",
        "notes":       "Opsiyonel not"
    }
    """
    client_id  = serializers.IntegerField()
    start_time = serializers.DateTimeField()
    end_time   = serializers.DateTimeField()
    notes      = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        start = data.get("start_time")
        end   = data.get("end_time")
        if start and end:
            if end <= start:
                raise serializers.ValidationError(
                    {"end_time": "Bitiş zamanı başlangıç zamanından sonra olmalıdır."}
                )
            duration = (end - start).total_seconds() / 60
            if duration < 15:
                raise serializers.ValidationError(
                    {"end_time": "Randevu süresi en az 15 dakika olmalıdır."}
                )
            if duration > 480:
                raise serializers.ValidationError(
                    {"end_time": "Randevu süresi en fazla 8 saat olabilir."}
                )
        return data