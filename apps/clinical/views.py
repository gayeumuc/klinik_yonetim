"""
Psikolog Klinik Yönetim Sistemi — Klinik Kayıt View'ları

Seans Notları:
    GET    /api/clinical/notes/                    → Psikolog: danışana göre filtreli liste
    POST   /api/clinical/notes/                    → Psikolog: yeni not oluştur
    GET    /api/clinical/notes/<id>/               → Psikolog: detay
    PATCH  /api/clinical/notes/<id>/               → Psikolog: güncelle
    DELETE /api/clinical/notes/<id>/               → Psikolog: sil
    GET    /api/clinical/notes/client/             → Danışan: paylaşılan notları gör

Ödevler:
    GET    /api/clinical/tasks/                    → Psikolog: danışana göre filtreli liste
    POST   /api/clinical/tasks/                    → Psikolog: ödev ata
    GET    /api/clinical/tasks/<id>/               → Detay
    PATCH  /api/clinical/tasks/<id>/               → Psikolog: güncelle
    DELETE /api/clinical/tasks/<id>/               → Psikolog: sil
    POST   /api/clinical/tasks/<id>/complete/      → Danışan veya psikolog: tamamla
    POST   /api/clinical/tasks/<id>/reopen/        → Psikolog: yeniden aç
    GET    /api/clinical/tasks/my/                 → Danışan: kendi ödevleri

Testler:
    GET    /api/clinical/tests/                    → Psikolog: test listesi
    POST   /api/clinical/tests/                    → Psikolog: test oluştur
    GET    /api/clinical/tests/<id>/               → Detay (sorularla)
    PATCH  /api/clinical/tests/<id>/               → Psikolog: güncelle
    DELETE /api/clinical/tests/<id>/               → Psikolog: sil
    POST   /api/clinical/tests/<id>/questions/     → Psikolog: soru ekle
    DELETE /api/clinical/tests/questions/<id>/     → Psikolog: soru sil
    POST   /api/clinical/tests/assign/             → Psikolog: danışana test ata
    GET    /api/clinical/tests/assignments/        → Psikolog: atama listesi
    GET    /api/clinical/tests/assignments/<id>/   → Atama detayı
    POST   /api/clinical/tests/assignments/<id>/submit/ → Danışan: yanıtları gönder
    PATCH  /api/clinical/tests/assignments/<id>/comment/ → Psikolog: yorum ekle
    GET    /api/clinical/tests/my-assignments/     → Danışan: kendi test atamaları
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from apps.accounts.permissions import IsPsychologist, IsClient
from apps.accounts.models import ClientProfile
from .models import SessionNote, Task, PsychTest, TestQuestion, TestAssignment, TestAnswer
from .serializers import (
    SessionNoteSerializer, SessionNoteClientSerializer,
    TaskSerializer, TaskCompleteSerializer,
    PsychTestSerializer, PsychTestListSerializer,
    TestQuestionSerializer,
    TestAssignmentSerializer, TestAssignmentListSerializer,
    TestSubmitSerializer,
)


# ═══════════════════════════════════════════════════════════════════════════════
# SEANS NOTLARI
# ═══════════════════════════════════════════════════════════════════════════════

class SessionNoteListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/clinical/notes/  → Psikolog: kendi notları (client_id filtresi)
    POST /api/clinical/notes/  → Psikolog: yeni not
    """
    serializer_class   = SessionNoteSerializer
    permission_classes = [IsPsychologist]

    def get_queryset(self):
        qs = SessionNote.objects.filter(
            psychologist=self.request.user
        ).select_related("client", "client__user")

        client_id = self.request.query_params.get("client_id")
        if client_id:
            qs = qs.filter(client_id=client_id)

        date_from = self.request.query_params.get("date_from")
        date_to   = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(session_date__gte=date_from)
        if date_to:
            qs = qs.filter(session_date__lte=date_to)

        return qs.order_by("-session_date")

    def perform_create(self, serializer):
        # client psikologun danışanı mı kontrol et
        client = serializer.validated_data.get("client")
        if client and client.psychologist != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bu danışan size ait değil.")
        serializer.save(psychologist=self.request.user)


class SessionNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/clinical/notes/<id>/
    PATCH  /api/clinical/notes/<id>/
    DELETE /api/clinical/notes/<id>/
    """
    serializer_class   = SessionNoteSerializer
    permission_classes = [IsPsychologist]
    http_method_names  = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return SessionNote.objects.filter(psychologist=self.request.user)


class ClientSessionNotesView(generics.ListAPIView):
    """
    GET /api/clinical/notes/client/
    Danışan yalnızca is_shared=True olan notları görür.
    """
    serializer_class   = SessionNoteClientSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        try:
            profile = self.request.user.client_profile
        except Exception:
            return SessionNote.objects.none()
        return SessionNote.objects.filter(
            client=profile,
            is_shared=True,
        ).order_by("-session_date")


class CompletedAppointmentsForNotesView(APIView):
    """
    GET /api/clinical/notes/completed-appointments/
    Psikolog: Notu olmayan veya notu olan tamamlanan randevuları listeler.
    Seans Notları sekmesinde tamamlanan görüşmeleri göstermek için kullanılır.
    """
    permission_classes = [IsPsychologist]

    def get(self, request):
        from apps.appointments.models import Appointment
        from apps.appointments.serializers import AppointmentListSerializer

        appointments = Appointment.objects.filter(
            psychologist=request.user,
            status="completed",
        ).select_related("client", "client__user").prefetch_related("session_note").order_by("-start_time")

        result = []
        for appt in appointments:
            # Randevuya bağlı seans notu var mı?
            try:
                note = appt.session_note
                note_data = {
                    "id": note.id,
                    "content": note.content,
                    "mood_score": note.mood_score,
                    "mood_score_display": note.get_mood_score_display(),
                    "is_shared": note.is_shared,
                    "created_at": note.created_at,
                }
            except Exception:
                note_data = None

            result.append({
                "appointment_id": appt.id,
                "client_id": appt.client.id,
                "client_name": f"{appt.client.first_name} {appt.client.last_name}",
                "start_time": appt.start_time,
                "end_time": appt.end_time,
                "duration_minutes": appt.duration_minutes,
                "session_date": appt.start_time.date().isoformat(),
                "session_note": note_data,
            })

        return Response(result)


# ═══════════════════════════════════════════════════════════════════════════════
# ÖDEVLER
# ═══════════════════════════════════════════════════════════════════════════════

class TaskListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/clinical/tasks/  → Psikolog: ödev listesi
    POST /api/clinical/tasks/  → Psikolog: ödev ata
    """
    serializer_class   = TaskSerializer
    permission_classes = [IsPsychologist]

    def get_queryset(self):
        qs = Task.objects.filter(
            psychologist=self.request.user
        ).select_related("client", "client__user")

        client_id = self.request.query_params.get("client_id")
        if client_id:
            qs = qs.filter(client_id=client_id)

        completed = self.request.query_params.get("completed")
        if completed == "true":
            qs = qs.filter(is_completed=True)
        elif completed == "false":
            qs = qs.filter(is_completed=False)

        return qs

    def perform_create(self, serializer):
        client = serializer.validated_data.get("client")
        if client and client.psychologist != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bu danışan size ait değil.")
        serializer.save(psychologist=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/clinical/tasks/<id>/
    PATCH  /api/clinical/tasks/<id>/
    DELETE /api/clinical/tasks/<id>/
    """
    serializer_class   = TaskSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "psychologist":
            return Task.objects.filter(psychologist=user)
        elif user.role == "client":
            try:
                return Task.objects.filter(client=user.client_profile)
            except Exception:
                return Task.objects.none()
        return Task.objects.none()

    def update(self, request, *args, **kwargs):
        if request.user.role != "psychologist":
            return Response(
                {"detail": "Yalnızca psikolog ödev güncelleyebilir."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "psychologist":
            return Response(
                {"detail": "Yalnızca psikolog ödev silebilir."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class TaskCompleteView(APIView):
    """POST /api/clinical/tasks/<id>/complete/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role == "psychologist":
            task = get_object_or_404(Task, pk=pk, psychologist=user)
        elif user.role == "client":
            try:
                task = get_object_or_404(Task, pk=pk, client=user.client_profile)
            except Exception:
                return Response({"detail": "Ödev bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"detail": "Yetki yok."}, status=status.HTTP_403_FORBIDDEN)

        if task.is_completed:
            return Response({"detail": "Ödev zaten tamamlanmış."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TaskCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task.complete(note=serializer.validated_data.get("completion_note", ""))
        return Response({"detail": "Ödev tamamlandı olarak işaretlendi."}, status=status.HTTP_200_OK)


class TaskReopenView(APIView):
    """POST /api/clinical/tasks/<id>/reopen/"""
    permission_classes = [IsPsychologist]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk, psychologist=request.user)
        if not task.is_completed:
            return Response({"detail": "Ödev zaten açık."}, status=status.HTTP_400_BAD_REQUEST)
        task.reopen()
        return Response({"detail": "Ödev yeniden açıldı."}, status=status.HTTP_200_OK)


class ClientTaskListView(generics.ListAPIView):
    """GET /api/clinical/tasks/my/  → Danışan kendi ödevleri"""
    serializer_class   = TaskSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        try:
            profile = self.request.user.client_profile
        except Exception:
            return Task.objects.none()

        qs = Task.objects.filter(client=profile).select_related("psychologist")
        completed = self.request.query_params.get("completed")
        if completed == "true":
            qs = qs.filter(is_completed=True)
        elif completed == "false":
            qs = qs.filter(is_completed=False)
        return qs


# ═══════════════════════════════════════════════════════════════════════════════
# PSİKOLOJİK TESTLER
# ═══════════════════════════════════════════════════════════════════════════════

class PsychTestListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/clinical/tests/  → Psikolog: test listesi
    POST /api/clinical/tests/  → Psikolog: test oluştur
    """
    permission_classes = [IsPsychologist]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PsychTestSerializer
        return PsychTestListSerializer

    def get_queryset(self):
        return PsychTest.objects.filter(
            psychologist=self.request.user
        ).prefetch_related("questions")

    def perform_create(self, serializer):
        serializer.save(psychologist=self.request.user)


class PsychTestDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/clinical/tests/<id>/
    PATCH  /api/clinical/tests/<id>/
    DELETE /api/clinical/tests/<id>/
    """
    serializer_class   = PsychTestSerializer
    permission_classes = [IsPsychologist]
    http_method_names  = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return PsychTest.objects.filter(
            psychologist=self.request.user
        ).prefetch_related("questions")


class TestQuestionCreateView(APIView):
    """POST /api/clinical/tests/<id>/questions/  → Psikolog: soru ekle"""
    permission_classes = [IsPsychologist]

    def post(self, request, pk):
        test = get_object_or_404(PsychTest, pk=pk, psychologist=request.user)
        serializer = TestQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # order değerini güvenli hesapla — mevcut max order + 1
        # unique_together çakışmasını önlemek için count yerine max kullan
        from django.db.models import Max
        max_order = test.questions.aggregate(Max("order"))["order__max"] or 0
        next_order = max_order + 1

        question = serializer.save(test=test, order=next_order)
        return Response(TestQuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class TestQuestionDeleteView(APIView):
    """DELETE /api/clinical/tests/questions/<id>/"""
    permission_classes = [IsPsychologist]

    def delete(self, request, pk):
        question = get_object_or_404(
            TestQuestion,
            pk=pk,
            test__psychologist=request.user,
        )
        question.delete()
        return Response({"detail": "Soru silindi."}, status=status.HTTP_200_OK)


class TestAssignView(APIView):
    """
    POST /api/clinical/tests/assign/
    {
        "test": <id>,
        "client": <client_profile_id>,
        "due_date": "2024-07-01"  (opsiyonel)
    }
    """
    permission_classes = [IsPsychologist]

    def post(self, request):
        test_id   = request.data.get("test")
        client_id = request.data.get("client")
        due_date  = request.data.get("due_date")

        if not test_id or not client_id:
            return Response(
                {"detail": "test ve client alanları zorunludur."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        test   = get_object_or_404(PsychTest, pk=test_id, psychologist=request.user)
        client = get_object_or_404(ClientProfile, pk=client_id, psychologist=request.user)

        assignment = TestAssignment.objects.create(
            test=test,
            client=client,
            assigned_by=request.user,
            due_date=due_date or None,
        )
        return Response(
            TestAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )


class TestAssignmentListView(generics.ListAPIView):
    """GET /api/clinical/tests/assignments/  → Psikolog: atama listesi"""
    serializer_class   = TestAssignmentListSerializer
    permission_classes = [IsPsychologist]

    def get_queryset(self):
        qs = TestAssignment.objects.filter(
            assigned_by=self.request.user
        ).select_related("test", "client", "client__user")

        client_id = self.request.query_params.get("client_id")
        if client_id:
            qs = qs.filter(client_id=client_id)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs


class TestAssignmentDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/clinical/tests/assignments/<id>/  → Atama detayı
    DELETE /api/clinical/tests/assignments/<id>/  → Psikolog: atamayı sil
    """
    serializer_class   = TestAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "psychologist":
            return TestAssignment.objects.filter(
                assigned_by=user
            ).select_related("test").prefetch_related(
                "test__questions",
                "answers__question",
            )
        elif user.role == "client":
            try:
                return TestAssignment.objects.filter(
                    client=user.client_profile
                ).select_related("test").prefetch_related(
                    "test__questions",
                    "answers__question",
                )
            except Exception:
                return TestAssignment.objects.none()
        return TestAssignment.objects.none()

    def destroy(self, request, *args, **kwargs):
        """Yalnızca psikolog silebilir."""
        if request.user.role != "psychologist":
            from rest_framework.response import Response
            from rest_framework import status as drf_status
            return Response(
                {"detail": "Atamayı silme yetkisi yalnızca psikologdadır."},
                status=drf_status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class TestSubmitView(APIView):
    """
    POST /api/clinical/tests/assignments/<id>/submit/
    Danışan test yanıtlarını gönderir, sistem otomatik puanlar.
    """
    permission_classes = [IsClient]

    def post(self, request, pk):
        try:
            profile = request.user.client_profile
        except Exception:
            return Response({"detail": "Danışan profili bulunamadı."}, status=status.HTTP_400_BAD_REQUEST)

        assignment = get_object_or_404(
            TestAssignment,
            pk=pk,
            client=profile,
            status=TestAssignment.Status.PENDING,
        )

        serializer = TestSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        answers_data = serializer.validated_data["answers"]

        # Mevcut yanıtları sil (yeniden gönderim desteği)
        assignment.answers.all().delete()

        for ans in answers_data:
            question = ans.get("question")
            if question and question.test != assignment.test:
                return Response(
                    {"detail": f"Soru {question.id} bu teste ait değil."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            TestAnswer.objects.create(
                assignment=assignment,
                question=question,
                text_value=ans.get("text_value", ""),
                numeric_value=ans.get("numeric_value"),
            )

        # Puanla ve tamamla
        assignment.calculate_score()
        assignment.status       = TestAssignment.Status.COMPLETED
        assignment.completed_at = timezone.now()
        assignment.save(update_fields=["status", "completed_at"])

        return Response(
            {
                "detail": "Test tamamlandı.",
                "total_score": assignment.total_score,
            },
            status=status.HTTP_200_OK,
        )


class TestAssignmentCommentView(APIView):
    """PATCH /api/clinical/tests/assignments/<id>/comment/  → Psikolog yorum ekle"""
    permission_classes = [IsPsychologist]

    def patch(self, request, pk):
        assignment = get_object_or_404(
            TestAssignment,
            pk=pk,
            assigned_by=request.user,
        )
        comment = request.data.get("psychologist_comment", "")
        assignment.psychologist_comment = comment
        assignment.save(update_fields=["psychologist_comment"])
        return Response({"detail": "Yorum kaydedildi."}, status=status.HTTP_200_OK)


class ClientTestAssignmentListView(generics.ListAPIView):
    """GET /api/clinical/tests/my-assignments/  → Danışan kendi test atamaları"""
    serializer_class   = TestAssignmentSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        try:
            profile = self.request.user.client_profile
        except Exception:
            return TestAssignment.objects.none()

        qs = TestAssignment.objects.filter(
            client=profile
        ).select_related("test").prefetch_related("test__questions")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs
