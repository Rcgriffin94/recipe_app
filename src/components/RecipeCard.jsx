import { Link } from 'react-router-dom';

export default function RecipeCard({ recipe, isFavourite, onToggleFavourite }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {recipe.photo_url ? (
        <img src={recipe.photo_url} alt={recipe.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-stone-100 flex items-center justify-center text-5xl">🍽️</div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/recipe/${recipe.id}`} className="flex-1">
            <h2 className="font-bold text-green-900 text-lg leading-tight hover:underline">
              {recipe.title}
            </h2>
          </Link>
          <button
            onClick={() => onToggleFavourite(recipe.id)}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            className="text-2xl leading-none"
          >
            {isFavourite ? '❤️' : '🤍'}
          </button>
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {recipe.tags.map((tag) => (
              <span key={tag} className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
