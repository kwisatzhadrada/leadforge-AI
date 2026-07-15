const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Clerk } = window as any;
    if (Clerk?.session) return await Clerk.session.getToken();
  } catch {}
  return null;
}

type FetchOptions = RequestInit & { skipAuth?: boolean; sessionId?: string };

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, sessionId, ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = await getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (sessionId) headers.set("X-Session-ID", sessionId);

  const res = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = typeof err.detail === "object" ? err.detail : { message: err.detail ?? "Request failed" };
    throw new APIError(res.status, detail.message ?? "Request failed", detail);
  }
  if (res.status === 204 || res.status === 202) return undefined as T;
  return res.json() as Promise<T>;
}

export class APIError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "APIError";
  }
}

export const api = {
  generations: {
    create: (data: object, sessionId?: string) =>
      apiFetch("/generations/", { method: "POST", body: JSON.stringify(data), sessionId }),
    status: (id: string) => apiFetch<any>(`/generations/${id}/status`, { skipAuth: true }),
    get: (id: string) => apiFetch<any>(`/generations/${id}`, { skipAuth: true }),
    leads: (id: string) => apiFetch<any>(`/generations/${id}/leads`, { skipAuth: true }),
    quotes: (id: string) => apiFetch<any>(`/generations/${id}/quotes`, { skipAuth: true }),
    gbp: (id: string) => apiFetch<any>(`/generations/${id}/gbp`, { skipAuth: true }),
    content: (id: string) => apiFetch<any>(`/generations/${id}/content`, { skipAuth: true }),
    plan: (id: string) => apiFetch<any>(`/generations/${id}/plan`, { skipAuth: true }),
    aiLogs: (id: string) => apiFetch<any>(`/generations/${id}/ai-logs`),
    list: (page = 1) => apiFetch<any>(`/generations/?page=${page}`),
  },
  users: {
    register: (data: object) => apiFetch("/users/register", { method: "POST", body: JSON.stringify(data) }),
    me: () => apiFetch<any>("/users/me"),
  },
  billing: {
    plans: () => apiFetch<any>("/billing/plans", { skipAuth: true }),
    checkout: (plan: string) => apiFetch<any>(`/billing/checkout/${plan}`, { method: "POST" }),
    portal: () => apiFetch<any>("/billing/portal", { method: "POST" }),
    subscription: () => apiFetch<any>("/billing/subscription"),
  },
};
