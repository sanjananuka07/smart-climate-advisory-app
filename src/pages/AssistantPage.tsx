import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Sprout, User, CloudSun, Thermometer, Droplets, Wind, AlertTriangle, MapPin } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface WeatherContext {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  season: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

// In-file AI responses with climate context
function generateAIResponse(query: string, weather: WeatherContext, location: string, lang: string): string {
  const q = query.toLowerCase();
  const locationName = location;

  // Season detection
  const month = new Date().getMonth();
  const isMonsoon = month >= 5 && month <= 9;
  const isSummer = month >= 2 && month <= 5;

  // Crop recommendations based on current weather
  if (q.includes('crop') || q.includes('grow') || q.includes('plant') || q.includes('పంట') || q.includes('పండించ')) {
    if (isMonsoon) {
      return lang === 'te'
        ? `ప్రస్తుత వర్షాకాలంలో (${locationName}లో ${weather.temp.toFixed(0)}°C, ${weather.humidity.toFixed(0)}% తేమ), వరి, మొక్కజొన్న, వేరుశనగ పండించడం మంచిది. ${weather.rainfall > 50 ? 'భారీ వర్షం కారణంగా పొడి పంటలు నివారించండి.' : 'పొడి మాసాల్లో నీటి పారుదల ఏర్పాటు చేసుకోండి.'}`
        : `In the current monsoon season (${weather.temp.toFixed(0)}°C, ${weather.humidity.toFixed(0)}% humidity in ${locationName}), paddy, maize, and groundnut are ideal. ${weather.rainfall > 50 ? 'Due to heavy rainfall, avoid dry crops.' : 'Ensure irrigation arrangements for dry spells.'}`;
    } else {
      return lang === 'te'
        ? `ప్రస్తుత సీజన్‌లో (${locationName}లో), కూరగాయలు, పప్పు పంటలు సరిపోతాయి. ${weather.temp > 35 ? 'అధిక ఉష్ణోగ్రత కారణంగా తరచుగా నీరు పెట్టండి.' : 'సాధారణ నీటి పారుదల సరిపోతుంది.'}`
        : `In the current season in ${locationName}, vegetables and pulses are suitable. ${weather.temp > 35 ? 'Due to high temperatures, irrigate frequently.' : 'Regular irrigation is sufficient.'}`;
    }
  }

  // Irrigation advice based on weather
  if (q.includes('irrigat') || q.includes('water') || q.includes('నీరు') || q.includes('పారు')) {
    if (weather.rainfall > 40 && isMonsoon) {
      return lang === 'te'
        ? `ప్రస్తుతం ${locationName}లో తగిన వర్షపాతం (${weather.rainfall.toFixed(0)}mm) ఉంది. నీటి పారుదల తగ్గించండి. పొండి రోజుల్లో మాత్రమే నీరు పెట్టండి.`
        : `Current rainfall in ${locationName} is adequate (${weather.rainfall.toFixed(0)}mm). Reduce irrigation frequency. Water only during dry spells.`;
    } else if (weather.temp > 35) {
      return lang === 'te'
        ? `అధిక ఉష్ణోగ్రత (${weather.temp.toFixed(0)}°C) కారణంగా పొద్దున లేదా సాయంత్రం నీరు పెట్టండి. మధ్యాహ్నం నీరు పెట్టడం మానుకోండి.`
        : `Due to high temperature (${weather.temp.toFixed(0)}°C), irrigate early morning or evening. Avoid midday watering to prevent evaporation loss.`;
    } else {
      return lang === 'te'
        ? `ప్రస్తుత వాతావరణంలో తేమ (${weather.humidity.toFixed(0)}%) ఉంది. 3-5 రోజులకో నీరు పెట్టడం సరిపోతుంది.`
        : `Current humidity is good (${weather.humidity.toFixed(0)}%). Irrigating every 3-5 days is sufficient.`;
    }
  }

  // Disease/fertilizer queries
  if (q.includes('leaf') || q.includes('yellow') || q.includes('disease') || q.includes('ఆకు') || q.includes('వ్యాధి')) {
    if (weather.humidity > 75) {
      return lang === 'te'
        ? `అధిక తేమ (${weather.humidity.toFixed(0)}%) కారణంగా శిలీంధ్ర వ్యాధులు రావచ్చు. ప్రిడాన్సివ్ ఫంగిసైడ్ స్ప్రే చేయండి.`
        : `High humidity (${weather.humidity.toFixed(0)}%) increases fungal disease risk. Apply preventive fungicide spray. Improve air circulation between plants.`;
    } else {
      return lang === 'te'
        ? `ఆకులు పసుపు రంగులోకి మారడం పోషకాల లేమి లేదా నీటి లేమి వల్ల కావచ్చు. మట్టి పరీక్ష చేయించండి.`
        : `Yellowing leaves may indicate nutrient deficiency or water stress. Get a soil test done to identify the issue.`;
    }
  }

  // Default response with weather context
  return lang === 'te'
    ? `నేను మీ ప్రశ్నను అర్థం చేసుకున్నాను. ప్రస్తుత ${locationName}లో ${weather.temp.toFixed(0)}°C ఉష్ణోగ్రత, ${weather.humidity.toFixed(0)}% తేమ ఉంది. దయచేసి మీ ప్రశ్నను మరింత స్పష్టంగా అడగండి.`
    : `I understand your question. Current conditions in ${locationName}: ${weather.temp.toFixed(0)}°C, ${weather.humidity.toFixed(0)}% humidity. Please ask a more specific question about crops, irrigation, or soil.`;
}

export default function AssistantPage() {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const { location } = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize weather context
  useEffect(() => {
    const now = Date.now();
    const seed = Math.sin(now / 60000) * 10000;
    const rand = (s: number) => Math.abs(Math.sin(s) * 10000) % 100;

    const month = new Date().getMonth();
    const season = (month >= 5 && month <= 9) ? 'kharif' : (month >= 10 || month <= 1) ? 'rabi' : 'zaid';

    setWeather({
      temp: 28 + (rand(seed) - 50) * 0.3,
      humidity: 60 + (rand(seed * 2) - 50) * 0.4,
      rainfall: season === 'kharif' ? 40 + rand(seed * 3) : rand(seed * 3),
      windSpeed: 10 + rand(seed * 4) * 0.2,
      season,
    });
  }, []);

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setMessages(data as Message[]);
      } else {
        setMessages([
          { id: 'intro', role: 'assistant', content: t('assistantIntro') },
        ]);
      }
    }
    loadHistory();
  }, [t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading || !weather) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    await supabase.from('chat_messages').insert({ role: 'user', content: text });

    try {
      // Generate local response with climate context
      const locationName = lang === 'te' ? location.nameTe : location.nameEn;
      const reply = generateAIResponse(text, weather, locationName, lang);

      // Also try the edge function
      let finalReply = reply;
      try {
        const resp = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            messages: newMessages
              .filter((m) => m.id !== 'intro')
              .map((m) => ({ role: m.role, content: m.content })),
            weather,
            location: locationName,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.reply) finalReply = data.reply;
        }
      } catch { /* Use local reply */ }

      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: finalReply };
      setMessages([...newMessages, assistantMsg]);
      await supabase.from('chat_messages').insert({ role: 'assistant', content: finalReply });
    } catch {
      const errorMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: t('error') };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  const locationName = lang === 'te' ? location.nameTe : location.nameEn;

  const suggestions = lang === 'te'
    ? ['ఈ సీజన్‌లో ఏ పంట పండించాలి?', 'ఎప్పుడు నీరు పారాలి?', 'ఆకులు ఎందుకు పసుపు రంగులోకి మారుతున్నాయి?']
    : ['Which crop should I grow this season?', 'When should I irrigate?', 'Why are my crop leaves turning yellow?'];

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] animate-fade-in">
      <div className="p-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('assistant')}</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{locationName}</span>
        </div>
      </div>

      {/* Weather Context Bar */}
      {weather && (
        <Card className="mx-4 p-3 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 border-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-red-500" />
                <span className="font-medium">{weather.temp.toFixed(0)}°C</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">{weather.humidity.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-cyan-500" />
                <span className="font-medium">{weather.rainfall.toFixed(0)}mm</span>
              </div>
            </div>
            <span className="text-gray-500 dark:text-gray-400 capitalize">{weather.season}</span>
          </div>
        </Card>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
          <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-gray-200 dark:bg-gray-700' : 'bg-brand-600'}`}>
              {isUser
                ? <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                : <Sprout className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              isUser
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
          );
        })}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-700/30 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('assistantPlaceholder')}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/30 hover:bg-brand-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
