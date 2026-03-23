import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Login from './pages/Login';
import Favourites from './pages/Favourites';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import { useAuth } from './components/AuthProvider';

export default function App() {
  const { session, loading } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/recipe/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
        <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!loading && session && <BottomNav />}
    </>
  );
}
