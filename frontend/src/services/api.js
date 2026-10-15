/**
 * API Servis Katmanı
 * Django backend ile tüm iletişim bu dosya üzerinden yapılır.
 * JWT token yönetimi otomatik olarak axios interceptor ile sağlanır.
 */
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api";

// Axios instance — tüm isteklere base URL ekler
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Token yenileme işlemi sırasında bekleyen istekleri tutan kuyruk
let isRefreshing = false;
let failedQueue  = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// ── Request Interceptor: Her isteğe access token ekle ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: 401 gelince token yenile ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auth endpoint'lerinde döngüsel yenileme yapma
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/me/") ||
      originalRequest.url?.includes("/auth/login/") ||
      originalRequest.url?.includes("/auth/token/refresh/") ||
      originalRequest.url?.includes("/auth/logout/");

    // 401 değilse veya zaten retry yapıldıysa veya auth endpoint'iyse direkt hata fırlat
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    // Refresh token yoksa direkt hata fırlat
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      localStorage.clear();
      return Promise.reject(error);
    }

    // Zaten yenileme yapılıyorsa kuyruğa ekle
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken  = res.data.access;
      const newRefreshToken = res.data.refresh; // ROTATE_REFRESH_TOKENS=True

      localStorage.setItem("access_token",  newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      }

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization     = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token da geçersizse storage'ı temizle
      processQueue(refreshError, null);
      localStorage.clear();
      // Yönlendirmeyi AuthContext halleder — burada window.location kullanmıyoruz
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post("/auth/login/", data),
  register:       (data) => api.post("/auth/register/", data),
  logout:         (refresh) => api.post("/auth/logout/", { refresh }),
  me:             () => api.get("/auth/me/"),
  updateMe:       (data) => api.patch("/auth/me/", data),
  changePassword: (data) => api.post("/auth/change-password/", data),

  // Şifre sıfırlama (e-posta tabanlı)
  passwordResetRequest: (email) =>
    api.post("/auth/password-reset/", { email }),
  passwordResetConfirm: (data) =>
    api.post("/auth/password-reset/confirm/", data),
};

// ── Psikolog Profili API ──────────────────────────────────────────────────────
export const psychologistAPI = {
  getPublicList:  () => api.get("/profiles/psychologists/public/"),
  getMyProfile:   () => api.get("/profiles/psychologist/"),
  updateProfile:  (data) => api.patch("/profiles/psychologist/", data),
};

// ── Danışan Profili API ───────────────────────────────────────────────────────
export const clientAPI = {
  // Yalnızca aktif danışanlar (liste/oluşturma)
  list:           () => api.get("/profiles/clients/"),
  // Aktif + pasif tüm danışanlar (dashboard istatistikleri için)
  listAll:        () => api.get("/profiles/clients/all/"),
  // Danışan listesini CSV olarak indir
  exportCSV:      () => api.get("/profiles/clients/export/", { responseType: "blob" }),
  create:         (data) => api.post("/profiles/clients/", data),
  get:            (id) => api.get(`/profiles/clients/${id}/`),
  update:         (id, data) => api.patch(`/profiles/clients/${id}/`, data),
  // Soft delete — danışanı pasife alır (is_active=False)
  delete:         (id) => api.delete(`/profiles/clients/${id}/`),
  // Danışanı tekrar aktif yap
  activate:       (id) => api.post(`/profiles/clients/${id}/activate/`),
  // Hard delete — danışanı ve kullanıcı hesabını kalıcı siler
  hardDelete:     (id) => api.delete(`/profiles/clients/${id}/hard-delete/`),
  // Psikolog tarafından danışan şifre sıfırlama
  resetPassword:  (id, newPassword) => api.post(`/profiles/clients/${id}/reset-password/`, newPassword ? { new_password: newPassword } : {}),
  // Danışana davet e-postası gönder
  invite:         (id) => api.post(`/profiles/clients/${id}/invite/`),
  myProfile:      () => api.get("/profiles/my-profile/"),
  updateMyProfile:(data) => api.patch("/profiles/my-profile/", data),
};

// ── Randevu API ───────────────────────────────────────────────────────────────
export const appointmentAPI = {
  // Psikolog: slot yönetimi
  list:        (params = {}) => api.get("/appointments/", { params }),
  createSlot:  (data) => api.post("/appointments/slots/", data),
  detail:      (id) => api.get(`/appointments/${id}/`),
  update:      (id, data) => api.patch(`/appointments/${id}/`, data),
  deleteSlot:  (id) => api.delete(`/appointments/${id}/`),
  complete:    (id) => api.post(`/appointments/${id}/complete/`),

  // Psikolog: direkt randevu oluştur (danışan seçerek, tek adımda)
  createDirect: (data) => api.post("/appointments/direct/", data),

  // Psikolog: haftalık takvim
  calendar:    (weekStart) => api.get("/appointments/calendar/", { params: weekStart ? { week_start: weekStart } : {} }),

  // Danışan: rezervasyon
  available:   (params = {}) => api.get("/appointments/available/", { params }),
  myList:      (params = {}) => api.get("/appointments/my/", { params }),
  book:        (id, data = {}) => api.post(`/appointments/${id}/book/`, data),
  // Danışan: onay / red
  confirm:     (id) => api.post(`/appointments/${id}/confirm/`),
  reject:      (id, reason = "") => api.post(`/appointments/${id}/reject/`, { reason }),
  // Ortak: iptal
  cancel:      (id, reason = "") => api.post(`/appointments/${id}/cancel/`, { reason }),
  // Psikolog: sil (cancelled/rejected/available)
  delete:      (id) => api.delete(`/appointments/${id}/`),

  // ── Randevu Notları ──────────────────────────────────────────────────────
  notes: {
    list:   (appointmentId) => api.get(`/appointments/${appointmentId}/notes/`),
    create: (appointmentId, data) => api.post(`/appointments/${appointmentId}/notes/`, data),
    update: (noteId, data) => api.patch(`/appointments/notes/${noteId}/`, data),
    delete: (noteId) => api.delete(`/appointments/notes/${noteId}/`),
  },

  // ── Danışan Randevu Geçmişi ──────────────────────────────────────────────
  clientHistory: (clientId, params = {}) =>
    api.get(`/appointments/client/${clientId}/history/`, { params }),
};

// ── Klinik Kayıt API ──────────────────────────────────────────────────────────
export const clinicalAPI = {
  // Seans Notları
  notes: {
    list:                  (params = {}) => api.get("/clinical/notes/", { params }),
    create:                (data) => api.post("/clinical/notes/", data),
    get:                   (id) => api.get(`/clinical/notes/${id}/`),
    update:                (id, data) => api.patch(`/clinical/notes/${id}/`, data),
    delete:                (id) => api.delete(`/clinical/notes/${id}/`),
    myList:                () => api.get("/clinical/notes/client/"),
    completedAppointments: () => api.get("/clinical/notes/completed-appointments/"),
  },
  // Ödevler
  tasks: {
    list:     (params = {}) => api.get("/clinical/tasks/", { params }),
    create:   (data) => api.post("/clinical/tasks/", data),
    get:      (id) => api.get(`/clinical/tasks/${id}/`),
    update:   (id, data) => api.patch(`/clinical/tasks/${id}/`, data),
    delete:   (id) => api.delete(`/clinical/tasks/${id}/`),
    complete: (id, note = "") => api.post(`/clinical/tasks/${id}/complete/`, { completion_note: note }),
    reopen:   (id) => api.post(`/clinical/tasks/${id}/reopen/`),
    myList:   (params = {}) => api.get("/clinical/tasks/my/", { params }),
  },
  // Testler
  tests: {
    list:           (params = {}) => api.get("/clinical/tests/", { params }),
    create:         (data) => api.post("/clinical/tests/", data),
    get:            (id) => api.get(`/clinical/tests/${id}/`),
    update:         (id, data) => api.patch(`/clinical/tests/${id}/`, data),
    delete:         (id) => api.delete(`/clinical/tests/${id}/`),
    addQuestion:    (testId, data) => api.post(`/clinical/tests/${testId}/questions/`, data),
    deleteQuestion: (qId) => api.delete(`/clinical/tests/questions/${qId}/`),
    assign:            (data) => api.post("/clinical/tests/assign/", data),
    assignments:       (params = {}) => api.get("/clinical/tests/assignments/", { params }),
    assignment:        (id) => api.get(`/clinical/tests/assignments/${id}/`),
    deleteAssignment:  (id) => api.delete(`/clinical/tests/assignments/${id}/`),
    submit:            (id, answers) => api.post(`/clinical/tests/assignments/${id}/submit/`, { answers }),
    comment:           (id, comment) => api.patch(`/clinical/tests/assignments/${id}/comment/`, { psychologist_comment: comment }),
    myAssignments:     (params = {}) => api.get("/clinical/tests/my-assignments/", { params }),
  },
};

// ── Çalışma Saatleri API ──────────────────────────────────────────────────────
export const workingHoursAPI = {
  list:       () => api.get("/profiles/working-hours/"),
  create:     (data) => api.post("/profiles/working-hours/", data),
  update:     (id, data) => api.patch(`/profiles/working-hours/${id}/`, data),
  delete:     (id) => api.delete(`/profiles/working-hours/${id}/`),
  bulkUpdate: (data) => api.post("/profiles/working-hours/bulk/", data),
};

// ── Davet Onayı API ───────────────────────────────────────────────────────────
export const inviteAPI = {
  confirm: (data) => api.post("/auth/invite/confirm/", data),
};

// ── Mesajlaşma API ────────────────────────────────────────────────────────────
export const messageAPI = {
  // Konuşma listesi — show: "active" (varsayılan) | "archived"
  conversations:  (show = "active") => api.get("/messages/", { params: { show } }),

  // Mesaj geçmişi — filter: all | starred, q: arama terimi
  thread:         (userId, filter = "all", q = "") =>
    api.get(`/messages/${userId}/`, { params: { filter, ...(q ? { q } : {}) } }),

  // Mesaj gönder
  send:           (userId, body) => api.post(`/messages/${userId}/send/`, { body }),

  // Okunmamış mesaj sayısı
  unreadCount:    () => api.get("/messages/unread-count/"),

  // Mesaj istatistikleri
  stats:          () => api.get("/messages/stats/"),

  // Konuşma arşivleme (kişi bazlı)
  archiveConversation:   (userId) => api.post(`/messages/${userId}/archive-conversation/`),
  unarchiveConversation: (userId) => api.post(`/messages/${userId}/unarchive-conversation/`),

  // Tek mesaj: yıldızla / yıldızı kaldır
  star:           (msgId) => api.post(`/messages/${msgId}/star/`),
  unstar:         (msgId) => api.post(`/messages/${msgId}/unstar/`),
};

export default api;