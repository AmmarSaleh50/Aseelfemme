import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getGeminiApiKey, saveGeminiApiKey } from '../../lib/gemini';
import { useToast } from '../../components/ToastProvider';
import { Key, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminAccount() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const email = localStorage.getItem('af_admin_email') || 'admin@aseelfemme.local';

  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    getGeminiApiKey().then(key => {
      setHasApiKey(!!key);
      if (key) setApiKey(key);
    }).catch(() => setHasApiKey(false));
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      showToast('Please enter an API key', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveGeminiApiKey(apiKey.trim());
      setHasApiKey(true);
      showToast('API key saved! ✨', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to save API key', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-px max-w-2xl mx-auto py-10">
      <h1 className="font-serif text-3xl mb-6">{t('admin.account.title')}</h1>

      {/* Account Info */}
      <div className="bg-white rounded-3xl p-6 shadow-soft grid gap-4 text-sm mb-6">
        <div>
          <div className="text-black/60 mb-1">{t('admin.account.email')}</div>
          <div className="font-medium">{email}</div>
        </div>
        <div className="text-black/60 text-xs">
          {t('admin.account.description')}
        </div>
      </div>

      {/* Gemini API Key */}
      <div className="bg-white rounded-3xl p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-mint/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-mint" />
          </div>
          <div>
            <h2 className="font-semibold">Gemini AI</h2>
            <p className="text-xs text-black/60">
              Configure API key for "Complete with AI" feature
            </p>
          </div>
          {hasApiKey && (
            <div className="ml-auto flex items-center gap-1 text-xs text-mint">
              <CheckCircle className="w-4 h-4" />
              Configured
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full rounded-xl px-4 py-3 pr-12 border border-black/10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-black/50">
              Get your free API key from{' '}
              <a
                href="https://ai.google.dev"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-mint"
              >
                ai.google.dev
              </a>
            </p>
            <button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey.trim()}
              className="btn btn-primary flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
