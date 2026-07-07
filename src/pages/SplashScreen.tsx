import { useEffect, useState } from 'react';
import { Sprout, Loader2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
      onDone();
    }, 500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl mb-6 animate-pulse-soft">
          <Sprout className="w-12 h-12 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">{t('appName')}</h1>
        <p className="text-brand-100 mt-2 text-sm">{t('tagline')}</p>
      </div>
      {showLoader && (
        <div className="absolute bottom-16">
          <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
        </div>
      )}
    </div>
  );
}
