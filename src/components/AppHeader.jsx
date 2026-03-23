export default function AppHeader({ title }) {
  return (
    <header className="bg-green-800 text-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-0.5">
          {/* Logo placeholder — swap this span for an <img> when you have a logo */}
          <span className="text-xl">🔒</span>
          <span className="text-xs font-semibold tracking-widest uppercase opacity-75">
            The Secret Ingredient
          </span>
        </div>
        {title && (
          <h1 className="text-xl font-bold">{title}</h1>
        )}
      </div>
    </header>
  );
}
