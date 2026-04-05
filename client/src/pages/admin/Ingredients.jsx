import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBlocker } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { ImageUp, Crop as CropIcon, Trash2 } from 'lucide-react';

const empty = {
  name: '',
  description: '',
  benefitsInput: '',
  imageUrl: '',
};

export default function AdminIngredients() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const { showToast } = useToast();
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [initialForm, setInitialForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState({});
  const [ignoreUnsavedGuard, setIgnoreUnsavedGuard] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [ingredientUpdatedAt, setIngredientUpdatedAt] = useState(null);
  const [fieldUpdatedAt, setFieldUpdatedAt] = useState({});
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppingImage, setCroppingImage] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [confirmRemoveImageOpen, setConfirmRemoveImageOpen] = useState(false);

  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const benefitsRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    const token = localStorage.getItem('af_admin_token');
    setAuthToken(token);
    const r = await api.get('/admin/ingredients');
    setItems(r.data || []);
  };

  useEffect(() => {
    load();
  }, []);

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

  const handleLeaveConfirm = () => {
    setConfirmLeaveOpen(false);

    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      if (action.type === 'startNew') {
        applyStartNew();
      } else if (action.type === 'edit' && action.item) {
        applyEdit(action.item);
      }
      return;
    }

    setIgnoreUnsavedGuard(true);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const handleLeaveCancel = () => {
    setConfirmLeaveOpen(false);
    setPendingAction(null);
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
    if (!form.imageUrl) return;
    setConfirmRemoveImageOpen(true);
  };

  const handleImageRemoveConfirm = () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    setConfirmRemoveImageOpen(false);
  };

  const handleImageRemoveCancel = () => {
    setConfirmRemoveImageOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const { benefitsInput, ...rest } = form;
    const benefits = benefitsInput
      ? benefitsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const payload = { ...rest, benefits };

    const errors = {};
    if (!rest.name?.trim()) errors.name = true;

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      showToast(t('admin.ingredients.missing_required'), 'error');

      const fieldOrder = ['name'];
      const refMap = {
        name: nameRef,
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
      const fieldsToCheck = ['name', 'description', 'benefitsInput', 'imageUrl'];
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
      const nextBase = empty;
      setForm(nextBase);
      setInitialForm(nextBase);
      setEditingId(null);
      setFieldErrors({});
      setIngredientUpdatedAt(null);
      setFieldUpdatedAt({});
      load();
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    }
  };

  const applyEdit = (item) => {
    setEditingId(item.id);
    const base = {
      name: item.name || '',
      description: item.description || '',
      benefitsInput: (item.benefits || []).join(', '),
      imageUrl: item.imageUrl || '',
    };
    setForm(base);
    setInitialForm(base);
    setFieldErrors({});
    setIngredientUpdatedAt(item.updatedAt || null);
    setFieldUpdatedAt(item.fieldUpdatedAt || {});
  };

  const edit = (item) => {
    if (isDirty && (!editingId || editingId !== item.id)) {
      setPendingAction({ type: 'edit', item });
      setConfirmLeaveOpen(true);
      return;
    }
    applyEdit(item);
  };

  const openDeleteConfirm = (item) => {
    setDeleteId(item.id);
    setDeleteName(item.name || '');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    try {
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

  const applyStartNew = () => {
    setEditingId(null);
    setForm(empty);
    setInitialForm(empty);
    setFieldErrors({});
    setIngredientUpdatedAt(null);
    setFieldUpdatedAt({});
  };

  const startNew = () => {
    if (isDirty) {
      setPendingAction({ type: 'startNew' });
      setConfirmLeaveOpen(true);
      return;
    }
    applyStartNew();
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      const res = await api.get('/admin/ingredients/export');
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ingredients-${new Date().toISOString().split('T')[0]}.json`;
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
      const res = await api.post('/admin/ingredients/import', data);
      showToast(t('admin.common.import_success', { count: res.data.count }), 'success');
      load();
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="container-px max-w-6xl mx-auto py-10">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <h1 className="font-serif text-3xl">{t('admin.ingredients.title')}</h1>
        <div className="flex gap-2">
          <label className="btn btn-secondary cursor-pointer">
            {t('admin.common.import')}
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            {t('admin.common.export')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={startNew}>
            {t('admin.ingredients.new')}
          </button>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <div className="mb-1">
            <h2 className="font-semibold text-lg">
              {editingId ? t('admin.ingredients.update') : t('admin.ingredients.create')}
            </h2>
            {editingId && ingredientUpdatedAt && (
              <div className="mt-1 text-[11px] text-black/45">
                {t('admin.ingredients.last_updated_ingredient', {
                  value: formatTimestamp(ingredientUpdatedAt),
                })}
              </div>
            )}
          </div>
          <form onSubmit={submit} className="grid gap-6">
            <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3">
              <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
                {t('admin.products.section_main')}
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-black/60">
                  {t('admin.ingredients.name')}
                  {renderFieldUpdated('name')}
                </label>
                <input
                  ref={nameRef}
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    clearFieldError('name');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 ${fieldErrors.name ? 'border-red-400 bg-red-50' : ''
                    }`}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-black/60">
                  {t('admin.ingredients.description')}
                  {renderFieldUpdated('description')}
                </label>
                <textarea
                  ref={descriptionRef}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="rounded-xl px-4 py-2 border border-black/10 min-h-[80px]"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-black/60">
                  {t('admin.ingredients.benefits')}
                  {renderFieldUpdated('benefits')}
                </label>
                <input
                  ref={benefitsRef}
                  value={form.benefitsInput}
                  onChange={(e) =>
                    setForm({ ...form, benefitsInput: e.target.value })
                  }
                  className="rounded-xl px-4 py-2 border border-black/10"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3">
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
                      alt={form.name || ''}
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

            <button className="btn btn-primary w-fit">
              {editingId ? t('admin.ingredients.update') : t('admin.ingredients.create')}
            </button>
          </form>
        </div>
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-soft flex flex-col gap-2">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-black/60">{item.slug}</div>
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full border border-black/10 bg-ivory hover:bg-charcoal hover:text-ivory transition-colors"
                    onClick={() => edit(item)}
                  >
                    {t('admin.ingredients.edit')}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full border border-red-100 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                    onClick={() => openDeleteConfirm(item)}
                  >
                    {t('admin.ingredients.delete')}
                  </button>
                </div>
              </div>
              {item.description && (
                <p className="text-sm text-black/80">{item.description}</p>
              )}
              {item.benefits && item.benefits.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.benefits.map((b) => (
                    <span
                      key={b}
                      className="text-[11px] px-2 py-1 rounded-full bg-ivory border border-black/5"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!items.length && (
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
      )}
      <ConfirmDialog
        open={confirmRemoveImageOpen}
        title={t('admin.products.image_remove_confirm_title')}
        description={t('admin.products.image_remove_confirm_body')}
        confirmLabel={t('admin.common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleImageRemoveConfirm}
        onCancel={handleImageRemoveCancel}
      />
    </div>
  );
}
