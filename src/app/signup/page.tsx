"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("dispatcher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-md relative bg-background">
      <div className="fixed inset-0 z-[-1] flex items-center justify-center pointer-events-none opacity-[0.15]">
        <svg className="ecg-line" fill="none" height="200" viewBox="0 0 1000 200" width="100%" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 100H200L220 70L250 130L270 100H400L420 20L450 180L480 100H650L670 85L690 115L710 100H1000" stroke="var(--primary-container)" strokeWidth="1.5"></path>
        </svg>
      </div>

      <div className="w-full max-w-[420px] bg-surface border border-outline-variant rounded-lg overflow-hidden shadow-glow animate-fade-in">
        <div className="p-xl pb-lg text-center">
          <div className="flex items-center justify-center gap-xs mb-sm">
            <span className="icon" style={{ color: 'var(--primary-container)', fontSize: '32px' }}>ecg_heart</span>
            <span className="font-technical text-2xl font-semibold text-primary-container tracking-tight">HEALTHYCART</span>
          </div>
          <p className="font-label text-[12px] font-bold text-outline-variant uppercase tracking-[0.2em]">Create Operator Account</p>
        </div>

        <form onSubmit={handleSignup} className="px-xl pb-xl flex flex-col gap-md">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm mb-4 font-data">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label className="font-label text-[11px] font-bold text-outline-variant uppercase tracking-wider">System Email</label>
            <div className="relative flex items-center">
              <span className="icon absolute left-md text-[#484f58]" style={{ fontSize: '18px' }}>mail</span>
              <input
                type="email"
                placeholder="operator@healthycart.dispatch"
                className="w-full py-sm px-md pl-[42px] bg-background border border-outline-variant rounded text-text font-data text-[13px] outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label text-[11px] font-bold text-outline-variant uppercase tracking-wider">Personnel Role</label>
            <div className="relative flex items-center">
              <span className="icon absolute left-md text-[#484f58]" style={{ fontSize: '18px' }}>badge</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full py-sm px-md pl-[42px] bg-background border border-outline-variant rounded text-text font-data text-[13px] outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all appearance-none cursor-pointer"
              >
                <option value="dispatcher" className="bg-[#0e1511]">Dispatcher</option>
                <option value="admin" className="bg-[#0e1511]">Administrator</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label text-[11px] font-bold text-outline-variant uppercase tracking-wider">Access Token</label>
            <div className="relative flex items-center">
              <span className="icon absolute left-md text-[#484f58]" style={{ fontSize: '18px' }}>key</span>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full py-sm px-md pl-[42px] bg-background border border-outline-variant rounded text-text font-data text-[13px] outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label text-[11px] font-bold text-outline-variant uppercase tracking-wider">Confirm Access Token</label>
            <div className="relative flex items-center">
              <span className="icon absolute left-md text-[#484f58]" style={{ fontSize: '18px' }}>lock_reset</span>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full py-sm px-md pl-[42px] bg-background border border-outline-variant rounded text-text font-data text-[13px] outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full p-[14px] mt-[10px]" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Registering...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <div className="flex justify-center pt-sm font-label text-[12px] text-[#484f58]">
            <Link href="/login" className="hover:text-primary-container transition-colors">Already have an account? Login</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
