"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiResult, Todo } from "@/lib/api";
import { auth } from "@/lib/auth";

export default function TodosPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAuthError = useCallback(
    (res: ApiResult<unknown>) => {
      if (res.status === 401) {
        auth.clear();
        router.replace("/login");
        return true;
      }
      return false;
    },
    [router],
  );

  const refresh = useCallback(async () => {
    const res = await api.listTodos();
    if (handleAuthError(res)) return;
    if (res.ok && res.data) setTodos(res.data);
    else setStatus(`GET /todos → ${res.status} ${res.error}`);
  }, [handleAuthError]);

  useEffect(() => {
    if (!auth.getToken()) {
      router.replace("/login");
      return;
    }
    (async () => {
      const me = await api.me();
      if (handleAuthError(me)) return;
      if (me.ok && me.data) {
        setUsername(me.data.username);
      } else {
        setUsername(auth.getUsername());
      }
      refresh();
    })();
  }, [router, handleAuthError, refresh]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await api.createTodo(name.trim());
    if (handleAuthError(res)) return;
    setStatus(`POST /todos → ${res.status}${res.error ? ` ${res.error}` : ""}`);
    if (res.ok) {
      setName("");
      refresh();
    }
  }

  async function onToggle(t: Todo) {
    const res = await api.updateTodo(t._id, { checked: !t.checked });
    if (handleAuthError(res)) return;
    setStatus(
      `PUT /todos/${t._id} {checked} → ${res.status}${res.error ? ` ${res.error}` : ""}`,
    );
    refresh();
  }

  async function onSaveEdit(id: string) {
    const res = await api.updateTodo(id, { name: editingName.trim() });
    if (handleAuthError(res)) return;
    setStatus(
      `PUT /todos/${id} {name} → ${res.status}${res.error ? ` ${res.error}` : ""}`,
    );
    setEditingId(null);
    setEditingName("");
    refresh();
  }

  async function onDelete(id: string) {
    const res = await api.deleteTodo(id);
    if (handleAuthError(res)) return;
    setStatus(
      `DELETE /todos/${id} → ${res.status}${res.error ? ` ${res.error}` : ""}`,
    );
    refresh();
  }

  function logout() {
    auth.clear();
    router.replace("/login");
  }

  if (!username) return null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Todos</h1>
          <p className="text-sm text-zinc-500">Signed in as {username}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          Logout
        </button>
      </header>

      <form onSubmit={onCreate} className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="New todo name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add
        </button>
      </form>

      {status && (
        <pre className="mb-4 overflow-x-auto rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {status}
        </pre>
      )}

      <ul className="space-y-2">
        {todos.map((t) => (
          <li
            key={t._id}
            className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <input
              type="checkbox"
              checked={t.checked}
              onChange={() => onToggle(t)}
            />
            {editingId === t._id ? (
              <>
                <input
                  className="flex-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => onSaveEdit(t._id)}
                  className="text-sm text-emerald-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditingName("");
                  }}
                  className="text-sm text-zinc-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm ${t.checked ? "line-through text-zinc-400" : ""}`}
                >
                  {t.name}
                </span>
                <button
                  onClick={() => {
                    setEditingId(t._id);
                    setEditingName(t.name);
                  }}
                  className="text-sm text-zinc-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(t._id)}
                  className="text-sm text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
        {todos.length === 0 && (
          <li className="text-sm text-zinc-500">No todos yet.</li>
        )}
      </ul>
    </main>
  );
}
