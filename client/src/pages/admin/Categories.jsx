import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { ChevronLeft } from 'lucide-react';

export default function AdminCategories() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const { showToast } = useToast();
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    const token = localStorage.getItem('af_admin_token');
    setAuthToken(token);
    const r = await api.get('/admin/categories');
    setItems(r.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const openDeleteConfirm = (item) => {
    setDeleteId(item.id);
    const name = i18n.language === 'ar' && item.nameAr
      ? item.nameAr
      : item.nameEn || item.name || '';
    setDeleteName(name);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/categories/${deleteId}`);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      showToast(t('admin.categories.deleted'), 'success');
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
      const categories = Array.isArray(data) ? data : [data];

      let created = 0;
      for (const cat of categories) {
        try {
          const slug = cat.slug || slugify(cat.nameEn || cat.name || `category-${Date.now()}`);
          await api.post('/admin/categories', {
            nameEn: cat.nameEn || cat.name || '',
            nameAr: cat.nameAr || '',
            slug: slug,
            descriptionEn: cat.descriptionEn || cat.description || '',
            descriptionAr: cat.descriptionAr || '',
            order: cat.order ?? 0,
            isActive: cat.isActive ?? true,
          });
          created++;
        } catch (error) {
          console.error('Failed to create category:', error);
        }
      }

      if (created > 0) {
        showToast(`Imported ${created} ${created === 1 ? 'category' : 'categories'}`, 'success');
        load();
      } else {
        showToast('No categories were imported', 'error');
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
      nameEn: item.nameEn || item.name || '',
      nameAr: item.nameAr || '',
      slug: item.slug || '',
      descriptionEn: item.descriptionEn || item.description || '',
      descriptionAr: item.descriptionAr || '',
      order: item.order ?? 0,
      isActive: item.isActive ?? true,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryName = (item) => {
    if (i18n.language === 'ar' && item.nameAr) {
      return item.nameAr;
    }
    return item.nameEn || item.name || '';
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
        <h1 className="font-serif text-3xl">{t('admin.categories.title')}</h1>
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
          <Link to="/admin/categories/new" className="btn btn-primary">
            {t('admin.categories.create')}
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl p-5 shadow-soft flex flex-col gap-2">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-semibold">{getCategoryName(item)}</div>
                <div className="text-xs text-black/60">{item.slug}</div>
              </div>
              <div className="flex gap-2 text-xs">
                <Link
                  to={`/admin/categories/${item.id}`}
                  className="px-3 py-1.5 rounded-full border border-black/10 bg-ivory hover:bg-charcoal hover:text-ivory transition-colors"
                >
                  {t('admin.categories.edit')}
                </Link>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full border border-red-100 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  onClick={() => openDeleteConfirm(item)}
                >
                  {t('admin.categories.delete')}
                </button>
              </div>
            </div>
            {(item.descriptionEn || item.description || item.descriptionAr) && (
              <p className="text-sm text-black/80">
                {i18n.language === 'ar' && item.descriptionAr
                  ? item.descriptionAr
                  : item.descriptionEn || item.description || ''}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-black/60 mt-1">
              <span>
                {t('admin.categories.order')}: {item.order}
              </span>
              <span>
                {item.isActive ? t('admin.categories.active') : t('admin.categories.inactive')}
              </span>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="text-sm text-black/60 text-center py-10">
            {t('admin.categories.no_categories')}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title={t('admin.categories.delete')}
        description={t('admin.products.confirm_delete_body', { name: deleteName || '' })}
        confirmLabel={t('admin.common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
