import { auth } from "./auth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5400/api";

export type Todo = { _id: string; name: string; checked: boolean };
export type User = { id: string; username: string };
export type SignInResponse = { message: string; accessToken: string };

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const token = auth.getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : null) ?? `HTTP ${res.status}`;
      return { ok: false, status: res.status, data: null, error: message };
    }
    return { ok: true, status: res.status, data: body as T, error: null };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export const api = {
  register: (username: string, password: string) =>
    request<User>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<SignInResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<User>("/auth/me"),
  listTodos: () => request<Todo[]>("/todos"),
  createTodo: (name: string) =>
    request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  updateTodo: (id: string, body: { name?: string; checked?: boolean }) =>
    request<Todo>(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteTodo: (id: string) =>
    request<Todo>(`/todos/${id}`, { method: "DELETE" }),
};
