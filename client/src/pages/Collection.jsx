import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { useTranslation } from 'react-i18next';
import FilterDropdown from '../components/FilterDropdown';
import { useLocation } from 'react-router-dom';

export default function Collection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [category, setCategory] = useState('');
  const [skinType, setSkinType] = useState('');
  const [shape, setShape] = useState('');
  const [ingredient, setIngredient] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableShapes, setAvailableShapes] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const location = useLocation();

  // Initialize ingredient filter from ?ingredient=slug when landing from IngredientDetail
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ingredientFromUrl = params.get('ingredient') || '';
    if (ingredientFromUrl) {
      setIngredient(ingredientFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (skinType) params.set('skinType', skinType);
    if (shape) params.set('shapeEn', shape);
    params.set('status', 'PUBLISHED');
    setLoadingProducts(true);
    api.get(`/products?${params.toString()}`)
      .then((r) => setProducts(r.data))
      .finally(() => setLoadingProducts(false));
  }, [category, skinType, shape]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('status', 'PUBLISHED');
    api.get(`/products?${params.toString()}`).then(r => {
      const list = r.data || [];
      // Build unique shapes with both En and Ar values
      const shapeMap = new Map();
      list.forEach(p => {
        const en = p.shapeEn || p.shape;
        const ar = p.shapeAr || en;
        if (en && !shapeMap.has(en)) {
          shapeMap.set(en, { en, ar });
        }
      });
      setAvailableShapes(Array.from(shapeMap.values()));
    });

    api.get('/categories').then(r => {
      setAvailableCategories(r.data || []);
    });
    api.get('/ingredients').then((r) => {
      setAvailableIngredients(r.data || []);
    });
  }, []);

  const filteredProducts = ingredient
    ? products.filter((p) =>
      Array.isArray(p.ingredients) &&
      p.ingredients.some((ing) => ing.slug === ingredient)
    )
    : products;

  const productCountLabel = t('collection.count', {
    count: filteredProducts.length,
  });

  return (
    <div className="container-px max-w-7xl mx-auto py-10">
      <Helmet>
        <title>
          {t('sections.collection')} — {t('brand')}
        </title>
      </Helmet>
      <div className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl">{t('sections.collection')}</h1>
            <p className="mt-1 text-sm text-black/60 max-w-xl">
              {t('collection.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-3 flex-wrap">
            <FilterDropdown
              label={t('filters.all_categories')}
              value={category}
              onChange={setCategory}
              options={[
                { value: '', label: t('filters.all_categories') },
                ...availableCategories.map((c) => ({
                  value: c[`name${lang}`] || c.name,
                  label: c[`name${lang}`] || c.name,
                })),
              ]}
            />
            <FilterDropdown
              label={t('filters.all_skin_types')}
              value={skinType}
              onChange={setSkinType}
              options={[
                { value: '', label: t('filters.all_skin_types') },
                { value: 'ALL', label: t('filters.skin_types.all') },
                { value: 'DRY', label: t('filters.skin_types.dry') },
                { value: 'OILY', label: t('filters.skin_types.oily') },
                { value: 'COMBINATION', label: t('filters.skin_types.combination') },
                { value: 'SENSITIVE', label: t('filters.skin_types.sensitive') },
              ]}
            />
            {availableIngredients.length > 0 && (
              <FilterDropdown
                label={t('filters.all_ingredients')}
                value={ingredient}
                onChange={setIngredient}
                options={[
                  { value: '', label: t('filters.all_ingredients') },
                  ...availableIngredients.map((ing) => ({
                    value: ing.slug,
                    label: ing[`name${lang}`] || ing.name,
                  })),
                ]}
              />
            )}
            {availableShapes.length > 0 && (
              <FilterDropdown
                label={t('filters.all_shapes')}
                value={shape}
                onChange={setShape}
                options={[
                  { value: '', label: t('filters.all_shapes') },
                  ...availableShapes.map((s) => ({
                    value: s.en,
                    label: lang === 'Ar' ? (s.ar || s.en) : s.en,
                  })),
                ]}
              />
            )}
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-black/45">
            {productCountLabel}
          </div>
        </div>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingProducts
          ? Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-black/5 bg-white/60 h-72 animate-pulse"
            />
          ))
          : filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
