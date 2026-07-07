import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

interface ContentItem {
  id: string;
  title: string;
  body: string;
  extra: { price?: string; unit?: string; trend?: string; change?: string; benefit?: string; deadline?: string; date?: string; source?: string };
}

export default function MarketPricesPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('content_items')
        .select('id, title, body, extra')
        .eq('type', 'market_price')
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

  const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
  const trendColor = {
    up: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-700/20',
    down: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-700/20',
    stable: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
  };
  const trendKey = { up: 'trendUp', down: 'trendDown', stable: 'trendStable' } as const;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('marketPriceTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('srikakulam')}</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const trend = item.extra.trend ?? 'stable';
          const Icon = trendIcon[trend as keyof typeof trendIcon];
          const change = item.extra.change ?? '0';
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.extra.unit ?? t('perQuintal')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">₹{item.extra.price}</p>
                  <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${trendColor[trend as keyof typeof trendColor]}`}>
                    <Icon className="w-3 h-3" />
                    {change !== '0' ? change : t(trendKey[trend as keyof typeof trendKey])}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
