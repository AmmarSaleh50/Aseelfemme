import React, { useEffect, useState, useRef } from 'react';
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

export default function AccessoryDetail() {
    const { slug } = useParams();
    const [accessory, setAccessory] = useState(null);
    const { t } = useTranslation();
    const [activeImage, setActiveImage] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        // If slug is numeric, it might be an ID link fallback? But API expects slug.
        // We should assume slug. If ID, we might need handling?
        // Current database update tries to backfill slug.
        api.get(`/accessories/${slug}`).then(r => setAccessory(r.data)).catch(() => {
            // Fallback logic or 404? 
            // For now, if failed, maybe try ID if numeric?
            // But publicApi.getAccessoryBySlug expects slug column.
        });
    }, [slug]);

    useEffect(() => {
        if (accessory) setActiveImage(accessory.imageUrl); // Hero image
    }, [accessory]);

    const scrollGallery = (dir) => {
        if (scrollRef.current) {
            const amount = 200;
            scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    if (!accessory) return <div className="container-px max-w-7xl mx-auto py-12">{t('common.loading')}</div>;

    const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
    const name = accessory[`name${lang}`] || accessory.name;

    // Use short for summary/top, description for long text
    // Since we migrated shortDescription, we use it. If missing, fall back to main description.
    const shortDescription = accessory[`shortDescription${lang}`] || accessory[`description${lang}`] || accessory.description;
    // If we have separate long desc (we don't officially yet in UI edit), we fallback to same or empty.
    // For now, let's treat 'description' as long if short exists?
    // But migration added short.
    // We'll just display available text.
    const longDescription = accessory[`description${lang}`] || accessory.description;
    // If short and long are same (because of fallback), hide one?
    // Just show whatever we have.

    const tags = accessory[`tags${lang}`] || [];

    const allImages = [accessory.imageUrl, ...(accessory.galleryImageUrls || [])].filter(Boolean);

    // Beeorder Logic
    const beeorderUrl = accessory.beeorderUrl || t('common.beeorder_link');

    return (
        <div>
            <Helmet><title>{name} — {t('brand')}</title></Helmet>

            <div className="container-px max-w-7xl mx-auto pt-6">
                <Link to="/accessories" className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('cta.view_all')} {t('nav.accessories')}</span>
                </Link>
            </div>

            <Breadcrumb items={[
                { label: t('nav.home'), href: '/' },
                { label: t('nav.accessories'), href: '/accessories' },
                { label: name, href: `/accessories/${slug}` }
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
                    {/* Image Section */}
                    <div className="order-1 space-y-2 md:space-y-4">
                        <div
                            className="aspect-square w-full rounded-3xl shadow-soft overflow-hidden bg-white relative group cursor-zoom-in"
                            onClick={() => { setLightboxOpen(true); }}
                        >
                            <img
                                src={activeImage || accessory.imageUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-2 rounded-full shadow-sm">
                                <Maximize2 className="w-5 h-5 text-charcoal" />
                            </div>
                        </div>

                        {allImages.length > 1 && (
                            <div className="relative group">
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
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="order-2 pt-2">
                        <div className="hidden md:block">
                            <h1 className="font-serif text-5xl mb-6">{name}</h1>
                            {shortDescription && (
                                <p className="text-xl text-black/60 mb-8 leading-relaxed">
                                    {shortDescription}
                                </p>
                            )}
                            {/* If long description is different from short, show it */}
                            {(longDescription && longDescription !== shortDescription) && (
                                <div className="text-lg leading-relaxed text-black/80 mb-10 whitespace-pre-wrap">
                                    {longDescription}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {tags.map(tag => <span key={tag} className="text-xs bg-ivory rounded-full px-3 py-1 border border-black/5">{tag}</span>)}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <a href={beeorderUrl} target="_blank" rel="noreferrer" className="btn btn-primary">{t('product.order_on_beeorder')}</a>
                            <ShareButton />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
