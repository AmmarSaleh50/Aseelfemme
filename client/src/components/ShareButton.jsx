import React, { useState } from 'react';
import { Check, Share2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ShareButton({ title, text, className }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy keys', err);
        }
    };

    return (
        <button
            onClick={handleShare}
            className={className || "btn btn-secondary flex items-center gap-2"}
            aria-label={t('product.share')}
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4" />
                    <span>{t('common.copied') || 'Copied'}</span>
                </>
            ) : (
                <>
                    {/* Reverting to simple Share text or Icon, user asked for "copy link" behavior */}
                    {/* But kept "Share" label for consistency unless user wants "Copy Link" label? 
               User said "make the share button just a copy link". 
               I'll keep the button looking like a Share button but acting like Copy.
           */}
                    <span>{text || t('product.share')}</span>
                </>
            )}
        </button>
    );
}
