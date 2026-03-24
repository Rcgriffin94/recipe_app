import { useState } from 'react';
import { supabase } from '../lib/supabase';

const MAX_PHOTOS = 3;

export default function PhotoRecipeModal({ onSave, onClose, onBack }) {
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState([]); // [{ file, preview }]
  const [useDifferentBanner, setUseDifferentBanner] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file || photos.length >= MAX_PHOTOS) return;
    setPhotos((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
  }

  function handleRemovePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleBannerChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function handleToggleBanner(e) {
    setUseDifferentBanner(e.target.checked);
    if (!e.target.checked) {
      setBannerFile(null);
      setBannerPreview('');
    }
  }

  async function uploadFile(file, suffix = '') {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}${suffix}.${ext}`;
    const { error } = await supabase.storage
      .from('recipe-photos')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (photos.length === 0) { setError('Please select at least one photo.'); return; }
    setSaving(true);
    setError('');

    try {
      const contentPhotoUrls = await Promise.all(
        photos.map((p, i) => uploadFile(p.file, `_${i}`))
      );

      let bannerUrl = contentPhotoUrls[0];
      if (useDifferentBanner && bannerFile) {
        bannerUrl = await uploadFile(bannerFile, '_banner');
      }

      const { error: insertError } = await supabase.from('recipes').insert({
        title,
        photo_url: bannerUrl,
        content_photo_url: contentPhotoUrls[0],
        content_photo_urls: contentPhotoUrls,
        ingredients: '',
        steps: '',
      });

      if (insertError) throw insertError;
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
            <h2 className="text-lg font-bold text-green-800">Upload Recipe Photo</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe name *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grandma's Shortbread"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Photo slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos * <span className="text-gray-400 font-normal">({photos.length}/{MAX_PHOTOS})</span>
            </label>
            <div className="space-y-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo.preview}
                    alt={`Recipe photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/70"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      Page 1
                    </span>
                  )}
                  {index > 0 && (
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      Page {index + 1}
                    </span>
                  )}
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition">
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-sm text-gray-500">
                    {photos.length === 0 ? 'Tap to add a photo' : 'Tap to add another page'}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Banner toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Use a different banner photo</p>
              <p className="text-xs text-gray-400">The banner appears on the recipe card and at the top of the page</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useDifferentBanner}
                onChange={handleToggleBanner}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {useDifferentBanner && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner photo</label>
              {bannerPreview ? (
                <div className="relative">
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-40 object-cover rounded-xl mb-2" />
                  <button
                    type="button"
                    onClick={() => { setBannerFile(null); setBannerPreview(''); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/70"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition">
                  <span className="text-3xl mb-1">🖼️</span>
                  <span className="text-sm text-gray-500">Choose a banner photo</span>
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
              )}
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Recipe'}
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
