import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function BottomNav() {
  const { role } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
      isActive ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
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
          onClick={async () => { await supabase.auth.signOut(); }}
          className="flex flex-col items-center gap-0.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="text-xl">👋</span>
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
