import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import AccessoryCard from '../components/AccessoryCard';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Accessories() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language.startsWith('ar') ? 'Ar' : 'En';
    const [accessories, setAccessories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/accessories')
            .then((r) => setAccessories(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="container-px max-w-7xl mx-auto py-10">
            <Helmet>
                <title>{t('nav.accessories')} — {t('brand')}</title>
            </Helmet>

            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="font-serif text-3xl">{t('nav.accessories')}</h1>
                    <p className="mt-1 text-sm text-black/60 max-w-xl">
                        {t('accessories.subtitle')}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20 text-black/40">{t('common.loading')}</div>
                ) : accessories.length === 0 ? (
                    <div className="flex justify-center py-20 text-black/40">
                        {t('common.no_results')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {accessories.map((item) => (
                            <AccessoryCard key={item.id} accessory={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
