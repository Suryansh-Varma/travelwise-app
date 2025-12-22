// app/(auth)/login/page.tsx
"use client";
import Link from "next/link";
import React from "react";
import { signIn } from "../../lib/auth-client";
import { useRouter } from "next/navigation";
import Toast from "../components/Toast";
import { supabase } from "../../../lib/supabaseClient";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [toast, setToast] = React.useState<null | { type: "error" | "success" | "info"; message: string }>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  // better-auth will handle sessions via its hooks; skipping supabase session checks
  React.useEffect(() => {
    // no-op: placeholder if you want to read session initially via useSession()
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const resp = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = data?.error || 'Invalid credentials';
        setErrorMsg(msg);
        setToast({ type: 'error', message: msg });
        setLoading(false);
        return;
      }
      // store sessionToken locally so client can call /api/auth/me
      if (data?.sessionToken) {
        try { localStorage.setItem('sessionToken', data.sessionToken); } catch (e) {}
      }
      setToast({ type: 'success', message: 'Signed in. Redirecting…' });
      setTimeout(() => router.push('/dashboard'), 300);
    } catch (e: any) {
      const msg = e?.message || 'Unexpected error during sign-in.';
      setErrorMsg(msg);
      setToast({ type: 'error', message: msg });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/dashboard",
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setToast({ type: "error", message: error.message });
      }
    } catch (e: any) {
      const msg = e?.message || "OAuth sign-in failed.";
      setErrorMsg(msg);
      setToast({ type: "error", message: msg });
    }
  };

  return (
    <main className="min-h-screen bg-site text-site">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <section className="flex justify-center px-4 py-10">
        <div className="max-w-md w-full animate-fade-up">
          {errorMsg && <p className="text-red-400 text-center mb-3">{errorMsg}</p>}
          <h2 className="text-2xl font-bold text-center mb-6">Welcome back</h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-base font-medium mb-2">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                className="w-full h-14 rounded-xl bg-card p-4 text-site placeholder:text-muted focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full h-14 rounded-xl bg-card p-4 text-site placeholder:text-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-10 btn-primary text-sm font-bold rounded-xl mt-2 text-white"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm underline">Forgot?</Link>
            </div>
            <p className="text-muted text-center text-sm mt-3 underline">
              Don't have an account? <Link href="/signup">Sign up</Link>
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={handleGoogleLogin} type="button" className="flex-1 h-10 rounded-xl bg-card font-bold text-sm text-site">
                Continue with Google
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}