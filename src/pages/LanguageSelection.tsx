import { Globe, Check, ArrowRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import type { Language } from '../i18n/translations';

const languageOptions: { code: Language; flag: string }[] = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'hi', flag: '🇮🇳' },
  { code: 'te', flag: '🇮🇳' },
  { code: 'ta', flag: '🇮🇳' },
  { code: 'kn', flag: '🇮🇳' },
  { code: 'ml', flag: '🇮🇳' },
];

export default function LanguageSelection({ onDone }: { onDone: () => void }) {
  const { lang, setLang, t, languageNames } = useI18n();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30 mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('selectLanguage')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose your preferred language</p>
        </div>

        <div className="space-y-2">
          {languageOptions.map((opt) => {
            const names = languageNames[opt.code];
            return (
              <button
                key={opt.code}
                onClick={() => setLang(opt.code)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                  lang === opt.code
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-700/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.flag}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{names.native}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{names.english}</p>
                  </div>
                </div>
                {lang === opt.code && (
                  <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onDone}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          {t('continue')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
