'use client';

import { useAuth } from "@/components/providers/AuthProvider";

export default function SignInButton() {
  const { signIn } = useAuth();

  return (
    <button
      onClick={signIn}
      className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors h-full">
      Sign In
    </button>
  )
}