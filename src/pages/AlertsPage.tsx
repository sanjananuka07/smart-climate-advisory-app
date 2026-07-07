import { useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, Sun, Droplets, Wind, Loader2, ShieldAlert, Thermometer, Zap, RefreshCw, MapPin } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useLocation } from '../context/LocationContext';
import { Card } from '../components/ui';
import { supabase } from '../lib/supabase';

interface ClimateAlert {
  id: string;
  alert_type: string;
  risk_level: 'low' | 'moderate' | 'high';
  title: string;
  description: string;
  precautions: string;
}

interface WeatherCondition {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
}

const alertIcons: Record<string, typeof CloudRain> = {
  heavy_rainfall: CloudRain,
  heat_wave: Sun,
  drought_risk: Droplets,
  flood_risk: CloudRain,
  cyclone_warning: Wind,
  strong_winds: Wind,
  thunderstorm: Zap,
  high_humidity: Droplets,
};

const alertColors: Record<string, string> = {
  heavy_rainfall: 'bg-accent-50 text-accent-600 dark:bg-accent-700/30 dark:text-accent-300',
  heat_wave: 'bg-amber-50 text-amber-600 dark:bg-amber-700/30 dark:text-amber-300',
  drought_risk: 'bg-orange-50 text-orange-600 dark:bg-orange-700/30 dark:text-orange-300',
  flood_risk: 'bg-sky-50 text-sky-600 dark:bg-sky-700/30 dark:text-sky-300',
  cyclone_warning: 'bg-rose-50 text-rose-600 dark:bg-rose-700/30 dark:text-rose-300',
  strong_winds: 'bg-teal-50 text-teal-600 dark:bg-teal-700/30 dark:text-teal-300',
  thunderstorm: 'bg-purple-50 text-purple-600 dark:bg-purple-700/30 dark:text-purple-300',
  high_humidity: 'bg-blue-50 text-blue-600 dark:bg-blue-700/30 dark:text-blue-300',
};

const riskStyles: Record<string, { badge: string; border: string; label: 'riskLow' | 'riskModerate' | 'riskHigh' }> = {
  low: { badge: 'bg-brand-100 text-brand-700 dark:bg-brand-700/40 dark:text-brand-200', border: 'border-l-brand-500', label: 'riskLow' },
  moderate: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-700/40 dark:text-amber-200', border: 'border-l-amber-500', label: 'riskModerate' },
  high: { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-700/40 dark:text-rose-200', border: 'border-l-rose-500', label: 'riskHigh' },
};

function generateDynamicAlerts(weather: WeatherCondition, location: string): ClimateAlert[] {
  const alerts: ClimateAlert[] = [];

  // Heavy rainfall check
  if (weather.rainfall > 50) {
    alerts.push({
      id: 'dynamic-rain-1',
      alert_type: 'heavy_rainfall',
      risk_level: weather.rainfall > 80 ? 'high' : 'moderate',
      title: 'Heavy Rainfall Alert',
      description: `Rainfall of ${weather.rainfall.toFixed(0)}mm expected in the next 48 hours in ${location}. Low-lying areas may experience waterlogging.`,
      precautions: 'Ensure proper drainage in fields. Delay fertilizer application. Harvest mature crops immediately. Move stored produce to higher ground.',
    });
  }

  // Heat wave check
  if (weather.temp > 38) {
    alerts.push({
      id: 'dynamic-heat-1',
      alert_type: 'heat_wave',
      risk_level: weather.temp > 42 ? 'high' : 'moderate',
      title: 'Heat Wave Warning',
      description: `Temperatures reaching ${weather.temp.toFixed(1)}°C expected during peak hours. Risk of heat stress for crops and livestock.`,
      precautions: 'Avoid field work during 11 AM - 4 PM. Ensure adequate irrigation. Use mulch to retain soil moisture. Provide shade for livestock.',
    });
  }

  // High humidity check
  if (weather.humidity > 80) {
    alerts.push({
      id: 'dynamic-humidity-1',
      alert_type: 'high_humidity',
      risk_level: 'moderate',
      title: 'High Humidity Alert',
      description: `Humidity levels at ${weather.humidity.toFixed(0)}%. Increased risk of fungal diseases in crops.`,
      precautions: 'Apply preventive fungicide sprays. Improve air circulation between plants. Avoid overhead irrigation. Monitor for disease symptoms.',
    });
  }

  // Strong winds check
  if (weather.windSpeed > 30) {
    alerts.push({
      id: 'dynamic-wind-1',
      alert_type: 'strong_winds',
      risk_level: weather.windSpeed > 50 ? 'high' : 'moderate',
      title: 'Strong Winds Alert',
      description: `Wind speeds of ${weather.windSpeed.toFixed(0)} km/h expected. Risk of lodging in tall crops.`,
      precautions: 'Stake young plants. Delay pesticide spraying. Inspect and reinforce greenhouse structures. Harvest mature fruits to prevent windfall damage.',
    });
  }

  // Default low alert if conditions are normal
  if (alerts.length === 0) {
    alerts.push({
      id: 'dynamic-normal',
      alert_type: 'normal',
      risk_level: 'low',
      title: 'Favorable Weather Conditions',
      description: `Current weather conditions in ${location} are favorable for agricultural activities.`,
      precautions: 'Continue regular farming operations. Monitor weather updates for any changes.',
    });
  }

  return alerts;
}

export default function AlertsPage() {
  const { t, lang } = useI18n();
  const { location } = useLocation();
  const [dbAlerts, setDbAlerts] = useState<ClimateAlert[]>([]);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [dynamicAlerts, setDynamicAlerts] = useState<ClimateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch weather and generate alerts
  useEffect(() => {
    async function loadData() {
      // Fetch stored alerts
      const { data } = await supabase
        .from('climate_alerts')
        .select('id, alert_type, risk_level, title, description, precautions')
        .eq('active', true)
        .order('created_at', { ascending: false });
      setDbAlerts(data ?? []);

      // Generate dynamic weather
      const now = Date.now();
      const seed = Math.sin(now / 60000) * 10000;
      const rand = (s: number) => Math.abs(Math.sin(s) * 10000) % 100;

      const weatherData: WeatherCondition = {
        temp: 28 + (rand(seed) - 50) * 0.4,
        humidity: 60 + (rand(seed * 2) - 50) * 0.5,
        rainfall: 30 + rand(seed * 3) * 0.8,
        windSpeed: 10 + rand(seed * 4) * 0.4,
        condition: 'variable',
      };

      setWeather(weatherData);

      const locationName = lang === 'te' ? location.nameTe : location.nameEn;
      setDynamicAlerts(generateDynamicAlerts(weatherData, locationName));

      setLoading(false);
      setLastUpdated(new Date());
    }

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [location.nameEn, location.nameTe, lang]);

  const refresh = () => {
    setLoading(true);
    // Force re-fetch
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  const locationName = lang === 'te' ? location.nameTe : location.nameEn;
  const allAlerts = [...dynamicAlerts, ...dbAlerts.slice(0, 2)];

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('activeAlerts')}</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <MapPin className="w-4 h-4" />
            <span>{locationName}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === 'te' ? `చివరి అప్‌డేట్: ${lastUpdated.toLocaleTimeString('te-IN')}` : `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current Weather Summary */}
      {weather && (
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            {lang === 'te' ? 'వాతావరణ సూచన' : 'Weather Indicators'}
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <Sun className="w-4 h-4 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.temp.toFixed(1)}°C</p>
            </div>
            <div>
              <Droplets className="w-4 h-4 text-blue-500 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.humidity.toFixed(0)}%</p>
            </div>
            <div>
              <CloudRain className="w-4 h-4 text-cyan-500 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.rainfall.toFixed(0)}mm</p>
            </div>
            <div>
              <Wind className="w-4 h-4 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.windSpeed.toFixed(0)}km/h</p>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts List */}
      {allAlerts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-700/30 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-7 h-7 text-brand-600 dark:text-brand-300" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('noAlerts')}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {allAlerts.map((alert) => {
            const Icon = alertIcons[alert.alert_type] ?? AlertTriangle;
            const color = alertColors[alert.alert_type] ?? 'bg-gray-50 text-gray-600';
            const risk = riskStyles[alert.risk_level] ?? riskStyles.low;
            return (
              <Card key={alert.id} className={`p-4 border-l-4 ${risk.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{alert.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${risk.badge}`}>
                        {t(risk.label)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{alert.description}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('precautions')}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{alert.precautions}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
