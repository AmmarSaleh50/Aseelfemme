import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ProductLightbox from '../components/ProductLightbox';
import Breadcrumb from '../components/Breadcrumb';
import ShareButton from '../components/ShareButton';

export default function ProductDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const { t } = useTranslation();
  useEffect(() => {
    api.get(`/products/${slug}`).then(r => setP(r.data));
  }, [slug]);

  const [activeImage, setActiveImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const scrollRef = React.useRef(null);

  useEffect(() => {
    if (p) setActiveImage(p.heroImageUrl);
  }, [p]);

  const scrollGallery = (dir) => {
    if (scrollRef.current) {
      const amount = 200;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  if (!p) return <div className="container-px max-w-7xl mx-auto py-12">{t('common.loading')}</div>;

  const skinTypeKey = typeof p.skinType === 'string'
    ? p.skinType.toLowerCase()
    : null;

  const skinTypeLabel = skinTypeKey
    ? t(`filters.skin_type_tags.${skinTypeKey}`)
    : null;

  const allImages = [p.heroImageUrl, ...(p.galleryImageUrls || [])].filter(Boolean);

  const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
  const name = p[`name${lang}`] || p.name;
  const shortDescription = p[`shortDescription${lang}`] || p.shortDescription;
  const longDescription = p[`longDescription${lang}`] || p.longDescription;
  const category = p[`category${lang}`] || p.category;
  const scentProfile = p[`scentProfile${lang}`] || p.scentProfile;
  const benefits = p[`benefits${lang}`] || p.benefits || [];

  return (
    <div>
      <Helmet><title>{name} — {t('brand')}</title></Helmet>

      <div className="container-px max-w-7xl mx-auto pt-6">
        <Link to="/collection" className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />
          <span>{t('cta.view_all')} {t('nav.collection')}</span>
        </Link>
      </div>

      <Breadcrumb items={[
        { label: t('nav.home'), href: '/' },
        { label: t('nav.collection'), href: '/collection' },
        { label: name, href: `/product/${slug}` }
      ]} />

      {/* Lightbox */}
      <AnimatePresence mode="wait">
        {lightboxOpen && (
          <ProductLightbox
            key="product-lightbox"
            activeImage={activeImage}
            allImages={allImages}
            onClose={() => setLightboxOpen(false)}
            setActiveImage={setActiveImage}
          />
        )}
      </AnimatePresence>

      <div className="container-px max-w-7xl mx-auto py-6 md:py-10">
        {/* Mobile: Title first */}
        <div className="md:hidden mb-6">
          <h1 className="font-serif text-4xl">{name}</h1>
          <p className="text-black/70 mt-2">{shortDescription}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Image Section - Order 1 on mobile (after title), Order 1 on desktop (left side) */}
          <div className="order-1 space-y-2 md:space-y-4">
            <div
              className="aspect-square w-full rounded-3xl shadow-soft overflow-hidden bg-white relative group cursor-zoom-in"
              onClick={() => { setLightboxOpen(true); setZoomLevel(1); }}
            >
              <img
                src={activeImage || p.heroImageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-2 rounded-full shadow-sm">
                <Maximize2 className="w-5 h-5 text-charcoal" />
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="relative group">
                {allImages.length > 4 && (
                  <button
                    onClick={() => scrollGallery('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/80 shadow-md rounded-full -ml-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <div
                  ref={scrollRef}
                  className={`flex gap-3 overflow-x-auto pb-2 scrollbar-hide ${allImages.length <= 4 ? 'justify-center' : ''}`}
                >
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-16 md:w-20 aspect-square rounded-xl overflow-hidden flex-shrink-0 border transition-all ${activeImage === img ? 'border-charcoal ring-1 ring-charcoal' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {allImages.length > 4 && (
                  <button
                    onClick={() => scrollGallery('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/80 shadow-md rounded-full -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content Section - Order 2 on both mobile and desktop */}
          <div className="order-2 pt-2">
            {/* Mobile Title/Desc (moved here to be after image on mobile, but still before other content) */}
            <div className="md:hidden mt-8">
              <h1 className="font-serif text-4xl mb-4">{name}</h1>
              <p className="text-black/70 mb-6">{shortDescription}</p>
              <div className="text-lg leading-relaxed text-black/80 whitespace-pre-wrap">
                {longDescription}
              </div>
            </div>

            {/* Desktop Title/Desc */}
            <div className="hidden md:block">
              <h1 className="font-serif text-5xl mb-6">{name}</h1>
              <p className="text-xl text-black/60 mb-8 leading-relaxed">
                {shortDescription}
              </p>
              <div className="text-lg leading-relaxed text-black/80 mb-10 whitespace-pre-wrap">
                {longDescription}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(p[`tags${lang}`] || p.tags || []).map(tag => <span key={tag} className="text-xs bg-ivory rounded-full px-3 py-1 border border-black/5">{tag}</span>)}
            </div>
            <div className="mt-6 flex gap-3">
              {p.beeorderUrl && <a href={p.beeorderUrl} target="_blank" rel="noreferrer" className="btn btn-primary">{t('product.order_on_beeorder')}</a>}
              <ShareButton />
            </div>

            {(category || p.shape || p.color || (typeof p.weightGrams === 'number' && !Number.isNaN(p.weightGrams)) || skinTypeLabel || scentProfile) && (
              <div className="mt-6 rounded-3xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 space-y-4">
                <div className="text-[11px] font-medium tracking-[0.18em] uppercase text-black/50">
                  {t('product.details')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  {category && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-black/50">
                        {t('product.category')}
                      </div>
                      <div className="text-black/80">{category}</div>
                    </div>
                  )}
                  {(p[`shape${lang}`] || p.shape) && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-black/50">
                        {t('product.shape')}
                      </div>
                      <div className="text-black/80">{p[`shape${lang}`] || p.shape}</div>
                    </div>
                  )}
                  {(p[`color${lang}`] || p.color) && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-black/50">
                        {t('product.color')}
                      </div>
                      <div className="text-black/80">{p[`color${lang}`] || p.color}</div>
                    </div>
                  )}
                  {typeof p.weightGrams === 'number' && !Number.isNaN(p.weightGrams) && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-black/50">
                        {t('product.weight')}
                      </div>
                      <div className="text-black/80">
                        {t('product.weight_unit_grams', { value: p.weightGrams })}
                      </div>
                    </div>
                  )}
                  {skinTypeLabel && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-black/50">
                        {t('product.skin_type')}
                      </div>
                      <div className="text-black/80">{skinTypeLabel}</div>
                    </div>
                  )}
                  {scentProfile && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-black/50">
                        {t('product.scent_profile')}
                      </div>
                      <div className="text-black/80">{scentProfile}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-6">
              {benefits?.length ? (
                <div>
                  <div className="font-semibold mb-2">{t('product.benefits')}</div>
                  <ul className="list-disc pl-6">{benefits.map(b => <li key={b}>{b}</li>)}</ul>
                </div>
              ) : null}
              {p.ingredients?.length ? (
                <div className="rounded-3xl border border-black/5 bg-white/60 backdrop-blur-sm p-5">
                  <div className="text-[11px] font-medium tracking-[0.18em] uppercase text-black/50 mb-3">{t('product.key_ingredients')}</div>
                  <ul className="space-y-2">
                    {p.ingredients.map((i) => {
                      const iName = i[`name${lang}`] || i.name;
                      const iDesc = i[`description${lang}`] || i.description;
                      return (
                        <li key={i.id} className="text-sm">
                          <Link to={`/ingredients/${i.slug}`} className="underline font-medium">
                            {iName}
                          </Link>{' '}
                          <span className="text-black/70">— {iDesc}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
