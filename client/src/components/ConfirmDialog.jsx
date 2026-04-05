import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-sm container-px py-6 px-6">
        <div className="space-y-4">
          <div>
            <div className="text-xs tracking-[0.14em] uppercase text-black/40 mb-1">
              {t('sections.admin')}
            </div>
            {title && (
              <h2 className="font-serif text-xl text-charcoal">{title}</h2>
            )}
          </div>
          {description && (
            <p className="text-sm text-black/70 whitespace-pre-line">{description}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-full border border-black/10 text-xs text-black/70 hover:bg-ivory"
            >
              {cancelLabel || t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-full text-xs bg-charcoal text-ivory hover:bg-black/80"
            >
              {confirmLabel || t('admin.common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
