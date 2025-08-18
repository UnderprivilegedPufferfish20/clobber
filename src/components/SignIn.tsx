'use client';

import { useAuth } from "./providers/AuthProvider";

export default function SignInButton() {
  const { user, signIn, signOut, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-8 h-8 rounded-full"
            />
          )}
          <span>Welcome, {user.name}!</span>
        </div>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Sign in with Google
    </button>
  );
}