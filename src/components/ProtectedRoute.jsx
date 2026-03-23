import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const [profile, setProfile] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null));
  }, [session]);

  if (loading || (session && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access restricted</h2>
          <p className="text-gray-500 text-sm">
            You need an invitation to access this app. Please contact the admin.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
