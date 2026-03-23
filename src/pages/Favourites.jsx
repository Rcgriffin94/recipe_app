import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import RecipeCard from '../components/RecipeCard';
import AppHeader from '../components/AppHeader';

export default function Favourites() {
  const { session } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [favourites, setFavourites] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('favorites')
        .select('recipe_id, recipes(*)')
        .eq('user_id', session.user.id);

      const favRecipes = (data ?? []).map((f) => f.recipes);
      setRecipes(favRecipes);
      setFavourites(new Set(favRecipes.map((r) => r.id)));
      setLoading(false);
    }
    load();
  }, [session]);

  async function handleToggleFavourite(recipeId) {
    await supabase
      .from('favorites')
      .delete()
      .match({ user_id: session.user.id, recipe_id: recipeId });

    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    setFavourites((prev) => {
      const next = new Set(prev);
      next.delete(recipeId);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <AppHeader title="My Favourites" />

      <div className="max-w-2xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm h-64 animate-pulse" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <p className="text-center text-gray-500 mt-12">No favourites yet. Tap ❤️ on a recipe to save it.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
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
