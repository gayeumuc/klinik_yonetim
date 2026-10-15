"""
Psikolog Klinik Yönetim Sistemi — Klinik Kayıt URL Yapılandırması
Tüm endpoint'ler /api/clinical/ prefix'i ile erişilir.

ÖNEMLİ: Sabit path'ler (my/, assign/, assignments/, vb.) her zaman
<int:pk> içeren dinamik path'lerden ÖNCE tanımlanmalıdır.
Django URL'leri sırayla eşleştirir; aksi hâlde "my" gibi string'ler
integer pk olarak yorumlanmaya çalışılır ve 404/hata üretir.
"""
from django.urls import path
from . import views

urlpatterns = [
    # ── Seans Notları ─────────────────────────────────────────────────────────
    # Sabit path'ler önce:
    path("notes/",                          views.SessionNoteListCreateView.as_view(),         name="note-list-create"),
    path("notes/client/",                   views.ClientSessionNotesView.as_view(),            name="note-client-list"),
    path("notes/completed-appointments/",   views.CompletedAppointmentsForNotesView.as_view(), name="note-completed-appointments"),
    # Dinamik path'ler sonra:
    path("notes/<int:pk>/",                 views.SessionNoteDetailView.as_view(),             name="note-detail"),

    # ── Ödevler ───────────────────────────────────────────────────────────────
    # Sabit path'ler önce:
    path("tasks/",          views.TaskListCreateView.as_view(),  name="task-list-create"),
    path("tasks/my/",       views.ClientTaskListView.as_view(),  name="task-my-list"),
    # Dinamik path'ler sonra:
    path("tasks/<int:pk>/",           views.TaskDetailView.as_view(),   name="task-detail"),
    path("tasks/<int:pk>/complete/",  views.TaskCompleteView.as_view(), name="task-complete"),
    path("tasks/<int:pk>/reopen/",    views.TaskReopenView.as_view(),   name="task-reopen"),

    # ── Testler ───────────────────────────────────────────────────────────────
    # Sabit path'ler önce:
    path("tests/",                 views.PsychTestListCreateView.as_view(),       name="test-list-create"),
    path("tests/assign/",          views.TestAssignView.as_view(),                name="test-assign"),
    path("tests/assignments/",     views.TestAssignmentListView.as_view(),        name="test-assignment-list"),
    path("tests/my-assignments/",  views.ClientTestAssignmentListView.as_view(),  name="test-my-assignments"),
    path("tests/questions/<int:pk>/", views.TestQuestionDeleteView.as_view(),     name="test-question-delete"),
    # assignments/ alt path'leri (sabit olanlar önce):
    path("tests/assignments/<int:pk>/submit/",  views.TestSubmitView.as_view(),              name="test-submit"),
    path("tests/assignments/<int:pk>/comment/", views.TestAssignmentCommentView.as_view(),   name="test-comment"),
    path("tests/assignments/<int:pk>/",         views.TestAssignmentDetailView.as_view(),    name="test-assignment-detail"),
    # tests/<pk>/ en sona:
    path("tests/<int:pk>/questions/",  views.TestQuestionCreateView.as_view(),  name="test-question-create"),
    path("tests/<int:pk>/",            views.PsychTestDetailView.as_view(),     name="test-detail"),
]