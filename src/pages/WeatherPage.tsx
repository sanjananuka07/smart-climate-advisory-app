import { useState, useEffect, useRef } from 'react';
import { Droplets, Wind, Sun, Sunrise, Sunset, Thermometer, RefreshCw, MapPin, ChevronDown } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useLocation, type Location } from '../context/LocationContext';
import { Card, StatCard } from '../components/ui';
import { WeatherIcon } from '../components/WeatherIcon';
import { type CurrentWeather, type HourlyForecast, type DailyForecast, dailyForecast as baseDailyForecast } from '../data/weather';

const weatherConditions = [
  { condition: 'Sunny', conditionTe: 'ఎండగా ఉంది', icon: 'sunny' },
  { condition: 'Partly Cloudy', conditionTe: 'ఆకాశం పాక్షికంగా మేఘావృతం', icon: 'partly-cloudy' },
  { condition: 'Cloudy', conditionTe: 'మేఘావృతం', icon: 'cloudy' },
  { condition: 'Light Rain', conditionTe: 'తేలికపాటి వర్షం', icon: 'rain' },
  { condition: 'Heavy Rain', conditionTe: 'భారీ వర్షం', icon: 'rain' },
];

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

function generateWeatherForLocation(location: Location, seed: number): CurrentWeather {
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
  const seededRandom = (n: number) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  let temp = Math.round(zone.avg + (seededRandom(1) - 0.5) * zone.variance);
  let humidity = location.climateZone === 'coastal'
    ? Math.round(70 + seededRandom(2) * 25)
    : Math.round(45 + seededRandom(2) * 30);
  let rainfall = location.climateZone === 'coastal'
    ? Math.round(5 + seededRandom(3) * 20)
    : Math.round(2 + seededRandom(3) * 15);

  if (isMonsoon) {
    temp = temp - 4;
    humidity = Math.min(95, humidity + 15);
    rainfall = rainfall + Math.round(seededRandom(4) * 20);
  } else if (now.getMonth() >= 2 && now.getMonth() <= 5) {
    temp = temp + 4;
    humidity = humidity - 15;
    rainfall = Math.max(0, rainfall - 5);
  }

  if (isNight) {
    temp = temp - 5;
  }

  let conditionIndex = location.climateZone === 'coastal'
    ? (isMonsoon ? 3 + Math.floor(seededRandom(5) * 2) : Math.floor(seededRandom(5) * 3))
    : (isMonsoon ? 2 + Math.floor(seededRandom(5) * 2) : Math.floor(seededRandom(5) * 2));

  if (isNight && conditionIndex === 0) conditionIndex = 1;

  const condition = weatherConditions[conditionIndex % weatherConditions.length];

  return {
    temp,
    feelsLike: temp + Math.round(seededRandom(6) * 5),
    humidity,
    rainfall,
    windSpeed: Math.round(8 + seededRandom(7) * 20),
    uvIndex: isNight ? 0 : Math.round(3 + seededRandom(8) * 7),
    condition: condition.conditionTe,
    conditionEn: condition.condition,
    icon: condition.icon,
    sunrise: sunriseTimes[location.id] || '05:48',
    sunset: sunsetTimes[location.id] || '18:32',
  };
}

function generateHourlyForecast(location: Location, seed: number): HourlyForecast[] {
  const hours = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00'];
  const baseTemp = generateWeatherForLocation(location, seed).temp;

  return hours.map((time, i) => {
    const seededRandom = (n: number) => {
      const x = Math.sin(seed + i + n) * 10000;
      return x - Math.floor(x);
    };

    const tempOffset = i < 4 ? (i * 2) - 2 : (7 - i) * 1.5;
    const isMonsoon = new Date().getMonth() >= 5 && new Date().getMonth() <= 9;

    const icons = ['sunny', 'partly-cloudy', 'cloudy', 'rain', 'partly-cloudy', 'cloudy', 'cloudy', 'partly-cloudy'];

    return {
      time,
      temp: baseTemp + Math.round(tempOffset + (seededRandom(1) - 0.5) * 4),
      rainProb: Math.max(0, Math.min(100, Math.round(
        location.climateZone === 'coastal'
          ? (isMonsoon ? 60 + seededRandom(2) * 35 : 20 + seededRandom(2) * 40)
          : (isMonsoon ? 40 + seededRandom(2) * 35 : 10 + seededRandom(2) * 25)
      ))),
      icon: icons[i],
    };
  });
}

export default function WeatherPage() {
  const { t, lang } = useI18n();
  const { location, setLocation, locations } = useLocation();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>(() =>
    generateWeatherForLocation(location, Date.now())
  );
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>(() =>
    generateHourlyForecast(location, Date.now())
  );
  const [dailyForecast] = useState<DailyForecast[]>(baseDailyForecast);
  const seedRef = useRef(Date.now());

  useEffect(() => {
    seedRef.current = Date.now();
    setCurrentWeather(generateWeatherForLocation(location, seedRef.current));
    setHourlyForecast(generateHourlyForecast(location, seedRef.current));
    setLastUpdated(new Date());
  }, [location]);

  useEffect(() => {
    const updateWeather = () => {
      seedRef.current = Date.now();
      setCurrentWeather(generateWeatherForLocation(location, seedRef.current));
      setHourlyForecast(generateHourlyForecast(location, seedRef.current));
      setLastUpdated(new Date());
    };

    const interval = setInterval(updateWeather, 60000);
    return () => clearInterval(interval);
  }, [location]);

  const refreshWeather = () => {
    seedRef.current = Date.now();
    setCurrentWeather(generateWeatherForLocation(location, seedRef.current));
    setHourlyForecast(generateHourlyForecast(location, seedRef.current));
    setLastUpdated(new Date());
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('weather')}</h1>
          <div className="relative mt-1">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{lang === 'te' ? location.nameTe : location.nameEn}</span>
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === 'te' ? `చివరి అప్‌డేట్: ${lastUpdated.toLocaleTimeString('te-IN')}` : `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={refreshWeather}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={lang === 'te' ? 'రిఫ్రెష్' : 'Refresh'}
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Current weather hero */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-accent-500 to-accent-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-100">{t('currentWeather')}</p>
              <p className="text-5xl font-bold mt-2">{currentWeather.temp}°C</p>
              <p className="text-sm text-accent-100 mt-1">
                {lang === 'te' ? currentWeather.condition : currentWeather.conditionEn}
              </p>
              <p className="text-xs text-accent-100 mt-1">{t('feelsLike')} {currentWeather.feelsLike}°C</p>
            </div>
            <WeatherIcon type={currentWeather.icon} className="w-20 h-20 text-white/90" />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Droplets className="w-5 h-5" />} label={t('humidity')} value={currentWeather.humidity} unit="%" accent="accent" />
        <StatCard icon={<Wind className="w-5 h-5" />} label={t('windSpeed')} value={currentWeather.windSpeed} unit="km/h" accent="brand" />
        <StatCard icon={<Sun className="w-5 h-5" />} label={t('uvIndex')} value={currentWeather.uvIndex} accent="amber" />
        <StatCard icon={<Thermometer className="w-5 h-5" />} label={t('rainfall')} value={currentWeather.rainfall} unit="mm" accent="accent" />
      </div>

      {/* Sunrise / Sunset */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-700/30 flex items-center justify-center">
            <Sunrise className="w-5 h-5 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('sunrise')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentWeather.sunrise}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-700/30 flex items-center justify-center">
            <Sunset className="w-5 h-5 text-orange-600 dark:text-orange-300" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('sunset')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentWeather.sunset}</p>
          </div>
        </Card>
      </div>

      {/* Hourly forecast */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('hourlyForecast')}</p>
        <Card className="p-4">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {hourlyForecast.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-[60px]">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{h.time}</span>
                <WeatherIcon type={h.icon} className="w-7 h-7 text-accent-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{h.temp}°</span>
                <span className="text-[10px] text-accent-600 dark:text-accent-400 flex items-center gap-0.5">
                  <Droplets className="w-3 h-3" />
                  {h.rainProb}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 7-day forecast */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('sevenDayForecast')}</p>
        <Card className="divide-y divide-gray-100 dark:divide-gray-700">
          {dailyForecast.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-10">
                {lang === 'te' ? d.day : d.dayEn}
              </span>
              <WeatherIcon type={d.icon} className="w-6 h-6 text-accent-500" />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-accent-600 dark:text-accent-400 flex items-center gap-0.5">
                  <Droplets className="w-3 h-3" />
                  {d.rainProb}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">{d.low}°</span>
                <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-accent-300 to-amber-400" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{d.high}°</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
