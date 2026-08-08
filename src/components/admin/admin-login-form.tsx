"use client";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          username,
          password,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !result.success) {
        setMessage(result.message ?? "Incorrect username or password.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setMessage("Login request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="admin-username">
          Username
        </label>
        <input
          id="admin-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={100}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 transition outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={500}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 transition outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>
      {message ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {message}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in to Admin"}
      </button>
    </form>
  );
}
