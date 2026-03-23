import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import RecipeFormModal from '../components/RecipeFormModal';

const CAN_EDIT = ['owner', 'editor'];

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [editing, setEditing] = useState(false);

  const canEdit = CAN_EDIT.includes(role);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      setRecipe(data);
      setLoading(false);
    }
    load();
  }, [id]);

  function toggleIngredient(index) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  async function handleDelete() {
    if (!confirm('Delete this recipe?')) return;
    await supabase.from('recipes').delete().eq('id', id);
    navigate('/recipes');
  }

  async function handleSave() {
    setEditing(false);
    const { data } = await supabase.from('recipes').select('*').eq('id', id).single();
    setRecipe(data);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="h-64 bg-stone-200 animate-pulse" />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="h-8 bg-stone-200 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-stone-200 rounded animate-pulse" />
          <div className="h-4 bg-stone-200 rounded animate-pulse w-4/5" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-gray-500">Recipe not found.</p>
      </div>
    );
  }

  const ingredients = recipe.ingredients
    .split(/\\n|\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const steps = recipe.steps
    .split(/\\n|\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Photo */}
      {recipe.photo_url ? (
        <img src={recipe.photo_url} alt={recipe.title} className="w-full h-64 object-cover" />
      ) : (
        <div className="w-full h-64 bg-stone-100 flex items-center justify-center text-7xl">🍽️</div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back link + actions */}
        <div className="flex items-center justify-between mb-3">
          <Link to="/recipes" className="text-green-700 text-sm font-medium hover:underline">
            ← Back to recipes
          </Link>
          {canEdit && (
            <div className="flex gap-4">
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-green-700 font-medium hover:underline"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 font-medium hover:underline"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Title & tags */}
        <h1 className="text-3xl font-bold text-green-900 mb-2">{recipe.title}</h1>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6">
            {recipe.tags.map((tag) => (
              <span key={tag} className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-green-800 mb-3">Ingredients</h2>
          <ul className="space-y-2">
            {ingredients.map((item, i) => (
              <li
                key={i}
                onClick={() => toggleIngredient(i)}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <span
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    checked[i] ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {checked[i] && (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={checked[i] ? 'line-through text-gray-400' : 'text-gray-700'}>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-green-800 mb-3">Instructions</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-700 text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-gray-700 leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Notes */}
        {recipe.notes && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="text-lg font-bold text-amber-800 mb-2">Notes & Story</h2>
            <p className="text-amber-900 text-sm leading-relaxed whitespace-pre-line">{recipe.notes}</p>
          </section>
        )}
      </div>

      {editing && (
        <RecipeFormModal
          recipe={recipe}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
