import { isAxiosError } from "axios";

import { http } from "./http";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantSpeechRequest,
} from "@aurora/shared";

type CacheEntry<T> = {
  value: T | null;
  expiresAt: number;
  pending: Promise<T> | null;
};

function createCachedLoader<T>(loader: () => Promise<T>, ttl = 30_000) {
  const entry: CacheEntry<T> = {
    value: null,
    expiresAt: 0,
    pending: null,
  };

  async function get(force = false): Promise<T> {
    const now = Date.now();
    if (!force && entry.value !== null && entry.expiresAt > now) {
      return entry.value;
    }

    if (entry.pending) {
      return entry.pending;
    }

    entry.pending = loader()
      .then((result) => {
        entry.value = result;
        entry.expiresAt = Date.now() + ttl;
        return result;
      })
      .finally(() => {
        entry.pending = null;
      });

    return entry.pending;
  }

  function invalidate() {
    entry.value = null;
    entry.expiresAt = 0;
    entry.pending = null;
  }

  return {
    get,
    invalidate,
  };
}

const categoriesListCache = createCachedLoader(() =>
  http.get("/categories").then((res) => res.data),
);
const tagsListCache = createCachedLoader(() =>
  http.get("/tags").then((res) => res.data),
);
const settingsCache = createCachedLoader(() =>
  http.get("/settings/site").then((res) => res.data),
);
const rolesListCache = createCachedLoader(() =>
  http.get("/roles").then((res) => res.data),
);
const rolePermissionsCache = createCachedLoader(
  () => http.get("/roles/permissions").then((res) => res.data),
  60_000,
);

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    http.post("/auth/login", payload).then((res) => res.data),
  requestEmailCode: (payload: {
    email: string;
    purpose: "register" | "resetPassword";
  }) => http.post("/auth/email-code", payload).then((res) => res.data),
  register: (payload: {
    name: string;
    email: string;
    password: string;
    code: string;
  }) => http.post("/auth/register", payload).then((res) => res.data),
  resetPassword: (payload: { email: string; password: string; code: string }) =>
    http.post("/auth/password/reset", payload).then((res) => res.data),
  me: () => http.get("/auth/me").then((res) => res.data),
};

function shouldFallbackToPublicAssistant(error: unknown) {
  return isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
}

export const assistantApi = {
  chat: (payload: AssistantChatRequest) =>
    http
      .post<AssistantChatResponse>("/assistant/admin-chat", payload)
      .then((res) => res.data)
      .catch((error) => {
        if (!shouldFallbackToPublicAssistant(error)) {
          throw error;
        }

        return http
          .post<AssistantChatResponse>("/assistant/public-chat", payload)
          .then((res) => res.data);
      }),
  speech: (payload: AssistantSpeechRequest) =>
    http
      .post<Blob>("/assistant/admin-speech", payload, {
        responseType: "blob",
      })
      .then((res) => res.data)
      .catch((error) => {
        if (!shouldFallbackToPublicAssistant(error)) {
          throw error;
        }

        return http
          .post<Blob>("/assistant/public-speech", payload, {
            responseType: "blob",
          })
          .then((res) => res.data);
      }),
};

export const dashboardApi = {
  metrics: () => http.get("/dashboard/metrics").then((res) => res.data),
};

export const postsApi = {
  list: (params?: Record<string, unknown>) =>
    http.get("/posts", { params }).then((res) => res.data),
  detail: (id: string) => http.get(`/posts/${id}`).then((res) => res.data),
  create: (payload: unknown) =>
    http.post("/posts", payload).then((res) => res.data),
  update: (id: string, payload: unknown) =>
    http.patch(`/posts/${id}`, payload).then((res) => res.data),
  revisions: (id: string) =>
    http.get(`/posts/${id}/revisions`).then((res) => res.data),
  restoreRevision: (id: string, revisionId: string, payload?: unknown) =>
    http
      .post(`/posts/${id}/revisions/${revisionId}/restore`, payload ?? {})
      .then((res) => res.data),
  toggleStatus: (id: string, status: "DRAFT" | "PUBLISHED") =>
    http.patch(`/posts/${id}/status`, { status }).then((res) => res.data),
  toggleFeatured: (id: string, featured: boolean) =>
    http.patch(`/posts/${id}/featured`, { featured }).then((res) => res.data),
  remove: (id: string) => http.delete(`/posts/${id}`).then((res) => res.data),
};

export const categoriesApi = {
  list: (force = false) => categoriesListCache.get(force),
  create: (payload: unknown) =>
    http.post("/categories", payload).then((res) => {
      categoriesListCache.invalidate();
      return res.data;
    }),
  update: (id: string, payload: unknown) =>
    http.patch(`/categories/${id}`, payload).then((res) => {
      categoriesListCache.invalidate();
      return res.data;
    }),
  toggleVisible: (id: string, visible: boolean) =>
    http.patch(`/categories/${id}/visibility`, { visible }).then((res) => {
      categoriesListCache.invalidate();
      return res.data;
    }),
  remove: (id: string) =>
    http.delete(`/categories/${id}`).then((res) => {
      categoriesListCache.invalidate();
      return res.data;
    }),
};

export const tagsApi = {
  list: (force = false) => tagsListCache.get(force),
  create: (payload: unknown) =>
    http.post("/tags", payload).then((res) => {
      tagsListCache.invalidate();
      return res.data;
    }),
  update: (id: string, payload: unknown) =>
    http.patch(`/tags/${id}`, payload).then((res) => {
      tagsListCache.invalidate();
      return res.data;
    }),
  toggleVisible: (id: string, visible: boolean) =>
    http.patch(`/tags/${id}/visibility`, { visible }).then((res) => {
      tagsListCache.invalidate();
      return res.data;
    }),
  remove: (id: string) =>
    http.delete(`/tags/${id}`).then((res) => {
      tagsListCache.invalidate();
      return res.data;
    }),
};

export const commentsApi = {
  list: () => http.get("/comments").then((res) => res.data),
  threads: (params?: Record<string, unknown>) =>
    http.get("/comments/threads", { params }).then((res) => res.data),
  getRules: () => http.get("/comments/rules").then((res) => res.data),
  updateRules: (payload: unknown) =>
    http.patch("/comments/rules", payload).then((res) => res.data),
  update: (id: string, payload: unknown) =>
    http.patch(`/comments/${id}`, payload).then((res) => res.data),
  review: (id: string, approved: boolean) =>
    http.patch(`/comments/${id}/review`, { approved }).then((res) => res.data),
  remove: (id: string) =>
    http.delete(`/comments/${id}`).then((res) => res.data),
};

export const mediaApi = {
  list: (params?: Record<string, unknown>) =>
    http.get("/media", { params }).then((res) => res.data),
  listFolders: () => http.get("/media/folders").then((res) => res.data),
  createFolder: (payload: unknown) =>
    http.post("/media/folders", payload).then((res) => res.data),
  updateFolder: (id: string, payload: unknown) =>
    http.patch(`/media/folders/${id}`, payload).then((res) => res.data),
  removeFolder: (id: string) =>
    http.delete(`/media/folders/${id}`).then((res) => res.data),
  searchExternal: (params: Record<string, unknown>) =>
    http.get("/media/external/search", { params }).then((res) => res.data),
  importExternal: (payload: unknown) =>
    http.post("/media/external/import", payload).then((res) => res.data),
  updateMeta: (id: string, payload: unknown) =>
    http.patch(`/media/${id}/meta`, payload).then((res) => res.data),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post("/media/upload", formData).then((res) => res.data);
  },
  remove: (id: string) => http.delete(`/media/${id}`).then((res) => res.data),
};

export const settingsApi = {
  get: (force = false) => settingsCache.get(force),
  update: (payload: unknown) =>
    http.patch("/settings/site", payload).then((res) => {
      settingsCache.invalidate();
      return res.data;
    }),
  versions: (params?: Record<string, unknown>) =>
    http.get("/settings/versions", { params }).then((res) => res.data),
  restoreVersion: (id: string) =>
    http.patch(`/settings/versions/${id}/restore`).then((res) => res.data),
};

export const operationLogsApi = {
  list: (params?: Record<string, unknown>) =>
    http.get("/operation-logs", { params }).then((res) => res.data),
};

export const notificationsApi = {
  summary: () => http.get("/notifications/summary").then((res) => res.data),
  list: (params?: Record<string, unknown>) =>
    http.get("/notifications", { params }).then((res) => res.data),
  markRead: (id: string) =>
    http.patch(`/notifications/${id}/read`).then((res) => res.data),
  markAllRead: () =>
    http.patch("/notifications/read-all").then((res) => res.data),
};

export const recycleBinApi = {
  list: (params?: Record<string, unknown>) =>
    http.get("/recycle-bin", { params }).then((res) => res.data),
  restore: (id: string) =>
    http.patch(`/recycle-bin/${id}/restore`).then((res) => res.data),
  restoreMany: (ids: string[]) =>
    http.patch("/recycle-bin/batch/restore", { ids }).then((res) => res.data),
  purge: (id: string) =>
    http.delete(`/recycle-bin/${id}`).then((res) => res.data),
  purgeMany: (ids: string[]) =>
    http
      .delete("/recycle-bin/batch", { data: { ids } })
      .then((res) => res.data),
};

export const usersApi = {
  list: () => http.get("/users").then((res) => res.data),
  profile: () => http.get("/users/profile").then((res) => res.data),
  updateProfile: (payload: unknown) =>
    http.patch("/users/profile", payload).then((res) => res.data),
  updateOwnPassword: (payload: { currentPassword: string; password: string }) =>
    http.patch("/users/profile/password", payload).then((res) => res.data),
  create: (payload: unknown) =>
    http.post("/users", payload).then((res) => res.data),
  update: (id: string, payload: unknown) =>
    http.patch(`/users/${id}`, payload).then((res) => res.data),
  updateStatus: (id: string, status: "ACTIVE" | "BANNED") =>
    http.patch(`/users/${id}/status`, { status }).then((res) => res.data),
  updatePassword: (id: string, password: string) =>
    http.patch(`/users/${id}/password`, { password }).then((res) => res.data),
  remove: (id: string) => http.delete(`/users/${id}`).then((res) => res.data),
};

export const rolesApi = {
  list: (force = false) => rolesListCache.get(force),
  listPermissions: (force = false) => rolePermissionsCache.get(force),
  create: (payload: unknown) =>
    http.post("/roles", payload).then((res) => {
      rolesListCache.invalidate();
      rolePermissionsCache.invalidate();
      return res.data;
    }),
  update: (id: string, payload: unknown) =>
    http.patch(`/roles/${id}`, payload).then((res) => {
      rolesListCache.invalidate();
      rolePermissionsCache.invalidate();
      return res.data;
    }),
  remove: (id: string) =>
    http.delete(`/roles/${id}`).then((res) => {
      rolesListCache.invalidate();
      rolePermissionsCache.invalidate();
      return res.data;
    }),
};
