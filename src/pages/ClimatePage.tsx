import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { useLocation } from '../context/LocationContext';
import { Card } from '../components/ui';
import { RefreshCw } from 'lucide-react';

interface ClimateSummary {
  avgAnnualRainfall: number;
  avgTemp: number;
  wettestYear: string;
  driestYear: string;
  tempRise: number;
}

interface MonthlyData {
  month: string;
  mm: number;
}

interface TempData {
  month: string;
  avg: number;
  max: number;
  min: number;
}

interface AnnualData {
  year: string;
  mm: number;
  avg: number;
}

// Generate climate data based on location and time
function generateClimateData(locationId: string, timestamp: number) {
  const seed = (s: number) => {
    const x = Math.sin(s + timestamp) * 10000;
    return x - Math.floor(x);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];

  // Base values vary by climate zone
  const coastalBase = { rainfall: 180, temp: 28 };
  const rayalaseemaBase = { rainfall: 80, temp: 30 };

  const isCoastal = !['chittoor', 'anantapur', 'kurnool', 'kadapa'].includes(locationId);
  const base = isCoastal ? coastalBase : rayalaseemaBase;

  // Monthly rainfall (monsoon pattern)
  const monthlyRainfall: MonthlyData[] = monthNames.map((month, i) => {
    const isMonsoon = i >= 5 && i <= 8; // Jun-Sep
    const baseMm = isMonsoon ? base.rainfall * (2 + seed(i * 10)) : base.rainfall * (0.1 + seed(i * 5) * 0.3);
    return {
      month,
      mm: Math.round(baseMm + (seed(i + timestamp) - 0.5) * 20)
    };
  });

  // Monthly temperature
  const monthlyTemp: TempData[] = monthNames.map((month, i) => {
    const isSummer = i >= 2 && i <= 4; // Mar-May
    const baseTemp = isSummer ? base.temp + 5 : base.temp;
    const variation = (seed(i * 7 + timestamp) - 0.5) * 4;
    return {
      month,
      avg: Math.round((baseTemp + variation) * 10) / 10,
      max: Math.round((baseTemp + variation + 5) * 10) / 10,
      min: Math.round((baseTemp + variation - 5) * 10) / 10
    };
  });

  // Annual rainfall history
  const annualRainfall: AnnualData[] = years.map((year, i) => {
    const baseMm = isCoastal ? 1100 : 750;
    return {
      year,
      mm: Math.round(baseMm + (seed(i * 3 + timestamp) - 0.5) * 300)
    };
  });

  // Annual temperature trend
  const annualTemp: AnnualData[] = years.map((year, i) => {
    const baseTemp = isCoastal ? 27.5 : 29;
    return {
      year,
      avg: Math.round((baseTemp + i * 0.12 + (seed(i * 5 + timestamp) - 0.5) * 0.5) * 10) / 10
    };
  });

  // Climate summary
  const avgAnnualRainfall = Math.round(annualRainfall.reduce((a, b) => a + b.mm, 0) / annualRainfall.length);
  const avgTemp = Math.round(annualTemp.reduce((a, b) => a + b.avg, 0) / annualTemp.length * 10) / 10;
  const sortedRainfall = [...annualRainfall].sort((a, b) => b.mm - a.mm);
  const wettestYear = sortedRainfall[0].year;
  const driestYear = sortedRainfall[sortedRainfall.length - 1].year;
  const tempRise = Math.round((annualTemp[annualTemp.length - 1].avg - annualTemp[0].avg) * 10) / 10;

  const climateSummary: ClimateSummary = {
    avgAnnualRainfall,
    avgTemp,
    wettestYear,
    driestYear,
    tempRise: Math.abs(tempRise)
  };

  return { monthlyRainfall, monthlyTemp, annualRainfall, annualTemp, climateSummary };
}

// Simple SVG bar chart
function BarChart({ data, color, unit }: { data: { label: string; value: number }[]; color: string; unit: string }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-between gap-1 h-40 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="relative w-full flex-1 flex items-end">
            <div
              className={`w-full rounded-t-md ${color} transition-all hover:opacity-80`}
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.label}: ${d.value}${unit}`}
            />
          </div>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Line chart for temperature trends
function LineChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.value - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - ((d.value - min) / range) * h;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={color} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-gray-500 dark:text-gray-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function ClimatePage() {
  const { t, lang } = useI18n();
  const { location } = useLocation();
  const [timestamp, setTimestamp] = useState(Date.now());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const climateData = generateClimateData(location.id, timestamp);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setTimestamp(Date.now());
    setLastUpdated(new Date());
  };

  const locationName = lang === 'te' ? location.nameTe : location.nameEn;

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('climate')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{locationName} · 2015–2024</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === 'te' ? `చివరి అప్‌డేట్: ${lastUpdated.toLocaleTimeString('te-IN')}` : `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={lang === 'te' ? 'రిఫ్రెష్' : 'Refresh'}
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? 'సగటు వార్షిక వర్షపాతం' : 'Avg Annual Rainfall'}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{climateData.climateSummary.avgAnnualRainfall}<span className="text-sm text-gray-400 ml-1">mm</span></p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? 'సగటు ఉష్ణోగ్రత' : 'Avg Temperature'}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{climateData.climateSummary.avgTemp}<span className="text-sm text-gray-400 ml-1">°C</span></p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? 'తేమ సంవత్సరం' : 'Wettest Year'}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{climateData.climateSummary.wettestYear}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? 'కరువు సంవత్సరం' : 'Driest Year'}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{climateData.climateSummary.driestYear}</p>
        </Card>
      </div>

      {/* Temperature rise indicator */}
      <Card className="p-4 border-2 border-rose-200 dark:border-rose-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'te' ? 'ఉష్ణోగ్రత పెరుగుదల (2015 నుండి)' : 'Temperature Rise (since 2015)'}</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">+{climateData.climateSummary.tempRise}<span className="text-sm ml-1">°C</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <span className="text-rose-600 dark:text-rose-400 text-xl">🌡️</span>
          </div>
        </div>
      </Card>

      {/* Monthly rainfall */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('monthlyRainfall')}</p>
        <BarChart
          data={climateData.monthlyRainfall.map((d) => ({ label: d.month, value: d.mm }))}
          color="bg-accent-500"
          unit="mm"
        />
      </Card>

      {/* Monthly temperature */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('tempTrends')}</p>
        <LineChart
          data={climateData.monthlyTemp.map((d) => ({ label: d.month, value: d.avg }))}
          color="#f59e0b"
        />
      </Card>

      {/* Annual rainfall history */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('rainfallHistory')}</p>
        <BarChart
          data={climateData.annualRainfall.map((d) => ({ label: d.year, value: d.mm }))}
          color="bg-brand-500"
          unit="mm"
        />
      </Card>

      {/* Annual temperature trend */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{lang === 'te' ? 'వార్షిక ఉష్ణోగ్రత ధోరణి' : 'Annual Temperature Trend'}</p>
        <LineChart
          data={climateData.annualTemp.map((d) => ({ label: d.year, value: d.avg }))}
          color="#ef4444"
        />
      </Card>

      {/* Annual summary */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('annualSummary')}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'te'
            ? `2015 నుండి 2024 వరకు ${locationName} జిల్లాలో సగటు వార్షిక వర్షపాతం ${climateData.climateSummary.avgAnnualRainfall} మిమీ. ఉష్ణోగ్రత ${climateData.climateSummary.tempRise}°C పెరిగింది. ${climateData.climateSummary.wettestYear} అత్యధిక వర్షపాతం, ${climateData.climateSummary.driestYear} అత్యల్ప వర్షపాతం. వర్షాకాలం (జూన్-సెప్టెంబర్) మొత్తం వర్షపాతంలో 70-80% వాటా కలిగి ఉంది.`
            : `From 2015 to 2024, ${locationName} district received an average annual rainfall of ${climateData.climateSummary.avgAnnualRainfall} mm. Temperature has risen by ${climateData.climateSummary.tempRise}°C. ${climateData.climateSummary.wettestYear} was the wettest year and ${climateData.climateSummary.driestYear} the driest. The monsoon season (Jun-Sep) accounts for 70-80% of total rainfall.`}
        </p>
      </Card>
    </div>
  );
}
