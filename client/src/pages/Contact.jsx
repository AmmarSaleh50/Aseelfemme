import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import emailjs from 'emailjs-com';

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Send via EmailJS (Frontend)
      // Replace these with your actual Service ID, Template ID, and Public Key
      const SERVICE_ID = 'service_xcwup4x';
      const TEMPLATE_ID = 'template_a28g15n';
      const PUBLIC_KEY = 'HsnFfkAj75S2_YzqL';

      // Only attempt if keys are not the placeholders (or let it fail and show error if user hasn't set them)
      if (SERVICE_ID !== 'YOUR_SERVICE_ID') {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          // We send multiple variations of the names to ensure it works
          // regardless of what variables are used in the EmailJS template
          from_name: form.name,
          name: form.name,       // Matches {{name}} in screenshot

          from_email: form.email,
          email: form.email,     // Matches {{email}} in screenshot
          reply_to: form.email,

          subject: form.subject,
          title: form.subject,   // Matches {{title}} in screenshot

          message: form.message,
        }, PUBLIC_KEY);
      } else {
        console.warn('EmailJS keys are missing. Please configure them in Contact.jsx');
        // For now we simulate success so the user sees the UI state change, unless we want to block it.
        // But since we also have the database save below...
      }

      // 2. Save to Supabase (Database record)
      // Note: The database table 'contact_submissions' does not have a 'subject' column,
      // so we merge it into the message to avoid a 400 error.
      const supabaseData = {
        name: form.name,
        email: form.email,
        message: `Subject: ${form.subject}\n\n${form.message}`
      };
      await api.post('/contact', supabaseData);

      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      setError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-px max-w-6xl mx-auto py-16 lg:py-24">
      <Helmet><title>{t('contact.title')} — {t('brand')}</title></Helmet>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Contact Info Section */}
        <div className="space-y-8">
          <div>
            <h1 className="font-serif text-4xl mb-4 text-primary-dark">{t('contact.get_in_touch')}</h1>
            <p className="text-secondary-600 text-lg leading-relaxed">{t('contact.intro')}</p>
          </div>

          <div className="bg-secondary-50 p-8 rounded-2xl space-y-6">
            <h2 className="font-serif text-2xl text-primary-dark mb-6">{t('contact.info_title')}</h2>

            <div className="space-y-1">
              <div className="text-sm uppercase tracking-wider text-secondary-500 font-semibold">{t('contact.name')}</div>
              <div className="text-lg font-medium">{t('contact.owner_name')}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm uppercase tracking-wider text-secondary-500 font-semibold">{t('contact.email')}</div>
              <a href="mailto:info@aseelfemme.com" className="text-lg underline font-medium hover:text-primary-600 transition-colors">info@aseelfemme.com</a>
            </div>

            <div className="space-y-1">
              <div className="text-sm uppercase tracking-wider text-secondary-500 font-semibold">{t('contact.location')}</div>
              <div className="text-lg font-medium">Damascus, Syria</div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-secondary-100">
          <h2 className="font-serif text-2xl text-primary-dark mb-6">{t('contact.title')}</h2>
          <form onSubmit={submit} className="grid gap-5">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">{t('contact.name')}</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-xl px-4 py-3 bg-secondary-50 border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">{t('contact.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-xl px-4 py-3 bg-secondary-50 border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">{t('contact.subject')}</label>
              <input
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-xl px-4 py-3 bg-secondary-50 border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">{t('contact.message')}</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
                className="w-full rounded-xl px-4 py-3 bg-secondary-50 border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all min-h-[160px]"
              />
            </div>

            <button disabled={loading} className="btn btn-primary w-full py-4 text-base font-medium mt-2">
              {loading ? t('common.loading') : t('contact.send')}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center font-medium border border-red-100">
                {error}
              </div>
            )}

            {sent && (
              <div className="p-4 bg-green-50 text-green-700 rounded-xl text-center font-medium animate-fade-in border border-green-100">
                {t('contact.sent_thanks')}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
