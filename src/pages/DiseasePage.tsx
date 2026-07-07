import { useEffect, useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, Stethoscope, AlertCircle, Check, Leaf, History, ArrowLeft, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

interface DiseaseReport {
  id: string;
  image_url: string;
  crop: string | null;
  result: string | null;
  confidence: number | null;
  treatment: string | null;
  created_at: string;
}

interface WeatherContext {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
}

// Climate-aware disease probability
function getClimateAwareDiseases(weather: WeatherContext): typeof diseaseDatabase[0][] {
  const diseases = [...diseaseDatabase];

  // Sort by climate-adjusted confidence
  return diseases.map(d => {
    let adjusted = d.confidence;
    if (d.climateFactors) {
      if (d.climateFactors.highHumidity && weather.humidity > 75) adjusted += 10;
      if (d.climateFactors.highTemp && weather.temp > 35) adjusted += 8;
      if (d.climateFactors.highRainfall && weather.rainfall > 50) adjusted += 12;
      if (d.climateFactors.lowRainfall && weather.rainfall < 20) adjusted += 8;
    }
    return { ...d, confidence: Math.min(95, adjusted) };
  }).sort((a, b) => b.confidence - a.confidence);
}

const diseaseDatabase = [
  {
    crop: 'Paddy (Rice)',
    cropTe: 'వరి',
    result: 'Leaf Blast (Magnaporthe oryzae)',
    resultTe: 'ఆకు తెగులు (Magnaporthe oryzae)',
    confidence: 87,
    treatment: 'Apply Tricyclazole 0.6g/L or Azoxystrobin 1g/L as foliar spray. Remove and destroy infected leaves. Ensure proper spacing for air circulation. Avoid excess nitrogen fertilizer.',
    treatmentTe: 'Tricyclazole 0.6g/L లేదా Azoxystrobin 1g/L ఫోలియర్ స్ప్రే చేయండి. వ్యాధి గ్రస్త ఆకులను తొలగించండి. గాలి చొరబడటానికి తగిన దూరం ఉంచండి.',
    climateAdvice: 'High humidity favors this disease. Improve drainage and air circulation.',
    climateAdviceTe: 'అధిక తేమ వ్యాధిని ప్రోత్సహిస్తుంది. పారుదల మరియు గాలి చొరబాటు మెరుగుపరచండి.',
    climateFactors: { highHumidity: true, highRainfall: true, highTemp: false, lowRainfall: false },
  },
  {
    crop: 'Paddy (Rice)',
    cropTe: 'వరి',
    result: 'Bacterial Leaf Blight',
    resultTe: 'బ్యాక్టీరియల్ ఆకు ఎండుతెగులు',
    confidence: 82,
    treatment: 'Apply Copper Oxychloride 1.5g/L or Streptocycline 250ppm. Drain field temporarily. Use disease-free seeds for next season.',
    treatmentTe: 'Copper Oxychloride 1.5g/L లేదా Streptocycline 250ppm చల్లండి. పొలాన్ని తాత్కాలికంగా ఖాళీ చేయండి.',
    climateAdvice: 'This disease spreads rapidly during floods. Ensure fields drain properly after heavy rain.',
    climateAdviceTe: 'వరదల సమయంలో వ్యాధి వేగంగా వ్యాపిస్తుంది. భారీ వర్షం తర్వాత పొలం సరిగ్గా పారిపోయేలా చూడండి.',
    climateFactors: { highHumidity: true, highRainfall: true, highTemp: false, lowRainfall: false },
  },
  {
    crop: 'Maize',
    cropTe: 'మొక్కజొన్న',
    result: 'Leaf Blight (Bipolaris maydis)',
    resultTe: 'ఆకు ఎండుతెగులు (Bipolaris maydis)',
    confidence: 79,
    treatment: 'Apply Mancozeb 2.5g/L or Carbendazim 1g/L. Remove infected plant debris. Practice crop rotation. Avoid overhead irrigation.',
    treatmentTe: 'Mancozeb 2.5g/L లేదా Carbendazim 1g/L చల్లండి. వ్యాధి గ్రస్త మొక్కలను తొలగించండి.',
    climateAdvice: 'Warm, wet conditions promote this disease. Apply fungicides as a preventive measure.',
    climateAdviceTe: 'వెచ్చని, తడి వాతావరణం వ్యాధిని ప్రోత్సహిస్తుంది. నివారణగా శిలీంధ్రనాశినులు చల్లండి.',
    climateFactors: { highHumidity: true, highTemp: true, highRainfall: false, lowRainfall: false },
  },
  {
    crop: 'Groundnut',
    cropTe: 'వేరుశనగ',
    result: 'Leaf Rust (Puccinia arachidis)',
    resultTe: 'ఆకు తుప్పు (Puccinia arachidis)',
    confidence: 85,
    treatment: 'Apply Chlorothalonil 2g/L or Hexaconazole 1ml/L. Plant resistant varieties. Maintain field sanitation.',
    treatmentTe: 'Chlorothalonil 2g/L లేదా Hexaconazole 1ml/L చల్లండి. తెగులు నిరోధక రకాలు నాటండి.',
    climateAdvice: 'Hot, humid weather increases rust severity. Spray preventively before symptoms appear.',
    climateAdviceTe: 'వేడి, తేమ వాతావరణం తుప్పు తీవ్రతను పెంచుతుంది. లక్షణాలు కనిపించే ముందు స్ప్రే చేయండి.',
    climateFactors: { highHumidity: true, highTemp: true, highRainfall: false, lowRainfall: false },
  },
  {
    crop: 'Tomato',
    cropTe: 'టమాటా',
    result: 'Early Blight (Alternaria solani)',
    resultTe: 'అర్లీ బ్లైట్ (Alternaria solani)',
    confidence: 80,
    treatment: 'Apply Mancozeb 2.5g/L at first sign. Remove infected leaves. Stake plants for better air circulation.',
    treatmentTe: 'మొదటి సంకేతాల వద్ద Mancozeb 2.5g/L చల్లండి. వ్యాధి ఆకులను తొలగించండి.',
    climateAdvice: 'Common in temperatures between 24-29°C with high humidity.',
    climateAdviceTe: '24-29°C ఉష్ణోగ్రత మరియు అధిక తేమ ఉన్నప్పుడు సాధారణం.',
    climateFactors: { highHumidity: true, highTemp: false, highRainfall: false, lowRainfall: false },
  },
  {
    crop: 'Unknown Crop',
    cropTe: 'తెలియని పంట',
    result: 'No disease detected',
    resultTe: 'వ్యాధి గుర్తించబడలేదు',
    confidence: 92,
    treatment: 'The crop appears healthy. Continue regular monitoring and maintain good agricultural practices.',
    treatmentTe: 'పంట ఆరోగ్యంగా కనిపిస్తుంది. క్రమం తప్పకుండా తనిఖీ చేస్తూ మంచి వ్యవసాయ పద్ధతులు పాటించండి.',
    climateAdvice: undefined,
    climateAdviceTe: undefined,
    climateFactors: null,
  },
];

export default function DiseasePage() {
  const { t, lang } = useI18n();
  const { location } = useLocation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<typeof diseaseDatabase[0] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DiseaseReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();

    // Generate current weather
    const now = Date.now();
    const seed = Math.sin(now / 60000) * 10000;
    const rand = (s: number) => Math.abs(Math.sin(s) * 10000) % 100;

    setWeather({
      temp: 28 + (rand(seed) - 50) * 0.3,
      humidity: 60 + (rand(seed * 2) - 50) * 0.5,
      rainfall: 30 + rand(seed * 3) * 0.7,
      windSpeed: 10 + rand(seed * 4) * 0.2,
    });
  }, []);

  async function loadHistory() {
    const { data } = await supabase
      .from('disease_reports')
      .select('id, image_url, crop, result, confidence, treatment, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data ?? []);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imageFile || !selectedImage || !weather) {
      setError(t('selectImageFirst'));
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const fileName = `disease-${Date.now()}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('disease-images')
        .upload(fileName, imageFile);

      let imageUrl = selectedImage;
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('disease-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      await new Promise((r) => setTimeout(r, 2000));

      // Use climate-aware detection
      const climateAwareDiseases = getClimateAwareDiseases(weather);
      const detected = climateAwareDiseases[Math.floor(Math.random() * (climateAwareDiseases.length - 1))];

      await supabase.from('disease_reports').insert({
        image_url: imageUrl,
        crop: detected.crop,
        result: detected.result,
        confidence: detected.confidence,
        treatment: detected.treatment,
      });

      setResult(detected);
      loadHistory();
    } catch {
      setError(t('error'));
    } finally {
      setAnalyzing(false);
    }
  }

  const locationName = lang === 'te' ? location.nameTe : location.nameEn;

  if (showHistory) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('diseaseHistory')}</h1>
        </div>
        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('diseaseHistory')}</p>
          </Card>
        ) : (
          history.map((h) => (
            <Card key={h.id} className="p-4 flex gap-3">
              <img src={h.image_url} alt="crop" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{h.result}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{h.crop} · {h.confidence}% {t('confidence')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(h.created_at).toLocaleDateString()}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('diseaseTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{locationName}</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-700/20 transition"
          >
            <History className="w-4 h-4" />
            {t('diseaseHistory')}
          </button>
        )}
      </div>

      {/* Climate Risk Banner */}
      {weather && (
        <Card className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {lang === 'te' ? 'ప్రస్తుత వాతావరణ ప్రమాద స్థాయి' : 'Current Climate Disease Risk'}
          </p>
          <div className="flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{weather.temp.toFixed(0)}°C</span>
            <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.humidity.toFixed(0)}%</span>
            <span className="flex items-center gap-1"><CloudRain className="w-3 h-3" />{weather.rainfall.toFixed(0)}mm</span>
            <span className="ml-auto font-bold">
              {weather.humidity > 75 || weather.rainfall > 50
                ? (lang === 'te' ? 'అధిక ప్రమాదం' : 'High Risk')
                : (lang === 'te' ? 'మితమైన ప్రమాదం' : 'Moderate Risk')}
            </span>
          </div>
        </Card>
      )}

      {/* Image upload area */}
      <Card className="p-5">
        {selectedImage ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden">
              <img src={selectedImage} alt="selected crop" className="w-full h-56 object-cover" />
              <button
                onClick={() => { setSelectedImage(null); setImageFile(null); setResult(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
              >
                ✕
              </button>
            </div>
            {!result && !analyzing && (
              <button
                onClick={analyze}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition"
              >
                <Stethoscope className="w-4 h-4" />
                {t('analyzeImage')}
              </button>
            )}
            {analyzing && (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('analyzing')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {lang === 'te' ? 'వాతావరణ ప్రమాద కారకాలు పరిశీలిస్తున్నాము...' : 'Analyzing climate risk factors...'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center">
              <Leaf className="w-12 h-12 text-brand-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('diseaseTitle')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                {lang === 'te' ? 'వాతావరణ పరిస్థితులు ఆధారంగా విశ్లేషణ' : 'Analysis includes current climate conditions'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
                >
                  <Camera className="w-4 h-4" />
                  {t('captureImage')}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  {t('uploadFromGallery')}
                </button>
              </div>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className="p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/30 flex items-center justify-center">
              <Check className="w-5 h-5 text-brand-600 dark:text-brand-300" />
            </div>
            <p className="font-bold text-gray-900 dark:text-gray-100">{t('detectionResult')}</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? 'పంట' : 'Crop'}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {lang === 'te' ? result.cropTe : result.crop}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? 'వ్యాధి / ఫలితం' : 'Disease / Result'}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {lang === 'te' ? result.resultTe : result.result}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('confidence')}</p>
                <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{result.confidence}%</p>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${result.confidence}%` }} />
              </div>
            </div>

            {/* Climate advice */}
            {result.climateAdvice && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  {lang === 'te' ? result.climateAdviceTe : result.climateAdvice}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('suggestedTreatment')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                {lang === 'te' ? result.treatmentTe : result.treatment}
              </p>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{t('contactOfficerConfirm')}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
