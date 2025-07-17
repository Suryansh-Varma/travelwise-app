// app/(auth)/login/page.tsx
'use client';
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const router = useRouter(); 
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState('')
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    fetchUser();
  }, []);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      router.push('/dashboard') 
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/dashboard', // your post-login route
      },
    })

    if (error) {
      setErrorMsg(error.message)
    }
  }
  return (
    <main className="min-h-screen bg-[#151122] text-white font-['Plus Jakarta Sans','Noto Sans',sans-serif]">
      <header className="flex items-center justify-between border-b border-[#2d2447] px-10 py-3">
        <div className="flex items-center gap-4">

        <Image
  src="/assets/logo.png"
  alt="Logo"
  width={16}
  height={16}
  className="w-10 h-10 rounded-2xl"
/>

          <h2 className="text-lg font-bold">TravelWise</h2>
        </div>
        <nav className="flex items-center gap-9">
          <Link href="#" className="text-sm font-medium">Trips</Link>
          <Link href="#" className="text-sm font-medium">Explore</Link>
          <Link href="#" className="text-sm font-medium">Saved</Link>
        </nav>
        <div className="flex gap-3 items-center">
          <button className="rounded-xl bg-[#2d2447] h-10 px-4 text-sm font-bold">Help</button>
          <div
            className="rounded-full w-10 h-10 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBTv3-9FXOcOP0c922ZuTHdFmEJp5gjXttOLw9xhBcAkOkC5LUXd6prw8fANB3hZI8MckDHCsAH40AoSRTlaD8yN8FIL8lPolZoEgAJ4jG5q1Ou80xl0F5r0oWV1h4A_aBCB5viRpRweG6ZySlkIcM43D1NmM6O1nJEW_qlcAVCOaE24uxCyDQJWnwCWlAw_R0NNbmINkBWjzh_yyF9C_-LmfTWD-qlEisbifvIbZA2f4xjSojcv5s9UrCwez1H8L-c2cHwYdYRBItS')",
            }}
          />
        </div>
      </header>

      <section className="flex justify-center px-4 py-10">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">Welcome back</h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-base font-medium mb-2">Email</label>
              <input
              value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                className="w-full h-14 rounded-xl bg-[#2d2447] p-4 text-white placeholder:text-[#a093c8] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-medium mb-2">Password</label>
              <input 
               value={password}
          onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                className="w-full h-14 rounded-xl bg-[#2d2447] p-4 text-white placeholder:text-[#a093c8] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full h-10 bg-[#4c19e5] text-sm font-bold rounded-xl mt-2"disabled={loading}> {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="text-[#a093c8] text-center text-sm mt-3 underline">
              Don't have an account? <Link href="/signup">Sign up</Link>
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={handleGoogleLogin} className="flex-1 h-10 rounded-xl bg-[#2d2447] font-bold text-sm">Continue with Google</button>
             
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}