import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import RecipeCard from '../components/RecipeCard';
import RecipeFormModal from '../components/RecipeFormModal';
import AppHeader from '../components/AppHeader';

const CAN_EDIT = ['owner', 'editor'];

export default function Recipes() {
  const { session, role } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [favourites, setFavourites] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const canEdit = CAN_EDIT.includes(role);

  useEffect(() => {
    async function load() {
      const [{ data: recipeData }, { data: favData }] = await Promise.all([
        supabase.from('recipes').select('*').order('created_at', { ascending: false }),
        supabase.from('favorites').select('recipe_id').eq('user_id', session.user.id),
      ]);
      setRecipes(recipeData ?? []);
      setFavourites(new Set((favData ?? []).map((f) => f.recipe_id)));
      setLoading(false);
    }
    load();
  }, [session]);

  async function handleToggleFavourite(recipeId) {
    const isFav = favourites.has(recipeId);
    setFavourites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(recipeId) : next.add(recipeId);
      return next;
    });
    if (isFav) {
      await supabase.from('favorites').delete().match({ user_id: session.user.id, recipe_id: recipeId });
    } else {
      await supabase.from('favorites').insert({ user_id: session.user.id, recipe_id: recipeId });
    }
  }

  async function handleSave() {
    setShowModal(false);
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
    setRecipes(data ?? []);
  }

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.ingredients.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <AppHeader title="Recipes" />

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ingredient…"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold text-sm px-4 rounded-xl transition whitespace-nowrap"
            >
              + Add Recipe
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 mt-12">
            {search ? 'No recipes match your search.' : 'No recipes yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavourite={favourites.has(recipe.id)}
                onToggleFavourite={handleToggleFavourite}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <RecipeFormModal
          recipe={null}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
