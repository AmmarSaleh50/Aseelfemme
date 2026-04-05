import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { useTranslation } from 'react-i18next';
import { BEEORDER_URL } from '../lib/config';
import { fadeInUp, staggerContainer } from '../lib/animations';

export default function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/products?status=published').then(r => setFeatured(r.data.slice(0, 3)));
  }, []);

  return (
    <>
      <Helmet>
        <title>{t('brand')} — {t('hero.title')}</title>
      </Helmet>

      <section className="container-px max-w-7xl mx-auto pt-10 md:pt-20 pb-20 overflow-hidden md:overflow-visible">
        <div className="grid md:grid-cols-2 gap-y-20 md:gap-10 items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="text-4xl md:text-6xl font-serif leading-tight">
              {t('hero.title')}
            </motion.div>
            <motion.p variants={fadeInUp} className="mt-4 text-black/70">{t('hero.sub')}</motion.p>
            <motion.div variants={fadeInUp} className="mt-6 flex gap-3">
              <Link to="/collection" className="btn btn-primary">{t('cta.explore')}</Link>
              <a className="btn btn-secondary" href={BEEORDER_URL} target="_blank" rel="noreferrer">{t('cta.order')}</a>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
            <motion.div
              className="absolute -inset-6 bg-gradient-to-br from-blush to-mint rounded-full blur-3xl opacity-30"
              animate={{ opacity: [0.25, 0.4, 0.25], scale: [1, 1.05, 1] }}
              transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror' }}
            />
            <div className="relative rounded-full shadow-soft w-full aspect-square overflow-hidden">
              <img
                src="/logo_transperent.png"
                alt={t('brand')}
                className="w-full h-full object-contain scale-125 md:-mt-4"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-px max-w-7xl mx-auto mt-20">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl">{t('sections.signature_collection')}</h2>
          <Link to="/collection" className="text-sm underline">{t('cta.view_all')}</Link>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(p => (
            <motion.div
              key={p.id}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "0px" }}
              className="h-full"
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
