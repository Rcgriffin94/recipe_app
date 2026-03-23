import AppHeader from '../components/AppHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Welcome to the family kitchen</h2>
          <p className="text-gray-600">
            A private collection of recipes passed down, shared, and loved — just for us.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h3 className="text-lg font-semibold text-green-800">How it works</h3>

          <div className="flex gap-4">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="font-medium text-gray-800">Browse recipes</p>
              <p className="text-sm text-gray-500">Head to the Recipes tab to explore the full collection. Search by name or ingredient to find exactly what you need.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-2xl">❤️</span>
            <div>
              <p className="font-medium text-gray-800">Save your favourites</p>
              <p className="text-sm text-gray-500">Tap the heart on any recipe to save it. Find all your favourites in one place under the Favourites tab.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-medium text-gray-800">Family only</p>
              <p className="text-sm text-gray-500">This app is private. Only people who have been invited can access the recipes inside.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
