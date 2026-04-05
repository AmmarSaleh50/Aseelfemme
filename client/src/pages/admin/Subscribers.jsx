import React, { useEffect, useState } from 'react';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function AdminSubscribers() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);

  const load = async () => {
    const token = localStorage.getItem('af_admin_token');
    setAuthToken(token);
    const r = await api.get('/admin/subscribers');
    setItems(r.data);
  };

  useEffect(() => { load(); }, []);

  const delItem = async (id) => {
    await api.delete(`/admin/subscribers/${id}`);
    load();
  };

  return (
    <div className="container-px max-w-4xl mx-auto py-10">
      <h1 className="font-serif text-3xl mb-4">{t('admin.subscribers.title')}</h1>
      <div className="bg-white rounded-3xl shadow-soft divide-y divide-black/5">
        {items.map(sub => (
          <div key={sub.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="font-medium">{sub.email}</div>
              {sub.createdAt && (
                <div className="text-xs text-black/60">
                  {t('admin.subscribers.subscribed_at')} {new Date(sub.createdAt).toLocaleString()}
                </div>
              )}
            </div>
            <button className="text-sm text-red-600 underline" onClick={()=>delItem(sub.id)}>{t('admin.subscribers.delete')}</button>
          </div>
        ))}
        {!items.length && (
          <div className="px-5 py-4 text-sm text-black/60">{t('admin.subscribers.empty')}</div>
        )}
      </div>
    </div>
  );
}
