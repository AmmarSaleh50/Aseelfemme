import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { api, setAuthToken } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { ImageUp, Crop as CropIcon, Trash2, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import FilterDropdown from '../../components/FilterDropdown';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import LanguageTabs from '../../components/admin/LanguageTabs';
import { completeProduct, getGeminiApiKey } from '../../lib/gemini';

const empty = {
  nameEn: '',
  nameAr: '',
  slug: '',
  shortDescriptionEn: '',
  shortDescriptionAr: '',
  longDescriptionEn: '',
  longDescriptionAr: '',
  categoryEn: '',
  categoryAr: '',
  shapeEn: '',
  shapeAr: '',
  colorEn: '',
  colorAr: '',
  weightGrams: '',
  heroImageUrl: '',
  beeorderUrl: '',
  status: 'DRAFT',
  scentProfileEn: '',
  scentProfileAr: '',
  tagsInputEn: '',
  tagsInputAr: '',
  skinType: 'ALL',
  galleryImageUrls: [],
  benefitsEn: [],
  benefitsAr: [],
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export default function AdminProductEdit() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeLanguage, setActiveLanguage] = useState('en');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [allIngredients, setAllIngredients] = useState([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [knownCategories, setKnownCategories] = useState([]);
  const [knownShapes, setKnownShapes] = useState([]);
  const [knownColors, setKnownColors] = useState([]);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppingImage, setCroppingImage] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialState, setInitialState] = useState({
    form: empty,
    selectedIngredientIds: [],
    selectedCategoryIds: [],
  });
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [ignoreUnsavedGuard, setIgnoreUnsavedGuard] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [productUpdatedAt, setProductUpdatedAt] = useState(null);
  const [fieldUpdatedAt, setFieldUpdatedAt] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const nameRef = useRef(null);
  const shortDescriptionRef = useRef(null);
  const categoryRef = useRef(null);
  const skinTypeRef = useRef(null);
  const scentRef = useRef(null);
  const shapeRef = useRef(null);
  const colorRef = useRef(null);
  const weightRef = useRef(null);
  const heroRef = useRef(null);

  const draftKey = id ? `af_admin_product_draft_${id}` : 'af_admin_product_draft_new';

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev || !prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const touchField = (field) => {
    setFieldUpdatedAt((prev) => ({
      ...(prev || {}),
      [field]: new Date().toISOString(),
    }));
  };

  const formatTimestamp = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    // Always use Gregorian calendar and Latin digits so Arabic still shows
    // "normal" (Christian) dates with English numbers.
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
        ({t('admin.products.last_updated_field', { value: formatted })})
      </span>
    );
  };

  const areArraysEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    for (let i = 0; i < sortedA.length; i += 1) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);

      const [categoriesRes, ingredientsRes, productsRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/ingredients'),
        api.get('/admin/products?status=all'),
      ]);

      const catItems = (categoriesRes.data || [])
        .filter((c) => c.isActive)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setKnownCategories(catItems);

      setAllIngredients(ingredientsRes.data || []);

      const list = productsRes.data || [];
      const shapes = Array.from(new Set(list.map((p) => p.shape).filter(Boolean))).sort();
      setKnownShapes(shapes);
      const colors = Array.from(new Set(list.map((p) => p.color).filter(Boolean))).sort();
      setKnownColors(colors);

      let baseForm = empty;

      let baseSelectedIds = [];
      let baseSelectedCatIds = [];

      if (id) {
        try {
          const res = await api.get(`/admin/products/${id}`);
          const p = res.data;
          const {
            ingredients,
            productCategories,
            tags,
            tagsEn: savedTagsEn,
            tagsAr: savedTagsAr,
            skinType,
            weightGrams,
            fieldUpdatedAt: fieldTimes,
            updatedAt,
            ...rest
          } = p;

          setProductUpdatedAt(updatedAt || null);
          setFieldUpdatedAt(fieldTimes || {});

          // Rebuild the base tags exactly like submit() will, so we can
          // separate them from any true "extra" tags.
          const basePartsEn = [];
          const basePartsAr = [];
          const pushEn = (val) => {
            const v = (val || '').trim();
            if (!v) return;
            if (!basePartsEn.includes(v)) basePartsEn.push(v);
          };
          const pushAr = (val) => {
            const v = (val || '').trim();
            if (!v) return;
            if (!basePartsAr.includes(v)) basePartsAr.push(v);
          };

          pushEn(rest.categoryEn);
          pushAr(rest.categoryAr);

          const skin = (skinType || '').trim();
          if (skin && skin !== 'ALL') {
            const skinKey = skin.toLowerCase();
            const localizedSkinTag = t(`filters.skin_type_tags.${skinKey}`);
            pushEn(localizedSkinTag || skin);
          }

          pushEn(rest.shapeEn);
          pushAr(rest.shapeAr || rest.shapeEn);
          pushEn(rest.colorEn);
          pushAr(rest.colorAr || rest.colorEn);

          if (Array.isArray(ingredients)) {
            ingredients.forEach((pi) => {
              const nameEn = pi?.nameEn || pi?.ingredient?.nameEn || pi?.name || pi?.ingredient?.name;
              const nameAr = pi?.nameAr || pi?.ingredient?.nameAr || nameEn;
              pushEn(nameEn);
              pushAr(nameAr);
            });
          }

          // Filter out auto-generated tags to find extra custom tags
          // If savedTagsEn/Ar are arrays, join them. Otherwise fall back to empty.

          const extraPartsEn = Array.isArray(savedTagsEn)
            ? savedTagsEn.filter((tag) => !basePartsEn.includes((tag || '').trim()))
            : (Array.isArray(tags) ? tags.filter((tag) => !basePartsEn.includes((tag || '').trim())) : []);
          const extraPartsAr = Array.isArray(savedTagsAr)
            ? savedTagsAr.filter((tag) => !basePartsAr.includes((tag || '').trim()))
            : [];

          baseForm = {
            ...empty,
            ...rest,
            weightGrams:
              typeof weightGrams === 'number' && !Number.isNaN(weightGrams)
                ? String(weightGrams)
                : '',
            // Only show true extra tags in the editor; core tags are derived
            // at submit time from category/skinType/shape/color/ingredients.
            tagsInputEn: extraPartsEn.join(', '),
            tagsInputAr: extraPartsAr.join(', '),
            skinType: skinType || 'ALL',
          };
          baseSelectedIds = Array.isArray(ingredients)
            ? ingredients.map((ing) => ing.id)
            : [];
          baseSelectedCatIds = Array.isArray(productCategories)
            ? productCategories.map((c) => c.id)
            : [];
          setEditingId(p.id);
        } catch (error) {
          console.error(error);
          setLoading(false);
          navigate('/admin/products');
          return;
        }
      } else {
        baseForm = empty;
        baseSelectedIds = [];
        baseSelectedCatIds = [];
        setEditingId(null);
        setProductUpdatedAt(null);
        setFieldUpdatedAt({});
      }

      let formToUse = baseForm;
      let selectedIdsToUse = baseSelectedIds;
      let selectedCatIdsToUse = baseSelectedCatIds;

      const draftRaw = localStorage.getItem(draftKey);
      if (draftRaw) {
        try {
          const draft = JSON.parse(draftRaw);
          // If we have a draft that matches the ID we're editing (or creating new),
          // use the draft form data.
          if (draft.editingId === (id ? Number(id) : null)) {
            formToUse = { ...baseForm, ...draft.form };
            selectedIdsToUse = draft.selectedIngredientIds || baseSelectedIds;
            selectedCatIdsToUse = draft.selectedCategoryIds || baseSelectedCatIds;
            showToast(t('admin.products.draft_restored'));
          } else {
            localStorage.removeItem(draftKey);
          }
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }

      setForm(formToUse);
      setSelectedIngredientIds(selectedIdsToUse);
      setSelectedCategoryIds(selectedCatIdsToUse);
      setLoading(false);
      // Take a snapshot of the fully bootstrapped state (including any draft)
      // so that "dirty" compares against what the user actually saw on load.
      setInitialState({
        form: formToUse,
        selectedIngredientIds: selectedIdsToUse,
        selectedCategoryIds: selectedCatIdsToUse,
      });

      setLoading(false);
    };

    bootstrap();
  }, [id, draftKey]);

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
      // Convert current form to the format Gemini expects
      const completed = await completeProduct(form);

      // Merge: keep existing non-empty values, fill in empty ones from AI
      setForm(prev => {
        const merged = { ...prev };
        Object.keys(completed).forEach(key => {
          const currentVal = prev[key];
          const aiVal = completed[key];

          // Only fill if current is empty/null/undefined
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

  const isDirty = useMemo(() => {
    const sameForm =
      JSON.stringify(form) === JSON.stringify(initialState.form || {});
    const sameIngredients = areArraysEqual(
      selectedIngredientIds,
      initialState.selectedIngredientIds || []
    );
    return !(sameForm && sameIngredients);
  }, [form, selectedIngredientIds, initialState]);

  const blocker = useBlocker(isDirty && !ignoreUnsavedGuard);

  useEffect(() => {
    if (loading) return;
    const payload = {
      form,
      selectedIngredientIds,
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors (e.g., quota exceeded)
    }
  }, [draftKey, form, selectedIngredientIds, loading]);

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

  const categoryOptions = useMemo(() => {
    const cats = knownCategories || [];
    // Build options from category objects
    const options = cats.map((c) => ({
      value: c.id,
      label: c.nameEn || c.name || 'Unnamed',
      nameEn: c.nameEn || c.name || '',
      nameAr: c.nameAr || '',
    }));
    // If current form has a category not in the list, add it
    if (form.categoryEn && !options.some(o => o.nameEn === form.categoryEn)) {
      options.push({ value: form.categoryEn, label: form.categoryEn, nameEn: form.categoryEn, nameAr: form.categoryAr || '' });
    }
    return options;
  }, [knownCategories, form.categoryEn, form.categoryAr]);

  const shapeOptions = useMemo(
    () => (knownShapes || []).map((name) => ({ value: name, label: name })),
    [knownShapes]
  );

  const exactShapeMatch = useMemo(() => {
    const current = (form.shapeEn || '').trim();
    if (!current) return '';
    return knownShapes.some((s) => s.trim() === current) ? current : '';
  }, [form.shapeEn, knownShapes]);

  const colorOptions = useMemo(
    () => (knownColors || []).map((name) => ({ value: name, label: name })),
    [knownColors]
  );

  const exactColorMatch = useMemo(() => {
    const current = (form.colorEn || '').trim();
    if (!current) return '';
    return knownColors.some((c) => c.trim() === current) ? current : '';
  }, [form.colorEn, knownColors]);

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
        setForm((prev) => ({ ...prev, heroImageUrl: url }));
        clearFieldError('heroImageUrl');
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
      size
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

  const handleImageRemoveClick = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setForm((prev) => ({ ...prev, heroImageUrl: '' }));
  };

  const handleImageCropClick = (event) => {
    if (event) {
      event.stopPropagation();
    }
    if (!form.heroImageUrl) return;
    setCroppingImage(form.heroImageUrl);
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
      const file = new File([blob], 'product.jpg', { type: 'image/jpeg' });
      await handleUpload(file);
    }
    cancelCrop();
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
        if (res.data?.url) {
          // Supabase Storage returns full public URL
          newUrls.push(res.data.url);
        }
      }

      setForm(prev => ({
        ...prev,
        galleryImageUrls: [...(prev.galleryImageUrls || []), ...newUrls]
      }));
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index) => {
    setForm(prev => {
      const next = [...(prev.galleryImageUrls || [])];
      next.splice(index, 1);
      return { ...prev, galleryImageUrls: next };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const {
      tagsInput,
      weightGrams,
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...restForm
    } = form;

    // Required-field validation
    const errors = {};

    if (!restForm.nameEn?.trim()) errors.nameEn = true;
    if (!restForm.nameAr?.trim()) errors.nameAr = true;
    if (!restForm.shortDescriptionEn?.trim()) errors.shortDescriptionEn = true;
    if (!restForm.shortDescriptionAr?.trim()) errors.shortDescriptionAr = true;
    if (!restForm.categoryEn?.trim()) errors.categoryEn = true;
    if (!restForm.categoryAr?.trim()) errors.categoryAr = true;
    if (!restForm.skinType) errors.skinType = true;
    if (!restForm.shapeEn?.trim()) errors.shapeEn = true;
    if (!restForm.shapeAr?.trim()) errors.shapeAr = true;
    if (!restForm.colorEn?.trim()) errors.colorEn = true;
    if (!restForm.colorAr?.trim()) errors.colorAr = true;
    if (
      weightGrams === '' ||
      weightGrams == null ||
      Number(weightGrams) <= 0
    ) {
      errors.weightGrams = true;
    }
    if (!restForm.heroImageUrl?.trim()) errors.heroImageUrl = true;

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      showToast(t('admin.products.missing_required'), 'error');

      const fieldOrder = [
        'heroImageUrl',
        'nameEn',
        'nameAr',
        'shortDescriptionEn',
        'shortDescriptionAr',
        'categoryEn',
        'categoryAr',
        'skinType',
        'shapeEn',
        'shapeAr',
        'colorEn',
        'colorAr',
        'weightGrams',
      ];
      const refMap = {
        heroImageUrl: heroRef,
        nameEn: nameRef,
        nameAr: nameRef,
        shortDescriptionEn: shortDescriptionRef,
        shortDescriptionAr: shortDescriptionRef,
        categoryEn: categoryRef,
        categoryAr: categoryRef,

        skinType: skinTypeRef,
        shapeEn: shapeRef,
        shapeAr: shapeRef,
        colorEn: colorRef,
        colorAr: colorRef,
        weightGrams: weightRef,
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

    // Base tags derived from core fields - now separated by language
    const basePartsEn = [];
    const basePartsAr = [];
    const pushEn = (val) => {
      const v = (val || '').trim();
      if (!v) return;
      if (!basePartsEn.includes(v)) basePartsEn.push(v);
    };
    const pushAr = (val) => {
      const v = (val || '').trim();
      if (!v) return;
      if (!basePartsAr.includes(v)) basePartsAr.push(v);
    };

    // Categories by language
    pushEn(restForm.categoryEn);
    pushAr(restForm.categoryAr);

    // Skin type tags (use i18n for both)
    const skin = (restForm.skinType || '').trim();
    if (skin && skin !== 'ALL') {
      // Just push the raw skin type key - will be translated at display time
      pushEn(skin.charAt(0) + skin.slice(1).toLowerCase());
    }

    // Shape and color - now bilingual
    pushEn(restForm.shapeEn);
    pushAr(restForm.shapeAr || restForm.shapeEn);
    pushEn(restForm.colorEn);
    pushAr(restForm.colorAr || restForm.colorEn);

    // Ingredients - use correct language
    selectedIngredientIds.forEach((idVal) => {
      const ing = allIngredients.find((i) => i.id === idVal);
      if (ing) {
        pushEn(ing.nameEn || ing.name);
        pushAr(ing.nameAr || ing.nameEn || ing.name);
      }
    });

    const extraTagsEn = restForm.tagsInputEn
      ? restForm.tagsInputEn.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const extraTagsAr = restForm.tagsInputAr
      ? restForm.tagsInputAr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const tagsEn = [...basePartsEn, ...extraTagsEn];
    const tagsAr = [...basePartsAr, ...extraTagsAr];

    const parsedWeight =
      weightGrams === '' || weightGrams == null
        ? null
        : Number(weightGrams);
    const data = {
      ...restForm,
      shape: restForm.shapeEn || restForm.shape,
      color: restForm.colorEn || restForm.color,
      tagsEn,
      tagsAr,
      tags: tagsEn, // Keep tags for backward compatibility
      benefitsEn: [],
      benefitsAr: [],
      galleryImageUrls: restForm.galleryImageUrls || [],
      skinType: restForm.skinType || 'ALL',
      weightGrams: Number.isNaN(parsedWeight) ? null : parsedWeight,
      isVegan: true,
      isCrueltyFree: true,
      isFragranceFree: false,
      ingredients: selectedIngredientIds.map(id => ({ id })),
      categories: selectedCategoryIds.map(id => ({ id })),
      longDescriptionEn:
        restForm.longDescriptionEn || restForm.shortDescriptionEn || ' ',
      longDescriptionAr:
        restForm.longDescriptionAr || restForm.shortDescriptionAr || ' ',
    };
    // Remove form-only fields that shouldn't be sent to DB
    delete data.tagsInputEn;
    delete data.tagsInputAr;

    // Compute how many things actually changed compared to what the user saw
    // when the editor first loaded (including any restored draft).
    let changeCount = 0;
    if (initialState && initialState.form) {
      const initialForm = initialState.form || {};
      const fieldsToCheck = [
        'nameEn',
        'nameAr',
        'slug',
        'shortDescriptionEn',
        'shortDescriptionAr',
        'longDescriptionEn',
        'longDescriptionAr',
        'categoryEn',
        'categoryAr',
        'shapeEn',
        'shapeAr',
        'colorEn',
        'colorAr',
        'weightGrams',
        'heroImageUrl',
        'galleryImageUrls',
        'beeorderUrl',
        'status',
        'scentProfileEn',
        'scentProfileAr',
        'tagsInputEn',
        'tagsInputAr',
        'skinType',
      ];

      fieldsToCheck.forEach((field) => {
        const curr = form[field];
        const init = initialForm[field];
        if ((curr ?? '') !== (init ?? '')) {
          changeCount += 1;
        }
      });

      const initialIds = initialState.selectedIngredientIds || [];
      if (!areArraysEqual(selectedIngredientIds, initialIds)) {
        changeCount += 1;
      }
      const initialCatIds = initialState.selectedCategoryIds || [];
      if (!areArraysEqual(selectedCategoryIds, initialCatIds)) {
        changeCount += 1;
      }
    }
    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, data);
        if (changeCount === 0) {
          showToast(t('admin.products.updated_no_changes'), 'success');
        } else {
          showToast(
            t('admin.products.updated_with_changes', { count: changeCount }),
            'success',
          );
        }
      } else {
        await api.post('/admin/products', data);
        showToast(t('admin.common.product_created'), 'success');
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      setIgnoreUnsavedGuard(true);
      // Defer navigation to the next tick so the blocker is disabled
      // before React Router evaluates navigation guards.
      setTimeout(() => {
        navigate('/admin/products');
      }, 0);
    } catch (error) {
      console.error(error);
      showToast(t('admin.common.error_generic'), 'error');
    }
  };

  const toggleIngredient = (idVal) => {
    setSelectedIngredientIds((prev) =>
      prev.includes(idVal) ? prev.filter((x) => x !== idVal) : [...prev, idVal]
    );
  };

  const addQuickIngredient = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const name = newIngredientName.trim();
    if (!name) return;
    setAddingIngredient(true);
    try {
      const token = localStorage.getItem('af_admin_token');
      setAuthToken(token);
      const res = await api.post('/admin/ingredients', {
        name,
        description: '',
        benefits: [],
        imageUrl: null,
      });
      const created = res.data;
      setAllIngredients((prev) => [...prev, created]);
      setSelectedIngredientIds((prev) => [...prev, created.id]);
      setNewIngredientName('');
    } finally {
      setAddingIngredient(false);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify({ form, selectedIngredientIds }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-${form.slug || 'draft'}.json`;
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
      if (data.form) {
        setForm(prev => ({ ...prev, ...data.form }));
      }
      if (Array.isArray(data.selectedIngredientIds)) {
        setSelectedIngredientIds(data.selectedIngredientIds);
      }
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
    ? t('admin.products.update')
    : t('admin.products.create');

  const handleBackClick = () => {
    navigate('/admin/products');
  };

  const handleLeaveConfirm = () => {
    setConfirmLeaveOpen(false);
    setFieldErrors({});
    setIgnoreUnsavedGuard(true);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore storage errors
    }
    if (blocker.state === 'blocked') {
      blocker.proceed();
    } else {
      navigate('/admin/products');
    }
  };

  const handleLeaveCancel = () => {
    setConfirmLeaveOpen(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
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
              {t('cta.view_all')} {t('admin.products.title').toLowerCase()}
            </span>
          </button>
          <div className="hidden sm:block" />
        </div>
        <h1 className="font-serif text-3xl text-center">{title}</h1>
        {productUpdatedAt && (
          <div className="mt-1 text-center text-[11px] text-black/45">
            {t('admin.products.last_updated_product', {
              value: formatTimestamp(productUpdatedAt),
            })}
          </div>
        )}
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
        <form onSubmit={submit} className="grid gap-6">
          <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3 order-2">
            <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
              {t('admin.products.section_main')}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.products.name')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated(activeLanguage === 'en' ? 'nameEn' : 'nameAr')}
              </label>
              {activeLanguage === 'en' ? (
                <input
                  ref={nameRef}
                  value={form.nameEn}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      nameEn: name,
                      slug: prev.slug || slugify(name),
                    }));
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
                    setForm((prev) => ({ ...prev, nameAr: e.target.value }));
                    clearFieldError('nameAr');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 text-right ${fieldErrors.nameAr ? 'border-red-400 bg-red-50' : ''
                    }`}
                  dir="rtl"
                />
              )}
            </div>
            <div className="grid gap-1" ref={categoryRef}>
              <label className="text-xs text-black/60">
                {t('admin.products.category')}
                {renderFieldUpdated('categoryEn')}
              </label>
              <MultiSelectDropdown
                label={t('admin.products.category')}
                values={selectedCategoryIds}
                onChange={(vals) => {
                  setSelectedCategoryIds(vals);
                  // Auto-set legacy fields to first selected category for backward compat
                  const firstId = vals[0];
                  const firstCat = knownCategories.find(c => c.id === firstId);
                  if (firstCat) {
                    setForm(prev => ({ ...prev, categoryEn: firstCat.nameEn || firstCat.name, categoryAr: firstCat.nameAr || firstCat.name }));
                  } else if (vals.length === 0) {
                    setForm(prev => ({ ...prev, categoryEn: '', categoryAr: '' }));
                  }
                  clearFieldError('categoryEn');
                }}
                hasError={!!fieldErrors.categoryEn}
                options={knownCategories.map(c => ({
                  value: c.id,
                  label: activeLanguage === 'ar' ? (c.nameAr || c.name) : (c.nameEn || c.name)
                }))}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategoryIds.map((idVal) => {
                  const cat = knownCategories.find((c) => c.id === idVal);
                  if (!cat) return null;
                  return (
                    <span
                      key={idVal}
                      className="px-3 py-1 rounded-full text-xs border bg-ivory text-black/70 border-black/10"
                    >
                      {activeLanguage === 'ar' ? (cat.nameAr || cat.name) : (cat.nameEn || cat.name)}
                    </span>
                  );
                })}
              </div>
              {form.categoryAr && (
                <div className="text-xs text-black/50 mt-1" dir="rtl">
                  {t('admin.products.category')} (AR): {form.categoryAr}
                </div>
              )}
            </div>
            <div className="grid gap-1" ref={skinTypeRef}>
              <label className="text-xs text-black/60">
                {t('filters.all_skin_types')}
                {renderFieldUpdated('skinType')}
              </label>
              <FilterDropdown
                label={t('filters.all_skin_types')}
                value={form.skinType}
                onChange={(val) => {
                  setForm({ ...form, skinType: val || 'ALL' });
                  clearFieldError('skinType');
                }}
                allowClear={false}
                hasError={!!fieldErrors.skinType}
                options={[
                  { value: 'ALL', label: t('filters.skin_types.all') },
                  { value: 'DRY', label: t('filters.skin_types.dry') },
                  { value: 'OILY', label: t('filters.skin_types.oily') },
                  {
                    value: 'COMBINATION',
                    label: t('filters.skin_types.combination'),
                  },
                  {
                    value: 'SENSITIVE',
                    label: t('filters.skin_types.sensitive'),
                  },
                ]}
              />
              {renderFieldUpdated('skinType')}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.products.shortDescription')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated(activeLanguage === 'en' ? 'shortDescriptionEn' : 'shortDescriptionAr')}
              </label>
              {activeLanguage === 'en' ? (
                <textarea
                  ref={shortDescriptionRef}
                  value={form.shortDescriptionEn}
                  onChange={(e) => {
                    setForm({ ...form, shortDescriptionEn: e.target.value });
                    clearFieldError('shortDescriptionEn');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 min-h-[70px] ${fieldErrors.shortDescriptionEn ? 'border-red-400 bg-red-50' : ''
                    }`}
                />
              ) : (
                <textarea
                  ref={shortDescriptionRef}
                  value={form.shortDescriptionAr}
                  onChange={(e) => {
                    setForm({ ...form, shortDescriptionAr: e.target.value });
                    clearFieldError('shortDescriptionAr');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 min-h-[70px] text-right ${fieldErrors.shortDescriptionAr ? 'border-red-400 bg-red-50' : ''
                    }`}
                  dir="rtl"
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3 order-3">
            <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
              {t('admin.products.section_details')}
            </div>
            <div className="grid gap-1" ref={scentRef}>
              <label className="text-xs text-black/60">
                {t('product.scent_texture')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated(activeLanguage === 'en' ? 'scentProfileEn' : 'scentProfileAr')}
              </label>
              {activeLanguage === 'en' ? (
                <textarea
                  ref={scentRef}
                  value={form.scentProfileEn}
                  onChange={(e) => {
                    setForm({ ...form, scentProfileEn: e.target.value });
                    clearFieldError('scentProfileEn');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 min-h-[70px] ${fieldErrors.scentProfileEn ? 'border-red-400 bg-red-50' : ''
                    }`}
                />
              ) : (
                <textarea
                  ref={scentRef}
                  value={form.scentProfileAr}
                  onChange={(e) => {
                    setForm({ ...form, scentProfileAr: e.target.value });
                    clearFieldError('scentProfileAr');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 min-h-[70px] text-right ${fieldErrors.scentProfileAr ? 'border-red-400 bg-red-50' : ''
                    }`}
                  dir="rtl"
                />
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.products.shape')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated('shapeEn')}
              </label>
              {activeLanguage === 'en' ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={shapeRef}
                    value={form.shapeEn || ''}
                    onChange={(e) => {
                      setForm({ ...form, shapeEn: e.target.value });
                      clearFieldError('shapeEn');
                    }}
                    className={`rounded-xl px-4 py-2 border border-black/10 flex-1 ${fieldErrors.shapeEn ? 'border-red-400 bg-red-50' : ''
                      }`}
                    placeholder={t('admin.products.shape_placeholder')}
                  />
                  <FilterDropdown
                    label={t('admin.products.shape_placeholder')}
                    value={exactShapeMatch}
                    onChange={(val) => {
                      setForm({ ...form, shapeEn: val || '' });
                      clearFieldError('shapeEn');
                    }}
                    allowClear={false}
                    hasError={!!fieldErrors.shapeEn}
                    options={[
                      {
                        value: '',
                        label: t('admin.products.shape_placeholder'),
                      },
                      ...shapeOptions,
                    ]}
                  />
                </div>
              ) : (
                <input
                  ref={shapeRef}
                  value={form.shapeAr || ''}
                  onChange={(e) => {
                    setForm({ ...form, shapeAr: e.target.value });
                    clearFieldError('shapeAr');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 flex-1 text-right ${fieldErrors.shapeAr ? 'border-red-400 bg-red-50' : ''
                    }`}
                  dir="rtl"
                  placeholder={t('admin.products.shape_placeholder')}
                />
              )}
              {form.shapeEn && activeLanguage === 'ar' && (
                <div className="text-xs text-black/50 mt-1">
                  {t('admin.products.shape')} (EN): {form.shapeEn}
                </div>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.products.color')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
                {renderFieldUpdated('colorEn')}
              </label>
              {activeLanguage === 'en' ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={colorRef}
                    value={form.colorEn || ''}
                    onChange={(e) => {
                      setForm({ ...form, colorEn: e.target.value });
                      clearFieldError('colorEn');
                    }}
                    className={`rounded-xl px-4 py-2 border border-black/10 flex-1 ${fieldErrors.colorEn ? 'border-red-400 bg-red-50' : ''
                      }`}
                    placeholder={t('admin.products.color_placeholder')}
                  />
                  <FilterDropdown
                    label={t('admin.products.color_placeholder')}
                    value={exactColorMatch}
                    onChange={(val) => {
                      setForm({ ...form, colorEn: val || '' });
                      clearFieldError('colorEn');
                    }}
                    allowClear={false}
                    hasError={!!fieldErrors.colorEn}
                    options={[
                      {
                        value: '',
                        label: t('admin.products.color_placeholder'),
                      },
                      ...colorOptions,
                    ]}
                  />
                </div>
              ) : (
                <input
                  ref={colorRef}
                  value={form.colorAr || ''}
                  onChange={(e) => {
                    setForm({ ...form, colorAr: e.target.value });
                    clearFieldError('colorAr');
                  }}
                  className={`rounded-xl px-4 py-2 border border-black/10 flex-1 text-right ${fieldErrors.colorAr ? 'border-red-400 bg-red-50' : ''
                    }`}
                  dir="rtl"
                  placeholder={t('admin.products.color_placeholder')}
                />
              )}
              {form.colorEn && activeLanguage === 'ar' && (
                <div className="text-xs text-black/50 mt-1">
                  {t('admin.products.color')} (EN): {form.colorEn}
                </div>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.products.weightGrams')}
                {renderFieldUpdated('weightGrams')}
              </label>
              <input
                ref={weightRef}
                type="number"
                min="0"
                step="1"
                value={form.weightGrams ?? ''}
                onChange={(e) => {
                  setForm({ ...form, weightGrams: e.target.value });
                  clearFieldError('weightGrams');
                }}
                className={`rounded-xl px-4 py-2 border border-black/10 max-w-[10rem] ${fieldErrors.weightGrams ? 'border-red-400 bg-red-50' : ''
                  }`}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">{t('product.key_ingredients')}</label>
              <div className="flex flex-col gap-3">
                <MultiSelectDropdown
                  label={t('product.key_ingredients')}
                  values={selectedIngredientIds}
                  onChange={(vals) => setSelectedIngredientIds(vals)}
                  options={allIngredients.map((i) => ({
                    value: i.id,
                    label: i.nameEn || i.nameAr || i.name || 'Unnamed',
                  }))}
                />
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-black/40">
                    {t('admin.products.key_ingredients_selected')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredientIds.map((idVal) => {
                      const ing = allIngredients.find((i) => i.id === idVal);
                      if (!ing) return null;
                      return (
                        <span
                          key={idVal}
                          className="px-3 py-1 rounded-full text-xs border bg-ivory text-black/70 border-black/10"
                        >
                          {ing.nameEn || ing.nameAr || ing.name || 'Unnamed'}
                        </span>
                      );
                    })}
                    {selectedIngredientIds.length === 0 && (
                      <span className="text-xs text-black/45 italic">
                        {t('admin.products.key_ingredients_none')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3 order-1">
            <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
              {t('admin.products.section_image')}
            </div>
            <div className="grid gap-2" ref={heroRef}>
              <label className="text-xs text-black/60">
                {t('admin.products.heroImageUrl')}
                {renderFieldUpdated('heroImageUrl')}
              </label>
              <div
                className={`mt-1 rounded-2xl border border-dashed aspect-square w-full flex items-center justify-center relative overflow-hidden cursor-pointer ${fieldErrors.heroImageUrl
                  ? 'border-red-400 bg-red-50'
                  : 'border-black/15 bg-ivory/60'
                  }`}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                {form.heroImageUrl ? (
                  <img
                    src={form.heroImageUrl}
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
                {form.heroImageUrl && (
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
            <div className="grid gap-2">
              <label className="text-xs text-black/60">
                {t('admin.products.galleryImages')}
                {renderFieldUpdated('galleryImageUrls')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(form.galleryImageUrls || []).map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-black/10 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border border-dashed border-black/15 bg-ivory/60 flex flex-col items-center justify-center cursor-pointer hover:bg-ivory/80 transition-colors">
                  <ImageUp className="w-5 h-5 text-black/40 mb-1" />
                  <span className="text-[10px] text-black/50">{t('common.add')}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-ivory/40 p-4 sm:p-5 grid gap-3 order-4">
            <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/40">
              {t('admin.products.section_meta')}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">{t('admin.products.beeorderUrl')}</label>
              <input
                value={form.beeorderUrl}
                onChange={(e) =>
                  setForm({ ...form, beeorderUrl: e.target.value })
                }
                className="rounded-xl px-4 py-2 border border-black/10"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">
                {t('admin.products.tags')} ({activeLanguage === 'en' ? 'English' : 'Arabic'})
              </label>
              {activeLanguage === 'en' ? (
                <input
                  key="tags-meta-en"
                  value={form.tagsInputEn || ''}
                  onChange={(e) =>
                    setForm({ ...form, tagsInputEn: e.target.value })
                  }
                  className="rounded-xl px-4 py-2 border border-black/10"
                  placeholder="Tag1, Tag2, Tag3..."
                />
              ) : (
                <input
                  key="tags-meta-ar"
                  value={form.tagsInputAr || ''}
                  onChange={(e) =>
                    setForm({ ...form, tagsInputAr: e.target.value })
                  }
                  className="rounded-xl px-4 py-2 border border-black/10 text-right"
                  dir="rtl"
                  placeholder="تاج1، تاج2، تاج3..."
                />
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-black/60">{t('admin.products.status')}</label>
              <FilterDropdown
                label={t('admin.products.status')}
                value={form.status}
                onChange={(val) =>
                  setForm({ ...form, status: val || 'DRAFT' })
                }
                allowClear={false}
                options={[
                  { value: 'DRAFT', label: 'DRAFT' },
                  { value: 'PUBLISHED', label: 'PUBLISHED' },
                  { value: 'ARCHIVED', label: 'ARCHIVED' },
                ]}
              />
            </div>
          </div>

          <div className="flex gap-2 order-5 mt-2 justify-end">
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
            <button type="submit" className="btn btn-primary">{title}</button>
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
