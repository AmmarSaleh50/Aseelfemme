import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const COOKIE_CONSENT_KEY = 'af_cookie_consent';
const GA_ID = 'G-MXT9LLD7D4';

// Initialize consent mode with defaults (denied until user accepts)
function initConsentMode() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    // Set default consent state - denied until user makes a choice
    gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'wait_for_update': 500
    });
}

// Update consent when user makes a choice
function updateConsent(granted) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    gtag('consent', 'update', {
        'analytics_storage': granted ? 'granted' : 'denied',
        'ad_storage': granted ? 'granted' : 'denied',
        'ad_user_data': granted ? 'granted' : 'denied',
        'ad_personalization': granted ? 'granted' : 'denied'
    });
}

export default function CookieConsent() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Initialize consent mode on mount
        initConsentMode();

        // Check if user has already made a choice
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent === 'accepted') {
            updateConsent(true);
        } else if (consent === 'declined') {
            updateConsent(false);
        } else {
            // No choice made yet - show banner after a short delay
            const timer = setTimeout(() => setVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        updateConsent(true);
        setVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
        updateConsent(false);
        // Also set the GA disable flag as backup
        window[`ga-disable-${GA_ID}`] = true;
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-fade-in">
            <div className="max-w-4xl mx-auto bg-white border border-secondary-200 rounded-2xl shadow-xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 text-sm text-secondary-700">
                        <p>{t('cookies.message')}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleDecline}
                            className="px-4 py-2 text-sm font-medium text-black/60 hover:text-black border border-black/10 hover:border-black/30 rounded-full transition-colors"
                        >
                            {t('cookies.decline')}
                        </button>
                        <button
                            onClick={handleAccept}
                            className="btn btn-secondary px-6 py-2 h-auto text-sm"
                        >
                            {t('cookies.accept')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
