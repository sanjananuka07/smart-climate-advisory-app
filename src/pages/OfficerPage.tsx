import { useEffect, useState, useRef } from 'react';
import { Phone, MessageSquare, Calendar, ArrowLeft, Send, Loader2, Check, Clock, User, MapPin, CloudRain, Sun, Droplets, Wind, Thermometer, AlertTriangle, Cloud } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

interface Officer {
  id: string;
  name: string;
  district: string;
  phone: string;
  specialization: string;
  available: boolean;
}

interface OfficerMessage {
  id: string;
  sender_role: 'farmer' | 'officer';
  content: string;
  created_at: string;
}

interface Appointment {
  id: string;
  officer_id: string;
  appointment_date: string;
  time_slot: string;
  reason: string | null;
  status: string;
}

interface WeatherCondition {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
}

type View = 'list' | 'chat' | 'appoint' | 'myAppointments';

const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

// Map specializations to climate threats they handle
const specializationClimateMap: Record<string, string[]> = {
  'Crop Protection': ['high_humidity', 'pest_outbreak', 'disease_risk'],
  'Water Management': ['heavy_rainfall', 'drought_risk', 'flood_risk'],
  'Soil Health': ['drought_risk', 'heat_wave'],
  'Pest Control': ['pest_outbreak', 'high_humidity'],
  'Irrigation': ['drought_risk', 'low_rainfall'],
  'Flood Management': ['flood_risk', 'heavy_rainfall'],
  'Disease Control': ['high_humidity', 'fungal_risk'],
  'General Agriculture': [],
};

function generateWeatherData(locationId: string): WeatherCondition {
  const now = Date.now();
  const seed = Math.sin(now / 60000 + locationId.length * 100) * 10000;
  const rand = (s: number) => Math.abs(Math.sin(s) * 10000) % 100;

  return {
    temp: 28 + (rand(seed) - 50) * 0.4,
    humidity: 60 + (rand(seed * 2) - 50) * 0.5,
    rainfall: 30 + rand(seed * 3) * 0.8,
    windSpeed: 10 + rand(seed * 4) * 0.4,
    condition: rand(seed * 5) > 70 ? 'rainy' : rand(seed * 6) > 50 ? 'cloudy' : 'sunny',
  };
}

function getClimateThreats(weather: WeatherCondition): string[] {
  const threats: string[] = [];
  if (weather.rainfall > 50) threats.push('heavy_rainfall');
  if (weather.rainfall > 70) threats.push('flood_risk');
  if (weather.temp > 38) threats.push('heat_wave');
  if (weather.humidity > 75) threats.push('high_humidity');
  if (weather.humidity > 80) threats.push('fungal_risk');
  if (weather.rainfall < 10 && weather.temp > 32) threats.push('drought_risk');
  if (weather.windSpeed > 30) threats.push('strong_winds');
  return threats;
}

function getClimateRecommendations(weather: WeatherCondition, lang: string): string[] {
  const threats = getClimateThreats(weather);
  const recs: string[] = [];

  if (lang === 'te') {
    if (weather.rainfall > 50) recs.push('భారీ వర్షం కారణంగా పంట రక్షణ అవసరం');
    if (weather.temp > 38) recs.push('వేడి తగ్గింపు చర్యలు తీసుకోండి');
    if (weather.humidity > 75) recs.push('శిలీంధ్ర సంబంధిత వ్యాధులకు జాగ్రత్త');
    if (weather.rainfall < 15) recs.push('నీటి నిర్వహణ సలహా అవసరం');
    if (recs.length === 0) recs.push('సాధారణ వాతావరణ పరిస్థితులు');
  } else {
    if (weather.rainfall > 50) recs.push('Crop protection needed due to heavy rainfall');
    if (weather.temp > 38) recs.push('Heat stress mitigation measures required');
    if (weather.humidity > 75) recs.push('Watch for fungal diseases');
    if (weather.rainfall < 15) recs.push('Water management consultation advised');
    if (recs.length === 0) recs.push('Normal weather conditions');
  }
  return recs;
}

function getClimateQuickMessages(weather: WeatherCondition, lang: string): string[] {
  const messages: string[] = [];

  if (lang === 'te') {
    if (weather.rainfall > 50) messages.push('వరదల నుండి పంటలను ఎలా కాపాడాలి?');
    if (weather.temp > 38) messages.push('వేడిలో పంటలకు ఎలా జాగ్రత్త పడాలి?');
    if (weather.humidity > 75) messages.push('తేమ కారణంగా వచ్చే వ్యాధుల గురించి సలహా');
    if (weather.windSpeed > 30) messages.push('గాలి నుండి పంటలను కాపాడే మార్గాలు');
    if (messages.length === 0) messages.push('సాధారణ సలహా కావాలి');
  } else {
    if (weather.rainfall > 50) messages.push('How to protect crops from flooding?');
    if (weather.temp > 38) messages.push('Heat stress protection for crops');
    if (weather.humidity > 75) messages.push('Advice on humidity-related diseases');
    if (weather.windSpeed > 30) messages.push('Wind damage prevention methods');
    if (messages.length === 0) messages.push('Need general farming advice');
  }
  return messages.slice(0, 3);
}

export default function OfficerPage() {
  const { t, lang } = useI18n();
  const { location } = useLocation();
  const [view, setView] = useState<View>('list');
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('officers')
        .select('*')
        .eq('district', location.nameEn)
        .order('available', { ascending: false });
      setOfficers(data ?? []);
      setWeather(generateWeatherData(location.nameEn));
      setLoading(false);
      setLastUpdated(new Date());
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [location.nameEn]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  const locationName = lang === 'te' ? location.nameTe : location.nameEn;
  const climateThreats = weather ? getClimateThreats(weather) : [];
  const climateRecs = weather ? getClimateRecommendations(weather, lang) : [];

  return (
    <div className="animate-fade-in">
      {view === 'list' && (
        <OfficerList
          officers={officers}
          locationName={locationName}
          weather={weather}
          climateThreats={climateThreats}
          climateRecs={climateRecs}
          lastUpdated={lastUpdated}
          onSelect={(o) => { setSelectedOfficer(o); setView('chat'); }}
          onAppoint={(o) => { setSelectedOfficer(o); setView('appoint'); }}
        />
      )}
      {view === 'chat' && selectedOfficer && (
        <OfficerChat
          officer={selectedOfficer}
          weather={weather}
          onBack={() => setView('list')}
        />
      )}
      {view === 'appoint' && selectedOfficer && (
        <BookAppointment
          officer={selectedOfficer}
          weather={weather}
          onBack={() => setView('list')}
          onDone={() => setView('myAppointments')}
        />
      )}
      {view === 'myAppointments' && (
        <MyAppointments onBack={() => setView('list')} />
      )}
      {view === 'list' && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setView('myAppointments')}
            className="w-full py-2.5 rounded-xl border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-700/20 transition flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {t('myAppointments')}
          </button>
        </div>
      )}
    </div>
  );
}

function OfficerList({ officers, locationName, weather, climateThreats, climateRecs, lastUpdated, onSelect, onAppoint }: {
  officers: Officer[];
  locationName: string;
  weather: WeatherCondition | null;
  climateThreats: string[];
  climateRecs: string[];
  lastUpdated: Date;
  onSelect: (o: Officer) => void;
  onAppoint: (o: Officer) => void;
}) {
  const { t, lang } = useI18n();

  // Score officers based on climate relevance
  const scoredOfficers = officers.map(o => {
    const relevantThreats = specializationClimateMap[o.specialization] || [];
    const matchCount = climateThreats.filter(t => relevantThreats.includes(t)).length;
    return { ...o, climateScore: matchCount };
  }).sort((a, b) => b.climateScore - a.climateScore || (b.available ? 1 : 0) - (a.available ? 1 : 0));

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('officerTitle')}</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
          <MapPin className="w-4 h-4" />
          <span>{locationName}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {lang === 'te' ? `చివరి అప్‌డేట్: ${lastUpdated.toLocaleTimeString('te-IN')}` : `Last updated: ${lastUpdated.toLocaleTimeString()}`}
        </p>
      </div>

      {/* Weather Summary */}
      {weather && (
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            {lang === 'te' ? 'ప్రస్తుత వాతావరణం' : 'Current Weather'}
          </p>
          <div className="grid grid-cols-4 gap-2 text-center mb-3">
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
          {climateThreats.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {climateThreats.map((threat, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-700/30 text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {threat.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Climate Recommendations */}
      {climateRecs.length > 0 && (
        <Card className="p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1.5 flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5" />
            {lang === 'te' ? 'శిఫారసు చేసిన సలహాదారులు' : 'Recommended Consultations'}
          </p>
          <div className="space-y-1">
            {climateRecs.map((rec, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{rec}</p>
            ))}
          </div>
        </Card>
      )}

      {scoredOfficers.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'te'
              ? 'ఈ జిల్లాలో ప్రస్తుతం అధికారులు అందుబాటులో లేరు.'
              : 'No officers available in this district currently.'}
          </p>
        </Card>
      ) : (
        scoredOfficers.map((o) => (
          <Card key={o.id} className={`p-4 ${o.climateScore > 0 ? 'ring-2 ring-amber-200 dark:ring-amber-700/50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                o.climateScore > 0
                  ? 'bg-amber-100 dark:bg-amber-700/40'
                  : 'bg-brand-100 dark:bg-brand-700/40'
              }`}>
                <User className={`w-6 h-6 ${o.climateScore > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-brand-600 dark:text-brand-300'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{o.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.available ? 'bg-brand-100 text-brand-700 dark:bg-brand-700/40 dark:text-brand-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {o.available ? t('available') : t('offline')}
                  </span>
                  {o.climateScore > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-700/40 text-amber-700 dark:text-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {lang === 'te' ? 'వాతావరణ నిపుణుడు' : 'Climate Expert'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{o.specialization}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{o.phone}</p>
                {o.climateScore > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    {lang === 'te' ? 'ప్రస్తుత వాతావరణ పరిస్థితులకు సరైన నిపుణుడు' : 'Best match for current weather conditions'}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onSelect(o)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t('chatWithOfficer')}
                  </button>
                  <a
                    href={`tel:${o.phone}`}
                    className="flex items-center justify-center w-10 h-9 rounded-lg bg-accent-50 dark:bg-accent-700/30 text-accent-600 dark:text-accent-300 hover:bg-accent-100 transition"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => onAppoint(o)}
                    className="flex items-center justify-center w-10 h-9 rounded-lg bg-amber-50 dark:bg-amber-700/30 text-amber-600 dark:text-amber-300 hover:bg-amber-100 transition"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function OfficerChat({ officer, weather, onBack }: { officer: Officer; weather: WeatherCondition | null; onBack: () => void }) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<OfficerMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickMessages = weather ? getClimateQuickMessages(weather, lang) : [];

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('officer_messages')
        .select('id, sender_role, content, created_at')
        .eq('officer_id', officer.id)
        .order('created_at', { ascending: true });
      setMessages(data ?? []);
    }
    load();
  }, [officer.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || sending) return;
    setSending(true);
    const { data } = await supabase
      .from('officer_messages')
      .insert({ officer_id: officer.id, sender_role: 'farmer', content: msg })
      .select('id, sender_role, content, created_at')
      .single();
    if (data) setMessages([...messages, data]);
    setInput('');
    setSending(false);

    // Simulate officer auto-reply after 2 seconds
    setTimeout(async () => {
      const replies = [
        'Thank you for your message. I will look into this and get back to you shortly.',
        'Can you share more details about your farm location and the crop?',
        'I recommend visiting the nearest agriculture office for a field inspection.',
        'Please share a photo of the affected crop so I can assess the issue better.',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const { data: replyData } = await supabase
        .from('officer_messages')
        .insert({ officer_id: officer.id, sender_role: 'officer', content: reply })
        .select('id, sender_role, content, created_at')
        .single();
      if (replyData) setMessages((prev) => [...prev, replyData]);
    }, 2000);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-700/40 flex items-center justify-center">
          <User className="w-5 h-5 text-brand-600 dark:text-brand-300" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{officer.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{officer.specialization}</p>
        </div>
        <a href={`tel:${officer.phone}`} className="p-2 rounded-lg bg-accent-50 dark:bg-accent-700/30 text-accent-600 dark:text-accent-300">
          <Phone className="w-4 h-4" />
        </a>
      </div>

      {/* Weather context */}
      {weather && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <Cloud className="w-3.5 h-3.5" />
            <span>{weather.temp.toFixed(0)}°C | {weather.humidity.toFixed(0)}% humidity</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
            {t('typeMessage')}
          </div>
        )}
        {messages.map((msg) => {
          const isFarmer = msg.sender_role === 'farmer';
          return (
            <div key={msg.id} className={`flex ${isFarmer ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isFarmer
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick messages */}
      {quickMessages.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-1">
            <CloudRain className="w-3 h-3" />
            {lang === 'te' ? 'వాతావరణ సంబంధిత ప్రశ్నలు' : 'Climate-related questions'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickMessages.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-700/30 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-700/50 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('typeMessage')}
            disabled={sending}
            className="flex-1 px-4 py-2.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <button
            onClick={() => send()}
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 active:scale-95 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BookAppointment({ officer, weather, onBack, onDone }: { officer: Officer; weather: WeatherCondition | null; onBack: () => void; onDone: () => void }) {
  const { t, lang } = useI18n();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Climate-based reason suggestions
  const suggestedReasons = weather ? getClimateQuickMessages(weather, lang) : [];

  async function book() {
    if (!date || !slot) return;
    setBooking(true);
    await supabase.from('appointments').insert({
      officer_id: officer.id,
      appointment_date: date,
      time_slot: slot,
      reason,
    });
    setBooking(false);
    setConfirmed(true);
    setTimeout(onDone, 1500);
  }

  if (confirmed) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-700/40 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-brand-600 dark:text-brand-300" />
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">{t('bookingConfirmed')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('bookAppointment')}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{officer.name}</p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('appointmentDate')}</label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('timeSlot')}</label>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`py-2 text-xs rounded-lg border transition ${
                  slot === s
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('reason')}</label>
          {suggestedReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestedReasons.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setReason(r)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition ${
                    reason === r
                      ? 'border-amber-500 bg-amber-100 dark:bg-amber-700/30 text-amber-700 dark:text-amber-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
            placeholder={t('reason')}
          />
        </div>

        <button
          onClick={book}
          disabled={booking || !date || !slot}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition disabled:opacity-50"
        >
          {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          {t('confirmBooking')}
        </button>
      </Card>
    </div>
  );
}

function MyAppointments({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState<(Appointment & { officers: { name: string; specialization: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('appointments')
        .select('id, officer_id, appointment_date, time_slot, reason, status, officers(name, specialization)')
        .order('appointment_date', { ascending: false });
      setAppointments((data ?? []) as unknown as (Appointment & { officers: { name: string; specialization: string } })[]);
      setLoading(false);
    }
    load();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-700/40 dark:text-amber-200',
    confirmed: 'bg-brand-100 text-brand-700 dark:bg-brand-700/40 dark:text-brand-200',
    completed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-700/40 dark:text-rose-200',
  };
  const statusKeys: Record<string, 'statusPending' | 'statusConfirmed' | 'statusCompleted' | 'statusCancelled'> = {
    pending: 'statusPending', confirmed: 'statusConfirmed', completed: 'statusCompleted', cancelled: 'statusCancelled',
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('myAppointments')}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-600 animate-spin" /></div>
      ) : appointments.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('myAppointments')}</p>
        </Card>
      ) : (
        appointments.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{a.officers?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{a.officers?.specialization}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>
                {t(statusKeys[a.status])}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{a.appointment_date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.time_slot}</span>
            </div>
            {a.reason && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{a.reason}</p>}
          </Card>
        ))
      )}
    </div>
  );
}
