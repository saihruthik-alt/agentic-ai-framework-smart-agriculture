"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register, loginGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("FARMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [googleStep, setGoogleStep] = useState<"choose" | "custom">("choose");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const executeGoogleLogin = async (email: string, name: string) => {
    setShowGooglePopup(false);
    setError("");
    setLoading(true);
    try {
      const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        email: email.trim().toLowerCase(),
        name: name,
        given_name: name.split(" ")[0],
        sub: "google-oauth-" + btoa(email).replace(/=/g, "")
      }));
      const mockGoogleToken = `${header}.${payload}.mock_signature`;
      await loginGoogle(mockGoogleToken);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Google registration failed.";
      setError(errMsg);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(username, email, password, role);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to register account.";
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
            Create an Account
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Join the Agentic AI Smart Farming Platform
          </p>
        </div>

        {error && (
          <div id="register-error-msg" className="rounded-xl bg-rose-950/30 border border-rose-800/50 p-4 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="reg-username" className="block text-xs font-semibold text-zinc-400 mb-2">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#07070a] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-zinc-400 mb-2">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#07070a] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-zinc-400 mb-2">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#07070a] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Primary Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "FARMER", label: "Farmer / Owner", desc: "Manage fields & crops" },
                  { value: "ADVISOR", label: "Advisor / Expert", desc: "Analyze data & advice" },
                ].map((item) => (
                  <label
                    key={item.value}
                    onClick={() => setRole(item.value)}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      role === item.value
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                        : "border-zinc-800 bg-[#07070a] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[9px] text-zinc-500 mt-1">{item.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              id="register-submit-btn"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-500 py-3 px-4 text-sm font-semibold text-black hover:bg-emerald-400 focus:outline-none disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <span className="absolute px-3 bg-[#0c0c12] text-[10px] text-zinc-555 font-bold uppercase tracking-widest">or sign up with</span>
          <div className="w-full border-t border-zinc-800/80"></div>
        </div>

        <div className="space-y-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => { setShowGooglePopup(true); setGoogleStep("choose"); }}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 py-3.5 text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-[0.99] font-sans"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="text-center pt-6 border-t border-zinc-900 mt-6">
          <p className="text-xs text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* GOOGLE SIGN-IN SIMULATOR MODAL */}
      {showGooglePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-[390px] border border-zinc-200 rounded-2xl bg-white p-8 text-left shadow-2xl relative font-sans text-zinc-900">
            {/* Google Logo */}
            <div className="flex justify-center mb-5">
              <svg className="h-6 w-24" viewBox="0 0 74 24" fill="none">
                <path d="M7.8 14.2c-1.3 0-2.4-.4-3.2-1.3C3.8 12 3.4 11 3.4 9.7c0-1.3.4-2.3 1.2-3.2.8-.9 1.9-1.3 3.2-1.3 1.1 0 2 .3 2.7 1 .7.7 1.1 1.6 1.1 2.8v.5H6.3c.1.9.4 1.5 1 2 .6.4 1.2.6 1.9.6.9 0 1.6-.2 2.1-.7l.9.9c-.8.9-1.9 1.5-3.3 1.5zm2.7-6.2c0-.6-.2-1.1-.6-1.5-.4-.4-1-.6-1.7-.6s-1.3.2-1.7.6c-.4.4-.6 1-.6 1.5h4.6zm6.3 6.2c-1.3 0-2.4-.4-3.2-1.3-.8-.9-1.2-1.9-1.2-3.2c0-1.3.4-2.3 1.2-3.2.8-.9 1.9-1.3 3.2-1.3 1.3 0 2.4.4 3.2 1.3.8.9 1.2 1.9 1.2 3.2c0 1.3-.4 2.3-1.2 3.2-.8.9-1.9 1.3-3.2 1.3zm0-1.8c.7 0 1.3-.3 1.7-.8s.6-1.2.6-2c0-.8-.2-1.4-.6-2-.4-.5-1-.8-1.7-.8s-1.3.3-1.7.8c-.4.5-.6 1.2-.6 2 0 .8.2 1.4.6 2 .4.5 1 .8 1.7.8zm9 8.2c.4.3 1 .4 1.6.4 1 0 1.7-.3 2.3-.9.6-.6.9-1.4.9-2.5V10h-3.1v1.5h1.6V17c-.2.5-.5.9-1 1.2-.4.3-.9.4-1.5.4-.5 0-1-.1-1.4-.4l-.5 1.1zm2.3-12.8c-1.3 0-2.4-.4-3.2-1.3-.8-.9-1.2-1.9-1.2-3.2s.4-2.3 1.2-3.2c.8-.9 1.9-1.3 3.2-1.3s2.4.4 3.2 1.3c.8.9 1.2 1.9 1.2 3.2s-.4 2.3-1.2 3.2c-.8.9-1.9 1.3-3.2 1.3zm0-1.8c.7 0 1.3-.3 1.7-.8s.6-1.2.6-2c0-.8-.2-1.4-.6-2-.4-.5-1-.8-1.7-.8s-1.3.3-1.7.8c-.4.5-.6 1.2-.6 2 0 .8.2 1.4.6 2 .4.5 1 .8 1.7.8zm6.5 7.8V3.5h1.5v10.5h-1.5zm6.3-5.2V3.5h1.5v10.5h-1.5z" fill="#757575"/>
              </svg>
            </div>

            {googleStep === "choose" ? (
              <>
                <h3 className="text-xl text-center text-[#202124] font-normal mb-1">Choose an account</h3>
                <p className="text-xs text-center text-[#5f6368] mb-6">to continue to <span className="font-semibold text-emerald-600">AgriAgent</span></p>

                <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 max-h-56 overflow-y-auto mb-6">
                  {/* Account 1: Saihruthik */}
                  <div
                    onClick={() => executeGoogleLogin("saihruthik2005@gmail.com", "Saihruthik")}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f1f3f4] cursor-pointer transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-bold font-sans">
                      S
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[#3c4043]">Saihruthik</h4>
                      <p className="text-[10px] text-[#5f6368]">saihruthik2005@gmail.com</p>
                    </div>
                  </div>

                  {/* Account 2: Test Farmer */}
                  <div
                    onClick={() => executeGoogleLogin("google_farmer_test@gmail.com", "Google Persistent Farmer")}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f1f3f4] cursor-pointer transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#10b981] text-white flex items-center justify-center text-sm font-bold font-sans">
                      G
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[#3c4043]">Google Persistent Farmer</h4>
                      <p className="text-[10px] text-[#5f6368]">google_farmer_test@gmail.com</p>
                    </div>
                  </div>

                  {/* Option: Use another account */}
                  <div
                    onClick={() => setGoogleStep("custom")}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f1f3f4] cursor-pointer transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-650 flex items-center justify-center text-sm font-bold border border-zinc-200">
                      👤
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[#1a73e8]">Use another account</h4>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl text-center text-[#202124] font-normal mb-1">Sign in</h3>
                <p className="text-xs text-center text-[#5f6368] mb-6">Use your Google Account</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] text-[#5f6368] font-bold mb-1">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-955 focus:border-[#1a73e8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#5f6368] font-bold mb-1">YOUR NAME</label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Ram Charan"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-955 focus:border-[#1a73e8] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setGoogleStep("choose")}
                    className="text-xs font-semibold text-[#1a73e8] hover:text-[#1557b0] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!customEmail || !customName}
                    onClick={() => executeGoogleLogin(customEmail, customName)}
                    className="px-6 py-2 rounded bg-[#1a73e8] text-white text-xs font-semibold hover:bg-[#1557b0] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            <div className="flex justify-between items-center text-[10px] text-[#70757a] border-t border-zinc-150 pt-4 mt-6">
              <span>English (United States)</span>
              <div className="flex gap-2">
                <span className="hover:underline cursor-pointer">Help</span>
                <span className="hover:underline cursor-pointer">Privacy</span>
                <span className="hover:underline cursor-pointer">Terms</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowGooglePopup(false)}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-655 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    
    </div>
  );
}
