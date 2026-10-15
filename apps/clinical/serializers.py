"""
Psikolog Klinik Yönetim Sistemi — Klinik Kayıt Serializer'ları
"""
from rest_framework import serializers
from .models import SessionNote, Task, PsychTest, TestQuestion, TestAssignment, TestAnswer


# ─── Seans Notu ───────────────────────────────────────────────────────────────

class SessionNoteSerializer(serializers.ModelSerializer):
    client_name      = serializers.SerializerMethodField()
    mood_score_display = serializers.CharField(source="get_mood_score_display", read_only=True)

    class Meta:
        model  = SessionNote
        fields = (
            "id", "psychologist", "client", "client_name",
            "appointment", "session_date", "content",
            "mood_score", "mood_score_display", "is_shared",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "psychologist", "client_name", "created_at", "updated_at")

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"


class SessionNoteClientSerializer(serializers.ModelSerializer):
    """Danışanın görebileceği seans notu (yalnızca is_shared=True olanlar)."""
    mood_score_display = serializers.CharField(source="get_mood_score_display", read_only=True)

    class Meta:
        model  = SessionNote
        fields = (
            "id", "session_date", "content",
            "mood_score", "mood_score_display", "created_at",
        )
        read_only_fields = fields


# ─── Ödev / Görev ─────────────────────────────────────────────────────────────

class TaskSerializer(serializers.ModelSerializer):
    client_name    = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        model  = Task
        fields = (
            "id", "psychologist", "client", "client_name",
            "title", "description", "due_date", "priority", "priority_display",
            "is_completed", "completed_at", "completion_note",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "psychologist", "client_name",
            "completed_at", "created_at", "updated_at",
        )

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"


class TaskCompleteSerializer(serializers.Serializer):
    """Görev tamamlama isteği."""
    completion_note = serializers.CharField(required=False, allow_blank=True, default="")


# ─── Psikolojik Test ──────────────────────────────────────────────────────────

class TestQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TestQuestion
        fields = ("id", "order", "question_text", "question_type", "options", "weight")
        read_only_fields = ("id",)


class PsychTestSerializer(serializers.ModelSerializer):
    questions      = TestQuestionSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model  = PsychTest
        fields = (
            "id", "psychologist", "title", "description",
            "is_active", "question_count", "questions",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "psychologist", "question_count", "created_at", "updated_at")


class PsychTestListSerializer(serializers.ModelSerializer):
    """Liste görünümü için sorular olmadan."""
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model  = PsychTest
        fields = (
            "id", "title", "description", "is_active",
            "question_count", "created_at",
        )
        read_only_fields = fields


# ─── Test Ataması ─────────────────────────────────────────────────────────────

class TestAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.question_text", read_only=True)
    question_type = serializers.CharField(source="question.question_type", read_only=True)
    question_order = serializers.IntegerField(source="question.order", read_only=True)

    class Meta:
        model  = TestAnswer
        fields = ("id", "question", "question_text", "question_type", "question_order", "text_value", "numeric_value")
        read_only_fields = ("id", "question_text", "question_type", "question_order")


class TestAssignmentSerializer(serializers.ModelSerializer):
    test_title   = serializers.CharField(source="test.title", read_only=True)
    test_detail  = PsychTestSerializer(source="test", read_only=True)
    client_name  = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    answers      = TestAnswerSerializer(many=True, read_only=True)

    class Meta:
        model  = TestAssignment
        fields = (
            "id", "test", "test_title", "test_detail", "client", "client_name",
            "assigned_by", "status", "status_display",
            "due_date", "completed_at", "total_score",
            "psychologist_comment", "answers", "created_at",
        )
        read_only_fields = (
            "id", "assigned_by", "test_title", "test_detail", "client_name",
            "status_display", "completed_at", "total_score", "created_at",
        )

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"


class TestAssignmentListSerializer(serializers.ModelSerializer):
    """Liste görünümü için yanıtlar olmadan."""
    test_title   = serializers.CharField(source="test.title", read_only=True)
    client_name  = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model  = TestAssignment
        fields = (
            "id", "test", "test_title", "client", "client_name",
            "status", "status_display", "due_date",
            "completed_at", "total_score", "created_at",
        )
        read_only_fields = fields

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"


class TestSubmitSerializer(serializers.Serializer):
    """
    Danışan test yanıtlarını gönderir.
    POST /api/clinical/tests/assignments/<id>/submit/
    {
        "answers": [
            {"question": 1, "numeric_value": 4},
            {"question": 2, "text_value": "Açık yanıt"},
            ...
        ]
    }
    """
    answers = TestAnswerSerializer(many=True)