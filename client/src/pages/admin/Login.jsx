import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function AdminLogin() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await api.post('/admin/login', { email, password });
      // Supabase handles session automatically, but we store token for compatibility
      if (r.data?.token) {
        localStorage.setItem('af_admin_token', r.data.token);
        localStorage.setItem('af_admin_email', email);
      }
      nav('/admin');
    } catch (error) {
      console.error('Login error:', error);
      setErr(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-px max-w-md mx-auto py-16">
      <h1 className="font-serif text-3xl mb-6">{t('admin.login.title')}</h1>
      <form onSubmit={submit} className="grid gap-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-xl px-4 py-3 border border-black/10"
          placeholder={t('admin.login.email')}
          required
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="rounded-xl px-4 py-3 border border-black/10"
          placeholder={t('admin.login.password')}
          required
          disabled={loading}
        />
        {err && (
          <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
            {err}
          </div>
        )}
        <button
          className="btn btn-primary w-fit disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t('common.loading') : t('admin.login.sign_in')}
        </button>
      </form>
      <p className="mt-6 text-sm text-black/50">
        {t('admin.login.hint', 'Use your Supabase Auth credentials to sign in.')}
      </p>
    </div>
  );
}
