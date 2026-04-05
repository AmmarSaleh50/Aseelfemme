export default function LanguageTabs({ activeLanguage, onLanguageChange, className = '' }) {
    return (
        <div className={`flex gap-2 mb-6 border-b border-black/10 pb-4 ${className}`}>
            <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${activeLanguage === 'en'
                    ? 'bg-charcoal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                English
            </button>
            <button
                type="button"
                onClick={() => onLanguageChange('ar')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${activeLanguage === 'ar'
                    ? 'bg-charcoal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                Arabic (العربية)
            </button>
        </div>
    );
}
