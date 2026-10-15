"""
Psikolog Klinik Yönetim Sistemi — Django Admin Yapılandırması

Admin panelinden kullanıcı, psikolog ve danışan profillerini yönetmek için.
Superuser oluşturulduktan sonra /admin/ adresinden erişilebilir.

NOT: CustomUser modeli email tabanlıdır (username yok).
     Bu nedenle BaseUserAdmin yerine ModelAdmin kullanılır;
     şifre yönetimi için gerekli fieldset'ler manuel eklendi.
"""
from django import forms
from django.contrib import admin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.contrib.auth.admin import sensitive_post_parameters_m
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, PsychologistProfile, ClientProfile, WorkingHours


# ─── Custom User Forms ────────────────────────────────────────────────────────

class CustomUserCreationForm(forms.ModelForm):
    """
    Yeni kullanıcı oluşturma formu — email tabanlı, username yok.
    """
    password1 = forms.CharField(
        label=_("Şifre"),
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
        strip=False,
    )
    password2 = forms.CharField(
        label=_("Şifre (Tekrar)"),
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
        strip=False,
        help_text=_("Doğrulama için aynı şifreyi tekrar girin."),
    )

    class Meta:
        model  = CustomUser
        fields = ("email", "role", "is_active", "is_staff")

    def clean_password2(self):
        p1 = self.cleaned_data.get("password1")
        p2 = self.cleaned_data.get("password2")
        if p1 and p2 and p1 != p2:
            raise ValidationError(_("Şifreler eşleşmiyor."))
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class CustomUserChangeForm(forms.ModelForm):
    """
    Mevcut kullanıcıyı düzenleme formu.
    Şifre hash olarak gösterilir; değiştirmek için ayrı link kullanılır.
    """
    password = ReadOnlyPasswordHashField(
        label=_("Şifre"),
        help_text=_(
            "Ham şifreler saklanmaz. Şifreyi değiştirmek için "
            "<a href=\"../password/\">bu formu</a> kullanın."
        ),
    )

    class Meta:
        model  = CustomUser
        fields = (
            "email", "password", "role",
            "is_active", "is_staff", "is_superuser",
            "groups", "user_permissions",
        )


# ─── Custom User Admin ────────────────────────────────────────────────────────

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    """
    E-posta tabanlı kullanıcı yönetimi.
    BaseUserAdmin KULLANILMAZ — username bağımlılığı olmadan sıfırdan yazıldı.
    Şifre değiştirme için Django'nun built-in AdminPasswordChangeForm kullanılır.
    """
    form     = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display    = ("email", "role", "is_active", "is_staff", "is_superuser", "created_at")
    list_filter     = ("role", "is_active", "is_staff", "is_superuser")
    search_fields   = ("email",)
    ordering        = ("-created_at",)
    readonly_fields = ("created_at", "last_login")
    filter_horizontal = ("groups", "user_permissions")

    # Mevcut kullanıcı düzenleme fieldset'leri
    fieldsets = (
        (None, {
            "fields": ("email", "password")
        }),
        (_("Rol ve Yetki"), {
            "fields": ("role", "is_active", "is_staff", "is_superuser",
                       "groups", "user_permissions")
        }),
        (_("Tarihler"), {
            "fields": ("created_at", "last_login"),
            "classes": ("collapse",)
        }),
    )

    # Yeni kullanıcı oluşturma fieldset'leri
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "role", "password1", "password2",
                       "is_active", "is_staff"),
        }),
    )

    def get_fieldsets(self, request, obj=None):
        """Yeni kullanıcı için add_fieldsets, mevcut için fieldsets kullan."""
        if not obj:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        """Yeni kullanıcı için add_form, mevcut için form kullan."""
        defaults = {}
        if obj is None:
            defaults["form"] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)

    def get_urls(self):
        """Şifre değiştirme URL'sini ekle."""
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                "<id>/password/",
                self.admin_site.admin_view(self.user_change_password),
                name="accounts_customuser_password_change",
            ),
        ]
        return custom_urls + urls

    @sensitive_post_parameters_m
    def user_change_password(self, request, id, form_url=""):
        """Admin şifre değiştirme view'ı."""
        from django.contrib.admin.utils import unquote
        from django.contrib.auth.admin import UserAdmin
        from django.contrib.auth.forms import AdminPasswordChangeForm
        from django.http import Http404
        from django.utils.html import escape

        user = self.get_object(request, unquote(id))
        if user is None:
            raise Http404(
                _("%(name)s object with primary key %(key)r does not exist.")
                % {"name": self.model._meta.verbose_name, "key": escape(id)}
            )

        if not self.has_change_permission(request, user):
            raise PermissionError

        form = AdminPasswordChangeForm(user, request.POST or None)
        if request.method == "POST" and form.is_valid():
            form.save()
            from django.contrib import messages
            messages.success(request, _("Şifre başarıyla değiştirildi."))
            from django.http import HttpResponseRedirect
            return HttpResponseRedirect("..")

        from django.contrib.admin.templatetags.admin_urls import add_preserved_filters
        fieldsets = [(None, {"fields": list(form.fields)})]
        admin_form = admin.helpers.AdminForm(form, fieldsets, {})

        context = {
            "title": _("Şifre Değiştir: %s") % user.email,
            "adminForm": admin_form,
            "form_url": form_url,
            "form": form,
            "is_popup": "_popup" in request.POST or "_popup" in request.GET,
            "add": True,
            "change": False,
            "has_delete_permission": False,
            "has_change_permission": True,
            "has_absolute_url": False,
            "opts": self.model._meta,
            "original": user,
            "save_as": False,
            "show_save": True,
            **self.admin_site.each_context(request),
        }
        request.current_app = self.admin_site.name
        from django.template.response import TemplateResponse
        return TemplateResponse(
            request,
            "admin/auth/user/change_password.html",
            context,
        )


# ─── Psikolog Profili Admin ───────────────────────────────────────────────────

@admin.register(PsychologistProfile)
class PsychologistProfileAdmin(admin.ModelAdmin):
    list_display    = ("__str__", "specialization", "license_number", "is_public", "created_at")
    list_filter     = ("is_public", "specialization")
    search_fields   = ("first_name", "last_name", "license_number", "user__email")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Kişisel Bilgiler", {
            "fields": ("user", "first_name", "last_name", "phone")
        }),
        ("Klinik Bilgiler", {
            "fields": ("specialization", "license_number", "bio", "is_public")
        }),
        ("Tarihler", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """user alanında yalnızca psikolog rolündeki kullanıcıları göster."""
        if db_field.name == "user":
            from apps.accounts.models import CustomUser
            kwargs["queryset"] = CustomUser.objects.filter(
                role=CustomUser.Role.PSYCHOLOGIST
            ).order_by("email")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


# ─── Danışan Profili Admin ────────────────────────────────────────────────────

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display    = ("__str__", "psychologist", "phone", "is_active", "created_at")
    list_filter     = ("is_active", "psychologist")
    search_fields   = ("first_name", "last_name", "user__email", "phone")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Kişisel Bilgiler", {
            "fields": ("user", "psychologist", "first_name", "last_name",
                       "phone", "birth_date", "address")
        }),
        ("Acil Durum", {
            "fields": ("emergency_contact", "emergency_phone"),
            "classes": ("collapse",)
        }),
        ("Klinik Notlar (Gizli)", {
            "fields": ("medical_history", "notes"),
            "classes": ("collapse",)
        }),
        ("Durum ve Tarihler", {
            "fields": ("is_active", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def get_queryset(self, request):
        """Admin'de tüm danışanları göster (aktif + pasif)."""
        return super().get_queryset(request)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """user → yalnızca danışan, psychologist → yalnızca psikolog göster."""
        from apps.accounts.models import CustomUser
        if db_field.name == "user":
            kwargs["queryset"] = CustomUser.objects.filter(
                role=CustomUser.Role.CLIENT
            ).order_by("email")
        elif db_field.name == "psychologist":
            kwargs["queryset"] = CustomUser.objects.filter(
                role=CustomUser.Role.PSYCHOLOGIST
            ).order_by("email")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


# ─── Çalışma Saatleri Admin ───────────────────────────────────────────────────

@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display  = ("psychologist", "day", "start_time", "end_time", "is_active")
    list_filter   = ("is_active", "day", "psychologist")
    search_fields = ("psychologist__email",)
    ordering      = ("psychologist", "day")
