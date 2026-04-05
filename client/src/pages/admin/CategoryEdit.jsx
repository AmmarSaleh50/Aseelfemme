import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import LanguageTabs from '../../components/admin/LanguageTabs';

const empty = {
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    order: 0,
    isActive: true,
};

export default function CategoryEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showToast } = useToast();

    const [activeLanguage, setActiveLanguage] = useState('en');
    const [form, setForm] = useState(empty);
    const [initialForm, setInitialForm] = useState(empty);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});
    const [ignoreUnsavedGuard, setIgnoreUnsavedGuard] = useState(false);
    const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

    const nameRef = useRef(null);
    const descriptionRef = useRef(null);

    useEffect(() => {
        const bootstrap = async () => {
            const token = localStorage.getItem('af_admin_token');
            setAuthToken(token);

            if (id && id !== 'new') {
                try {
                    const r = await api.get(`/admin/categories/${id}`);
                    const cat = r.data;
                    const formData = {
                        nameEn: cat.name_en || cat.nameEn || cat.name || '',
                        nameAr: cat.name_ar || cat.nameAr || '',
                        descriptionEn: cat.description_en || cat.descriptionEn || cat.description || '',
                        descriptionAr: cat.description_ar || cat.descriptionAr || '',
                        order: cat.order ?? 0,
                        isActive: cat.is_active ?? cat.isActive ?? true,
                    };
                    setForm(formData);
                    setInitialForm(formData);
                    setEditingId(cat.id);
                } catch (error) {
                    console.error(error);
                    showToast('Failed to load category', 'error');
                    navigate('/admin/categories');
                }
            }

            setLoading(false);
        };

        bootstrap();
    }, [id, navigate, showToast]);

    const isDirty = useMemo(() => {
        return JSON.stringify(form) !== JSON.stringify(initialForm);
    }, [form, initialForm]);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !ignoreUnsavedGuard &&
            isDirty &&
            currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === 'blocked') {
            setConfirmLeaveOpen(true);
        }
    }, [blocker.state]);

    const clearFieldError = (field) => {
        setFieldErrors((prev) => {
            if (!prev || !prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        const payload = {
            nameEn: form.nameEn.trim(),
            nameAr: form.nameAr.trim(),
            descriptionEn: form.descriptionEn.trim(),
            descriptionAr: form.descriptionAr.trim(),
            order: Number(form.order) || 0,
            isActive: !!form.isActive,
        };

        try {
            if (editingId) {
                await api.put(`/admin/categories/${editingId}`, payload);
                showToast(t('admin.categories.updated'), 'success');
            } else {
                await api.post('/admin/categories', payload);
                showToast(t('admin.categories.created'), 'success');
            }
            setIgnoreUnsavedGuard(true);
            setTimeout(() => navigate('/admin/categories'), 100);
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
            setForm({
                nameEn: data.nameEn || data.name || '',
                nameAr: data.nameAr || '',
                descriptionEn: data.descriptionEn || data.description || '',
                descriptionAr: data.descriptionAr || '',
                order: data.order ?? 0,
                isActive: data.isActive ?? true,
            });
            showToast('JSON imported', 'success');
        } catch (error) {
            showToast('Invalid JSON', 'error');
        } finally {
            e.target.value = '';
        }
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `category-${form.nameEn || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBackClick = () => {
        navigate('/admin/categories');
    };

    const handleLeaveConfirm = () => {
        setConfirmLeaveOpen(false);
        setFieldErrors({});
        setIgnoreUnsavedGuard(true);
        if (blocker.state === 'blocked') {
            blocker.proceed();
        } else {
            navigate('/admin/categories');
        }
    };

    const handleLeaveCancel = () => {
        setConfirmLeaveOpen(false);
        if (blocker.state === 'blocked') {
            blocker.reset();
        }
    };

    if (loading) {
        return (
            <div className="container-px max-w-3xl mx-auto py-10 text-sm text-black/60">
                {t('common.loading')}
            </div>
        );
    }

    const title = editingId
        ? t('admin.categories.update')
        : t('admin.categories.create');

    return (
        <div className="container-px max-w-3xl mx-auto py-10">
            <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs text-black/75 rounded-full border border-black/10 px-3 py-1.5 hover:bg-ivory/80 transition-colors"
                        onClick={handleBackClick}
                    >
                        <ChevronLeft className="w-3 h-3" aria-hidden="true" />
                        <span>{t('cta.view_all')} {t('admin.categories.title').toLowerCase()}</span>
                    </button>
                    <div className="hidden sm:block" />
                </div>
                <h1 className="font-serif text-3xl text-center">{title}</h1>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-soft w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-black/10 pb-4">
                    <LanguageTabs
                        activeLanguage={activeLanguage}
                        onLanguageChange={setActiveLanguage}
                        className="!mb-0 !border-0 !pb-0"
                    />
                    <div className="flex gap-2">
                        <label className="btn btn-secondary cursor-pointer text-xs py-2 h-auto">
                            {t('admin.common.import')}
                            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </label>
                        <button type="button" className="btn btn-secondary text-xs py-2 h-auto" onClick={handleExport}>
                            {t('admin.common.export')}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-6">
                    {/* Name Fields */}
                    <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3">
                        <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
                            {t('admin.categories.section_basic')}
                        </div>

                        {activeLanguage === 'en' && (
                            <div className="grid gap-1">
                                <label className="text-xs text-black/60">{t('admin.categories.name')} (EN)</label>
                                <input
                                    ref={nameRef}
                                    value={form.nameEn}
                                    onChange={(e) => {
                                        setForm({ ...form, nameEn: e.target.value });
                                        clearFieldError('nameEn');
                                    }}
                                    className={`rounded-xl px-4 py-2 border ${fieldErrors.nameEn ? 'border-red-400' : 'border-black/10'
                                        }`}
                                    required
                                />
                                {fieldErrors.nameEn && (
                                    <span className="text-xs text-red-600">{fieldErrors.nameEn}</span>
                                )}
                            </div>
                        )}

                        {activeLanguage === 'ar' && (
                            <div className="grid gap-1">
                                <label className="text-xs text-black/60">{t('admin.categories.name')} (AR)</label>
                                <input
                                    value={form.nameAr}
                                    onChange={(e) => {
                                        setForm({ ...form, nameAr: e.target.value });
                                        clearFieldError('nameAr');
                                    }}
                                    className={`rounded-xl px-4 py-2 border ${fieldErrors.nameAr ? 'border-red-400' : 'border-black/10'
                                        }`}
                                    dir="rtl"
                                    lang="ar"
                                />
                                {fieldErrors.nameAr && (
                                    <span className="text-xs text-red-600">{fieldErrors.nameAr}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description Fields */}
                    <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3">
                        <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
                            {t('admin.categories.section_description')}
                        </div>

                        {activeLanguage === 'en' && (
                            <div className="grid gap-1">
                                <label className="text-xs text-black/60">{t('admin.categories.description')} (EN)</label>
                                <textarea
                                    ref={descriptionRef}
                                    value={form.descriptionEn}
                                    onChange={(e) => {
                                        setForm({ ...form, descriptionEn: e.target.value });
                                        clearFieldError('descriptionEn');
                                    }}
                                    className={`rounded-xl px-4 py-2 border ${fieldErrors.descriptionEn ? 'border-red-400' : 'border-black/10'
                                        } min-h-[100px]`}
                                />
                                {fieldErrors.descriptionEn && (
                                    <span className="text-xs text-red-600">{fieldErrors.descriptionEn}</span>
                                )}
                            </div>
                        )}

                        {activeLanguage === 'ar' && (
                            <div className="grid gap-1">
                                <label className="text-xs text-black/60">{t('admin.categories.description')} (AR)</label>
                                <textarea
                                    value={form.descriptionAr}
                                    onChange={(e) => {
                                        setForm({ ...form, descriptionAr: e.target.value });
                                        clearFieldError('descriptionAr');
                                    }}
                                    className={`rounded-xl px-4 py-2 border ${fieldErrors.descriptionAr ? 'border-red-400' : 'border-black/10'
                                        } min-h-[100px]`}
                                    dir="rtl"
                                    lang="ar"
                                />
                                {fieldErrors.descriptionAr && (
                                    <span className="text-xs text-red-600">{fieldErrors.descriptionAr}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3">
                        <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
                            {t('admin.categories.section_settings')}
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs text-black/60">{t('admin.categories.order')}</label>
                            <input
                                type="number"
                                value={form.order}
                                onChange={(e) => setForm({ ...form, order: e.target.value })}
                                className="rounded-xl px-4 py-2 border border-black/10"
                            />
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-black/70">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                            />
                            <span>{t('admin.categories.isActive')}</span>
                        </label>
                    </div>

                    <div className="flex gap-2 mt-2 justify-end">
                        <button type="submit" className="btn btn-primary">{title}</button>
                    </div>
                </form>
            </div>

            <ConfirmDialog
                open={confirmLeaveOpen}
                title={t('admin.common.discard_changes_title')}
                description={t('admin.products.unsaved_changes_confirm')}
                confirmLabel={t('admin.common.discard')}
                cancelLabel={t('common.cancel')}
                onConfirm={handleLeaveConfirm}
                onCancel={handleLeaveCancel}
            />
        </div>
    );
}
