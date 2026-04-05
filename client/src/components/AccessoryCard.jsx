import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useHasHover } from '../hooks/useMedia';

export default function AccessoryCard({ accessory }) {
    const { t, i18n } = useTranslation();
    const hasHover = useHasHover();
    const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
    const name = accessory[`name${lang}`] || accessory.name;

    // Use short description if available, otherwise fallback or slice long description
    const description = accessory[`shortDescription${lang}`] || accessory[`description${lang}`] || accessory.description;

    const tags = accessory[`tags${lang}`] || [];

    // Fallback to ID if slug hasn't been generated yet
    const linkUrl = `/accessories/${accessory.slug || accessory.id}`;

    const heroImage = accessory.imageUrl;
    const galleryImage = (accessory.galleryImageUrls && accessory.galleryImageUrls[0]);

    return (
        <motion.div
            className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col h-full"
            {...(hasHover ? { whileHover: { y: -6, boxShadow: '0 18px 40px rgba(15,23,42,0.16)' } } : {})}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
            <Link to={linkUrl} className="flex flex-col h-full">
                <motion.div
                    className="w-full overflow-hidden relative"
                    {...(hasHover ? { whileHover: { scale: 1.05 } } : {})}
                    transition={{ duration: 0.4 }}
                >
                    <img
                        src={heroImage}
                        alt={name}
                        loading="lazy"
                        className="w-full aspect-square object-cover"
                    />
                    {galleryImage && (
                        <motion.img
                            src={galleryImage}
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
                    <div className="text-[11px] uppercase tracking-[0.16em] text-black/45 mb-1">
                        {t('nav.accessories')}
                    </div>
                    <div className="font-serif text-lg leading-snug">
                        {name}
                    </div>
                    {description && (
                        <div className="mt-1 text-sm text-black/70 line-clamp-2">
                            {description}
                        </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
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
                    )}
                </div>
            </Link>
        </motion.div>
    );
}
