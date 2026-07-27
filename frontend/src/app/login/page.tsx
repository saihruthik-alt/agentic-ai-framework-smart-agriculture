"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeveloperGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Create a mock base64 Google token containing testing fields
      const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        email: "google_farmer_test@gmail.com",
        name: "Google Persistent Farmer",
        given_name: "GoogleFarmer",
        sub: "mock-google-sub-777"
      }));
      const mockGoogleToken = `${header}.${payload}.mock_signature`;
      await loginGoogle(mockGoogleToken);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Google login failed.";
      setError(errMsg);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to login. Check your credentials.";
      setError(errMsg);
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

        <div className="relative my-6 flex items-center justify-center">
          <span className="absolute px-3 bg-[#0c0c12] text-[10px] text-zinc-550 font-bold uppercase tracking-widest">or sign in with</span>
          <div className="w-full border-t border-zinc-800/80"></div>
        </div>

        <div className="space-y-4 flex flex-col items-center">
          <button
            type="button"
            onClick={handleDeveloperGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 py-3.5 text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-[0.99] font-sans"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="text-center pt-6 border-t border-zinc-900 mt-6">
          <p className="text-xs text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
