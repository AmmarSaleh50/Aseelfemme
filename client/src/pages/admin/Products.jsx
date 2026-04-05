import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { ChevronLeft } from 'lucide-react';

export default function AdminProducts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      const res = await api.get('/admin/products?status=all');
      setItems(res.data || []);
      setLoading(false);
    };

    load();
  }, []);

  const getStatusClasses = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'border-mint/40 bg-mint/10 text-mint';
      case 'DRAFT':
        return 'border-amber/40 bg-amber/10 text-amber-700';
      case 'ARCHIVED':
        return 'border-black/10 bg-black/5 text-black/50';
      default:
        return 'border-black/10 bg-ivory text-black/60';
    }
  };

  const handleCreate = () => {
    navigate('/admin/products/new');
  };

  const handleEdit = (id) => {
    navigate(`/admin/products/${id}`);
  };

  const openDeleteConfirm = (product) => {
    setDeleteId(product.id);
    setDeleteName(product.name || '');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      await api.delete(`/admin/products/${deleteId}`);
      setItems((prev) => prev.filter((p) => p.id !== deleteId));
      showToast(t('admin.common.product_deleted'), 'success');
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

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      const res = await api.get('/admin/products/export');
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('admin.common.export_success'), 'success');
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid format');

      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      const res = await api.post('/admin/products/import', data);
      showToast(t('admin.common.import_success', { count: res.data.count }), 'success');

      const resList = await api.get('/admin/products?status=all');
      setItems(resList.data || []);
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    } finally {
      e.target.value = '';
    }
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
        <h1 className="font-serif text-3xl">{t('admin.products.title')}</h1>
        <div className="flex gap-2">
          <label className="btn btn-secondary cursor-pointer">
            {t('admin.common.import')}
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            {t('admin.common.export')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreate}
          >
            {t('admin.products.new')}
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col"
          >
            <div className="aspect-square w-full overflow-hidden">
              {p.heroImageUrl ? (
                <img
                  src={p.heroImageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-black/40 bg-ivory">
                  {t('admin.products.no_image')}
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold truncate">{p.name}</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide ${getStatusClasses(
                    p.status,
                  )}`}
                >
                  {p.status}
                </span>
              </div>
              <div className="text-xs text-black/60 truncate">{p.category}</div>
              <div className="mt-3 flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleEdit(p.id)}
                  className="px-3 py-1.5 rounded-full border border-black/10 bg-ivory hover:bg-charcoal hover:text-ivory transition-colors"
                >
                  {t('admin.products.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteConfirm(p)}
                  className="px-3 py-1.5 rounded-full border border-red-100 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  {t('admin.products.delete')}
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
        title={t('admin.products.delete')}
        description={t('admin.products.confirm_delete_body', { name: deleteName || '' })}
        confirmLabel={t('admin.common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
