import { useState, type FormEvent, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Sprout, User, Phone, Tractor, Briefcase, Building2 } from 'lucide-react';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { supabase } from '../lib/supabase';

type AuthMode = 'select' | 'farmer-signin' | 'farmer-signup' | 'officer-signin' | 'officer-signup' | 'forgot';

export default function LoginPage() {
  const { signIn, signUp, farmerSignIn, farmerSignUp, resetPassword, profile } = useAuth();
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<AuthMode>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Farmer form
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmerDistrict, setFarmerDistrict] = useState('Srikakulam');

  // Officer form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const districts = [
    'Srikakulam', 'Vizianagaram', 'Visakhapatnam', 'East Godavari', 'West Godavari',
    'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Chittoor', 'Anantapur', 'Kurnool', 'Kadapa'
  ];

  // Clear errors when switching modes
  useEffect(() => { setError(null); setInfo(null); }, [mode]);

  async function handleFarmerSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await farmerSignIn(farmerPhone);
      if (!result) {
        setError(lang === 'te' ? 'ఫోన్ నంబర్ నమోదు చేయబడలేదు. దయచేసి సైన్ అప్ చేయండి.' :
               lang === 'hi' ? 'फोन नंबर पंजीकृत नहीं है। कृपया साइन अप करें।' :
               'Phone number not registered. Please sign up.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleFarmerSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await farmerSignUp(farmerName, farmerPhone, farmerDistrict);
      setInfo(lang === 'te' ? 'ఖాతా సృష్టించబడింది!' :
             lang === 'hi' ? 'खाता बनाया गया!' :
             'Account created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleOfficerSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleOfficerSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, {
        full_name: officerName,
        role: 'officer',
      });
      setInfo(lang === 'te' ? 'ఖాతా సృష్టించబడింది. దయచేసి మీ ఇమెయిల్‌ను ధృవీకరించండి.' :
             lang === 'hi' ? 'खाता बनाया गया। कृपया अपना ईमेल सत्यापित करें।' :
             'Account created. Please verify your email.');
      setMode('officer-signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setInfo(lang === 'te' ? 'పాస్‌వర్డ్ రీసెట్ లింక్ పంపబడింది.' :
             lang === 'hi' ? 'पासवर्ड रीसेट लिंक भेजा गया।' :
             'Password reset link sent.');
      setMode('officer-signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  // Role selection screen
  if (mode === 'select') {
    const roles = [
      {
        id: 'farmer',
        titleEn: 'Farmer',
        titleTe: 'రైతు',
        titleHi: 'किसान',
        descriptionEn: 'Register with name and phone number',
        descriptionTe: 'పేరు మరియు ఫోన్ నంబర్‌తో నమోదు చేయండి',
        descriptionHi: 'नाम और फोन नंबर से पंजीकरण करें',
        icon: <Tractor className="w-6 h-6" />,
        color: 'bg-green-500',
        modes: ['farmer-signin', 'farmer-signup'] as const,
      },
      {
        id: 'officer',
        titleEn: 'Agriculture Officer',
        titleTe: 'వ్యవసాయ అధికారి',
        titleHi: 'कृषि अधिकारी',
        descriptionEn: 'Sign in with email verification',
        descriptionTe: 'ఇమెయిల్ ధృవీకరణతో సైన్ ఇన్ చేయండి',
        descriptionHi: 'ईमेल सत्यापन के साथ साइन इन करें',
        icon: <Briefcase className="w-6 h-6" />,
        color: 'bg-teal-500',
        modes: ['officer-signin', 'officer-signup'] as const,
      },
    ];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30 mb-4">
              <Sprout className="w-8 h-8 text-white" strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{t('appName')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('tagline')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/60 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {lang === 'te' ? 'మీరు ఎవరు?' : lang === 'hi' ? 'आप कौन हैं?' : 'Who are you?'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {lang === 'te' ? 'కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి' :
               lang === 'hi' ? 'जारी रखने के लिए अपनी भूमिका चुनें' :
               'Select your role to continue'}
            </p>

            <div className="space-y-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setMode(role.id === 'farmer' ? 'farmer-signin' : 'officer-signin')}
                  className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 transition group"
                >
                  <div className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition`}>
                    {role.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {lang === 'te' ? role.titleTe : lang === 'hi' ? role.titleHi : role.titleEn}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {lang === 'te' ? role.descriptionTe : lang === 'hi' ? role.descriptionHi : role.descriptionEn}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Farmer sign in (phone only)
  if (mode === 'farmer-signin') {
    return (
      <AuthContainer title={lang === 'te' ? 'రైతు సైన్ ఇన్' : lang === 'hi' ? 'किसान साइन इन' : 'Farmer Sign In'} onBack={() => setMode('select')} icon={<Tractor className="w-5 h-5" />} color="green">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {lang === 'te' ? 'మీ ఫోన్ నంబర్‌తో సైన్ ఇన్ చేయండి' :
           lang === 'hi' ? 'अपने फोन नंबर से साइन इन करें' :
           'Sign in with your phone number'}
        </p>
        <form onSubmit={handleFarmerSignIn} className="space-y-4">
          <Input
            icon={<Phone className="w-4 h-4" />}
            type="tel"
            placeholder={lang === 'te' ? 'ఫోన్ నంబర్' : lang === 'hi' ? 'फोन नंबर' : 'Phone Number'}
            value={farmerPhone}
            onChange={setFarmerPhone}
            required
          />
          {error && <ErrorBox message={error} />}
          {info && <InfoBox message={info} />}
          <SubmitButton loading={loading} label={t('signIn')} />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {lang === 'te' ? 'ఖాతా లేదా? ' : lang === 'hi' ? 'खाता नहीं है? ' : "Don't have an account? "}
            <button type="button" onClick={() => setMode('farmer-signup')} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {t('signUp')}
            </button>
          </p>
        </form>
      </AuthContainer>
    );
  }

  // Farmer sign up (name + phone + district)
  if (mode === 'farmer-signup') {
    return (
      <AuthContainer title={lang === 'te' ? 'రైతు సైన్ అప్' : lang === 'hi' ? 'किसान साइन अप' : 'Farmer Sign Up'} onBack={() => setMode('select')} icon={<Tractor className="w-5 h-5" />} color="green">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {lang === 'te' ? 'కేవలం పేరు మరియు ఫోన్ నంబర్‌తో ఖాతా సృష్టించండి' :
           lang === 'hi' ? 'केवल नाम और फोन नंबर से खाता बनाएं' :
           'Create account with just name and phone'}
        </p>
        <form onSubmit={handleFarmerSignUp} className="space-y-4">
          <Input
            icon={<User className="w-4 h-4" />}
            type="text"
            placeholder={t('fullName')}
            value={farmerName}
            onChange={setFarmerName}
            required
          />
          <Input
            icon={<Phone className="w-4 h-4" />}
            type="tel"
            placeholder={lang === 'te' ? 'ఫోన్ నంబర్' : lang === 'hi' ? 'फोन नंबर' : 'Phone Number'}
            value={farmerPhone}
            onChange={setFarmerPhone}
            required
          />
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={farmerDistrict}
              onChange={(e) => setFarmerDistrict(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
            >
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {error && <ErrorBox message={error} />}
          {info && <InfoBox message={info} />}
          <SubmitButton loading={loading} label={t('signUp')} />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {lang === 'te' ? 'ఇప్పటికే ఖాతా ఉందా? ' : lang === 'hi' ? 'पहले से खाता है? ' : 'Already have an account? '}
            <button type="button" onClick={() => setMode('farmer-signin')} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {t('signIn')}
            </button>
          </p>
        </form>
      </AuthContainer>
    );
  }

  // Officer sign in (email + password)
  if (mode === 'officer-signin') {
    return (
      <AuthContainer title={lang === 'te' ? 'అధికారి సైన్ ఇన్' : lang === 'hi' ? 'अधिकारी साइन इन' : 'Officer Sign In'} onBack={() => setMode('select')} icon={<Briefcase className="w-5 h-5" />} color="teal">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {lang === 'te' ? 'మీ ఇమెయిల్ మరియు పాస్‌వర్డ్‌తో సైన్ ఇన్ చేయండి' :
           lang === 'hi' ? 'अपने ईमेल और पासवर्ड से साइन इन करें' :
           'Sign in with your email and password'}
        </p>
        <form onSubmit={handleOfficerSignIn} className="space-y-4">
          <Input
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={setEmail}
            required
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            show={showPassword}
            setShow={setShowPassword}
            placeholder={t('password')}
          />
          {error && <ErrorBox message={error} />}
          {info && <InfoBox message={info} />}
          <SubmitButton loading={loading} label={t('signIn')} />
          <button type="button" onClick={() => setMode('forgot')} className="w-full text-sm text-brand-600 dark:text-brand-400 hover:underline">
            {t('forgotPassword')}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {lang === 'te' ? 'ఖాతా లేదా? ' : lang === 'hi' ? 'खाता नहीं है? ' : "Don't have an account? "}
            <button type="button" onClick={() => setMode('officer-signup')} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {t('signUp')}
            </button>
          </p>
        </form>
      </AuthContainer>
    );
  }

  // Officer sign up (email + password + name)
  if (mode === 'officer-signup') {
    return (
      <AuthContainer title={lang === 'te' ? 'అధికారి సైన్ అప్' : lang === 'hi' ? 'अधिकारी साइन अप' : 'Officer Sign Up'} onBack={() => setMode('select')} icon={<Briefcase className="w-5 h-5" />} color="teal">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {lang === 'te' ? 'ఇమెయిల్ ధృవీకరణ అవసరం' :
           lang === 'hi' ? 'ईमेल सत्यापन आवश्यक' :
           'Email verification required'}
        </p>
        <form onSubmit={handleOfficerSignUp} className="space-y-4">
          <Input
            icon={<User className="w-4 h-4" />}
            type="text"
            placeholder={t('fullName')}
            value={officerName}
            onChange={setOfficerName}
            required
          />
          <Input
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={setEmail}
            required
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            show={showPassword}
            setShow={setShowPassword}
            placeholder={t('password')}
          />
          {error && <ErrorBox message={error} />}
          {info && <InfoBox message={info} />}
          <SubmitButton loading={loading} label={t('signUp')} />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {lang === 'te' ? 'ఇప్పటికే ఖాతా ఉందా? ' : lang === 'hi' ? 'पहले से खाता है? ' : 'Already have an account? '}
            <button type="button" onClick={() => setMode('officer-signin')} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {t('signIn')}
            </button>
          </p>
        </form>
      </AuthContainer>
    );
  }

  // Forgot password
  if (mode === 'forgot') {
    return (
      <AuthContainer title={t('forgotPassword')} onBack={() => setMode('officer-signin')} icon={<Mail className="w-5 h-5" />} color="teal">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {lang === 'te' ? 'మీ ఇమెయిల్ నమోదు చేయండి' :
           lang === 'hi' ? 'अपना ईमेल दर्ज करें' :
           'Enter your email to reset password'}
        </p>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <Input
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={setEmail}
            required
          />
          {error && <ErrorBox message={error} />}
          {info && <InfoBox message={info} />}
          <SubmitButton loading={loading} label={lang === 'te' ? 'లింక్ పంపు' : lang === 'hi' ? 'लिंक भेजें' : 'Send Link'} />
        </form>
      </AuthContainer>
    );
  }

  return null;
}

// Helper components
function AuthContainer({ title, onBack, children, icon, color }: { title: string; onBack: () => void; children: React.ReactNode; icon: React.ReactNode; color: 'green' | 'teal' }) {
  const { lang } = useI18n();
  const bgColor = color === 'green' ? 'bg-green-500' : 'bg-teal-500';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 rounded-2xl ${bgColor} flex items-center justify-center shadow-lg mb-4 text-white`}>
            {icon}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
          <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 flex items-center gap-1">
            ← {lang === 'te' ? 'వెనుకకు' : lang === 'hi' ? 'वापस' : 'Back'}
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}

function Input({ icon, type, placeholder, value, onChange, required }: { icon: React.ReactNode; type: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
      />
    </div>
  );
}

function PasswordInput({ value, onChange, show, setShow, placeholder }: { value: string; onChange: (v: string) => void; show: boolean; setShow: (v: boolean) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={6}
        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function InfoBox({ message }: { message: string }) {
  return (
    <div className="text-sm text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-lg px-3 py-2.5">
      {message}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

