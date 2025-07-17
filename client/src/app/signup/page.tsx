'use client';
import React from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/dashboard', // or your desired page
    }
  })

  if (error) {
    console.error('Google login error:', error.message)
  }
}
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

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
      data: {
        full_name: fullName,
      },
    },
    })

    if (error) setMessage(`❌ ${error.message}`)
    else 
      {
        setMessage('✅ Signup successful! Check your email to confirm.')
        router.push('/login')
      }

    setLoading(false)
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
    <main className="min-h-screen bg-[#151122] text-white font-sans px-6">
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between border-b border-[#2d2447] px-10 py-3">
          <div className="flex items-center gap-4">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z"
                  fill="currentColor"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M39.998 12.236...Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-tight">TravelWise</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-sm font-medium" href="#">Plan</a>
              <a className="text-sm font-medium" href="#">Explore</a>
              <a className="text-sm font-medium" href="#">Trips</a>
            </div>
            <button className="h-10 px-4 rounded-xl bg-[#2d2447] text-sm font-bold">Log in</button>
          </div>
        </header>

        <section className="flex justify-center py-5 flex-1">
          <div className="w-full max-w-xl px-4 py-5">
            <h2 className="text-[28px] font-bold text-center pb-3 pt-5">Create your account</h2>
            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="block text-base font-medium pb-2">Name</label>
                <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full h-14 p-4 rounded-xl bg-[#2d2447] text-white placeholder:text-[#a093c8]"
                />
              </div>
              <div>
                <label className="block text-base font-medium pb-2">Email</label>
                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email address"
                    className="w-full h-14 p-4 rounded-xl bg-[#2d2447] text-white placeholder:text-[#a093c8]"
                />
              </div>
              <div>
                <label className="block text-base font-medium pb-2">Password</label>
                <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full h-14 p-4 rounded-xl bg-[#2d2447] text-white placeholder:text-[#a093c8]"
                />
                <div className="text-[#a093c8] text-sm pt-2">
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
                  className="w-full h-14 p-4 rounded-xl bg-[#2d2447] text-white placeholder:text-[#a093c8]"
                />
              </div>
        
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-[#4c19e5] text-sm font-bold tracking-wide"
              disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Account'}
      </button>
            </form>

            <div className="flex justify-center gap-3 flex-wrap pt-6">
              <button onClick={handleGoogleLogin} className="grow h-10 px-4 rounded-xl bg-[#2d2447] font-bold text-sm">
                Sign up with Google
              </button>
              <button onClick={() => router.push('/login')} className="grow h-10 px-4 rounded-xl bg-transparent font-bold text-sm">
                Already have an account? Log in
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}