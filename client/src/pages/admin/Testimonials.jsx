import React, { useEffect, useState } from 'react';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';

const empty = { name: '', quote: '', skinType: '', rating: 5, isFeatured: false };

export default function AdminTestimonials() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const token = localStorage.getItem('af_admin_token');
    setAuthToken(token);
    const r = await api.get('/admin/testimonials');
    setItems(r.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, rating: Number(form.rating) || 0 };
    if (editingId) {
      await api.put(`/admin/testimonials/${editingId}`, payload);
    } else {
      await api.post('/admin/testimonials', payload);
    }
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      quote: item.quote || '',
      skinType: item.skinType || '',
      rating: item.rating ?? 5,
      isFeatured: !!item.isFeatured,
    });
  };

  const delItem = async (id) => {
    await api.delete(`/admin/testimonials/${id}`);
    load();
  };

  return (
    <div className="container-px max-w-6xl mx-auto py-10">
      <h1 className="font-serif text-3xl mb-4">{t('admin.testimonials.title')}</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-black/60">{t('admin.testimonials.name')}</label>
              <input className="rounded-xl px-4 py-2 border border-black/10" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">{t('admin.testimonials.quote')}</label>
              <textarea className="rounded-xl px-4 py-2 border border-black/10 min-h-[80px]" value={form.quote} onChange={e=>setForm({...form,quote:e.target.value})} required />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">{t('admin.testimonials.skinType')}</label>
              <input className="rounded-xl px-4 py-2 border border-black/10" value={form.skinType} onChange={e=>setForm({...form,skinType:e.target.value})} />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">{t('admin.testimonials.rating')}</label>
              <input type="number" min="1" max="5" className="rounded-xl px-4 py-2 border border-black/10" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} />
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-black/80">
              <input type="checkbox" checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})} />
              {t('admin.testimonials.isFeatured')}
            </label>
            <button className="btn btn-primary w-fit">{editingId ? t('admin.testimonials.update') : t('admin.testimonials.create')}</button>
          </form>
        </div>
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-soft flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-black/60">
                    {item.skinType} • {t('admin.testimonials.rating_label', { rating: item.rating })}{item.isFeatured ? ` • ${t('admin.testimonials.featured')}` : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm underline" onClick={()=>edit(item)}>{t('admin.testimonials.edit')}</button>
                  <button className="text-sm text-red-600 underline" onClick={()=>delItem(item.id)}>{t('admin.testimonials.delete')}</button>
                </div>
              </div>
              <p className="text-sm text-black/80">“{item.quote}”</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
