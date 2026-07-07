import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import SplashScreen from './pages/SplashScreen';
import LanguageSelection from './pages/LanguageSelection';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { AppLayout, type NavPage } from './components/AppLayout';
import HomePage from './pages/HomePage';
import WeatherPage from './pages/WeatherPage';
import ClimatePage from './pages/ClimatePage';
import CropPage from './pages/CropPage';
import AlertsPage from './pages/AlertsPage';
import AssistantPage from './pages/AssistantPage';
import OfficerPage from './pages/OfficerPage';
import DiseasePage from './pages/DiseasePage';
import ProfilePage from './pages/ProfilePage';
import MarketPricesPage from './pages/MarketPricesPage';
import SchemesPage from './pages/SchemesPage';
import NewsPage from './pages/NewsPage';
import FeedbackPage from './pages/FeedbackPage';
import OfficerDashboard from './pages/OfficerDashboard';

type AppStage = 'splash' | 'language' | 'auth' | 'app' | 'reset-password';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [stage, setStage] = useState<AppStage>('splash');
  const [page, setPage] = useState<NavPage>('home');

  const isOfficer = profile?.role === 'officer';
  const isAuthenticated = !!(session || profile);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setStage('reset-password');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (stage === 'reset-password') {
    return <ResetPasswordPage onComplete={() => setStage('auth')} />;
  }

  // Splash → Language → (auth check) → App/Login
  if (stage === 'splash') {
    return <SplashScreen onDone={() => setStage('language')} />;
  }

  if (stage === 'language') {
    return <LanguageSelection onDone={() => setStage(isAuthenticated ? 'app' : 'auth')} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If authenticated but stage is auth (user just logged in), go to app
  if (stage === 'auth' && isAuthenticated) {
    setStage('app');
  }

  // Officer dashboard for agriculture officers
  if (isOfficer) {
    const officerPages: Record<NavPage, React.ReactNode> = {
      home: <OfficerDashboard />,
      weather: <WeatherPage />,
      climate: <ClimatePage />,
      crops: <CropPage />,
      alerts: <AlertsPage />,
      assistant: <AssistantPage />,
      officer: <OfficerPage />,
      disease: <DiseasePage />,
      profile: <ProfilePage onNavigate={setPage} />,
      market: <MarketPricesPage />,
      schemes: <SchemesPage />,
      news: <NewsPage />,
      feedback: <FeedbackPage />,
    };

    return (
      <AppLayout current={page} onNavigate={setPage}>
        {officerPages[page]}
      </AppLayout>
    );
  }

  // Farmer dashboard
  const pages: Record<NavPage, React.ReactNode> = {
    home: <HomePage onNavigate={setPage} />,
    weather: <WeatherPage />,
    climate: <ClimatePage />,
    crops: <CropPage />,
    alerts: <AlertsPage />,
    assistant: <AssistantPage />,
    officer: <OfficerPage />,
    disease: <DiseasePage />,
    profile: <ProfilePage onNavigate={setPage} />,
    market: <MarketPricesPage />,
    schemes: <SchemesPage />,
    news: <NewsPage />,
    feedback: <FeedbackPage />,
  };

  return (
    <AppLayout current={page} onNavigate={setPage}>
      {pages[page]}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <LocationProvider>
            <AppContent />
          </LocationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
