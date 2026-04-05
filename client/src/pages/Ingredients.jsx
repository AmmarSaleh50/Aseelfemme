import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Ingredients() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/ingredients')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="container-px max-w-7xl mx-auto py-10">
      <Helmet><title>{t('sections.ingredients')} — {t('brand')}</title></Helmet>
      <h1 className="font-serif text-3xl">{t('sections.ingredients')}</h1>
      <p className="mt-2 text-sm text-black/60 max-w-2xl">
        {t('ingredients_page.subtitle')}
      </p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-black/5 rounded-[2rem] aspect-[4/3] animate-pulse"
            />
          ))
          : items.map((i) => {
            const name = i18n.language === 'ar' ? (i.nameAr || i.nameEn) : (i.nameEn || i.nameAr);
            const description = i18n.language === 'ar' ? (i.descriptionAr || i.descriptionEn) : (i.descriptionEn || i.descriptionAr);

            return (
              <motion.div
                key={i.id}
                id={i.slug}
                className="group relative h-full"
                whileHover={{ y: -8 }}
              >
                <Link to={`/ingredients/${i.slug}`} className="block h-full bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col">
                  {/* Image Section - Full width, rounded top */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {i.imageUrl ? (
                      <img
                        src={i.imageUrl}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-ivory flex items-center justify-center text-black/20 font-serif italic text-2xl">
                        {name}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                  </div>

                  {/* Text Section - Connected, inside the card */}
                  <div className="p-8 flex-1 flex flex-col items-center text-center">
                    <h3 className="font-serif text-3xl mb-4 text-black group-hover:text-charcoal transition-colors">
                      {name}
                    </h3>
                    {description && (
                      <p className="text-lg text-black/60 font-light leading-relaxed line-clamp-4">
                        {description}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
