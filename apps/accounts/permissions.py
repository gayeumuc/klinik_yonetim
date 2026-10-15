"""
Psikolog Klinik Yönetim Sistemi — Yetkilendirme (Permission) Sınıfları

Bu sınıflar diğer tüm modüller tarafından da kullanılır:
    from apps.accounts.permissions import IsPsychologist, IsClient, IsOwnerOrPsychologist
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsPsychologist(BasePermission):
    """
    Yalnızca psikolog rolündeki kimliği doğrulanmış kullanıcılara izin verir.

    Kullanım:
        permission_classes = [IsPsychologist]

    Örnek: Danışan listesi, seans notu oluşturma, görev atama
    """
    message = "Bu işlem için psikolog yetkisi gereklidir."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "psychologist"
        )


class IsClient(BasePermission):
    """
    Yalnızca danışan rolündeki kimliği doğrulanmış kullanıcılara izin verir.

    Kullanım:
        permission_classes = [IsClient]

    Örnek: Danışanın kendi randevularını görüntülemesi, görev tamamlama
    """
    message = "Bu işlem için danışan yetkisi gereklidir."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "client"
        )


class IsOwnerOrPsychologist(BasePermission):
    """
    Nesne düzeyinde yetkilendirme:
        - Psikolog: Yalnızca kendi danışanlarına erişebilir
        - Danışan:  Yalnızca kendi profiline erişebilir

    Kullanım:
        permission_classes = [IsAuthenticated, IsOwnerOrPsychologist]

    has_object_permission() çağrılabilmesi için view'da
    get_object() kullanılmalıdır.

    Örnek: Danışan profil detayı, seans notu görüntüleme
    """
    message = "Bu kaynağa erişim yetkiniz bulunmamaktadır."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # obj bir ClientProfile nesnesidir
        if request.user.role == "psychologist":
            # Psikolog yalnızca kendi danışanlarına erişebilir
            return obj.psychologist == request.user
        if request.user.role == "client":
            # Danışan yalnızca kendi profiline erişebilir
            return obj.user == request.user
        # Admin her şeye erişebilir
        return request.user.role == "admin"


class IsPsychologistOrReadOnly(BasePermission):
    """
    GET/HEAD/OPTIONS istekleri herkese açık (ziyaretçi dahil).
    Yazma işlemleri (POST/PUT/PATCH/DELETE) yalnızca psikolog.

    Kullanım:
        permission_classes = [IsPsychologistOrReadOnly]

    Örnek: Psikolog profil listesi — ziyaretçi görebilir (UC-31),
           psikolog kendi profilini güncelleyebilir.
    """
    message = "Bu işlem için psikolog yetkisi gereklidir."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True  # Ziyaretçi dahil herkes okuyabilir
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "psychologist"
        )


class IsPsychologistOrIsOwner(BasePermission):
    """
    Psikolog VEYA nesnenin sahibi olan danışan erişebilir.
    Randevu iptal etme gibi her iki rolün de yapabildiği işlemler için.

    Kullanım:
        permission_classes = [IsPsychologistOrIsOwner]

    Örnek: UC-05 Randevu İptal Etme — hem psikolog hem danışan yapabilir.
    """
    message = "Bu işlem için psikolog veya ilgili danışan yetkisi gereklidir."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == "psychologist":
            return True  # Psikolog tüm randevulara erişebilir
        if request.user.role == "client":
            # Danışan yalnızca kendi randevusuna erişebilir
            # obj bir Appointment nesnesi olduğunda:
            # obj.client_profile.user == request.user
            if hasattr(obj, "user"):
                return obj.user == request.user
            if hasattr(obj, "client_profile"):
                return obj.client_profile.user == request.user
        return False