import type { ReactNode } from 'react';
import { Home, CloudSun, Sprout, Bell, MessageSquare, User, LogOut, Stethoscope, Briefcase, Calendar, Users, FileText, TrendingUp, HelpCircle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { TranslationKey } from '../i18n/translations';

export type NavPage = 'home' | 'weather' | 'climate' | 'crops' | 'alerts' | 'assistant' | 'officer' | 'disease' | 'profile' | 'market' | 'schemes' | 'news' | 'feedback';

interface LayoutProps {
  current: NavPage;
  onNavigate: (page: NavPage) => void;
  children: ReactNode;
}

const farmerNavItems: { page: NavPage; icon: typeof Home; labelKey: TranslationKey }[] = [
  { page: 'home', icon: Home, labelKey: 'home' },
  { page: 'weather', icon: CloudSun, labelKey: 'weather' },
  { page: 'crops', icon: Sprout, labelKey: 'crops' },
  { page: 'alerts', icon: Bell, labelKey: 'alerts' },
  { page: 'assistant', icon: MessageSquare, labelKey: 'assistant' },
  { page: 'officer', icon: Briefcase, labelKey: 'officerTitle' },
  { page: 'disease', icon: Stethoscope, labelKey: 'diseaseTitle' },
  { page: 'profile', icon: User, labelKey: 'profile' },
];

const officerNavItems: { page: NavPage; icon: typeof Home; labelKey: TranslationKey }[] = [
  { page: 'home', icon: Home, labelKey: 'home' },
  { page: 'officer', icon: MessageSquare, labelKey: 'queries' },
  { page: 'alerts', icon: Bell, labelKey: 'alerts' },
  { page: 'assistant', icon: HelpCircle, labelKey: 'assistant' },
  { page: 'weather', icon: CloudSun, labelKey: 'weather' },
  { page: 'crops', icon: Sprout, labelKey: 'crops' },
  { page: 'profile', icon: User, labelKey: 'profile' },
];

export function AppLayout({ current, onNavigate, children }: LayoutProps) {
  const { t, lang } = useI18n();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isOfficer = profile?.role === 'officer';
  const navItems = isOfficer ? officerNavItems : farmerNavItems;

  const roleLabel = isOfficer
    ? (lang === 'te' ? 'అధికారి' : 'Officer')
    : (lang === 'te' ? 'రైతు' : 'Farmer');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col max-w-md mx-auto md:max-w-lg lg:max-w-xl md:shadow-2xl md:my-4 md:rounded-3xl md:overflow-hidden min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOfficer ? 'bg-teal-600' : 'bg-brand-600'}`}>
              <Sprout className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t('appName')}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{roleLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label={t('signOut')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 fixed bottom-0 left-0 right-0 md:absolute md:rounded-b-3xl z-20 max-w-md mx-auto md:max-w-lg lg:max-w-xl">
        <div className="flex items-center h-16 px-1 overflow-x-auto gap-1 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.page;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[58px] h-full transition-colors ${
                  active
                    ? isOfficer
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-brand-600 dark:text-brand-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                <span className="text-[9px] font-medium leading-none whitespace-nowrap">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
