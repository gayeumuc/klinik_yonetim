"""
Psikolog Klinik Yönetim Sistemi — Randevu View'ları

Endpoint özeti:
    GET    /api/appointments/              → Psikolog: kendi tüm randevuları
    POST   /api/appointments/slots/        → Psikolog: boş slot oluştur
    POST   /api/appointments/direct/       → Psikolog: danışana direkt randevu ata (pending)
    GET    /api/appointments/calendar/     → Psikolog: haftalık takvim
    GET    /api/appointments/available/    → Danışan: müsait slotları gör
    GET    /api/appointments/my/           → Danışan: kendi randevuları
    GET    /api/appointments/<id>/         → Detay
    PATCH  /api/appointments/<id>/         → Psikolog: randevu güncelle (tarih/saat/not)
    DELETE /api/appointments/<id>/         → Psikolog: randevu sil (cancelled/rejected/available)
    POST   /api/appointments/<id>/book/    → Danışan: boş slotu rezerve et
    POST   /api/appointments/<id>/confirm/ → Danışan: pending randevuyu onayla
    POST   /api/appointments/<id>/reject/  → Danışan: pending randevuyu reddet
    POST   /api/appointments/<id>/cancel/  → Psikolog veya danışan: iptal et
    POST   /api/appointments/<id>/complete/→ Psikolog: tamamlandı işaretle
    GET    /api/appointments/<id>/notes/   → Randevu notları
    POST   /api/appointments/<id>/notes/   → Not ekle
    PATCH  /api/appointments/notes/<nid>/  → Not güncelle
    DELETE /api/appointments/notes/<nid>/  → Not sil
    GET    /api/appointments/client/<id>/history/ → Danışan geçmişi
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.accounts.permissions import IsPsychologist, IsClient
from apps.accounts.models import ClientProfile
from .models import Appointment, AppointmentNote
from .serializers import (
    AppointmentSerializer,
    AppointmentListSerializer,
    AppointmentNoteSerializer,
    AppointmentNoteCreateSerializer,
    SlotCreateSerializer,
    BookAppointmentSerializer,
    CancelAppointmentSerializer,
    DirectAppointmentSerializer,
    AppointmentUpdateSerializer,
)


# ═══════════════════════════════════════════════════════════════════════════════
# PSİKOLOG — SLOT YÖNETİMİ
# ═══════════════════════════════════════════════════════════════════════════════

class SlotCreateView(generics.CreateAPIView):
    """POST /api/appointments/slots/ — Psikolog boş slot oluşturur."""
    serializer_class   = SlotCreateSerializer
    permission_classes = [IsPsychologist]

    def perform_create(self, serializer):
        serializer.save(
            psychologist=self.request.user,
            status=Appointment.Status.AVAILABLE,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except ValidationError as e:
            return Response(
                {"detail": e.message_dict if hasattr(e, "message_dict") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PsychologistAppointmentListView(generics.ListAPIView):
    """
    GET /api/appointments/
    Query: ?status=all|available|pending|booked|completed|cancelled|rejected
           ?date_from=YYYY-MM-DD  ?date_to=YYYY-MM-DD  ?client_id=<id>
    """
    serializer_class   = AppointmentListSerializer
    permission_classes = [IsPsychologist]

    def get_queryset(self):
        qs = Appointment.objects.filter(
            psychologist=self.request.user
        ).select_related("client", "client__user").prefetch_related("appointment_notes")

        status_filter = self.request.query_params.get("status", "all")
        if status_filter != "all":
            qs = qs.filter(status=status_filter)

        date_from = self.request.query_params.get("date_from")
        date_to   = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(start_time__date__gte=date_from)
        if date_to:
            qs = qs.filter(start_time__date__lte=date_to)

        client_id = self.request.query_params.get("client_id")
        if client_id:
            qs = qs.filter(client_id=client_id)

        return qs.order_by("-start_time")


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/appointments/<id>/  → Detay (notlarla birlikte)
    PATCH  /api/appointments/<id>/  → Psikolog: tarih/saat/not güncelle
    DELETE /api/appointments/<id>/  → Psikolog: sil (cancelled/rejected/available)
    """
    permission_classes = [IsAuthenticated]
    http_method_names  = ["get", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AppointmentUpdateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "psychologist":
            return Appointment.objects.filter(
                psychologist=user
            ).select_related("client", "client__user").prefetch_related("appointment_notes__author")
        elif user.role == "client":
            try:
                profile = user.client_profile
                return Appointment.objects.filter(
                    client=profile
                ).select_related("client", "client__user").prefetch_related("appointment_notes")
            except Exception:
                return Appointment.objects.none()
        return Appointment.objects.none()

    def update(self, request, *args, **kwargs):
        """Psikolog randevuyu günceller (tarih/saat/not). Tamamlanmış güncellenemez."""
        if request.user.role != "psychologist":
            return Response(
                {"detail": "Yalnızca psikolog randevu güncelleyebilir."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance = self.get_object()
        if instance.status == Appointment.Status.COMPLETED:
            return Response(
                {"detail": "Tamamlanmış randevu güncellenemez."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except ValidationError as e:
            return Response(
                {"detail": e.message_dict if hasattr(e, "message_dict") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Güncel veriyi AppointmentSerializer ile döndür
        return Response(AppointmentSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        """Psikolog randevuyu siler. Yalnızca available/cancelled/rejected silinebilir."""
        if request.user.role != "psychologist":
            return Response(
                {"detail": "Yalnızca psikolog randevu silebilir."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance = self.get_object()
        deletable = [
            Appointment.Status.AVAILABLE,
            Appointment.Status.CANCELLED,
            Appointment.Status.REJECTED,
        ]
        if instance.status not in deletable:
            return Response(
                {"detail": "Yalnızca müsait, iptal edilmiş veya reddedilmiş randevular silinebilir."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.delete()
        return Response({"detail": "Randevu silindi."}, status=status.HTTP_200_OK)


class AppointmentCompleteView(APIView):
    """POST /api/appointments/<id>/complete/ — Psikolog tamamlandı işaretler."""
    permission_classes = [IsPsychologist]

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk, psychologist=request.user)
        try:
            appointment.complete()
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Randevu tamamlandı olarak işaretlendi."}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════════
# DİREKT RANDEVU (Psikolog danışana atar → pending)
# ═══════════════════════════════════════════════════════════════════════════════

class DirectAppointmentView(APIView):
    """
    POST /api/appointments/direct/
    Psikolog danışanı seçerek randevu oluşturur → status=pending
    Danışan onaylayana kadar pending kalır.
    """
    permission_classes = [IsPsychologist]

    def post(self, request):
        serializer = DirectAppointmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        client = get_object_or_404(
            ClientProfile,
            pk=data["client_id"],
            psychologist=request.user,
        )

        # Psikolog çakışma kontrolü
        conflict = Appointment.objects.filter(
            psychologist=request.user,
            status__in=[
                Appointment.Status.AVAILABLE,
                Appointment.Status.PENDING,
                Appointment.Status.BOOKED,
            ],
            start_time__lt=data["end_time"],
            end_time__gt=data["start_time"],
        )
        if conflict.exists():
            c = conflict.first()
            return Response(
                {"detail": f"Bu zaman diliminde başka bir randevunuz var: {c.start_time.strftime('%d.%m.%Y %H:%M')}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Danışan çakışma kontrolü
        client_conflict = Appointment.objects.filter(
            client=client,
            status__in=[Appointment.Status.PENDING, Appointment.Status.BOOKED],
            start_time__lt=data["end_time"],
            end_time__gt=data["start_time"],
        )
        if client_conflict.exists():
            return Response(
                {"detail": "Danışanın bu zaman diliminde zaten bir randevusu var."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            appointment = Appointment(
                psychologist=request.user,
                client=client,
                start_time=data["start_time"],
                end_time=data["end_time"],
                status=Appointment.Status.PENDING,
                notes=data.get("notes", ""),
            )
            appointment.full_clean()
            appointment.save()
        except ValidationError as e:
            return Response(
                {"detail": e.message_dict if hasattr(e, "message_dict") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            AppointmentListSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# DANIŞAN — ONAY / RED
# ═══════════════════════════════════════════════════════════════════════════════

class ConfirmAppointmentView(APIView):
    """POST /api/appointments/<id>/confirm/ — Danışan pending randevuyu onaylar."""
    permission_classes = [IsClient]

    def post(self, request, pk):
        # client_profile ilişkisini güvenli şekilde al
        profile = getattr(request.user, "client_profile", None)
        if profile is None:
            return Response(
                {"detail": "Danışan profili bulunamadı."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment = get_object_or_404(Appointment, pk=pk, client=profile)

        if appointment.status != Appointment.Status.PENDING:
            return Response(
                {"detail": f"Bu randevu onaylanamaz. Mevcut durum: {appointment.get_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            appointment.confirm()
        except ValidationError as e:
            msg = e.message_dict if hasattr(e, "message_dict") else (
                e.messages[0] if hasattr(e, "messages") else str(e)
            )
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": "Randevu onaylandı.",
                "appointment": AppointmentListSerializer(appointment).data,
            },
            status=status.HTTP_200_OK,
        )


class RejectAppointmentView(APIView):
    """POST /api/appointments/<id>/reject/ — Danışan pending randevuyu reddeder."""
    permission_classes = [IsClient]

    def post(self, request, pk):
        profile = getattr(request.user, "client_profile", None)
        if profile is None:
            return Response(
                {"detail": "Danışan profili bulunamadı."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment = get_object_or_404(Appointment, pk=pk, client=profile)

        if appointment.status != Appointment.Status.PENDING:
            return Response(
                {"detail": f"Bu randevu reddedilemez. Mevcut durum: {appointment.get_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        try:
            appointment.reject(reason=reason)
        except ValidationError as e:
            msg = e.message_dict if hasattr(e, "message_dict") else (
                e.messages[0] if hasattr(e, "messages") else str(e)
            )
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": "Randevu reddedildi.",
                "appointment": AppointmentListSerializer(appointment).data,
            },
            status=status.HTTP_200_OK,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# RANDEVU NOTLARI
# ═══════════════════════════════════════════════════════════════════════════════

class AppointmentNoteListCreateView(APIView):
    """GET/POST /api/appointments/<pk>/notes/"""
    permission_classes = [IsPsychologist]

    def get_appointment(self, pk, user):
        return get_object_or_404(Appointment, pk=pk, psychologist=user)

    def get(self, request, pk):
        appointment = self.get_appointment(pk, request.user)
        notes = appointment.appointment_notes.select_related("author").all()
        return Response(AppointmentNoteSerializer(notes, many=True).data)

    def post(self, request, pk):
        appointment = self.get_appointment(pk, request.user)
        serializer = AppointmentNoteCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        note = AppointmentNote.objects.create(
            appointment=appointment,
            author=request.user,
            **serializer.validated_data,
        )
        return Response(AppointmentNoteSerializer(note).data, status=status.HTTP_201_CREATED)


class AppointmentNoteDetailView(APIView):
    """PATCH/DELETE /api/appointments/notes/<note_id>/"""
    permission_classes = [IsPsychologist]

    def get_note(self, note_id, user):
        return get_object_or_404(AppointmentNote, pk=note_id, author=user)

    def patch(self, request, note_id):
        note = self.get_note(note_id, request.user)
        serializer = AppointmentNoteCreateSerializer(note, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(AppointmentNoteSerializer(note).data)

    def delete(self, request, note_id):
        note = self.get_note(note_id, request.user)
        note.delete()
        return Response({"detail": "Not silindi."}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════════
# DANIŞAN GEÇMİŞİ
# ═══════════════════════════════════════════════════════════════════════════════

class ClientAppointmentHistoryView(generics.ListAPIView):
    """GET /api/appointments/client/<client_id>/history/"""
    serializer_class   = AppointmentSerializer
    permission_classes = [IsPsychologist]

    def get_queryset(self):
        client_id = self.kwargs["client_id"]
        client = get_object_or_404(ClientProfile, pk=client_id, psychologist=self.request.user)
        qs = Appointment.objects.filter(
            psychologist=self.request.user,
            client=client,
        ).select_related("client", "client__user").prefetch_related("appointment_notes__author")

        status_filter = self.request.query_params.get("status", "all")
        if status_filter != "all":
            qs = qs.filter(status=status_filter)

        return qs.order_by("-start_time")

    def list(self, request, *args, **kwargs):
        client_id = self.kwargs["client_id"]
        client = get_object_or_404(ClientProfile, pk=client_id, psychologist=request.user)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        total     = queryset.count()
        completed = queryset.filter(status="completed").count()
        cancelled = queryset.filter(status="cancelled").count()
        booked    = queryset.filter(status="booked").count()
        pending   = queryset.filter(status="pending").count()
        rejected  = queryset.filter(status="rejected").count()

        return Response({
            "client": {
                "id":         client.id,
                "first_name": client.first_name,
                "last_name":  client.last_name,
                "email":      client.user.email,
            },
            "stats": {
                "total":     total,
                "completed": completed,
                "cancelled": cancelled,
                "booked":    booked,
                "pending":   pending,
                "rejected":  rejected,
            },
            "appointments": serializer.data,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# DANIŞAN — REZERVASYON (eski akış)
# ═══════════════════════════════════════════════════════════════════════════════

class AvailableSlotsView(generics.ListAPIView):
    """GET /api/appointments/available/"""
    serializer_class   = AppointmentListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Appointment.objects.filter(
            status=Appointment.Status.AVAILABLE,
            start_time__gte=timezone.now(),
        ).select_related("client", "client__user", "psychologist")

        psychologist_id = self.request.query_params.get("psychologist_id")
        if psychologist_id:
            qs = qs.filter(psychologist_id=psychologist_id)

        date_from = self.request.query_params.get("date_from")
        date_to   = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(start_time__date__gte=date_from)
        if date_to:
            qs = qs.filter(start_time__date__lte=date_to)

        return qs.order_by("start_time")


class ClientAppointmentListView(generics.ListAPIView):
    """GET /api/appointments/my/ — Danışan kendi randevularını listeler."""
    serializer_class   = AppointmentListSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        try:
            profile = self.request.user.client_profile
        except Exception:
            return Appointment.objects.none()

        qs = Appointment.objects.filter(
            client=profile
        ).select_related("client", "client__user", "psychologist")

        status_filter = self.request.query_params.get("status", "all")
        if status_filter != "all":
            qs = qs.filter(status=status_filter)

        return qs.order_by("-start_time")


class BookAppointmentView(APIView):
    """POST /api/appointments/<id>/book/ — Danışan boş slotu rezerve eder."""
    permission_classes = [IsClient]

    def post(self, request, pk):
        appointment = get_object_or_404(
            Appointment, pk=pk, status=Appointment.Status.AVAILABLE,
        )
        try:
            client_profile = request.user.client_profile
        except Exception:
            return Response({"detail": "Danışan profili bulunamadı."}, status=status.HTTP_400_BAD_REQUEST)

        conflict = Appointment.objects.filter(
            client=client_profile,
            status__in=[Appointment.Status.PENDING, Appointment.Status.BOOKED],
            start_time__lt=appointment.end_time,
            end_time__gt=appointment.start_time,
        )
        if conflict.exists():
            return Response({"detail": "Bu zaman diliminde zaten bir randevunuz var."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BookAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            appointment.book(client_profile)
            if serializer.validated_data.get("notes"):
                appointment.notes = serializer.validated_data["notes"]
                appointment.save(update_fields=["notes"])
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AppointmentListSerializer(appointment).data, status=status.HTTP_200_OK)


class CancelAppointmentView(APIView):
    """POST /api/appointments/<id>/cancel/ — Psikolog veya danışan iptal eder."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user

        if user.role == "psychologist":
            appointment = get_object_or_404(Appointment, pk=pk, psychologist=user)
        elif user.role == "client":
            try:
                profile = user.client_profile
            except Exception:
                return Response({"detail": "Danışan profili bulunamadı."}, status=status.HTTP_400_BAD_REQUEST)
            appointment = get_object_or_404(Appointment, pk=pk, client=profile)
        else:
            return Response({"detail": "Bu işlem için yetkiniz yok."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CancelAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            appointment.cancel(reason=serializer.validated_data.get("reason", ""))
        except ValidationError as e:
            return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Randevu iptal edildi."}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════════
# HAFTALIK TAKVİM
# ═══════════════════════════════════════════════════════════════════════════════

class WeeklyCalendarView(APIView):
    """GET /api/appointments/calendar/?week_start=YYYY-MM-DD"""
    permission_classes = [IsPsychologist]

    def get(self, request):
        from datetime import date, timedelta
        import datetime as dt

        week_start_str = request.query_params.get("week_start")
        if week_start_str:
            try:
                week_start = dt.date.fromisoformat(week_start_str)
            except ValueError:
                return Response({"detail": "Geçersiz tarih formatı."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            today = date.today()
            week_start = today - timedelta(days=today.weekday())

        week_end = week_start + timedelta(days=6)

        appointments = Appointment.objects.filter(
            psychologist=request.user,
            start_time__date__gte=week_start,
            start_time__date__lte=week_end,
        ).select_related("client", "client__user").prefetch_related("appointment_notes").order_by("start_time")

        day_names = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
        days = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            day_appts = [a for a in appointments if a.start_time.date() == day_date]
            days.append({
                "date":         day_date.isoformat(),
                "day_name":     day_names[i],
                "is_today":     day_date == date.today(),
                "appointments": AppointmentListSerializer(day_appts, many=True).data,
            })

        return Response({
            "week_start":  week_start.isoformat(),
            "week_end":    week_end.isoformat(),
            "days":        days,
            "total_count": appointments.count(),
        })
