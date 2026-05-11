"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState(params.get("username") ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await api.login(username, password);
    setLoading(false);
    if (!res.ok) {
      setStatus(`✗ ${res.status} ${res.error}`);
      return;
    }
    if (res.data?.accessToken) {
      auth.set(username, res.data.accessToken);
      router.replace("/todos");
    } else {
      setStatus(`✗ Unexpected response (${JSON.stringify(res.data)})`);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="text-xl font-semibold">Login</h1>
        <input
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "..." : "Login"}
        </button>
        {status && (
          <p className="text-sm text-red-600 dark:text-red-400">{status}</p>
        )}
        <p className="text-sm text-zinc-500">
          No account?{" "}
          <Link href="/register" className="underline">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}
