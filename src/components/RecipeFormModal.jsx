import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const EMPTY_FORM = {
  title: '',
  ingredients: '',
  steps: '',
  notes: '',
  tags: '',
  photo_url: '',
};

export default function RecipeFormModal({ recipe, initialData, onSave, onClose, onBack }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (recipe) {
      setForm({
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        notes: recipe.notes ?? '',
        tags: (recipe.tags ?? []).join(', '),
        photo_url: recipe.photo_url ?? '',
      });
      setPhotoPreview(recipe.photo_url ?? '');
    } else if (initialData) {
      setForm({
        title: initialData.title ?? '',
        ingredients: initialData.ingredients ?? '',
        steps: initialData.steps ?? '',
        notes: initialData.notes ?? '',
        tags: initialData.tags ?? '',
        photo_url: initialData.image_url ?? '',
      });
      if (initialData.image_url) setPhotoPreview(initialData.image_url);
    }
  }, [recipe, initialData]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(file) {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('recipe-photos')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let photo_url = form.photo_url;
      if (photoFile) photo_url = await uploadPhoto(photoFile);

      const payload = {
        title: form.title,
        ingredients: form.ingredients,
        steps: form.steps,
        notes: form.notes,
        photo_url,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (recipe) {
        await supabase.from('recipes').update(payload).eq('id', recipe.id);
      } else {
        await supabase.from('recipes').insert(payload);
      }

      onSave();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="text-green-700 text-sm font-medium hover:underline">
                ← Back
              </button>
            )}
            <h2 className="text-lg font-bold text-green-800">
              {recipe ? 'Edit Recipe' : 'Add Recipe'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingredients * <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea
              required
              rows={5}
              value={form.ingredients}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              placeholder={"2 cups flour\n1 cup sugar\n3 eggs"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steps * <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea
              required
              rows={5}
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              placeholder={"Preheat oven to 180°C\nMix dry ingredients\nBake for 35 minutes"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Story</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="dessert, chocolate, family favourite"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="text-sm text-gray-600"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : recipe ? 'Save Changes' : 'Add Recipe'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
