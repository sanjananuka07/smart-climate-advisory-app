import {
  CloudSun, Droplets, Wind, Sun, CloudRain, Thermometer,
  Sprout, Bell, MessageSquare, Stethoscope, FileText, AlertTriangle,
  MapPin, ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../context/I18nContext';
import { useLocation, type Location } from '../context/LocationContext';
import { Card, StatCard } from '../components/ui';
import { WeatherIcon } from '../components/WeatherIcon';
import type { NavPage } from '../components/AppLayout';

const sunriseTimes: Record<string, string> = {
  'srikakulam': '05:42', 'vizianagaram': '05:44', 'visakhapatnam': '05:46',
  'east-godavari': '05:48', 'west-godavari': '05:50', 'krishna': '05:52',
  'guntur': '05:54', 'prakasam': '05:56', 'nellore': '05:58',
  'chittoor': '06:02', 'anantapur': '06:05', 'kurnool': '06:00', 'kadapa': '06:03',
};

const sunsetTimes: Record<string, string> = {
  'srikakulam': '18:28', 'vizianagaram': '18:30', 'visakhapatnam': '18:26',
  'east-godavari': '18:24', 'west-godavari': '18:22', 'krishna': '18:20',
  'guntur': '18:18', 'prakasam': '18:16', 'nellore': '18:14',
  'chittoor': '18:22', 'anantapur': '18:30', 'kurnool': '18:25', 'kadapa': '18:20',
};

const weatherConditions = [
  { condition: 'Sunny', conditionTe: 'ఎండగా ఉంది', icon: 'sunny' },
  { condition: 'Partly Cloudy', conditionTe: 'ఆకాశం పాక్షికంగా మేఘావృతం', icon: 'partly-cloudy' },
  { condition: 'Cloudy', conditionTe: 'మేఘావృతం', icon: 'cloudy' },
  { condition: 'Light Rain', conditionTe: 'తేలికపాటి వర్షం', icon: 'rain' },
  { condition: 'Heavy Rain', conditionTe: 'భారీ వర్షం', icon: 'rain' },
];

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  uvIndex: number;
  condition: string;
  conditionEn: string;
  icon: string;
  sunrise: string;
  sunset: string;
}

function generateWeatherForLocation(location: Location): WeatherData {
  const now = new Date();
  const hour = now.getHours();
  const isNight = hour < 6 || hour > 19;
  const isMonsoon = now.getMonth() >= 5 && now.getMonth() <= 9;

  const baseTempByZone = {
    coastal: { avg: 30, variance: 6 },
    interior: { avg: 32, variance: 8 },
    rayalaseema: { avg: 34, variance: 10 },
    telangana: { avg: 33, variance: 8 },
  };

  const zone = baseTempByZone[location.climateZone];
  const random = Math.random;

  let temp = Math.round(zone.avg + (random() - 0.5) * zone.variance);
  let humidity = location.climateZone === 'coastal'
    ? Math.round(70 + random() * 25)
    : Math.round(45 + random() * 30);
  let rainfall = location.climateZone === 'coastal'
    ? Math.round(5 + random() * 20)
    : Math.round(2 + random() * 15);

  if (isMonsoon) {
    temp = temp - 4;
    humidity = Math.min(95, humidity + 15);
    rainfall = rainfall + Math.round(random() * 20);
  } else if (now.getMonth() >= 2 && now.getMonth() <= 5) {
    temp = temp + 4;
    humidity = humidity - 15;
    rainfall = Math.max(0, rainfall - 5);
  }

  if (isNight) {
    temp = temp - 5;
  }

  let conditionIndex = location.climateZone === 'coastal'
    ? (isMonsoon ? 3 + Math.floor(random() * 2) : Math.floor(random() * 3))
    : (isMonsoon ? 2 + Math.floor(random() * 2) : Math.floor(random() * 2));

  if (isNight && conditionIndex === 0) conditionIndex = 1;

  const condition = weatherConditions[conditionIndex % weatherConditions.length];

  return {
    temp,
    feelsLike: temp + Math.round(random() * 5),
    humidity,
    rainfall,
    windSpeed: Math.round(8 + random() * 20),
    uvIndex: isNight ? 0 : Math.round(3 + random() * 7),
    condition: condition.conditionTe,
    conditionEn: condition.condition,
    icon: condition.icon,
    sunrise: sunriseTimes[location.id] || '05:48',
    sunset: sunsetTimes[location.id] || '18:32',
  };
}

export default function HomePage({ onNavigate }: { onNavigate: (p: NavPage) => void }) {
  const { t, lang } = useI18n();
  const { location, setLocation, locations } = useLocation();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<WeatherData>(() =>
    generateWeatherForLocation(location)
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentWeather(generateWeatherForLocation(location));
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickCards: { page: NavPage; icon: LucideIcon; labelKey: 'weatherForecast' | 'cropRecommendation' | 'irrigationAdvice' | 'climateAlerts' | 'aiAssistant' | 'agricultureOfficer' | 'cropDisease' | 'climateReports'; color: string }[] = [
    { page: 'weather', icon: CloudSun, labelKey: 'weatherForecast', color: 'bg-accent-50 text-accent-600 dark:bg-accent-700/30 dark:text-accent-300' },
    { page: 'crops', icon: Sprout, labelKey: 'cropRecommendation', color: 'bg-brand-50 text-brand-600 dark:bg-brand-700/30 dark:text-brand-300' },
    { page: 'weather', icon: CloudRain, labelKey: 'irrigationAdvice', color: 'bg-sky-50 text-sky-600 dark:bg-sky-700/30 dark:text-sky-300' },
    { page: 'alerts', icon: Bell, labelKey: 'climateAlerts', color: 'bg-amber-50 text-amber-600 dark:bg-amber-700/30 dark:text-amber-300' },
    { page: 'assistant', icon: MessageSquare, labelKey: 'aiAssistant', color: 'bg-purple-50 text-purple-600 dark:bg-purple-700/30 dark:text-purple-300' },
    { page: 'officer', icon: Stethoscope, labelKey: 'agricultureOfficer', color: 'bg-teal-50 text-teal-600 dark:bg-teal-700/30 dark:text-teal-300' },
    { page: 'disease', icon: Stethoscope, labelKey: 'cropDisease', color: 'bg-rose-50 text-rose-600 dark:bg-rose-700/30 dark:text-rose-300' },
    { page: 'climate', icon: FileText, labelKey: 'climateReports', color: 'bg-teal-50 text-teal-600 dark:bg-teal-700/30 dark:text-teal-300' },
  ];

  const riskLevel = 'moderate';
  const riskColor = {
    low: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-700/20 dark:text-brand-300 dark:border-brand-800',
    moderate: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-700/20 dark:text-amber-300 dark:border-amber-800',
    high: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-700/20 dark:text-rose-300 dark:border-rose-800',
  };
  const riskKey = { low: 'riskLow', moderate: 'riskModerate', high: 'riskHigh' } as const;

  const locationName = lang === 'te' ? location.nameTe : location.nameEn;

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('home')}</h1>
          <div className="relative mt-1" ref={dropdownRef}>
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{locationName}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLocationDropdown && (
              <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
                    {lang === 'te' ? 'ఆంధ్రప్రదేశ్ జిల్లాలు' : 'Andhra Pradesh Districts'}
                  </p>
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        loc.id === location.id
                          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <span className="font-medium">{lang === 'te' ? loc.nameTe : loc.nameEn}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        {loc.climateZone === 'coastal' ? (lang === 'te' ? 'తీర ప్రాంతం' : 'Coastal') :
                         loc.climateZone === 'rayalaseema' ? (lang === 'te' ? 'రాయలసీమ' : 'Rayalaseema') :
                         (lang === 'te' ? 'అంతర్భాగం' : 'Interior')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current weather hero */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-accent-500 to-accent-700 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-accent-100">{t('currentWeather')}</p>
              <p className="text-4xl font-bold mt-1">{currentWeather.temp}°C</p>
              <p className="text-sm text-accent-100 mt-1">
                {lang === 'te' ? currentWeather.condition : currentWeather.conditionEn} · {t('feelsLike')} {currentWeather.feelsLike}°C
              </p>
            </div>
            <WeatherIcon type={currentWeather.icon} className="w-14 h-14 text-white/90" />
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <span>🌅 {t('sunrise')} {currentWeather.sunrise}</span>
            <span>🌇 {t('sunset')} {currentWeather.sunset}</span>
          </div>
        </div>
      </Card>

      {/* Weather stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Thermometer className="w-5 h-5" />} label={t('temperature')} value={`${currentWeather.temp}`} unit="°C" accent="amber" />
        <StatCard icon={<Droplets className="w-5 h-5" />} label={t('humidity')} value={currentWeather.humidity} unit="%" accent="accent" />
        <StatCard icon={<CloudRain className="w-5 h-5" />} label={t('rainfall')} value={currentWeather.rainfall} unit="mm" accent="accent" />
        <StatCard icon={<Wind className="w-5 h-5" />} label={t('windSpeed')} value={currentWeather.windSpeed} unit="km/h" accent="brand" />
        <StatCard icon={<Sun className="w-5 h-5" />} label={t('uvIndex')} value={currentWeather.uvIndex} accent="amber" />
        <StatCard icon={<Droplets className="w-5 h-5" />} label={t('feelsLike')} value={currentWeather.feelsLike} unit="°C" accent="rose" />
      </div>

      {/* Climate risk indicator */}
      <Card className={`p-4 border-2 ${riskColor[riskLevel]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-80">{t('climateRisk')}</p>
            <p className="text-lg font-bold mt-0.5">{t(riskKey[riskLevel])}</p>
          </div>
          <AlertTriangle className="w-8 h-8 opacity-80" />
        </div>
      </Card>

      {/* Today's summary */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('todaysSummary')}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'te'
            ? 'నేడు పాక్షికంగా మేఘావృతం, మధ్యాహ్నం వర్షం సంభావ్యత ఉంది. ఉష్ణోగ్రత 31°C చుట్టలో ఉంటుంది. నీటి పారుదల షెడ్యూల్ సర్దుబాటు చేయండి.'
            : 'Partly cloudy today with a chance of afternoon showers. Temperature around 31°C. Adjust irrigation schedule accordingly.'}
        </p>
      </Card>

      {/* Quick access */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('quickAccess')}</p>
        <div className="grid grid-cols-2 gap-3">
          {quickCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <button
                key={i}
                onClick={() => onNavigate(card.page)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col items-start gap-3 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-left"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
                  {t(card.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
