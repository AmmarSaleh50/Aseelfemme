import React, { useEffect, useState } from 'react';
import { api, setAuthToken } from '../../lib/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, FlaskConical, FolderTree, Gem } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('af_admin_token');
    setAuthToken(token);
    api.get('/admin/stats').then(r => setStats(r.data));
  }, []);
  return (
    <div className="container-px max-w-5xl mx-auto py-10">
      <h1 className="font-serif text-3xl mb-6">{t('sections.admin')}</h1>
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/products"
            className="bg-white rounded-3xl p-6 shadow-soft flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-transform transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-ivory flex items-center justify-center text-charcoal">
                <Package className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="text-sm text-black/60">{t('sections.products')}</div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-3xl font-semibold">{stats.products}</div>
              <span className="text-xs underline">{t('cta.view_all')}</span>
            </div>
          </Link>
          <Link
            to="/admin/ingredients"
            className="bg-white rounded-3xl p-6 shadow-soft flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-transform transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-ivory flex items-center justify-center text-charcoal">
                <FlaskConical className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="text-sm text-black/60">{t('sections.ingredients')}</div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-3xl font-semibold">{stats.ingredients}</div>
              <span className="text-xs underline">{t('cta.view_all')}</span>
            </div>
          </Link>
          <Link
            to="/admin/categories"
            className="bg-white rounded-3xl p-6 shadow-soft flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-transform transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-ivory flex items-center justify-center text-charcoal">
                <FolderTree className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="text-sm text-black/60">{t('sections.categories')}</div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-3xl font-semibold">{stats.categories}</div>
              <span className="text-xs underline">{t('cta.view_all')}</span>
            </div>
          </Link>
          <Link
            to="/admin/accessories"
            className="bg-white rounded-3xl p-6 shadow-soft flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-transform transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-ivory flex items-center justify-center text-charcoal">
                <Gem className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="text-sm text-black/60">{t('admin.accessories.title') || 'Accessories'}</div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-3xl font-semibold">{stats.accessories}</div>
              <span className="text-xs underline">{t('cta.view_all')}</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
