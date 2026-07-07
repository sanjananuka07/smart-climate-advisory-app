import { useState, useEffect } from 'react';
import { Sprout, MapPin, Home, Layers, Ruler, Wheat, Calendar, Loader2, Droplets, FlaskConical, Clock, CheckCircle2, CloudSun, Thermometer, Wind, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useLocation } from '../context/LocationContext';
import { Card } from '../components/ui';
import { supabase } from '../lib/supabase';

interface WeatherData {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
}

interface CropRecommendation {
  crop: string;
  cropTe: string;
  confidence: number;
  sowingTime: string;
  sowingTimeTe: string;
  irrigation: string;
  irrigationTe: string;
  fertilizer: string;
  fertilizerTe: string;
  waterReq: string;
  waterReqTe: string;
  harvestTime: string;
  harvestTimeTe: string;
  climateAdvice?: string;
  climateAdviceTe?: string;
}

interface ClimateAlert {
  id: string;
  alert_type: string;
  risk_level: string;
  title: string;
}

const soilTypes = [
  { value: 'red', label: 'Red Soil', labelTe: 'ఎర్రుపు నేల' },
  { value: 'black', label: 'Black Soil', labelTe: 'నల్ల నేల' },
  { value: 'alluvial', label: 'Alluvial Soil', labelTe: 'గండి నేల' },
  { value: 'sandy', label: 'Sandy Soil', labelTe: 'ఇసుక నేల' },
  { value: 'loamy', label: 'Loamy Soil', labelTe: 'లోమీ నేల' },
];

export default function CropPage() {
  const { t, lang } = useI18n();
  const { location } = useLocation();
  const [district, setDistrict] = useState(location.nameEn);
  const [village, setVillage] = useState('');
  const [soil, setSoil] = useState('alluvial');
  const [farmSize, setFarmSize] = useState('');
  const [currentCrop, setCurrentCrop] = useState('');
  const [season, setSeason] = useState('kharif');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CropRecommendation[] | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<ClimateAlert[]>([]);

  // Get current season based on date
  useEffect(() => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 9) setSeason('kharif');
    else if (month >= 10 || month <= 1) setSeason('rabi');
    else setSeason('zaid');
  }, []);

  // Fetch weather data
  useEffect(() => {
    async function fetchWeather() {
      // Generate weather data based on timestamp for dynamic changes
      const now = Date.now();
      const seed = Math.sin(now / 60000) * 10000;
      const rand = (s: number) => Math.abs(Math.sin(s) * 10000) % 100;

      setWeather({
        temp: 28 + (rand(seed) - 50) * 0.3,
        humidity: 65 + (rand(seed * 2) - 50) * 0.4,
        rainfall: season === 'kharif' ? 50 + rand(seed * 3) : rand(seed * 3),
        windSpeed: 10 + rand(seed * 4) * 0.2,
        condition: season === 'kharif' ? 'rainy' : 'sunny',
      });
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000);
    return () => clearInterval(interval);
  }, [season]);

  // Fetch active alerts
  useEffect(() => {
    async function fetchAlerts() {
      const { data } = await supabase
        .from('climate_alerts')
        .select('id, alert_type, risk_level, title')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      setAlerts(data ?? []);
    }
    fetchAlerts();
  }, []);

  // Generate dynamic crop recommendations based on weather
  function generateRecommendations(): CropRecommendation[] {
    if (!weather) return [];

    const baseCrops: Record<string, CropRecommendation[]> = {
      kharif: [
        {
          crop: 'Paddy (Rice)',
          cropTe: 'వరి',
          confidence: Math.min(95, 85 + Math.round((weather.humidity - 50) * 0.3)),
          sowingTime: 'June - July (with monsoon onset)',
          sowingTimeTe: 'జూన్ - జులై (వర్షాకాలం ప్రారంభంతో)',
          irrigation: weather.rainfall > 40 ? 'Rely on monsoon rainfall; supplement only during dry spells' : 'Flood irrigation every 5-7 days essential',
          irrigationTe: weather.rainfall > 40 ? 'వర్షాకాలం నుండి నీరు; పొడి రోజుల్లో మాత్రమే నీరు' : 'ప్రతి 5-7 రోజులకు నీటి పారుదల అవసరం',
          fertilizer: 'NPK 80:40:40 kg/ha; apply in 3 splits. Add zinc sulphate 25 kg/ha.',
          fertilizerTe: 'NPK 80:40:40 కిలో/హెక్టార్; 3 దఫాలుగా ఇవ్వండి.',
          waterReq: '1200-1500 mm over the season',
          waterReqTe: 'సీజన్‌లో 1200-1500 మిమీ',
          harvestTime: 'October - November (110-120 days)',
          harvestTimeTe: 'అక్టోబర్ - నవంబర్ (110-120 రోజులు)',
          climateAdvice: weather.temp > 35 ? 'High temperature alert: Consider early morning irrigation to reduce heat stress.' : undefined,
          climateAdviceTe: weather.temp > 35 ? 'అధిక ఉష్ణోగ్రత హెచ్చరిక: వేడి ఒత్తిడి తగ్గించడానికి పొద్దున నీరు పెట్టండి.' : undefined,
        },
        {
          crop: 'Maize',
          cropTe: 'మొక్కజొన్న',
          confidence: Math.min(90, 80 + Math.round((weather.temp - 25) * 0.5)),
          sowingTime: 'June - July',
          sowingTimeTe: 'జూన్ - జులై',
          irrigation: weather.rainfall > 30 ? 'Monsoon sufficient; protect from waterlogging' : 'Drip irrigation every 8-10 days',
          irrigationTe: weather.rainfall > 30 ? 'వర్షాకాలం సరిపోతుంది; నీరు నిలవకుండా చూడండి' : 'ప్రతి 8-10 రోజులకు డ్రిప్ నీటి పారుదల',
          fertilizer: 'NPK 80:40:40 kg/ha; basal + 2 top dressings',
          fertilizerTe: 'NPK 80:40:40 కిలో/హెక్టార్; బేసల్ + 2 టాప్ డ్రెస్సింగ్‌లు',
          waterReq: '500-700 mm over the season',
          waterReqTe: 'సీజన్‌లో 500-700 మిమీ',
          harvestTime: 'September - October (90-100 days)',
          harvestTimeTe: 'సెప్టెంబర్ - అక్టోబర్ (90-100 రోజులు)',
          climateAdvice: weather.windSpeed > 25 ? 'Strong winds expected: Provide support for tall plants.' : undefined,
          climateAdviceTe: weather.windSpeed > 25 ? 'బలమైన గాలులు వస్తాయి: పొడవైన మొక్కలకు మద్దతు ఇవ్వండి.' : undefined,
        },
        {
          crop: 'Groundnut',
          cropTe: 'వేరుశనగ',
          confidence: Math.min(85, 70 + Math.round((40 - weather.rainfall) * 0.2)),
          sowingTime: 'June - July',
          sowingTimeTe: 'జూన్ - జులై',
          irrigation: 'Light irrigation every 10-12 days; avoid waterlogging',
          irrigationTe: 'ప్రతి 10-12 రోజులకు తేలికపాటి నీటి పారుదల',
          fertilizer: 'Gypsum 400 kg/ha at flowering; NPK 20:40:40 kg/ha basal',
          fertilizerTe: 'పుష్పించే సమయంలో జిప్సం 400 కిలో/హెక్టార్',
          waterReq: '400-500 mm over the season',
          waterReqTe: 'సీజన్‌లో 400-500 మిమీ',
          harvestTime: 'October (105-120 days)',
          harvestTimeTe: 'అక్టోబర్ (105-120 రోజులు)',
        },
      ],
      rabi: [
        {
          crop: 'Paddy (Rabi)',
          cropTe: 'వరి (రబీ)',
          confidence: 88,
          sowingTime: 'November - December',
          sowingTimeTe: 'నవంబర్ - డిసెంబర్',
          irrigation: 'Irrigation every 4-6 days; ensure canal/borewell supply',
          irrigationTe: 'ప్రతి 4-6 రోజులకు నీటి పారుదల',
          fertilizer: 'NPK 100:50:50 kg/ha in 3 splits',
          fertilizerTe: 'NPK 100:50:50 కిలో/హెక్టార్ 3 దఫాలుగా',
          waterReq: '1400-1600 mm over the season',
          waterReqTe: 'సీజన్‌లో 1400-1600 మిమీ',
          harvestTime: 'March - April (120-130 days)',
          harvestTimeTe: 'మార్చి - ఏప్రిల్ (120-130 రోజులు)',
        },
        {
          crop: 'Bengal Gram (Chickpea)',
          cropTe: 'శనగ',
          confidence: 82,
          sowingTime: 'November',
          sowingTimeTe: 'నవంబర్',
          irrigation: '1-2 irrigations: at flowering and pod-filling stage',
          irrigationTe: '1-2 నీటి పారుదలలు: పుష్పించే మరియు కాయ నిండే దశలో',
          fertilizer: 'Rhizobium seed treatment; NPK 20:50:25 kg/ha basal',
          fertilizerTe: 'రైజోబియం విత్తన శుద్ధి; NPK 20:50:25 కిలో/హెక్టార్ బేసల్',
          waterReq: '150-250 mm over the season',
          waterReqTe: 'సీజన్‌లో 150-250 మిమీ',
          harvestTime: 'February - March (100-110 days)',
          harvestTimeTe: 'ఫిబ్రవరి - మార్చి (100-110 రోజులు)',
        },
      ],
      zaid: [
        {
          crop: 'Green Gram (Moong)',
          cropTe: 'పెసర',
          confidence: 80,
          sowingTime: 'March - April',
          sowingTimeTe: 'మార్చి - ఏప్రిల్',
          irrigation: 'Irrigate every 7-10 days; requires assured water source',
          irrigationTe: 'ప్రతి 7-10 రోజులకు నీటి పారుదల; నిశ్చిత నీటి వనరు అవసరం',
          fertilizer: 'NPK 20:40:20 kg/ha basal; Rhizobium seed treatment',
          fertilizerTe: 'NPK 20:40:20 కిలో/హెక్టార్ బేసల్',
          waterReq: '300-400 mm over the season',
          waterReqTe: 'సీజన్‌లో 300-400 మిమీ',
          harvestTime: 'June - July (65-75 days)',
          harvestTimeTe: 'జూన్ - జులై (65-75 రోజులు)',
        },
        {
          crop: 'Cucumber',
          cropTe: 'దోస',
          confidence: 74,
          sowingTime: 'March - April',
          sowingTimeTe: 'మార్చి - ఏప్రిల్',
          irrigation: 'Drip irrigation daily or every alternate day',
          irrigationTe: 'ప్రతిరోజు లేదా రెండవ రోజు డ్రిప్ నీటి పారుదల',
          fertilizer: 'NPK 60:30:30 kg/ha; FYM 20 t/ha basal',
          fertilizerTe: 'NPK 60:30:30 కిలో/హెక్టార్; FYM 20 టన్/హెక్టార్ బేసల్',
          waterReq: '450-600 mm over the season',
          waterReqTe: 'సీజన్‌లో 450-600 మిమీ',
          harvestTime: 'May - June (60-70 days)',
          harvestTimeTe: 'మే - జూన్ (60-70 రోజులు)',
        },
      ],
    };

    return baseCrops[season] ?? [];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    await new Promise((r) => setTimeout(r, 1500));
    setResults(generateRecommendations());
    setLoading(false);
  }

  const fieldClass = "w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";
  const locationName = lang === 'te' ? location.nameTe : location.nameEn;

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('cropRecTitle')}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
          <MapPin className="w-4 h-4" />
          <span>{locationName}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{t(season)}</span>
        </div>
      </div>

      {/* Weather Summary */}
      {weather && (
        <Card className="p-4 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/30 dark:to-accent-900/30 border-0">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
            <CloudSun className="w-3.5 h-3.5" />
            {lang === 'te' ? 'ప్రస్తుత వాతావరణం' : 'Current Weather'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <Thermometer className="w-4 h-4 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.temp.toFixed(1)}°C</p>
              <p className="text-[10px] text-gray-500">{t('temperature')}</p>
            </div>
            <div className="text-center">
              <Droplets className="w-4 h-4 text-blue-500 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.humidity.toFixed(0)}%</p>
              <p className="text-[10px] text-gray-500">{t('humidity')}</p>
            </div>
            <div className="text-center">
              <CloudSun className="w-4 h-4 text-cyan-500 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.rainfall.toFixed(0)}mm</p>
              <p className="text-[10px] text-gray-500">{t('rainfall')}</p>
            </div>
            <div className="text-center">
              <Wind className="w-4 h-4 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{weather.windSpeed.toFixed(0)}km/h</p>
              <p className="text-[10px] text-gray-500">{t('windSpeed')}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Active Alerts Warning */}
      {alerts.length > 0 && (
        <Card className="p-3 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {lang === 'te'
                ? `${alerts.length} క్రియాశీల హెచ్చరికలు - పంట సలహాలను ప్రభావితం చేయవచ్చు`
                : `${alerts.length} active alerts - may affect crop recommendations`}
            </p>
          </div>
        </Card>
      )}

      {/* Form */}
      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field icon={<MapPin className="w-4 h-4 text-gray-400" />} label={t('district')}>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} className={fieldClass} placeholder={t('district')} />
            </Field>
            <Field icon={<Home className="w-4 h-4 text-gray-400" />} label={t('village')}>
              <input value={village} onChange={(e) => setVillage(e.target.value)} className={fieldClass} placeholder={t('village')} />
            </Field>
          </div>

          <Field icon={<Layers className="w-4 h-4 text-gray-400" />} label={t('soilType')}>
            <select value={soil} onChange={(e) => setSoil(e.target.value)} className={fieldClass}>
              {soilTypes.map((s) => (
                <option key={s.value} value={s.value}>{lang === 'te' ? s.labelTe : s.label}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field icon={<Ruler className="w-4 h-4 text-gray-400" />} label={t('farmSize')}>
              <input type="number" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} className={fieldClass} placeholder="2.5" />
            </Field>
            <Field icon={<Wheat className="w-4 h-4 text-gray-400" />} label={t('currentCrop')}>
              <input value={currentCrop} onChange={(e) => setCurrentCrop(e.target.value)} className={fieldClass} placeholder={t('currentCrop')} />
            </Field>
          </div>

          <Field icon={<Calendar className="w-4 h-4 text-gray-400" />} label={t('season')}>
            <select value={season} onChange={(e) => setSeason(e.target.value)} className={fieldClass}>
              <option value="kharif">{t('kharif')}</option>
              <option value="rabi">{t('rabi')}</option>
              <option value="zaid">{t('zaid')}</option>
            </select>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sprout className="w-4 h-4" />}
            {loading ? t('loading') : t('getRecommendations')}
          </button>
        </form>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('suitableCrops')}</p>
          {results.map((crop, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/30 flex items-center justify-center">
                    <Wheat className="w-5 h-5 text-brand-600 dark:text-brand-300" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{lang === 'te' ? crop.cropTe : crop.crop}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? crop.crop : crop.cropTe}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-bold">{crop.confidence}%</span>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${crop.confidence}%` }} />
              </div>

              {/* Climate-specific advice */}
              {crop.climateAdvice && (
                <div className="mb-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {lang === 'te' ? crop.climateAdviceTe : crop.climateAdvice}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <DetailRow icon={<Calendar className="w-4 h-4" />} label={t('bestSowingTime')} value={lang === 'te' ? crop.sowingTimeTe : crop.sowingTime} />
                <DetailRow icon={<Droplets className="w-4 h-4" />} label={t('irrigationSchedule')} value={lang === 'te' ? crop.irrigationTe : crop.irrigation} />
                <DetailRow icon={<FlaskConical className="w-4 h-4" />} label={t('fertilizerSuggestions')} value={lang === 'te' ? crop.fertilizerTe : crop.fertilizer} />
                <DetailRow icon={<Droplets className="w-4 h-4" />} label={t('waterRequirement')} value={lang === 'te' ? crop.waterReqTe : crop.waterReq} />
                <DetailRow icon={<Clock className="w-4 h-4" />} label={t('harvestTime')} value={lang === 'te' ? crop.harvestTimeTe : crop.harvestTime} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 z-10">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{value}</p>
      </div>
    </div>
  );
}
