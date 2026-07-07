import { useEffect, useState } from 'react';
import { FileText, Loader2, Gift, Calendar } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

interface ContentItem {
  id: string;
  title: string;
  body: string;
  extra: { benefit?: string; deadline?: string };
}

export default function SchemesPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('content_items')
        .select('id, title, body, extra')
        .eq('type', 'scheme')
        .order('created_at', { ascending: false });
      setItems((data ?? []) as ContentItem[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('schemesTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('srikakulam')}</p>
      </div>

      {items.map((item) => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-brand-600 dark:text-brand-300" />
            </div>
            <p className="font-bold text-gray-900 dark:text-gray-100 leading-snug">{item.title}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{item.body}</p>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            {item.extra.benefit && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300">
                <Gift className="w-3 h-3" />
                {t('benefit')}: {item.extra.benefit}
              </span>
            )}
            {item.extra.deadline && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-700/20 text-amber-700 dark:text-amber-300">
                <Calendar className="w-3 h-3" />
                {t('deadline')}: {item.extra.deadline}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
