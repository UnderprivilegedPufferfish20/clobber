'use client';

import { useAuth } from "@/components/providers/AuthProvider";

export default function SignInButton() {
  const { signIn } = useAuth();

  return (
    <button
      onClick={signIn} 
      className="px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
        Sign In
      </button>
  )
}