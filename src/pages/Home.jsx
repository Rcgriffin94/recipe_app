import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import RecipeCard from '../components/RecipeCard';

export default function Home() {
  const { session } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [favourites, setFavourites] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

    // Optimistic update
    setFavourites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(recipeId) : next.add(recipeId);
      return next;
    });

    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .match({ user_id: session.user.id, recipe_id: recipeId });
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: session.user.id, recipe_id: recipeId });
    }
  }

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.ingredients.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <header className="bg-green-800 text-white px-4 py-5 sticky top-0 z-10 shadow">
        <h1 className="text-xl font-bold text-center">The Secret Ingredient</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        {/* Search bar */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or ingredient…"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 mb-6"
        />

        {/* Recipe grid */}
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
    </div>
  );
}
