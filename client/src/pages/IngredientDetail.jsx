import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';

export default function IngredientDetail() {
  const { slug } = useParams();
  const [ingredient, setIngredient] = useState(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    api.get(`/ingredients/${slug}`).then((response) => {
      if (mounted) setIngredient(response.data);
    });
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (!ingredient) {
    return (
      <div className="container-px max-w-7xl mx-auto py-12">
        {t('common.loading')}
      </div>
    );
  }

  const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
  const name = ingredient[`name${lang}`] || ingredient.name;
  const description = ingredient[`description${lang}`] || ingredient.description;
  const benefits = ingredient[`benefits${lang}`] || ingredient.benefits || [];
  const { imageUrl } = ingredient;

  const handleViewProductsClick = () => {
    if (!slug) return;
    navigate(`/collection?ingredient=${encodeURIComponent(slug)}`);
  };

  return (
    <div>
      <Helmet>
        <title>
          {name} - {t('brand')}
        </title>
      </Helmet>

      <div className="container-px max-w-7xl mx-auto py-6">
        <Link to="/ingredients" className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />
          <span>{t('cta.view_all')} {t('nav.ingredients')}</span>
        </Link>
        <Breadcrumb className="text-lg" items={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.ingredients'), href: '/ingredients' },
          { label: name, href: `/ingredients/${slug}` }
        ]} />
      </div>

      <div className="container-px max-w-7xl mx-auto pb-10">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className="rounded-[2rem] shadow-soft w-full aspect-[4/3] object-cover"
            />
          )}
          <div className="py-4">
            <h1 className="font-serif text-5xl mb-6">{name}</h1>
            {description && (
              <p className="text-black/70 text-lg leading-relaxed mb-8">
                {description}
              </p>
            )}
            {Array.isArray(benefits) && benefits.length > 0 && (
              <div className="mt-8 p-6 bg-ivory/50 rounded-2xl border border-black/5">
                <div className="text-sm font-medium tracking-[0.18em] uppercase text-black/50 mb-4">
                  {t('product.benefits')}
                </div>
                <div className="flex flex-wrap gap-3">
                  {benefits.map((b) => (
                    <span
                      key={b}
                      className="text-lg px-4 py-2 rounded-full border border-black/5 bg-white shadow-sm text-black/80"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              className="btn btn-secondary mt-8"
              onClick={handleViewProductsClick}
            >
              {t('collection.filter_by_ingredient_cta', { name })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
