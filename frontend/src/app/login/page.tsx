"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Failed to login. Check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070a] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 border border-zinc-800/80 rounded-3xl bg-[#0c0c12]/60 p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl"></div>

        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-black text-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            🌾
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-100">
            Sign in to AgriAgent
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Agentic AI Framework for Smart Agriculture
          </p>
        </div>

        {error && (
          <div id="login-error-msg" className="rounded-xl bg-rose-950/30 border border-rose-800/50 p-4 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                Username or Email Address
              </label>
              <input
                id="username-input"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#07070a] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Enter your username or email"
              />
            </div>
            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-zinc-400 mb-2">
                Password
              </label>
              <input
                id="password-input"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#07070a] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-500 py-3 px-4 text-sm font-semibold text-black hover:bg-emerald-400 focus:outline-none disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
