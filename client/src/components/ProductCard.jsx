import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useHasHover } from '../hooks/useMedia';

export default function ProductCard({ product }) {
  const { i18n } = useTranslation();
  const hasHover = useHasHover();
  const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
  const name = product[`name${lang}`] || product.name;
  const shortDescription = product[`shortDescription${lang}`] || product.shortDescription;

  const cats = product.productCategories || [];
  const categoryNames = cats.map(c => c[`name${lang}`] || c.name).join(', ');
  const category = categoryNames || product[`category${lang}`] || product.category;

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col h-full"
      {...(hasHover ? { whileHover: { y: -6, boxShadow: '0 18px 40px rgba(15,23,42,0.16)' } } : {})}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <Link to={`/product/${product.slug}`} className="flex flex-col h-full">
        <motion.div
          className="w-full overflow-hidden relative"
          {...(hasHover ? { whileHover: { scale: 1.05 } } : {})}
          transition={{ duration: 0.4 }}
        >
          <img
            src={product.heroImageUrl}
            alt={name}
            loading="lazy"
            className="w-full aspect-square object-cover"
          />
          {product.galleryImageUrls && product.galleryImageUrls[0] && (
            <motion.img
              src={product.galleryImageUrls[0]}
              alt={name}
              loading="lazy"
              className="w-full aspect-square object-cover absolute inset-0"
              initial={{ opacity: 0 }}
              {...(hasHover ? { whileHover: { opacity: 1 } } : {})}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
        <div className="p-5 border-t border-black/5 bg-white flex-1 flex flex-col">
          {category && (
            <div className="text-[11px] uppercase tracking-[0.16em] text-black/45 mb-1">
              {category}
            </div>
          )}
          <div className="font-serif text-lg leading-snug">
            {name}
          </div>
          {shortDescription && (
            <div className="mt-1 text-sm text-black/70">
              {shortDescription}
            </div>
          )}
          {/* Display tags based on current language */}
          {(() => {
            const tags = product[`tags${lang}`] || product.tags || [];
            return tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 mt-auto pt-3">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] rounded-full px-3 py-1 border border-black/5 bg-ivory text-black/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      </Link>
    </motion.div>
  );
}
