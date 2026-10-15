"""
Psikolog Klinik Yönetim Sistemi — Randevu Admin Yapılandırması
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display  = (
        "id", "psychologist", "client", "start_time", "end_time",
        "duration_minutes", "status", "created_at"
    )
    list_filter   = ("status", "psychologist", "start_time")
    search_fields = (
        "psychologist__email",
        "client__first_name", "client__last_name", "client__user__email",
    )
    readonly_fields = ("created_at", "updated_at", "duration_minutes")
    ordering        = ("-start_time",)
    date_hierarchy  = "start_time"

    fieldsets = (
        ("Randevu Bilgileri", {
            "fields": ("psychologist", "client", "start_time", "end_time", "duration_minutes")
        }),
        ("Durum", {
            "fields": ("status", "notes", "cancellation_reason")
        }),
        ("Tarihler", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        from apps.accounts.models import CustomUser, ClientProfile
        if db_field.name == "psychologist":
            kwargs["queryset"] = CustomUser.objects.filter(
                role=CustomUser.Role.PSYCHOLOGIST
            ).order_by("email")
        elif db_field.name == "client":
            kwargs["queryset"] = ClientProfile.objects.filter(
                is_active=True
            ).select_related("user").order_by("last_name", "first_name")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "psychologist", "client", "client__user"
        )
