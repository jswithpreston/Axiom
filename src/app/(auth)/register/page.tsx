"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      setError(data.message ?? "Registration failed.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="font-mono text-2xl font-bold tracking-[0.3em] text-axiom-text">
          AXIOM
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-axiom-muted">
          STUDY SYSTEM
        </div>
      </div>

      <div className="rounded-lg border border-axiom-border bg-axiom-surface p-8">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-axiom-muted">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-xs uppercase tracking-wider text-axiom-muted"
            >
              Name{" "}
              <span className="normal-case text-axiom-muted/50">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-wider text-axiom-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs uppercase tracking-wider text-axiom-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm"
              className="text-xs uppercase tracking-wider text-axiom-muted"
            >
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-axiom-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-axiom-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-axiom-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
