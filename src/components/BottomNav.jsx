import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function BottomNav() {
  const { role } = useAuth();
  const [confirming, setConfirming] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
      isActive ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <>
      {confirming && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirming(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm px-6 py-8 shadow-xl">
            <p className="text-base font-semibold text-gray-800 text-center mb-1">Sign out?</p>
            <p className="text-sm text-gray-500 text-center mb-6">You'll need a magic link to sign back in.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-4 py-2">
          <NavLink to="/" end className={linkClass}>
            <span className="text-xl">🏠</span>
            <span>Home</span>
          </NavLink>

          <NavLink to="/recipes" className={linkClass}>
            <span className="text-xl">📖</span>
            <span>Recipes</span>
          </NavLink>

          <NavLink to="/favourites" className={linkClass}>
            <span className="text-xl">❤️</span>
            <span>Favourites</span>
          </NavLink>

          {role === 'owner' && (
            <NavLink to="/users" className={linkClass}>
              <span className="text-xl">👥</span>
              <span>Users</span>
            </NavLink>
          )}

          <button
            onClick={() => setConfirming(true)}
            className="flex flex-col items-center gap-0.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xl">👋</span>
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
