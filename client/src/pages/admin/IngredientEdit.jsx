import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { ImageUp, Crop as CropIcon, Trash2, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import LanguageTabs from '../../components/admin/LanguageTabs';
import { completeIngredient, getGeminiApiKey } from '../../lib/gemini';

const empty = {
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  benefitsEnInput: '',
  benefitsArInput: '',
  imageUrl: '',
};

export default function AdminIngredientEdit() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeLanguage, setActiveLanguage] = useState('en');
  const [form, setForm] = useState(empty);
  const [initialForm, setInitialForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [ignoreUnsavedGuard, setIgnoreUnsavedGuard] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [ingredientUpdatedAt, setIngredientUpdatedAt] = useState(null);
  const [fieldUpdatedAt, setFieldUpdatedAt] = useState({});
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppingImage, setCroppingImage] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const benefitsRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const { showToast } = useToast();

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);

      if (id) {
        try {
          const res = await api.get(`/admin/ingredients/${id}`);
          const item = res.data;
          const base = {
            nameEn: item.nameEn || '',
            nameAr: item.nameAr || '',
            descriptionEn: item.descriptionEn || '',
            descriptionAr: item.descriptionAr || '',
            benefitsEnInput: (item.benefitsEn || []).join(', '),
            benefitsArInput: (item.benefitsAr || []).join(', '),
            imageUrl: item.imageUrl || '',
          };
          setForm(base);
          setInitialForm(base);
          setEditingId(item.id);
          setIngredientUpdatedAt(item.updatedAt || null);
          setFieldUpdatedAt(item.fieldUpdatedAt || {});
        } catch (error) {
          console.error(error);
          navigate('/admin/ingredients');
          return;
        }
      } else {
        setForm(empty);
        setInitialForm(empty);
        setEditingId(null);
        setIngredientUpdatedAt(null);
        setFieldUpdatedAt({});
      }

      setLoading(false);
    };

    bootstrap();
  }, [id, navigate]);

  // Check if Gemini API key is configured
  useEffect(() => {
    getGeminiApiKey().then(key => setHasApiKey(!!key)).catch(() => setHasApiKey(false));
  }, []);

  // AI Complete - fills empty fields with Gemini
  const handleAIComplete = async () => {
    if (!hasApiKey) {
      showToast('Please configure your Gemini API key in Account settings first', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const completed = await completeIngredient(form);

      // Merge: keep existing non-empty values, fill in empty ones from AI
      setForm(prev => {
        const merged = { ...prev };
        Object.keys(completed).forEach(key => {
          const currentVal = prev[key];
          const aiVal = completed[key];

          const isEmpty = currentVal === '' || currentVal === null || currentVal === undefined ||
            (Array.isArray(currentVal) && currentVal.length === 0);

          if (isEmpty && aiVal !== undefined && aiVal !== null && aiVal !== '') {
            merged[key] = aiVal;
          }
        });
        return merged;
      });

      showToast('AI filled in the empty fields! ✨', 'success');
    } catch (error) {
      console.error('AI completion error:', error);
      showToast(error.message || 'AI completion failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev || !prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const formatTimestamp = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const locale = 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const renderFieldUpdated = (field) => {
    const raw = (fieldUpdatedAt || {})[field];
    const formatted = formatTimestamp(raw);
    if (!formatted) return null;
    return (
      <span className="text-[10px] text-black/40">
        {' - '}
        {t('admin.ingredients.last_updated_field', { value: formatted })}
      </span>
    );
  };

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const blocker = useBlocker(isDirty && !ignoreUnsavedGuard);

  useEffect(() => {
    if (!isDirty || ignoreUnsavedGuard) {
      if (confirmLeaveOpen) {
        setConfirmLeaveOpen(false);
      }
      return;
    }
    if (blocker.state === 'blocked' && !confirmLeaveOpen) {
      setConfirmLeaveOpen(true);
    }
  }, [blocker.state, isDirty, ignoreUnsavedGuard, confirmLeaveOpen]);

  useEffect(() => {
    if (!isDirty || ignoreUnsavedGuard) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      // Chrome requires returnValue to be set.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, ignoreUnsavedGuard]);

  const handleLeaveConfirm = () => {
    setConfirmLeaveOpen(false);
    setFieldErrors({});
    setIgnoreUnsavedGuard(true);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    } else {
      navigate('/admin/ingredients');
    }
  };

  const handleLeaveCancel = () => {
    setConfirmLeaveOpen(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/admin/upload', fd);
      const url = res.data?.url;
      if (url) {
        // Supabase Storage returns full public URL
        setForm((prev) => ({ ...prev, imageUrl: url }));
        clearFieldError('imageUrl');
      }
    } finally {
      setUploading(false);
    }
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (err) => reject(err));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImage = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = Math.max(pixelCrop.width, pixelCrop.height);
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      size,
      size,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const startCropFromFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCroppingImage(reader.result);
      setCropperOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageEditClick = (event) => {
    if (event) {
      event.stopPropagation();
    }
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const handleImageCropClick = (event) => {
    if (event) {
      event.stopPropagation();
    }
    if (!form.imageUrl) return;
    setCroppingImage(form.imageUrl);
    setCropperOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const onCropComplete = (_, pixels) => {
    setCroppedAreaPixels(pixels);
  };

  const cancelCrop = () => {
    setCropperOpen(false);
    setCroppingImage(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const applyCrop = async () => {
    if (!croppingImage || !croppedAreaPixels) {
      cancelCrop();
      return;
    }
    const blob = await getCroppedImage(croppingImage, croppedAreaPixels);
    if (blob) {
      const file = new File([blob], 'ingredient.jpg', { type: 'image/jpeg' });
      await handleUpload(file);
    }
    cancelCrop();
  };

  const handleImageRemoveClick = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setForm((prev) => ({ ...prev, imageUrl: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const { benefitsEnInput, benefitsArInput, ...rest } = form;
    const benefitsEn = benefitsEnInput
      ? benefitsEnInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const benefitsAr = benefitsArInput
      ? benefitsArInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const payload = { ...rest, benefitsEn, benefitsAr };

    const errors = {};
    if (!rest.nameEn?.trim()) errors.nameEn = true;
    if (!rest.nameAr?.trim()) errors.nameAr = true;
    if (!rest.descriptionEn?.trim()) errors.descriptionEn = true;
    if (!rest.descriptionAr?.trim()) errors.descriptionAr = true;
    if (!rest.imageUrl?.trim()) errors.imageUrl = true;

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      showToast(t('admin.ingredients.missing_required'), 'error');

      const fieldOrder = ['nameEn', 'nameAr', 'descriptionEn', 'descriptionAr', 'benefitsEnInput', 'benefitsArInput', 'imageUrl'];
      const refMap = {
        nameEn: nameRef,
        nameAr: nameRef,
        descriptionEn: descriptionRef,
        descriptionAr: descriptionRef,
        benefitsEnInput: benefitsRef,
        benefitsArInput: benefitsRef,
        imageUrl: imageRef,
      };

      for (let i = 0; i < fieldOrder.length; i += 1) {
        const key = fieldOrder[i];
        if (!errors[key]) continue;
        const node = refMap[key]?.current;
        if (node) {
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof node.focus === 'function') {
            node.focus();
          }
        }
        break;
      }

      return;
    }

    let changeCount = 0;
    if (editingId && initialForm) {
      const fieldsToCheck = ['nameEn', 'nameAr', 'descriptionEn', 'descriptionAr', 'benefitsEnInput', 'benefitsArInput', 'imageUrl'];
      fieldsToCheck.forEach((field) => {
        const curr = form[field];
        const init = initialForm[field];
        if ((curr ?? '') !== (init ?? '')) {
          changeCount += 1;
        }
      });
    }

    try {
      if (editingId) {
        const res = await api.put(`/admin/ingredients/${editingId}`, payload);
        const updated = res.data;
        if (changeCount === 0) {
          showToast(t('admin.ingredients.updated_no_changes'), 'success');
        } else {
          showToast(
            t('admin.ingredients.updated_with_changes', { count: changeCount }),
            'success',
          );
        }
        setIngredientUpdatedAt(updated?.updatedAt || null);
        setFieldUpdatedAt(updated?.fieldUpdatedAt || {});
      } else {
        await api.post('/admin/ingredients', payload);
        showToast(t('admin.ingredients.saved'), 'success');
      }

      setIgnoreUnsavedGuard(true);
      setTimeout(() => {
        navigate('/admin/ingredients');
      }, 0);
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(form, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingredient-${form.nameEn || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('admin.common.export_success'), 'success');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setForm(prev => ({ ...prev, ...data }));
      showToast(t('admin.common.import_success', { count: 1 }), 'success');
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    } finally {
      e.target.value = '';
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
    ? t('admin.ingredients.update')
    : t('admin.ingredients.create');

  const handleBackClick = () => {
    navigate('/admin/ingredients');
  };

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
            <span>
              {t('cta.view_all')} {t('admin.ingredients.title').toLowerCase()}
            </span>
          </button>
          <div className="hidden sm:block" />
        </div>
        <h1 className="font-serif text-3xl text-center">{title}</h1>
        {ingredientUpdatedAt && (
          <div className="mt-1 text-center text-[11px] text-black/45">
            {t('admin.ingredients.last_updated_ingredient', {
              value: formatTimestamp(ingredientUpdatedAt),
            })}
          </div>
        )}
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-soft w-full">
        <LanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />
        <form onSubmit={submit} className="grid gap-6">
          <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3 order-2">
            <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
              {t('admin.products.section_main')}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.ingredients.name')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated(activeLanguage === 'en' ? 'nameEn' : 'nameAr')}
              </label>
              {activeLanguage === 'en' ? (
                <input
                  ref={nameRef}
                  value={form.nameEn}
                  onChange={(e) => {
                    setForm({ ...form, nameEn: e.target.value });
                    clearFieldError('nameEn');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 ${fieldErrors.nameEn ? 'border-red-400 bg-red-50' : ''
                    }`}
                />
              ) : (
                <input
                  ref={nameRef}
                  value={form.nameAr}
                  onChange={(e) => {
                    setForm({ ...form, nameAr: e.target.value });
                    clearFieldError('nameAr');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 text-right ${fieldErrors.nameAr ? 'border-red-400 bg-red-50' : ''
                    }`}
                  dir="rtl"
                />
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.ingredients.description')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated(activeLanguage === 'en' ? 'descriptionEn' : 'descriptionAr')}
              </label>
              {activeLanguage === 'en' ? (
                <textarea
                  ref={descriptionRef}
                  value={form.descriptionEn}
                  onChange={(e) =>
                    setForm({ ...form, descriptionEn: e.target.value })
                  }
                  className={`rounded-xl px-4 py-2 border min-h-[80px] ${fieldErrors.descriptionEn
                    ? 'border-red-400 bg-red-50'
                    : 'border-black/10'
                    }`}
                />
              ) : (
                <textarea
                  ref={descriptionRef}
                  value={form.descriptionAr}
                  onChange={(e) =>
                    setForm({ ...form, descriptionAr: e.target.value })
                  }
                  className={`rounded-xl px-4 py-2 border min-h-[80px] text-right ${fieldErrors.descriptionAr
                    ? 'border-red-400 bg-red-50'
                    : 'border-black/10'
                    }`}
                  dir="rtl"
                />
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.ingredients.benefits')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated(activeLanguage === 'en' ? 'benefitsEnInput' : 'benefitsArInput')}
              </label>
              {activeLanguage === 'en' ? (
                <input
                  ref={benefitsRef}
                  value={form.benefitsEnInput}
                  onChange={(e) =>
                    setForm({ ...form, benefitsEnInput: e.target.value })
                  }
                  className={`rounded-xl px-4 py-2 border ${fieldErrors.benefitsEnInput
                    ? 'border-red-400 bg-red-50'
                    : 'border-black/10'
                    }`}
                />
              ) : (
                <input
                  ref={benefitsRef}
                  value={form.benefitsArInput}
                  onChange={(e) =>
                    setForm({ ...form, benefitsArInput: e.target.value })
                  }
                  className={`rounded-xl px-4 py-2 border text-right ${fieldErrors.benefitsArInput
                    ? 'border-red-400 bg-red-50'
                    : 'border-black/10'
                    }`}
                  dir="rtl"
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3 order-1">
            <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
              {t('admin.products.section_image')}
            </div>
            <div className="grid gap-2" ref={imageRef}>
              <label className="text-xs text-black/60">
                {t('admin.ingredients.imageUrl')}
                {renderFieldUpdated('imageUrl')}
              </label>
              <div
                className={`mt-1 rounded-2xl border border-dashed aspect-square w-full flex items-center justify-center relative overflow-hidden cursor-pointer ${fieldErrors.imageUrl
                  ? 'border-red-400 bg-red-50'
                  : 'border-black/15 bg-ivory/60'
                  }`}
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
              >
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt={form.nameEn || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-xs text-black/50 px-4">
                    {uploading
                      ? t('admin.products.image_uploading')
                      : t('admin.products.image_upload')}
                  </div>
                )}
                {form.imageUrl && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={handleImageEditClick}
                      className="p-1.5 rounded-full bg-white/85 shadow-soft hover:bg-white text-charcoal transition-colors"
                    >
                      <span className="sr-only">{t('admin.products.image_edit')}</span>
                      <ImageUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleImageCropClick}
                      className="p-1.5 rounded-full bg-white/85 shadow-soft hover:bg-white text-charcoal transition-colors"
                    >
                      <span className="sr-only">{t('admin.products.image_crop')}</span>
                      <CropIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleImageRemoveClick}
                      className="p-1.5 rounded-full bg-white/85 shadow-soft hover:bg-white text-red-700 transition-colors"
                    >
                      <span className="sr-only">{t('admin.products.image_remove')}</span>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => startCropFromFile(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 order-3 mt-2">
            <label className="btn btn-secondary cursor-pointer">
              {t('admin.common.import')}
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button type="button" className="btn btn-secondary" onClick={handleExport}>
              {t('admin.common.export')}
            </button>
            <button
              type="button"
              onClick={handleAIComplete}
              disabled={aiLoading}
              className="btn btn-secondary flex items-center gap-2"
              title={hasApiKey ? 'Fill empty fields with AI' : 'Configure API key in Account settings'}
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {aiLoading ? 'Completing...' : 'Complete with AI'}
            </button>
            <button className="btn btn-primary">{title}</button>
          </div>
        </form>
      </div >
      {cropperOpen && croppingImage && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-4 w-full max-w-md shadow-soft container-px">
            <div className="text-sm font-medium mb-3">
              {t('admin.products.image_preview')}
            </div>
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/5">
              <Cropper
                image={croppingImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex justify-between gap-3 text-sm">
              <button
                type="button"
                className="px-4 py-2 rounded-full border border-black/10"
                onClick={cancelCrop}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={applyCrop}
              >
                {t('admin.products.image_apply_crop')}
              </button>
            </div>
          </div>
        </div>
      )
      }
      <ConfirmDialog
        open={confirmLeaveOpen}
        title={t('admin.common.discard_changes_title')}
        description={t('admin.products.unsaved_changes_confirm')}
        confirmLabel={t('admin.common.discard')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleLeaveConfirm}
        onCancel={handleLeaveCancel}
      />
    </div >
  );
}
