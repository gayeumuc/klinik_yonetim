"""
Psikolog Klinik Yönetim Sistemi — Klinik Kayıt Admin Yapılandırması
"""
from django.contrib import admin
from .models import SessionNote, Task, PsychTest, TestQuestion, TestAssignment, TestAnswer


class TestQuestionInline(admin.TabularInline):
    model  = TestQuestion
    extra  = 1
    fields = ("order", "question_text", "question_type", "options", "weight")


class TestAnswerInline(admin.TabularInline):
    model     = TestAnswer
    extra     = 0
    readonly_fields = ("question", "text_value", "numeric_value")
    can_delete = False


@admin.register(SessionNote)
class SessionNoteAdmin(admin.ModelAdmin):
    list_display    = ("client", "psychologist", "session_date", "mood_score", "is_shared", "created_at")
    list_filter     = ("is_shared", "mood_score", "psychologist")
    search_fields   = ("client__first_name", "client__last_name", "psychologist__email", "content")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy  = "session_date"
    ordering        = ("-session_date",)

    fieldsets = (
        ("Seans Bilgileri", {
            "fields": ("psychologist", "client", "appointment", "session_date")
        }),
        ("Not İçeriği", {
            "fields": ("content", "mood_score", "is_shared")
        }),
        ("Tarihler", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display    = ("title", "client", "psychologist", "priority", "due_date", "is_completed", "created_at")
    list_filter     = ("is_completed", "priority", "psychologist")
    search_fields   = ("title", "client__first_name", "client__last_name", "psychologist__email")
    readonly_fields = ("created_at", "updated_at", "completed_at")
    ordering        = ("is_completed", "due_date")

    fieldsets = (
        ("Ödev Bilgileri", {
            "fields": ("psychologist", "client", "title", "description", "due_date", "priority")
        }),
        ("Durum", {
            "fields": ("is_completed", "completed_at", "completion_note")
        }),
        ("Tarihler", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(PsychTest)
class PsychTestAdmin(admin.ModelAdmin):
    list_display    = ("title", "psychologist", "is_active", "created_at")
    list_filter     = ("is_active", "psychologist")
    search_fields   = ("title", "psychologist__email")
    readonly_fields = ("created_at", "updated_at")
    inlines         = [TestQuestionInline]


@admin.register(TestAssignment)
class TestAssignmentAdmin(admin.ModelAdmin):
    list_display    = ("test", "client", "assigned_by", "status", "due_date", "total_score", "created_at")
    list_filter     = ("status", "assigned_by")
    search_fields   = ("test__title", "client__first_name", "client__last_name")
    readonly_fields = ("created_at", "completed_at", "total_score")
    inlines         = [TestAnswerInline]
