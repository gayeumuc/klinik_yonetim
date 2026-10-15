"""
Psikolog Klinik Yönetim Sistemi — Serializer'lar

Serializer'lar Django model nesnelerini JSON'a (ve tersine) dönüştürür.
Her endpoint için uygun serializer seçilir; psikolog gizli alanları
görebilirken danışan göremez.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings

from .models import PsychologistProfile, ClientProfile, WorkingHours

User = get_user_model()


# ─── Kimlik Doğrulama Serializer'ları ────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    """
    Yeni kullanıcı kaydı için serializer.
    Şifre doğrulaması ve tekrar kontrolü içerir.

    POST /api/auth/register/
    {
        "email": "psikolog@klinik.com",
        "role": "psychologist",
        "password": "güçlüŞifre123",
        "password2": "güçlüŞifre123"
    }
    """
    password  = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        label="Şifre Tekrar"
    )

    class Meta:
        model  = User
        fields = ("id", "email", "role", "password", "password2")
        read_only_fields = ("id",)

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError(
                {"password2": "Şifreler eşleşmiyor."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Giriş yapan kullanıcının temel bilgileri.
    GET/PATCH /api/auth/me/
    """
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ("id", "email", "role", "full_name", "created_at", "last_login")
        read_only_fields = ("id", "role", "created_at", "last_login")

    def get_full_name(self, obj):
        return obj.get_full_name()


class ChangePasswordSerializer(serializers.Serializer):
    """
    Şifre değiştirme için serializer.
    POST /api/auth/change-password/
    """
    old_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={"input_type": "password"}
    )
    new_password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        label="Yeni Şifre Tekrar"
    )

    def validate(self, data):
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError(
                {"new_password2": "Yeni şifreler eşleşmiyor."}
            )
        return data

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mevcut şifre hatalı.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# ─── Şifre Sıfırlama Serializer'ları (FR-05) ─────────────────────────────────

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Şifre sıfırlama isteği — e-posta adresine token gönderir.
    POST /api/auth/password-reset/
    {
        "email": "kullanici@ornek.com"
    }
    """
    email = serializers.EmailField(label="E-posta Adresi")

    def validate_email(self, value):
        """E-posta sistemde kayıtlı mı kontrol et."""
        # Güvenlik: kullanıcı var mı yok mu bilgisini sızdırmamak için
        # her durumda başarı döndürüyoruz (view katmanında da aynı şekilde)
        return value.lower()

    def save(self):
        email = self.validated_data["email"]
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Güvenlik: kullanıcı bulunamasa bile sessizce geç
            return

        # Token ve UID oluştur
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Sıfırlama linki (frontend URL'si — .env'deki FRONTEND_URL'den okunur)
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3001")
        clinic_name  = getattr(settings, "CLINIC_NAME",  "Klinik Yönetim Sistemi")
        reset_url    = f"{frontend_url}/sifre-sifirla/{uid}/{token}"

        # E-posta gönder
        send_mail(
            subject=f"Şifre Sıfırlama — {clinic_name}",
            message=(
                f"Merhaba,\n\n"
                f"Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n"
                f"{reset_url}\n\n"
                f"Bu bağlantı 24 saat geçerlidir.\n\n"
                f"Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.\n\n"
                f"{clinic_name}"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@klinik.com"),
            recipient_list=[email],
            fail_silently=True,
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Şifre sıfırlama onayı — token doğrulayıp yeni şifreyi kaydeder.
    POST /api/auth/password-reset/confirm/
    {
        "uid": "base64_encoded_uid",
        "token": "reset_token",
        "new_password": "yeniŞifre123",
        "new_password2": "yeniŞifre123"
    }
    """
    uid           = serializers.CharField()
    token         = serializers.CharField()
    new_password  = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={"input_type": "password"}
    )
    new_password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        label="Yeni Şifre Tekrar"
    )

    def validate(self, data):
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError(
                {"new_password2": "Şifreler eşleşmiyor."}
            )

        # UID çöz ve kullanıcıyı bul
        try:
            uid  = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError(
                {"uid": "Geçersiz veya süresi dolmuş sıfırlama bağlantısı."}
            )

        # Token doğrula
        if not default_token_generator.check_token(user, data["token"]):
            raise serializers.ValidationError(
                {"token": "Geçersiz veya süresi dolmuş token. Lütfen yeni sıfırlama isteği gönderin."}
            )

        data["user"] = user
        return data

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# ─── Psikolog Profili Serializer'ları ────────────────────────────────────────

class PsychologistProfileSerializer(serializers.ModelSerializer):
    """
    Psikolog profili — hem herkese açık hem de kendi güncellemesi için.

    GET  /api/profiles/psychologists/public/  → Ziyaretçi erişimi
    GET  /api/profiles/psychologist/          → Psikolog kendi profili
    PATCH /api/profiles/psychologist/         → Psikolog güncelleme
    """
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model  = PsychologistProfile
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "specialization",
            "license_number",
            "phone",
            "bio",
            "experience_years",
            "photo_url",
            "is_public",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "email", "created_at", "updated_at")


# ─── Danışan Profili Serializer'ları ─────────────────────────────────────────

class ClientProfileSerializer(serializers.ModelSerializer):
    """
    Danışan profili — danışanın kendi profilini görmesi için.
    Gizli alanlar (medical_history, notes) dahil DEĞİL.

    GET  /api/profiles/clients/{id}/  → Danışan kendi profilini görür
    PATCH /api/profiles/clients/{id}/ → Danışan kendi profilini günceller
    """
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model  = ClientProfile
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "birth_date",
            "address",
            "emergency_contact",
            "emergency_phone",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "email", "is_active", "created_at", "updated_at")


class ClientProfileDetailSerializer(ClientProfileSerializer):
    """
    Danışan profili — psikolog için genişletilmiş versiyon.
    Gizli alanlar (medical_history, notes, psychologist) dahil.

    GET  /api/profiles/clients/       → Psikolog danışan listesi
    POST /api/profiles/clients/       → Psikolog yeni danışan oluşturur
    GET  /api/profiles/clients/{id}/  → Psikolog danışan detayı
    PATCH /api/profiles/clients/{id}/ → Psikolog danışan günceller
    """
    psychologist_email = serializers.EmailField(
        source="psychologist.email",
        read_only=True
    )
    # Yeni danışan oluştururken e-posta ve şifre alınır
    email    = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
        style={"input_type": "password"},
        help_text="Boş bırakılırsa otomatik şifre oluşturulur."
    )

    class Meta(ClientProfileSerializer.Meta):
        fields = ClientProfileSerializer.Meta.fields + (
            "psychologist",
            "psychologist_email",
            "medical_history",
            "notes",
            "email",
            "password",
        )
        read_only_fields = ClientProfileSerializer.Meta.read_only_fields + (
            "psychologist",
            "psychologist_email",
        )

    def create(self, validated_data):
        """email ve password alanlarını çıkar — bunlar view'da ayrıca işlenir."""
        validated_data.pop("email",    None)
        validated_data.pop("password", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Güncelleme sırasında email/password alanlarını yoksay."""
        validated_data.pop("email",    None)
        validated_data.pop("password", None)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Okuma sırasında email/password alanlarını gizle."""
        data = super().to_representation(instance)
        # write_only alanlar zaten gizlenir, ama user.email'i göster
        data["email"] = instance.user.email
        return data


# ─── Çalışma Saatleri Serializer'ı ──────────────────────────────────────────

class WorkingHoursSerializer(serializers.ModelSerializer):
    """
    Psikologun çalışma saatleri.
    GET  /api/profiles/working-hours/       → Psikolog kendi saatlerini görür
    POST /api/profiles/working-hours/       → Psikolog saat ekler
    PATCH /api/profiles/working-hours/{id}/ → Psikolog saat günceller
    DELETE /api/profiles/working-hours/{id}/ → Psikolog saat siler
    """
    day_display = serializers.CharField(source="get_day_display", read_only=True)

    class Meta:
        model  = WorkingHours
        fields = (
            "id",
            "day",
            "day_display",
            "start_time",
            "end_time",
            "is_active",
        )
        read_only_fields = ("id", "day_display")