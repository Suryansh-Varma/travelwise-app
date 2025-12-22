"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "../../lib/auth-client";
const handleGoogleLogin = async () => {
  try {
    await signIn.social(
      { provider: "google", callbackURL: "/dashboard" },
      {
        onRequest: () => {},
        onResponse: () => {},
      }
    );
  } catch (err: any) {
    console.error("Google login error:", err?.message || err);
  }
};
export default function SignupPage() {
    const router = useRouter();
 const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!email || !password || !confirmPassword || !fullName) {
      setMessage('❌ Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('❌ Passwords do not match.')
      return
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const resp = await fetch(`${API_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setMessage(`❌ ${data?.error || data?.message || 'Signup failed'}`);
        setLoading(false);
        return;
      }
      setMessage('✅ Signup successful! Check your email for verification.');
      setLoading(false);
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Signup error'}`);
      setLoading(false);
    }
  }
  const passwordRequirements = [
  {
    test: (pw: string) => /[A-Z]/.test(pw),
    message: "At least one uppercase letter",
  },
  {
    test: (pw: string) => /[0-9]/.test(pw),
    message: "At least one number",
  },
  {
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
    message: "At least one special character",
  },
  {
    test: (pw: string) => pw.length >= 8,
    message: "Minimum 8 characters",
  },
];
  return (
    <main className="min-h-screen bg-site text-site px-6">
      <div className="flex flex-col min-h-screen">

        <section className="flex justify-center py-5 flex-1">
          <div className="w-full max-w-xl px-4 py-5 animate-fade-up">
            <h2 className="text-[28px] font-bold text-center pb-3 pt-5">Create your account</h2>
            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="block text-base font-medium pb-2">Name</label>
                <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full h-14 p-4 rounded-xl bg-card text-site placeholder:text-muted"
                />
              </div>
              <div>
                <label className="block text-base font-medium pb-2">Email</label>
                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email address"
                      className="w-full h-14 p-4 rounded-xl bg-card text-site placeholder:text-muted"
                />
              </div>
              <div>
                <label className="block text-base font-medium pb-2">Password</label>
                <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                    className="w-full h-14 p-4 rounded-xl bg-card text-site placeholder:text-muted"
                />
                  <div className="text-muted text-sm pt-2">
    {password
      ? passwordRequirements
          .filter(req => !req.test(password))
          .map((req, idx) => (
            <div key={idx}>❌ {req.message}</div>
          ))
      : "Use 8 or more characters with a mix of letters, numbers & symbols"}
  </div>
              </div>
              <div>
                <label className="block text-base font-medium pb-2">Confirm Password</label>
                <input
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  type="password"
                    className="w-full h-14 p-4 rounded-xl bg-card text-site placeholder:text-muted"
                />
              </div>
        
              <button
                type="submit"
                className="w-full h-10 rounded-xl btn-primary text-sm font-bold tracking-wide text-white"
              disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Account'}
      </button>
            </form>

            <div className="flex justify-center gap-3 flex-wrap pt-6">
              <button onClick={handleGoogleLogin} className="grow h-10 px-4 rounded-xl bg-card font-bold text-sm text-site">
                Sign up with Google
              </button>
              <button onClick={() => router.push('/login')} className="grow h-10 px-4 rounded-xl bg-transparent font-bold text-sm text-primary">
                Already have an account? Log in
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}