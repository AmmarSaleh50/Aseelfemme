import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { ChevronLeft } from 'lucide-react';

export default function AdminAccessoriesList() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
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
            try {
                const res = await api.get('/admin/accessories');
                setItems(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleCreate = () => {
        navigate('/admin/accessories/new');
    };

    const handleEdit = (id) => {
        navigate(`/admin/accessories/${id}`);
    };

    const openDeleteConfirm = (item) => {
        setDeleteId(item.id);
        setDeleteName(item[`name${lang}`] || item.nameEn || '');
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId || deleting) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('af_admin_token');
            setAuthToken(token);
            await api.delete(`/admin/accessories/${deleteId}`);
            setItems((prev) => prev.filter((p) => p.id !== deleteId));
            showToast(t('admin.common.deleted'), 'success');
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
                <h1 className="font-serif text-3xl">{t('admin.accessories.title') || 'Accessories'}</h1>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCreate}
                    >
                        {t('admin.accessories.new')}
                    </button>
                </div>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col"
                    >
                        <div className="aspect-square w-full overflow-hidden bg-ivory/50">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.nameEn}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-black/40">
                                    {t('common.no_image')}
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold truncate">{item[`name${lang}`] || item.nameEn}</div>
                            </div>
                            <div className="mt-3 flex gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(item.id)}
                                    className="px-3 py-1.5 rounded-full border border-black/10 bg-ivory hover:bg-charcoal hover:text-ivory transition-colors"
                                >
                                    {t('common.edit')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openDeleteConfirm(item)}
                                    className="px-3 py-1.5 rounded-full border border-red-100 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                    {t('common.delete')}
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
                title={t('common.delete')}
                description={t('admin.common.confirm_delete_body', { name: deleteName })}
                confirmLabel={t('admin.common.confirm')}
                cancelLabel={t('common.cancel')}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </div>
    );
}
