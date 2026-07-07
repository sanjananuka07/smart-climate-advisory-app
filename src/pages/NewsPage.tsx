import { useEffect, useState } from 'react';
import { Newspaper, Loader2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

interface ContentItem {
  id: string;
  title: string;
  body: string;
  extra: { date?: string; source?: string };
}

export default function NewsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('content_items')
        .select('id, title, body, extra')
        .eq('type', 'news')
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('newsTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('srikakulam')}</p>
      </div>

      {items.map((item) => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-700/30 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 text-accent-600 dark:text-accent-300" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-gray-100 leading-snug">{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {item.extra.date && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.extra.date}</span>
                )}
                {item.extra.source && (
                  <span className="text-xs text-accent-600 dark:text-accent-400 font-medium">{item.extra.source}</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.body}</p>
        </Card>
      ))}
    </div>
  );
}
