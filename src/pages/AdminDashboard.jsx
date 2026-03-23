import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

const EMPTY_INVITE = { email: '', status: '', error: '' };

const EMPTY_FORM = {
  title: '',
  ingredients: '',
  steps: '',
  notes: '',
  tags: '',
  photo_url: '',
};

export default function AdminDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(null); // null = loading
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [invites, setInvites] = useState([]);

  // Check admin role
  useEffect(() => {
    async function checkRole() {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (data?.role === 'admin') {
        setIsAdmin(true);
        loadRecipes();
        loadInvites();
      } else {
        setIsAdmin(false);
      }
    }
    checkRole();
  }, [session]);

  async function loadInvites() {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .order('invited_at', { ascending: false });
    setInvites(data ?? []);
  }

  async function handleInvite(e) {
    e.preventDefault();
    setInvite((prev) => ({ ...prev, status: 'sending', error: '' }));

    const { error } = await supabase
      .from('invites')
      .insert({ email: invite.email });

    if (error) {
      setInvite((prev) => ({ ...prev, status: '', error: error.message }));
    } else {
      setInvite(EMPTY_INVITE);
      await loadInvites();
    }
  }

  async function handleRemoveInvite(email) {
    await supabase.from('invites').delete().eq('email', email);
    await loadInvites();
  }

  async function loadRecipes() {
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    setRecipes(data ?? []);
  }

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

      if (photoFile) {
        photo_url = await uploadPhoto(photoFile);
      }

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

      if (editingId) {
        await supabase.from('recipes').update(payload).eq('id', editingId);
      } else {
        await supabase.from('recipes').insert(payload);
      }

      setForm(EMPTY_FORM);
      setPhotoFile(null);
      setPhotoPreview('');
      setEditingId(null);
      await loadRecipes();
    } catch (err) {
      setError(err.message);
    }

    setSaving(false);
  }

  function handleEdit(recipe) {
    setEditingId(recipe.id);
    setForm({
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      notes: recipe.notes ?? '',
      tags: (recipe.tags ?? []).join(', '),
      photo_url: recipe.photo_url ?? '',
    });
    setPhotoPreview(recipe.photo_url ?? '');
    setPhotoFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview('');
    setEditingId(null);
    setError('');
  }

  async function handleDelete(id) {
    if (!confirm('Delete this recipe?')) return;
    await supabase.from('recipes').delete().eq('id', id);
    await loadRecipes();
  }

  // Loading role check
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  // Not admin
  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You don't have admin access.</p>
          <button onClick={() => navigate('/')} className="text-green-700 underline">
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <header className="bg-green-800 text-white px-4 py-5 sticky top-0 z-10 shadow">
        <h1 className="text-xl font-bold text-center">Admin Dashboard</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-6">

        {/* Recipe form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-green-800 mb-4">
            {editingId ? 'Edit Recipe' : 'Add New Recipe'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
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
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Recipe'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Invite section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-green-800 mb-4">Invite a Member</h2>
          <form onSubmit={handleInvite} className="flex gap-2 mb-4">
            <input
              type="email"
              required
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              placeholder="family@example.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              type="submit"
              disabled={invite.status === 'sending'}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
            >
              {invite.status === 'sending' ? 'Inviting…' : 'Invite'}
            </button>
          </form>
          {invite.error && <p className="text-red-600 text-sm mb-2">{invite.error}</p>}

          {invites.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {invites.map((inv) => (
                <li key={inv.email} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-700">{inv.email}</span>
                  <button
                    onClick={() => handleRemoveInvite(inv.email)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recipe list */}
        <h2 className="text-lg font-bold text-green-800 mb-3">All Recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-gray-500 text-sm">No recipes yet.</p>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4"
              >
                {recipe.photo_url ? (
                  <img
                    src={recipe.photo_url}
                    alt={recipe.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{recipe.title}</p>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{recipe.tags.join(', ')}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(recipe)}
                    className="text-sm text-green-700 font-medium hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="text-sm text-red-500 font-medium hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
