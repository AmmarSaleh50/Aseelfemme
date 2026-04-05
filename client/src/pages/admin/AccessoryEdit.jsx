import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { ImageUp, Trash2, ChevronLeft, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import FilterDropdown from '../../components/FilterDropdown';
import LanguageTabs from '../../components/admin/LanguageTabs';

const empty = {
    nameEn: '', nameAr: '',
    slug: '',
    shortDescriptionEn: '', shortDescriptionAr: '',
    descriptionEn: '', descriptionAr: '', // Long description
    imageUrl: '', // Hero
    galleryImageUrls: [],
    beeorderUrl: '',
    isActive: true,
    tagsInputEn: '', tagsInputAr: ''
};

const slugify = (text) => text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export default function AccessoryEdit() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activeLanguage, setActiveLanguage] = useState('en');
    const [form, setForm] = useState(empty);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    useEffect(() => {
        if (id) {
            setLoading(true);
            const token = localStorage.getItem('af_admin_token');
            setAuthToken(token);
            api.get(`/admin/accessories/${id}`)
                .then(res => {
                    const data = res.data;
                    // Map DB fields to state
                    setForm({
                        ...empty,
                        ...data,
                        descriptionEn: data.descriptionEn || data.description, // Fallback logic if needed
                        descriptionAr: data.descriptionAr,
                        nameEn: data.nameEn || data.name,
                        isActive: data.isActive ?? true,
                        // Convert tags arrays to string
                        tagsInputEn: (data.tagsEn || []).join(', '),
                        tagsInputAr: (data.tagsAr || []).join(', '),
                    });
                })
                .catch(err => {
                    console.error(err);
                    showToast('Failed to load accessory', 'error');
                    navigate('/admin/accessories');
                })
                .finally(() => setLoading(false));
        }
    }, [id, navigate, showToast]);

    // Determine effective language for labels/placeholders if needed
    const isAr = activeLanguage === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('af_admin_token');
            setAuthToken(token);
            const fd = new FormData();
            fd.append('file', file);
            const res = await api.post('/admin/upload', fd);
            if (res.data?.url) {
                setForm(prev => ({ ...prev, imageUrl: res.data.url }));
            }
        } catch (error) {
            showToast('Upload failed', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = null;
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('af_admin_token');
            setAuthToken(token);
            const newUrls = [];
            for (let i = 0; i < files.length; i++) {
                const fd = new FormData();
                fd.append('file', files[i]);
                const res = await api.post('/admin/upload', fd);
                if (res.data?.url) newUrls.push(res.data.url);
            }
            setForm(prev => ({
                ...prev,
                galleryImageUrls: [...(prev.galleryImageUrls || []), ...newUrls]
            }));
        } catch (error) {
            showToast('Gallery upload failed', 'error');
        } finally {
            setUploading(false);
            if (galleryInputRef.current) galleryInputRef.current.value = null;
        }
    };

    const removeGalleryImage = (idx) => {
        setForm(prev => {
            const next = [...(prev.galleryImageUrls || [])];
            next.splice(idx, 1);
            return { ...prev, galleryImageUrls: next };
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.nameEn) return showToast(t('admin.products.missing_required'), 'error');

        setUploading(true);
        try {
            const token = localStorage.getItem('af_admin_token');
            setAuthToken(token);

            const { tagsInputEn, tagsInputAr, created_at, updated_at, id: _id, ...rest } = form;

            const payload = {
                ...rest,
                tagsEn: tagsInputEn ? tagsInputEn.split(',').map(s => s.trim()).filter(Boolean) : [],
                tagsAr: tagsInputAr ? tagsInputAr.split(',').map(s => s.trim()).filter(Boolean) : [],
                // Ensure slug
                slug: form.slug || slugify(form.nameEn)
            };

            if (id) {
                await api.put(`/admin/accessories/${id}`, payload);
            } else {
                await api.post('/admin/accessories', payload);
            }
            showToast(t('admin.accessories.toast_success'), 'success');
            navigate('/admin/accessories');
        } catch (error) {
            console.error(error);
            showToast('Error saving accessory (check unique slug?)', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container-px max-w-7xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <Link to="/admin/accessories" className="inline-flex items-center gap-1.5 text-xs text-black/75 rounded-full border border-black/10 px-3 py-1.5 hover:bg-ivory/80 transition-colors">
                    <ChevronLeft className="w-3 h-3" />
                    {t('cta.view_all')} {t('nav.accessories')}
                </Link>
                <div className="flex items-center gap-3">
                    <button
                        disabled={uploading}
                        onClick={submit}
                        className="btn btn-primary"
                    >
                        {uploading ? (id ? 'Saving...' : 'Creating...') : (id ? t('admin.accessories.save') : t('admin.accessories.new'))}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Col: Images */}
                <div className="md:col-span-1 space-y-6">
                    <div className="rounded-2xl border border-black/5 bg-white p-4">
                        <h3 className="text-sm font-medium mb-3">Hero Image</h3>
                        <div className="aspect-square bg-ivory rounded-xl overflow-hidden relative group">
                            {form.imageUrl ? (
                                <>
                                    <img src={form.imageUrl} alt="Hero" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => setForm(f => ({ ...f, imageUrl: '' }))} className="p-2 bg-white rounded-full text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-black/30">
                                    <ImageUp className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="mt-3">
                            <button onClick={() => fileInputRef.current.click()} className="text-xs underline text-black/60 hover:text-black">
                                {form.imageUrl ? 'Change Image' : t('admin.accessories.upload_placeholder')}
                            </button>
                            <input type="file" hidden ref={fileInputRef} onChange={e => handleUpload(e.target.files[0])} accept="image/*" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-white p-4">
                        <h3 className="text-sm font-medium mb-3">Image Gallery</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {(form.galleryImageUrls || []).map((url, idx) => (
                                <div key={idx} className="aspect-square relative rounded-lg overflow-hidden group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeGalleryImage(idx)}
                                        className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => galleryInputRef.current.click()}
                                className="aspect-square rounded-lg border border-dashed border-black/20 flex items-center justify-center hover:bg-ivory transition-colors"
                            >
                                <ImageUp className="w-4 h-4 text-black/40" />
                            </button>
                        </div>
                        <input type="file" multiple hidden ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" />
                    </div>
                </div>

                {/* Right Col: Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-black/5 bg-white p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-serif">Product Information</h2>
                            <LanguageTabs activeLanguage={activeLanguage} setActiveLanguage={setActiveLanguage} />
                        </div>

                        <div className="space-y-5" dir={dir}>
                            {/* Name */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-black/50 mb-1">
                                    {t('admin.accessories.name')} ({activeLanguage.toUpperCase()})
                                </label>
                                <input
                                    type="text"
                                    value={form[`name${activeLanguage === 'en' ? 'En' : 'Ar'}`] || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const key = activeLanguage === 'en' ? 'nameEn' : 'nameAr';
                                        setForm(prev => {
                                            const next = { ...prev, [key]: val };
                                            if (activeLanguage === 'en' && !id && !prev.slug) next.slug = slugify(val);
                                            return next;
                                        });
                                    }}
                                    className="w-full rounded-xl border-black/10 focus:ring-black/5 bg-ivory/50"
                                />
                            </div>

                            {/* Slug */}
                            {activeLanguage === 'en' && (
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-black/50 mb-1">Slug (URL)</label>
                                    <input
                                        type="text"
                                        value={form.slug || ''}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        className="w-full rounded-xl border-black/10 focus:ring-black/5 bg-ivory/50 font-mono text-sm"
                                    />
                                </div>
                            )}

                            {/* Short Desc */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-black/50 mb-1">Short Description (Card)</label>
                                <textarea
                                    rows={2}
                                    value={form[`shortDescription${activeLanguage === 'en' ? 'En' : 'Ar'}`] || ''}
                                    onChange={e => {
                                        const key = activeLanguage === 'en' ? 'shortDescriptionEn' : 'shortDescriptionAr';
                                        setForm(f => ({ ...f, [key]: e.target.value }));
                                    }}
                                    className="w-full rounded-xl border-black/10 focus:ring-black/5 bg-ivory/50"
                                />
                            </div>

                            {/* Long Desc */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-black/50 mb-1">{t('admin.accessories.description')} (Detail Page)</label>
                                <textarea
                                    rows={6}
                                    value={form[`description${activeLanguage === 'en' ? 'En' : 'Ar'}`] || ''}
                                    onChange={e => {
                                        const key = activeLanguage === 'en' ? 'descriptionEn' : 'descriptionAr';
                                        setForm(f => ({ ...f, [key]: e.target.value }));
                                    }}
                                    className="w-full rounded-xl border-black/10 focus:ring-black/5 bg-ivory/50"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-black/50 mb-1">Tags (Comma separated)</label>
                                <input
                                    type="text"
                                    value={form[`tagsInput${activeLanguage === 'en' ? 'En' : 'Ar'}`] || ''}
                                    onChange={e => {
                                        const key = activeLanguage === 'en' ? 'tagsInputEn' : 'tagsInputAr';
                                        setForm(f => ({ ...f, [key]: e.target.value }));
                                    }}
                                    placeholder="e.g. Soap, Gift, Organic"
                                    className="w-full rounded-xl border-black/10 focus:ring-black/5 bg-ivory/50"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-black/50 mb-1">{t('admin.accessories.beeorder_url')}</label>
                            <input
                                type="text"
                                placeholder="http://beeorder.com/..."
                                value={form.beeorderUrl || ''}
                                onChange={e => setForm(f => ({ ...f, beeorderUrl: e.target.value }))}
                                className="w-full rounded-xl border-black/10 focus:ring-black/5 bg-ivory/50 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-black/50 mb-1">Status</label>
                            <FilterDropdown
                                options={[
                                    { value: true, label: t('admin.accessories.active') },
                                    { value: false, label: t('admin.accessories.inactive') }
                                ]}
                                value={form.isActive}
                                onChange={(opt) => setForm(f => ({ ...f, isActive: opt.value }))}
                                label=""
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
