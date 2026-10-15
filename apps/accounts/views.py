"""
Psikolog Klinik Yönetim Sistemi — View'lar (API Endpoint'leri)

Her view hangi HTTP metodunu, hangi permission'ı ve hangi serializer'ı
kullandığını açıkça belirtir.
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings

from .models import PsychologistProfile, ClientProfile, WorkingHours
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PsychologistProfileSerializer,
    ClientProfileSerializer,
    ClientProfileDetailSerializer,
    WorkingHoursSerializer,
)
from .permissions import IsPsychologist, IsClient, IsOwnerOrPsychologist

User = get_user_model()


# ═══════════════════════════════════════════════════════════════════════════════
# KİMLİK DOĞRULAMA (AUTH) VIEW'LARI
# ═══════════════════════════════════════════════════════════════════════════════

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/

    Yeni kullanıcı kaydı oluşturur.
    Herkes erişebilir (AllowAny).

    İstek gövdesi:
        {
            "email": "kullanici@ornek.com",
            "role": "psychologist" | "client",
            "password": "güçlüŞifre123",
            "password2": "güçlüŞifre123"
        }

    Yanıt (201):
        { "id": 1, "email": "...", "role": "..." }
    """
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Refresh token'ı blacklist'e ekleyerek oturumu güvenli şekilde kapatır.
    Access token süresi dolana kadar geçerli olmaya devam eder (15 dk).

    İstek gövdesi:
        { "refresh": "<refresh_token>" }

    Yanıt (205): { "detail": "Başarıyla çıkış yapıldı." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token gereklidir."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Başarıyla çıkış yapıldı."},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception:
            return Response(
                {"detail": "Geçersiz veya süresi dolmuş token."},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/  → Giriş yapan kullanıcının bilgilerini döndürür
    PATCH /api/auth/me/  → E-posta güncellemesi (rol değiştirilemez)

    Yanıt (200):
        {
            "id": 1,
            "email": "...",
            "role": "psychologist",
            "full_name": "Ad Soyad",
            "created_at": "...",
            "last_login": "..."
        }
    """
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/

    Giriş yapan kullanıcının şifresini değiştirir.
    Başarılı değişiklik sonrası yeni token çifti döndürür.

    İstek gövdesi:
        {
            "old_password": "eskiŞifre",
            "new_password": "yeniŞifre123",
            "new_password2": "yeniŞifre123"
        }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            user = serializer.save()
            # Şifre değişince yeni token çifti üret
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "detail": "Şifre başarıyla değiştirildi.",
                    "access":  str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Şifre Sıfırlama (FR-05) ──────────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/

    Kayıtlı e-posta adresine şifre sıfırlama bağlantısı gönderir.
    Herkes erişebilir (AllowAny) — giriş yapmadan kullanılır.

    Güvenlik: Kullanıcı var mı yok mu bilgisi sızdırılmaz;
    her durumda aynı başarı mesajı döner.

    İstek gövdesi:
        { "email": "kullanici@ornek.com" }

    Yanıt (200):
        { "detail": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "detail": (
                        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. "
                        "Gelen kutunuzu kontrol edin (spam klasörünü de kontrol etmeyi unutmayın)."
                    )
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/

    Şifre sıfırlama token'ını doğrulayıp yeni şifreyi kaydeder.
    Herkes erişebilir (AllowAny) — giriş yapmadan kullanılır.

    İstek gövdesi:
        {
            "uid": "base64_encoded_user_id",
            "token": "reset_token",
            "new_password": "yeniŞifre123",
            "new_password2": "yeniŞifre123"
        }

    Yanıt (200):
        { "detail": "Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "detail": (
                        "Şifreniz başarıyla sıfırlandı. "
                        "Yeni şifrenizle giriş yapabilirsiniz."
                    )
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════════════════════
# PSİKOLOG PROFİLİ VIEW'LARI
# ═══════════════════════════════════════════════════════════════════════════════

class PublicPsychologistListView(generics.ListAPIView):
    """
    GET /api/profiles/psychologists/public/

    Herkese açık psikolog profilleri (UC-31: Ziyaretçi Profilini Görüntüle).
    Giriş yapmadan erişilebilir.

    Yanıt (200): [{ "id", "email", "first_name", "last_name", "bio", ... }]
    """
    serializer_class   = PsychologistProfileSerializer
    permission_classes = [AllowAny]
    queryset           = PsychologistProfile.objects.filter(is_public=True)


class PsychologistProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/profiles/psychologist/  → Psikolog kendi profilini görür
    PATCH /api/profiles/psychologist/  → Psikolog kendi profilini günceller

    Yalnızca psikolog rolündeki kullanıcılar erişebilir.
    Profil yoksa 404 döner (admin panelinden oluşturulmalıdır).
    """
    serializer_class   = PsychologistProfileSerializer
    permission_classes = [IsPsychologist]
    http_method_names  = ["get", "patch", "head", "options"]

    def get_object(self):
        return get_object_or_404(
            PsychologistProfile,
            user=self.request.user
        )


# ═══════════════════════════════════════════════════════════════════════════════
# DANIŞAN PROFİLİ VIEW'LARI
# ═══════════════════════════════════════════════════════════════════════════════

class ClientProfileListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/profiles/clients/  → Psikolog kendi aktif danışanlarını listeler (UC-08)
    POST /api/profiles/clients/  → Psikolog yeni danışan oluşturur (UC-07)

    Yalnızca psikolog erişebilir.
    Yalnızca is_active=True danışanlar listelenir.

    POST isteği gövdesi:
        {
            "email": "danisan@ornek.com",
            "password": "şifre123",        ← opsiyonel, boşsa otomatik üretilir
            "first_name": "Ad",
            "last_name": "Soyad",
            "phone": "05001234567",
            "birth_date": "1990-01-15",
            "address": "...",
            "medical_history": "...",
            "notes": "..."
        }
    """
    permission_classes = [IsPsychologist]

    def get_serializer_class(self):
        return ClientProfileDetailSerializer

    def get_queryset(self):
        """Psikolog yalnızca kendi aktif danışanlarını görür."""
        return ClientProfile.objects.filter(
            psychologist=self.request.user,
            is_active=True
        ).select_related("user")

    def perform_create(self, serializer):
        """
        Yeni danışan oluştururken:
        1. CustomUser kaydı oluşturulur (role=client)
        2. ClientProfile bu user'a bağlanır
        3. Psikolog otomatik atanır
        4. Danışana hoş geldin e-postası gönderilir (e-posta + şifre bilgisi)
        """
        from rest_framework.exceptions import ValidationError

        email    = self.request.data.get("email")
        password = self.request.data.get("password") or User.objects.make_random_password(length=12)

        if not email:
            raise ValidationError({"email": "Danışan e-postası zorunludur."})

        if User.objects.filter(email=email).exists():
            raise ValidationError({"email": "Bu e-posta adresi zaten kullanımda."})

        # Danışan kullanıcı hesabı oluştur
        user = User.objects.create_user(
            email=email,
            password=password,
            role="client"
        )

        # Profili kaydet
        profile = serializer.save(
            user=user,
            psychologist=self.request.user
        )

        # Psikolog bilgilerini al
        psikolog_adi = "Psikologunuz"
        try:
            psych_profile = self.request.user.psychologist_profile
            psikolog_adi = f"{psych_profile.first_name} {psych_profile.last_name}"
        except Exception:
            pass

        # Danışan adını al
        danisan_adi = f"{profile.first_name} {profile.last_name}" if profile else email

        # Hoş geldin e-postası gönder
        clinic_name    = getattr(settings, "CLINIC_NAME",          "Klinik")
        clinic_phone   = getattr(settings, "CLINIC_PHONE",         "")
        clinic_email   = getattr(settings, "CLINIC_CONTACT_EMAIL", "")
        frontend_url   = getattr(settings, "FRONTEND_URL",         "http://localhost:3001")
        login_url      = f"{frontend_url}/login"
        subject = f"{clinic_name} — Hesabınız Oluşturuldu"
        message = (
            f"Merhaba {danisan_adi},\n\n"
            f"{clinic_name} sistemine hoş geldiniz!\n\n"
            f"{psikolog_adi} tarafından sizin için bir hesap oluşturuldu.\n\n"
            f"Giriş bilgileriniz:\n"
            f"  E-posta : {email}\n"
            f"  Şifre   : {password}\n\n"
            f"Sisteme giriş yapmak için:\n"
            f"{login_url}\n\n"
            f"Güvenliğiniz için ilk girişinizde şifrenizi değiştirmenizi öneririz.\n\n"
            f"Herhangi bir sorunuz için psikologunuzla iletişime geçebilirsiniz.\n\n"
            f"Saygılarımızla,\n"
            f"{clinic_name} Ekibi"
            + (f"\n{clinic_email}" if clinic_email else "")
            + (f" | {clinic_phone}" if clinic_phone else "")
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@klinik.com"),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            # E-posta gönderilemese bile danışan kaydı tamamlanmış olur
            # Hata loglanır ama işlem iptal edilmez
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Danışan hoş geldin e-postası gönderilemedi ({email}): {e}")


class ClientProfileAllListView(generics.ListAPIView):
    """
    GET /api/profiles/clients/all/

    Psikolog kendi tüm danışanlarını listeler — aktif VE pasif (UC-08 genişletilmiş).
    Dashboard istatistikleri için kullanılır.

    Yalnızca psikolog erişebilir.
    """
    serializer_class   = ClientProfileDetailSerializer
    permission_classes = [IsPsychologist]

    def get_queryset(self):
        """Psikolog kendi tüm danışanlarını görür (aktif + pasif)."""
        return ClientProfile.objects.filter(
            psychologist=self.request.user
        ).select_related("user")


class ClientProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/profiles/clients/{id}/  → Psikolog veya danışanın kendisi (UC-09)
    PATCH  /api/profiles/clients/{id}/  → Psikolog veya danışanın kendisi (UC-10)
    DELETE /api/profiles/clients/{id}/  → Yalnızca psikolog — soft delete (UC-11)

    Erişim kuralı (IsOwnerOrPsychologist):
        - Psikolog: Yalnızca kendi danışanlarına erişebilir
        - Danışan:  Yalnızca kendi profiline erişebilir
    """
    permission_classes = [IsAuthenticated, IsOwnerOrPsychologist]
    http_method_names  = ["get", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        """Psikolog gizli alanları görebilir, danışan göremez."""
        if self.request.user.role == "psychologist":
            return ClientProfileDetailSerializer
        return ClientProfileSerializer

    def get_queryset(self):
        return ClientProfile.objects.select_related("user", "psychologist")

    def perform_destroy(self, instance):
        """
        Hard delete yerine soft delete — KVKK uyumu.
        Veri korunur, is_active=False yapılır.
        """
        instance.soft_delete()

    def destroy(self, request, *args, **kwargs):
        """Psikolog dışındaki kullanıcılar silme yapamaz."""
        if request.user.role != "psychologist":
            return Response(
                {"detail": "Danışan profilini silme yetkisi yalnızca psikologdadır."},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"detail": "Danışan profili pasife alındı."},
            status=status.HTTP_200_OK
        )


class ClientProfileActivateView(APIView):
    """
    POST /api/profiles/clients/{id}/activate/

    Pasife alınmış danışanı tekrar aktif yapar.
    Yalnızca psikolog erişebilir ve yalnızca kendi danışanlarını aktif yapabilir.
    """
    permission_classes = [IsPsychologist]

    def post(self, request, pk):
        try:
            profile = ClientProfile.objects.select_related("user").get(
                pk=pk,
                psychologist=request.user
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"detail": "Danışan bulunamadı veya bu danışana erişim yetkiniz yok."},
                status=status.HTTP_404_NOT_FOUND
            )

        if profile.is_active:
            return Response(
                {"detail": "Danışan zaten aktif durumda."},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.is_active = True
        profile.save(update_fields=["is_active"])
        # Kullanıcı hesabını da aktif et
        profile.user.is_active = True
        profile.user.save(update_fields=["is_active"])

        return Response(
            {"detail": f'"{profile.first_name} {profile.last_name}" tekrar aktif edildi.'},
            status=status.HTTP_200_OK
        )


class ClientProfileHardDeleteView(APIView):
    """
    DELETE /api/profiles/clients/{id}/hard-delete/

    Danışanı ve ilişkili kullanıcı hesabını kalıcı olarak siler.
    Yalnızca psikolog erişebilir ve yalnızca kendi danışanlarını silebilir.

    ⚠️ Bu işlem geri alınamaz. Tüm veriler silinir.
    """
    permission_classes = [IsPsychologist]

    def delete(self, request, pk):
        try:
            profile = ClientProfile.objects.select_related("user").get(
                pk=pk,
                psychologist=request.user
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"detail": "Danışan bulunamadı veya bu danışana erişim yetkiniz yok."},
                status=status.HTTP_404_NOT_FOUND
            )

        # İlişkili kullanıcı hesabını da sil (CASCADE ile profil de silinir)
        user_account = profile.user
        danisan_adi = f"{profile.first_name} {profile.last_name}"
        user_account.delete()

        return Response(
            {"detail": f'"{danisan_adi}" adlı danışan ve hesabı kalıcı olarak silindi.'},
            status=status.HTTP_200_OK
        )


class ClientPasswordResetByPsychologistView(APIView):
    """
    POST /api/profiles/clients/{id}/reset-password/

    Psikolog, danışanın şifresini sıfırlar ve yeni şifreyi e-posta ile gönderir.
    Yalnızca psikolog erişebilir.

    İstek gövdesi (opsiyonel):
        { "new_password": "yeniŞifre123" }  ← boşsa otomatik üretilir
    """
    permission_classes = [IsPsychologist]

    def post(self, request, pk):
        try:
            profile = ClientProfile.objects.select_related("user").get(
                pk=pk,
                psychologist=request.user
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"detail": "Danışan bulunamadı veya bu danışana erişim yetkiniz yok."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_password = request.data.get("new_password") or User.objects.make_random_password(length=12)
        profile.user.set_password(new_password)
        profile.user.save()

        # Psikolog bilgilerini al
        psikolog_adi = "Psikologunuz"
        try:
            psych_profile = request.user.psychologist_profile
            psikolog_adi = f"{psych_profile.first_name} {psych_profile.last_name}"
        except Exception:
            pass

        danisan_adi = f"{profile.first_name} {profile.last_name}"
        email = profile.user.email

        clinic_name  = getattr(settings, "CLINIC_NAME",  "Klinik")
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3001")
        subject = f"{clinic_name} — Şifreniz Güncellendi"
        message = (
            f"Merhaba {danisan_adi},\n\n"
            f"{psikolog_adi} tarafından şifreniz sıfırlandı.\n\n"
            f"Yeni giriş bilgileriniz:\n"
            f"  E-posta : {email}\n"
            f"  Şifre   : {new_password}\n\n"
            f"Sisteme giriş yapmak için:\n"
            f"{frontend_url}/login\n\n"
            f"Güvenliğiniz için lütfen giriş yaptıktan sonra şifrenizi değiştirin.\n\n"
            f"Saygılarımızla,\n"
            f"{clinic_name} Ekibi"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@klinik.com"),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Şifre sıfırlama e-postası gönderilemedi ({email}): {e}")
            return Response(
                {"detail": f"Şifre güncellendi ancak e-posta gönderilemedi: {str(e)}"},
                status=status.HTTP_200_OK
            )

        return Response(
            {"detail": f"Şifre sıfırlandı ve {email} adresine gönderildi."},
            status=status.HTTP_200_OK
        )


class ClientInviteView(APIView):
    """
    POST /api/profiles/clients/{id}/invite/

    Danışana kendi şifresini belirleyebileceği davet linki gönderir.
    Danışan linke tıklayarak şifresini kendisi belirler.
    Yalnızca psikolog erişebilir.
    """
    permission_classes = [IsPsychologist]

    def post(self, request, pk):
        try:
            profile = ClientProfile.objects.select_related("user").get(
                pk=pk,
                psychologist=request.user
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"detail": "Danışan bulunamadı veya bu danışana erişim yetkiniz yok."},
                status=status.HTTP_404_NOT_FOUND
            )

        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        user = profile.user
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        clinic_name  = getattr(settings, "CLINIC_NAME",  "Klinik")
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3001")
        invite_url   = f"{frontend_url}/davet/{uid}/{token}"

        psikolog_adi = "Psikologunuz"
        try:
            psych_profile = request.user.psychologist_profile
            psikolog_adi = f"{psych_profile.first_name} {psych_profile.last_name}"
        except Exception:
            pass

        danisan_adi = f"{profile.first_name} {profile.last_name}"
        email = user.email

        subject = f"{clinic_name} — Hesabınıza Davet Edildiniz"
        message = (
            f"Merhaba {danisan_adi},\n\n"
            f"{psikolog_adi} sizi {clinic_name} sistemine davet etti.\n\n"
            f"Aşağıdaki bağlantıya tıklayarak kendi şifrenizi belirleyebilirsiniz:\n\n"
            f"{invite_url}\n\n"
            f"Bu bağlantı 24 saat geçerlidir.\n\n"
            f"Giriş e-postanız: {email}\n\n"
            f"Saygılarımızla,\n"
            f"{clinic_name} Ekibi"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@klinik.com"),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Davet e-postası gönderilemedi ({email}): {e}")
            return Response(
                {"detail": f"Davet linki oluşturuldu ancak e-posta gönderilemedi: {str(e)}", "invite_url": invite_url},
                status=status.HTTP_200_OK
            )

        return Response(
            {"detail": f"Davet e-postası {email} adresine gönderildi.", "invite_url": invite_url},
            status=status.HTTP_200_OK
        )


class ClientInviteConfirmView(APIView):
    """
    POST /api/auth/invite/confirm/

    Danışan davet linkindeki token ile kendi şifresini belirler.
    Herkes erişebilir (AllowAny) — giriş yapmadan kullanılır.

    İstek gövdesi:
        {
            "uid": "base64_encoded_uid",
            "token": "invite_token",
            "new_password": "yeniŞifre123",
            "new_password2": "yeniŞifre123"
        }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError

        uid           = request.data.get("uid")
        token         = request.data.get("token")
        new_password  = request.data.get("new_password")
        new_password2 = request.data.get("new_password2")

        if not all([uid, token, new_password, new_password2]):
            return Response(
                {"detail": "Tüm alanlar zorunludur."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != new_password2:
            return Response(
                {"detail": "Şifreler eşleşmiyor."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "Geçersiz veya süresi dolmuş davet bağlantısı."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Davet bağlantısı geçersiz veya süresi dolmuş. Psikologunuzdan yeni davet isteyin."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {"detail": " ".join(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Şifreniz başarıyla belirlendi. Artık sisteme giriş yapabilirsiniz."},
            status=status.HTTP_200_OK
        )


class ClientExportCSVView(APIView):
    """
    GET /api/profiles/clients/export/

    Psikologun tüm danışanlarını CSV formatında dışa aktarır.
    Yalnızca psikolog erişebilir.
    """
    permission_classes = [IsPsychologist]

    def get(self, request):
        import csv
        from django.http import HttpResponse

        clients = ClientProfile.objects.filter(
            psychologist=request.user
        ).select_related("user").order_by("last_name", "first_name")

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="danisanlar.csv"'
        response.write('\ufeff')  # UTF-8 BOM — Excel'de Türkçe karakter desteği

        writer = csv.writer(response)
        writer.writerow([
            "Ad", "Soyad", "E-posta", "Telefon", "Doğum Tarihi",
            "Adres", "Acil Kişi", "Acil Telefon", "Durum", "Kayıt Tarihi"
        ])

        for c in clients:
            writer.writerow([
                c.first_name,
                c.last_name,
                c.user.email,
                c.phone,
                c.birth_date.strftime("%d.%m.%Y") if c.birth_date else "",
                c.address or "",
                c.emergency_contact or "",
                c.emergency_phone or "",
                "Aktif" if c.is_active else "Pasif",
                c.created_at.strftime("%d.%m.%Y") if c.created_at else "",
            ])

        return response


class WorkingHoursListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/profiles/working-hours/  → Psikolog kendi çalışma saatlerini görür
    POST /api/profiles/working-hours/  → Psikolog yeni çalışma saati ekler

    Yalnızca psikolog erişebilir.
    """
    serializer_class   = WorkingHoursSerializer
    permission_classes = [IsPsychologist]

    def get_queryset(self):
        return WorkingHours.objects.filter(psychologist=self.request.user)

    def perform_create(self, serializer):
        serializer.save(psychologist=self.request.user)


class WorkingHoursDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/profiles/working-hours/{id}/  → Çalışma saati detayı
    PATCH  /api/profiles/working-hours/{id}/  → Güncelle
    DELETE /api/profiles/working-hours/{id}/  → Sil

    Yalnızca psikolog erişebilir ve yalnızca kendi saatlerini yönetebilir.
    """
    serializer_class   = WorkingHoursSerializer
    permission_classes = [IsPsychologist]
    http_method_names  = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return WorkingHours.objects.filter(psychologist=self.request.user)


class WorkingHoursBulkUpdateView(APIView):
    """
    POST /api/profiles/working-hours/bulk/

    Tüm çalışma saatlerini tek seferde günceller (7 gün).
    Mevcut kayıtları siler ve yenilerini oluşturur.

    İstek gövdesi:
        [
            {"day": 0, "start_time": "09:00", "end_time": "17:00", "is_active": true},
            {"day": 1, "start_time": "09:00", "end_time": "17:00", "is_active": true},
            ...
        ]
    """
    permission_classes = [IsPsychologist]

    def post(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response(
                {"detail": "Liste formatında veri gönderilmelidir."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mevcut saatleri sil
        WorkingHours.objects.filter(psychologist=request.user).delete()

        created = []
        errors  = []
        for item in data:
            serializer = WorkingHoursSerializer(data=item)
            if serializer.is_valid():
                wh = serializer.save(psychologist=request.user)
                created.append(WorkingHoursSerializer(wh).data)
            else:
                errors.append({"day": item.get("day"), "errors": serializer.errors})

        if errors:
            return Response(
                {"detail": "Bazı kayıtlar kaydedilemedi.", "created": created, "errors": errors},
                status=status.HTTP_207_MULTI_STATUS
            )

        return Response(
            {"detail": f"{len(created)} çalışma saati kaydedildi.", "data": created},
            status=status.HTTP_200_OK
        )


class MyClientProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/profiles/my-profile/  → Danışan kendi profilini görür (UC-08 danışan tarafı)
    PATCH /api/profiles/my-profile/  → Danışan kendi profilini günceller

    Yalnızca danışan rolündeki kullanıcılar erişebilir.
    """
    serializer_class   = ClientProfileSerializer
    permission_classes = [IsClient]
    http_method_names  = ["get", "patch", "head", "options"]

    def get_object(self):
        return get_object_or_404(
            ClientProfile,
            user=self.request.user,
            is_active=True
        )