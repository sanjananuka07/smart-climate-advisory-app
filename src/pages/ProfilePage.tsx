import { useEffect, useState } from 'react';
import { User, Phone, MapPin, Home, Ruler, Layers, Globe, Wheat, Loader2, Check, Moon, FileText, Newspaper, TrendingUp, ChevronDown } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';
import type { Language } from '../i18n/translations';

interface Profile {
  full_name: string | null;
  mobile_number: string | null;
  district: string | null;
  village: string | null;
  farm_size: number | null;
  soil_type: string | null;
  preferred_language: string | null;
  crops_grown: string | null;
}

export default function ProfilePage({ onNavigate }: { onNavigate?: (p: 'home' | 'weather' | 'climate' | 'crops' | 'alerts' | 'assistant' | 'officer' | 'disease' | 'profile' | 'market' | 'schemes' | 'news' | 'feedback') => void }) {
  const { t, lang, setLang, languageNames } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Edit form state
  const [form, setForm] = useState<Profile>({
    full_name: '', mobile_number: '', district: 'Srikakulam', village: '',
    farm_size: null, soil_type: 'alluvial', preferred_language: 'en', crops_grown: '',
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, mobile_number, district, village, farm_size, soil_type, preferred_language, crops_grown')
        .maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setForm(data as Profile);
        const savedLang = data.preferred_language as Language;
        if (['en', 'te', 'hi', 'ta', 'kn', 'ml'].includes(savedLang)) {
          setLang(savedLang);
        }
      }
      setLoading(false);
    }
    load();
  }, [setLang]);

  async function save() {
    setSaving(true);
    setSaved(false);
    await supabase.from('profiles').upsert({
      user_id: user?.id,
      ...form,
    });
    setProfile(form);
    setEditing(false);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  const fields = [
    { icon: User, label: t('fullName'), value: profile?.full_name },
    { icon: Phone, label: t('mobileNumber'), value: profile?.mobile_number },
    { icon: MapPin, label: t('district'), value: profile?.district },
    { icon: Home, label: t('village'), value: profile?.village },
    { icon: Ruler, label: t('farmSize'), value: profile?.farm_size ? `${profile.farm_size} acres` : null },
    { icon: Layers, label: t('soilType'), value: profile?.soil_type },
    { icon: Wheat, label: t('cropsGrown'), value: profile?.crops_grown },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('profileTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-700/20 transition"
          >
            {t('editProfile')}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setForm(profile ?? form); }}
              className="text-sm font-medium text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {t('cancel')}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-sm font-medium text-white bg-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-700 transition flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {t('save')}
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="text-sm text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-lg px-3 py-2.5">
          {t('saved')}
        </div>
      )}

      {/* Profile info / edit form */}
      <Card className="p-5">
        {editing ? (
          <div className="space-y-4">
            <EditField icon={<User className="w-4 h-4" />} label={t('fullName')} value={form.full_name ?? ''} onChange={(v) => setForm({ ...form, full_name: v })} />
            <EditField icon={<Phone className="w-4 h-4" />} label={t('mobileNumber')} value={form.mobile_number ?? ''} onChange={(v) => setForm({ ...form, mobile_number: v })} />
            <EditField icon={<MapPin className="w-4 h-4" />} label={t('district')} value={form.district ?? ''} onChange={(v) => setForm({ ...form, district: v })} />
            <EditField icon={<Home className="w-4 h-4" />} label={t('village')} value={form.village ?? ''} onChange={(v) => setForm({ ...form, village: v })} />
            <EditField icon={<Ruler className="w-4 h-4" />} label={t('farmSize')} value={form.farm_size?.toString() ?? ''} onChange={(v) => setForm({ ...form, farm_size: v ? Number(v) : null })} type="number" />
            <EditField icon={<Layers className="w-4 h-4" />} label={t('soilType')} value={form.soil_type ?? ''} onChange={(v) => setForm({ ...form, soil_type: v })} />
            <EditField icon={<Wheat className="w-4 h-4" />} label={t('cropsGrown')} value={form.crops_grown ?? ''} onChange={(v) => setForm({ ...form, crops_grown: v })} />
          </div>
        ) : (
          <div className="space-y-3.5">
            {fields.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {f.value || <span className="text-gray-400 dark:text-gray-500">—</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Language selection */}
      <Card className="p-4">
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-50 dark:bg-accent-700/30 flex items-center justify-center text-accent-600 dark:text-accent-300">
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('preferredLanguage')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{languageNames[lang].native}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showLangPicker ? 'rotate-180' : ''}`} />
        </button>
        {showLangPicker && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
            {(['en', 'hi', 'te', 'ta', 'kn', 'ml'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setShowLangPicker(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                  lang === l
                    ? 'bg-brand-100 dark:bg-brand-700/30 text-brand-700 dark:text-brand-300'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{languageNames[l].native}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Dark mode */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <Moon className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('darkMode')}</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-11 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-brand-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </Card>

      {/* Additional features (placeholders) */}
      <div className="space-y-3">
        <FeatureRow icon={<FileText className="w-4 h-4" />} label={t('governmentSchemes')} onClick={() => onNavigate?.('schemes')} />
        <FeatureRow icon={<Newspaper className="w-4 h-4" />} label={t('agriNews')} onClick={() => onNavigate?.('news')} />
        <FeatureRow icon={<TrendingUp className="w-4 h-4" />} label={t('marketPrices')} onClick={() => onNavigate?.('market')} />
        <FeatureRow icon={<User className="w-4 h-4" />} label={t('feedback')} onClick={() => onNavigate?.('feedback')} />
      </div>
    </div>
  );
}

function EditField({ icon, label, value, onChange, type = 'text' }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
        />
      </div>
    </div>
  );
}

function FeatureRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Card className="p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
    </Card>
  );
}
