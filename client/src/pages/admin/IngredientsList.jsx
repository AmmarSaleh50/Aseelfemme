import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { ChevronLeft } from 'lucide-react';

export default function AdminIngredients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    const token = localStorage.getItem('af_admin_token');
    setAuthToken(token);
    const res = await api.get('/admin/ingredients');
    setItems(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = () => {
    navigate('/admin/ingredients/new');
  };

  const handleEdit = (id) => {
    navigate(`/admin/ingredients/${id}`);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Helper to generate slug from name
    const slugify = (text) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const ingredients = Array.isArray(data) ? data : [data];

      let created = 0;
      for (const ing of ingredients) {
        try {
          const slug = ing.slug || slugify(ing.nameEn || ing.name || `ingredient-${Date.now()}`);
          await api.post('/admin/ingredients', {
            nameEn: ing.nameEn || '',
            nameAr: ing.nameAr || '',
            slug: slug,
            descriptionEn: ing.descriptionEn || '',
            descriptionAr: ing.descriptionAr || '',
            benefitsEn: ing.benefitsEn || [],
            benefitsAr: ing.benefitsAr || [],
            imageUrl: ing.imageUrl || '',
          });
          created++;
        } catch (error) {
          console.error('Failed to create ingredient:', error);
        }
      }

      if (created > 0) {
        showToast(`Imported ${created} ${created === 1 ? 'ingredient' : 'ingredients'}`, 'success');
        load();
      } else {
        showToast('No ingredients were imported', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Invalid JSON file', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleExport = () => {
    const exportData = items.map(item => ({
      nameEn: item.nameEn || '',
      nameAr: item.nameAr || '',
      slug: item.slug || '',
      descriptionEn: item.descriptionEn || '',
      descriptionAr: item.descriptionAr || '',
      benefitsEn: item.benefitsEn || [],
      benefitsAr: item.benefitsAr || [],
      imageUrl: item.imageUrl || '',
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingredients-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDeleteConfirm = (item) => {
    setDeleteId(item.id);
    setDeleteName(item.name || '');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      await api.delete(`/admin/ingredients/${deleteId}`);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      showToast(t('admin.ingredients.deleted'), 'success');
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  const handleDeleteCancel = () => {
    if (deleting) return;
    setDeleteId(null);
    setDeleteName('');
  };

  return (
    <div className="container-px max-w-6xl mx-auto py-10">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-black/75 rounded-full border border-black/10 px-3 py-1.5 hover:bg-ivory/80 transition-colors mb-4"
      >
        <ChevronLeft className="w-3 h-3" aria-hidden="true" />
        <span>Dashboard</span>
      </Link>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <h1 className="font-serif text-3xl">{t('admin.ingredients.title')}</h1>
        <div className="flex gap-2">
          <label className="btn btn-secondary cursor-pointer">
            {t('admin.common.import')}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            {t('admin.common.export')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreate}
          >
            {t('admin.ingredients.new')}
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col"
          >
            <div className="aspect-square w-full overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-black/40 bg-ivory">
                  {t('admin.products.no_image')}
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold truncate">{item.name}</div>
              </div>
              <div className="text-xs text-black/60 truncate">{item.slug}</div>
              {item.description && (
                <div className="text-sm text-black/80 line-clamp-2">
                  {item.description}
                </div>
              )}
              <div className="mt-3 flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleEdit(item.id)}
                  className="px-3 py-1.5 rounded-full border border-black/10 bg-ivory hover:bg-charcoal hover:text-ivory transition-colors"
                >
                  {t('admin.ingredients.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteConfirm(item)}
                  className="px-3 py-1.5 rounded-full border border-red-100 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  {t('admin.ingredients.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
        {loading && !items.length && (
          <div className="text-sm text-black/60">{t('common.loading')}</div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteId}
        title={t('admin.ingredients.delete')}
        description={t('admin.products.confirm_delete_body', { name: deleteName || '' })}
        confirmLabel={t('admin.common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
