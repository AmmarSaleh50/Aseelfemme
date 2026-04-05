import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-footer-bg footer-wood text-footer-text/85 border-t border-footer-border">
      <div className="max-w-7xl mx-auto container-px py-12 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-serif text-2xl mb-3 text-footer-text">{t('brand')}</div>
          <p className="text-sm text-footer-text/85">{t('footer.about')}</p>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-2 text-footer-text">{t('contact.info_title')}</div>
          <p className="mb-1">{t('contact.owner_name')}</p>
          <p className="mb-1">{t('footer.email')}: <a className="text-footer-text underline" href="mailto:info@aseelfemme.com">info@aseelfemme.com</a></p>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-2 text-footer-text">{t('footer.explore')}</div>
          <div className="flex flex-col gap-2">
            <Link to="/collection" className="hover:underline">{t('nav.collection')}</Link>
            <Link to="/accessories" className="hover:underline">{t('nav.accessories')}</Link>
            <Link to="/ingredients" className="hover:underline">{t('nav.ingredients')}</Link>
            <Link to="/contact" className="hover:underline">{t('nav.contact')}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-footer-borderSubtle py-4 text-center text-xs text-footer-text/75">
        © {new Date().getFullYear()} {t('brand')}. {t('footer.copyright')}
      </div>
    </footer>
  );
}
