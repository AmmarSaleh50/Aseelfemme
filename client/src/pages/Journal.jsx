import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export default function Journal() {
  const { t } = useTranslation();
  return (
    <div className="container-px max-w-3xl mx-auto py-10">
      <Helmet><title>{t('sections.journal')} — {t('brand')}</title></Helmet>
      <h1 className="font-serif text-3xl">{t('sections.journal')}</h1>
      <p className="text-black/70 mt-4">{t('journal.coming_soon')}</p>
    </div>
  );
}
