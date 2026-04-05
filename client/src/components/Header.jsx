import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BEEORDER_URL } from '../lib/config';
import { setAuthToken } from '../lib/api';

const nav = (t) => ([
  { to: '/', label: t('nav.home') },
  { to: '/collection', label: t('nav.collection') },
  { to: '/accessories', label: t('nav.accessories') },
  { to: '/ingredients', label: t('nav.ingredients') },
  { to: '/contact', label: t('nav.contact') },
]);

function LangSwitcher() {
  const { i18n } = useTranslation();
  const change = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };
  return (
    <div className="flex items-center gap-2 text-sm">
      {['en', 'ar'].map(l => (
        <button key={l} onClick={() => change(l)} className={`px-2 py-1 rounded-full border ${i18n.language === l ? 'font-semibold border-charcoal' : 'border-black/10'}`}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

export default function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Lock page scroll when mobile menu is open
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY || window.pageYOffset || 0;
          if (currentY <= 0) {
            setHidden(false);
            setAtTop(true);
          } else if (currentY > lastY.current + 50) {
            setHidden(true);
          } else if (currentY < lastY.current - 50) {
            setHidden(false);
            setAtTop(false);
          }
          lastY.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const hasToken = !!localStorage.getItem('af_admin_token');
    setIsAdmin(hasToken);
    setAdminMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('af_admin_token');
    setAuthToken(null);
    setIsAdmin(false);
    setOpen(false);
    navigate('/');
  };

  const handleAdminNav = (path) => {
    navigate(path);
    setAdminMenuOpen(false);
    setOpen(false);
  };

  const renderAdminMenu = () => (
    <div className="relative select-pill-wrapper text-sm">
      <button
        type="button"
        className="select-pill flex items-center gap-2 min-w-[9rem] justify-between"
        onClick={() => setAdminMenuOpen((o) => !o)}
      >
        <span className="truncate">{t('sections.admin')}</span>
      </button>
      {adminMenuOpen && (
        <div className="absolute left-0 mt-2 w-full rounded-2xl bg-ivory shadow-soft border border-charcoal/15 z-40 overflow-hidden">
          <ul className="max-h-60 overflow-auto text-sm">
            <li>
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-blush/80"
                onClick={() => handleAdminNav('/admin')}
              >
                {t('admin.account.dashboard')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-blush/80 text-red-700"
                onClick={handleSignOut}
              >
                {t('admin.login.sign_out')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );

  const renderNavLinks = (className = '') => (
    <nav className={`flex items-center gap-6 ${className}`}>
      {nav(t).map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          className={({ isActive }) => `text-sm transition-colors relative group ${isActive ? 'font-semibold text-charcoal' : 'text-black/70'}`}
        >
          {({ isActive }) => (
            <>
              {n.label}
              <span className={`absolute -bottom-1 left-0 w-full h-[0.1rem] bg-charcoal transform origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const renderActions = () => (
    <div className="flex items-center gap-3">
      <LangSwitcher />
      <a href={BEEORDER_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
        {t('cta.order')}
      </a>
    </div>
  );

  const DesktopLogo = ({ className = '' }) => (
    <Link
      to="/"
      className={`font-serif tracking-[0.12em] uppercase text-charcoal inline-block ${className}`}
    >
      <span className="relative inline-block">
        ASEELFEMME
        <span className="absolute -right-1 -bottom-3 text-[10px] tracking-normal">®</span>
      </span>
    </Link>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-ivory/90 backdrop-blur transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="max-w-7xl mx-auto container-px py-3 md:py-3">
        {/* Desktop */}
        <div className="hidden md:block">
          {atTop ? (
            <div className="flex flex-col transition-all duration-300 ease-out">
              <div className="flex items-center justify-between w-full mb-2 relative z-10">
                <div className="flex items-center gap-1">
                  {isAdmin ? renderAdminMenu() : null}
                </div>
                {renderActions()}
              </div>
              <div className="-mt-12 flex flex-col items-center gap-2">
                <DesktopLogo className="text-3xl" />
                {renderNavLinks('justify-center flex-wrap')}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-6 transition-all duration-300 ease-out">
              <DesktopLogo className="text-2xl" />
              <div className="flex items-center justify-center flex-1 gap-4">
                {renderNavLinks()}
                {isAdmin ? (
                  <div className="ml-1">
                    {renderAdminMenu()}
                  </div>
                ) : null}
              </div>
              {renderActions()}
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center justify-between md:hidden">
          {/* Left spacer to mirror the menu button width so logo stays centered */}
          <div className="w-10" aria-hidden="true" />
          <Link
            to="/"
            className="font-serif text-2xl tracking-[0.12em] uppercase text-charcoal text-center flex-1"
          >
            <span className="relative inline-block">
              ASEELFEMME
              <span className="absolute -right-1 -bottom-3 text-[10px] tracking-normal">®</span>
            </span>
          </Link>
          <button className="p-2" onClick={() => setOpen(!open)} aria-label={t('nav.menu')}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-black/5 bg-ivory overflow-hidden"
          >
            <div className="container-px py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {nav(t).map(n => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="py-1 text-base"
                  >
                    {n.label}
                  </NavLink>
                ))}
              </div>
              {isAdmin && (
                <div className="pt-3 border-t border-black/10 flex flex-col gap-2 text-sm">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-black/45">
                    {t('sections.admin')}
                  </div>
                  <button
                    type="button"
                    className="text-left py-1"
                    onClick={() => handleAdminNav('/admin')}
                  >
                    {t('admin.account.dashboard')}
                  </button>
                  <button
                    type="button"
                    className="text-left py-1 text-red-700"
                    onClick={handleSignOut}
                  >
                    {t('admin.login.sign_out')}
                  </button>
                </div>
              )}
              <div className="pt-4 border-t border-black/10 flex flex-col gap-3">
                <LangSwitcher />
                <a href={BEEORDER_URL} className="btn btn-primary w-full">{t('cta.order')}</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
