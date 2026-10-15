"""
Mesajlaşma Modülü — View'lar (API Endpoint'leri)

Psikolog ↔ Danışan arasında bire-bir mesajlaşma.

Endpoint'ler:
    GET  /api/messages/                              → Konuşma listesi (?show=archived için arşivlenenler)
    GET  /api/messages/unread-count/                 → Okunmamış mesaj sayısı
    GET  /api/messages/stats/                        → Mesaj istatistikleri
    GET  /api/messages/{user_id}/                    → Mesaj geçmişi (?filter=all|starred, ?q=arama)
    POST /api/messages/{user_id}/send/               → Mesaj gönder
    POST /api/messages/{user_id}/archive-conversation/   → Konuşmayı arşivle
    POST /api/messages/{user_id}/unarchive-conversation/ → Konuşmayı arşivden çıkar
    POST /api/messages/{msg_id}/star/                → Mesajı yıldızla
    POST /api/messages/{msg_id}/unstar/              → Yıldızı kaldır
"""
from django.db import models as db_models
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Message, ConversationArchive
from .serializers import MessageSerializer, SendMessageSerializer
from apps.accounts.models import ClientProfile

User = get_user_model()


# ── Yardımcı ─────────────────────────────────────────────────────────────────

def can_communicate(user, other):
    """İki kullanıcının mesajlaşma yetkisi var mı?"""
    if user.role == "psychologist" and other.role == "client":
        return ClientProfile.objects.filter(user=other, psychologist=user).exists()
    if user.role == "client" and other.role == "psychologist":
        try:
            return user.client_profile.psychologist_id == other.id
        except ClientProfile.DoesNotExist:
            return False
    return False


def get_thread_qs(user, other):
    """İki kullanıcı arasındaki mesaj queryset'i."""
    return Message.objects.filter(
        db_models.Q(sender=user, recipient=other) |
        db_models.Q(sender=other, recipient=user)
    ).select_related("sender", "recipient")


# ── View'lar ──────────────────────────────────────────────────────────────────

class ConversationListView(APIView):
    """
    GET /api/messages/?show=active|archived

    Psikolog için: Kendi danışanlarının listesi.
        show=active   → Arşivlenmemiş konuşmalar (varsayılan)
        show=archived → Arşivlenmiş konuşmalar
    Danışan için: Psikologunun bilgileri (tek konuşma).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        show = request.query_params.get("show", "active")  # active | archived

        # Kullanıcının arşivlediği konuşmaların other_user id seti
        archived_ids = set(
            ConversationArchive.objects.filter(user=user).values_list("other_user_id", flat=True)
        )

        if user.role == "psychologist":
            client_profiles = ClientProfile.objects.filter(
                psychologist=user,
            ).select_related("user")

            conversations = []
            for cp in client_profiles:
                client_user = cp.user
                is_archived = client_user.id in archived_ids

                # Filtre: show=archived ise yalnızca arşivlenenler, show=active ise arşivlenmeyenler
                if show == "archived" and not is_archived:
                    continue
                if show == "active" and is_archived:
                    continue

                qs = get_thread_qs(user, client_user)
                last_msg = qs.order_by("-created_at").first()
                unread   = qs.filter(sender=client_user, recipient=user, is_read=False).count()

                conversations.append({
                    "user_id":        client_user.id,
                    "email":          client_user.email,
                    "name":           f"{cp.first_name} {cp.last_name}",
                    "total_messages": qs.count(),
                    "last_message": {
                        "body":       last_msg.body if last_msg else None,
                        "created_at": last_msg.created_at if last_msg else None,
                        "is_mine":    last_msg.sender_id == user.id if last_msg else None,
                    } if last_msg else None,
                    "unread_count":  unread,
                    "is_archived":   is_archived,
                })

            conversations.sort(
                key=lambda c: c["last_message"]["created_at"].isoformat() if c["last_message"] and c["last_message"]["created_at"] else "",
                reverse=True
            )
            return Response(conversations)

        elif user.role == "client":
            try:
                cp = user.client_profile
            except ClientProfile.DoesNotExist:
                return Response({"detail": "Profil bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

            if not cp.psychologist:
                return Response([], status=status.HTTP_200_OK)

            psych_user  = cp.psychologist
            is_archived = psych_user.id in archived_ids
            psych_name  = psych_user.email
            try:
                pp = psych_user.psychologist_profile
                psych_name = f"{pp.first_name} {pp.last_name}"
            except Exception:
                pass

            qs       = get_thread_qs(user, psych_user)
            last_msg = qs.order_by("-created_at").first()
            unread   = qs.filter(sender=psych_user, recipient=user, is_read=False).count()

            return Response([{
                "user_id":        psych_user.id,
                "email":          psych_user.email,
                "name":           psych_name,
                "total_messages": qs.count(),
                "last_message": {
                    "body":       last_msg.body if last_msg else None,
                    "created_at": last_msg.created_at if last_msg else None,
                    "is_mine":    last_msg.sender_id == user.id if last_msg else None,
                } if last_msg else None,
                "unread_count": unread,
                "is_archived":  is_archived,
            }])

        return Response([], status=status.HTTP_200_OK)


class ArchiveConversationView(APIView):
    """
    POST /api/messages/{user_id}/archive-conversation/

    Belirli kullanıcıyla olan konuşmayı arşivle.
    Arşivleme kişiye özeldir — karşı tarafı etkilemez.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        user  = request.user
        other = get_object_or_404(User, pk=user_id)

        if not can_communicate(user, other):
            return Response(
                {"detail": "Bu kullanıcıyla mesajlaşma yetkiniz yok."},
                status=status.HTTP_403_FORBIDDEN
            )

        _, created = ConversationArchive.objects.get_or_create(user=user, other_user=other)
        if created:
            return Response({"detail": "Konuşma arşivlendi.", "is_archived": True}, status=status.HTTP_200_OK)
        return Response({"detail": "Konuşma zaten arşivde.", "is_archived": True}, status=status.HTTP_200_OK)


class UnarchiveConversationView(APIView):
    """
    POST /api/messages/{user_id}/unarchive-conversation/

    Arşivlenmiş konuşmayı geri al.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        user  = request.user
        other = get_object_or_404(User, pk=user_id)

        deleted, _ = ConversationArchive.objects.filter(user=user, other_user=other).delete()
        if deleted:
            return Response({"detail": "Konuşma arşivden çıkarıldı.", "is_archived": False}, status=status.HTTP_200_OK)
        return Response({"detail": "Konuşma zaten arşivde değil.", "is_archived": False}, status=status.HTTP_200_OK)


class MessageThreadView(APIView):
    """
    GET /api/messages/{user_id}/?filter=all|starred|archived&q=arama_terimi

    Mesaj geçmişi. Filtreler:
        all      → Arşivlenmemiş tüm mesajlar (varsayılan)
        starred  → Yalnızca yıldızlı mesajlar
        archived → Yalnızca arşivlenmiş mesajlar
        q        → İçerik araması (isteğe bağlı, tüm filtrelerde çalışır)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user  = request.user
        other = get_object_or_404(User, pk=user_id)

        if not can_communicate(user, other):
            return Response(
                {"detail": "Bu kullanıcıyla mesajlaşma yetkiniz yok."},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = get_thread_qs(user, other).order_by("created_at")

        filter_type = request.query_params.get("filter", "all")
        search_q    = request.query_params.get("q", "").strip()

        if filter_type == "starred":
            # Kullanıcının yıldızladığı mesajlar
            qs = qs.filter(
                db_models.Q(sender=user,  is_starred_by_sender=True) |
                db_models.Q(recipient=user, is_starred_by_recipient=True)
            )
        elif filter_type == "archived":
            # Kullanıcının arşivlediği mesajlar
            qs = qs.filter(
                db_models.Q(sender=user,  is_archived_by_sender=True) |
                db_models.Q(recipient=user, is_archived_by_recipient=True)
            )
        else:
            # Varsayılan: arşivlenmemiş mesajlar
            qs = qs.exclude(
                db_models.Q(sender=user,  is_archived_by_sender=True) |
                db_models.Q(recipient=user, is_archived_by_recipient=True)
            )

        if search_q:
            qs = qs.filter(body__icontains=search_q)

        # Okunmamışları okundu yap (yalnızca "all" filtresinde)
        if filter_type == "all" and not search_q:
            Message.objects.filter(
                sender=other, recipient=user, is_read=False
            ).update(is_read=True)

        serializer = MessageSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class SendMessageView(APIView):
    """
    POST /api/messages/{user_id}/send/

    İstek gövdesi: { "body": "Mesaj içeriği" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        user      = request.user
        recipient = get_object_or_404(User, pk=user_id)

        if not can_communicate(user, recipient):
            return Response(
                {"detail": "Bu kullanıcıya mesaj gönderme yetkiniz yok."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            sender=user,
            recipient=recipient,
            body=serializer.validated_data["body"]
        )

        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )


class ArchiveMessageView(APIView):
    """
    POST /api/messages/{msg_id}/archive/
    POST /api/messages/{msg_id}/unarchive/

    Mesajı kullanıcı tarafında arşivle / arşivden çıkar.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, msg_id):
        user = request.user
        msg  = get_object_or_404(
            Message,
            pk=msg_id,
            **self._filter(user)
        )
        action = request.path.rstrip("/").split("/")[-1]
        if action == "archive":
            msg.archive_for(user)
            detail = "Mesaj arşivlendi."
        else:
            msg.unarchive_for(user)
            detail = "Mesaj arşivden çıkarıldı."

        return Response(
            {"detail": detail, "message": MessageSerializer(msg, context={"request": request}).data},
            status=status.HTTP_200_OK
        )

    def _filter(self, user):
        return {"sender": user} if True else {}  # sender veya recipient olabilir

    def get_object_or_403(self, msg_id, user):
        try:
            return Message.objects.get(
                db_models.Q(sender=user) | db_models.Q(recipient=user),
                pk=msg_id
            )
        except Message.DoesNotExist:
            return None


class ArchiveMsgView(APIView):
    """POST /api/messages/{msg_id}/archive/ ve /unarchive/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, msg_id):
        user = request.user
        try:
            msg = Message.objects.get(
                db_models.Q(sender=user) | db_models.Q(recipient=user),
                pk=msg_id
            )
        except Message.DoesNotExist:
            return Response({"detail": "Mesaj bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        msg.archive_for(user)
        return Response(
            {"detail": "Mesaj arşivlendi.", "message": MessageSerializer(msg, context={"request": request}).data},
            status=status.HTTP_200_OK
        )


class UnarchiveMsgView(APIView):
    """POST /api/messages/{msg_id}/unarchive/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, msg_id):
        user = request.user
        try:
            msg = Message.objects.get(
                db_models.Q(sender=user) | db_models.Q(recipient=user),
                pk=msg_id
            )
        except Message.DoesNotExist:
            return Response({"detail": "Mesaj bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        msg.unarchive_for(user)
        return Response(
            {"detail": "Mesaj arşivden çıkarıldı.", "message": MessageSerializer(msg, context={"request": request}).data},
            status=status.HTTP_200_OK
        )


class StarMsgView(APIView):
    """POST /api/messages/{msg_id}/star/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, msg_id):
        user = request.user
        try:
            msg = Message.objects.get(
                db_models.Q(sender=user) | db_models.Q(recipient=user),
                pk=msg_id
            )
        except Message.DoesNotExist:
            return Response({"detail": "Mesaj bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        msg.star_for(user)
        return Response(
            {"detail": "Mesaj yıldızlandı.", "message": MessageSerializer(msg, context={"request": request}).data},
            status=status.HTTP_200_OK
        )


class UnstarMsgView(APIView):
    """POST /api/messages/{msg_id}/unstar/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, msg_id):
        user = request.user
        try:
            msg = Message.objects.get(
                db_models.Q(sender=user) | db_models.Q(recipient=user),
                pk=msg_id
            )
        except Message.DoesNotExist:
            return Response({"detail": "Mesaj bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        msg.unstar_for(user)
        return Response(
            {"detail": "Yıldız kaldırıldı.", "message": MessageSerializer(msg, context={"request": request}).data},
            status=status.HTTP_200_OK
        )


class ArchiveAllView(APIView):
    """
    POST /api/messages/{user_id}/archive-all/

    Belirli kullanıcıyla olan tüm mesajları arşivle.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        user  = request.user
        other = get_object_or_404(User, pk=user_id)

        if not can_communicate(user, other):
            return Response(
                {"detail": "Bu kullanıcıyla mesajlaşma yetkiniz yok."},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = get_thread_qs(user, other)

        # Gönderdiği mesajlar
        qs.filter(sender=user).update(is_archived_by_sender=True)
        # Aldığı mesajlar
        qs.filter(recipient=user).update(is_archived_by_recipient=True)

        count = qs.count()
        return Response(
            {"detail": f"{count} mesaj arşivlendi."},
            status=status.HTTP_200_OK
        )


class UnreadCountView(APIView):
    """
    GET /api/messages/unread-count/

    Toplam okunmamış mesaj sayısı.
    Yanıt: { "unread_count": 3 }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({"unread_count": count})


class MessageStatsView(APIView):
    """
    GET /api/messages/stats/

    Kullanıcının mesaj istatistikleri.
    Yanıt:
        {
            "total_sent":     12,
            "total_received": 8,
            "total_unread":   2,
            "total_starred":  3,
            "total_archived": 5,
            "conversations":  1,   ← kaç farklı kişiyle konuşulmuş
        }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        sent     = Message.objects.filter(sender=user).count()
        received = Message.objects.filter(recipient=user).count()
        unread   = Message.objects.filter(recipient=user, is_read=False).count()
        starred  = Message.objects.filter(
            db_models.Q(sender=user,    is_starred_by_sender=True) |
            db_models.Q(recipient=user, is_starred_by_recipient=True)
        ).count()
        archived = Message.objects.filter(
            db_models.Q(sender=user,    is_archived_by_sender=True) |
            db_models.Q(recipient=user, is_archived_by_recipient=True)
        ).count()

        # Kaç farklı kişiyle konuşulmuş
        sent_to   = set(Message.objects.filter(sender=user).values_list("recipient_id", flat=True))
        recv_from = set(Message.objects.filter(recipient=user).values_list("sender_id", flat=True))
        conversations = len(sent_to | recv_from)

        return Response({
            "total_sent":      sent,
            "total_received":  received,
            "total_unread":    unread,
            "total_starred":   starred,
            "total_archived":  archived,
            "conversations":   conversations,
        })