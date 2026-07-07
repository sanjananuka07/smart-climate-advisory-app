import { useState } from 'react';
import { Star, Loader2, Check, MessageSquare } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

export default function FeedbackPage() {
  const { t } = useI18n();
  const [category, setCategory] = useState('app');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'app', label: t('categoryApp') },
    { value: 'service', label: t('categoryService') },
    { value: 'suggestion', label: t('categorySuggestion') },
    { value: 'complaint', label: t('categoryComplaint') },
  ];

  async function submit() {
    if (!message.trim()) return;
    setSubmitting(true);
    await supabase.from('feedback').insert({ category, message, rating });
    setSubmitting(false);
    setSubmitted(true);
    setMessage('');
    setRating(5);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('feedbackTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('appName')}</p>
      </div>

      {submitted && (
        <div className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-lg px-3 py-2.5">
          <Check className="w-4 h-4" />
          {t('feedbackSubmitted')}
        </div>
      )}

      <Card className="p-5 space-y-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('feedbackCategory')}</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`py-2.5 text-xs font-medium rounded-lg border transition ${
                  category === c.value
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('rating')}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="p-1"
              >
                <Star
                  className={`w-7 h-7 transition ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('feedbackMessage')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
            placeholder={t('feedbackMessage')}
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting || !message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          {t('submitFeedback')}
        </button>
      </Card>
    </div>
  );
}
