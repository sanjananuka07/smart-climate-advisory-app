// Sample weather and climate data for Srikakulam district, Andhra Pradesh

export interface CurrentWeather {
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

export interface HourlyForecast {
  time: string;
  temp: number;
  rainProb: number;
  icon: string;
}

export interface DailyForecast {
  day: string;
  dayEn: string;
  high: number;
  low: number;
  rainProb: number;
  icon: string;
  condition: string;
}

export const currentWeather: CurrentWeather = {
  temp: 31,
  feelsLike: 35,
  humidity: 72,
  rainfall: 12,
  windSpeed: 14,
  uvIndex: 7,
  condition: 'ఆకాశం పాక్షికంగా మేఘావృతం',
  conditionEn: 'Partly Cloudy',
  icon: 'partly-cloudy',
  sunrise: '05:48',
  sunset: '18:32',
};

export const hourlyForecast: HourlyForecast[] = [
  { time: '06:00', temp: 26, rainProb: 10, icon: 'sunny' },
  { time: '09:00', temp: 29, rainProb: 15, icon: 'partly-cloudy' },
  { time: '12:00', temp: 32, rainProb: 35, icon: 'partly-cloudy' },
  { time: '15:00', temp: 33, rainProb: 55, icon: 'rain' },
  { time: '18:00', temp: 30, rainProb: 60, icon: 'rain' },
  { time: '21:00', temp: 27, rainProb: 30, icon: 'partly-cloudy' },
  { time: '00:00', temp: 25, rainProb: 20, icon: 'cloudy' },
  { time: '03:00', temp: 24, rainProb: 15, icon: 'cloudy' },
];

const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayNamesTe = ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'];

export const dailyForecast: DailyForecast[] = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  const idx = d.getDay();
  const conditions = ['sunny', 'partly-cloudy', 'rain', 'cloudy', 'partly-cloudy', 'sunny', 'rain'];
  const highs = [33, 34, 31, 30, 32, 34, 29];
  const lows = [25, 26, 24, 24, 25, 26, 23];
  const rain = [10, 20, 65, 70, 30, 15, 60];
  return {
    day: dayNamesTe[idx],
    dayEn: dayNamesEn[idx],
    high: highs[i],
    low: lows[i],
    rainProb: rain[i],
    icon: conditions[i],
    condition: '',
  };
});

// Srikakulam historical climate data 2015-2024
export const monthlyRainfall = [
  { month: 'Jan', mm: 12 },
  { month: 'Feb', mm: 18 },
  { month: 'Mar', mm: 25 },
  { month: 'Apr', mm: 45 },
  { month: 'May', mm: 68 },
  { month: 'Jun', mm: 185 },
  { month: 'Jul', mm: 245 },
  { month: 'Aug', mm: 280 },
  { month: 'Sep', mm: 210 },
  { month: 'Oct', mm: 120 },
  { month: 'Nov', mm: 55 },
  { month: 'Dec', mm: 18 },
];

export const monthlyTemp = [
  { month: 'Jan', avg: 22, max: 28, min: 16 },
  { month: 'Feb', avg: 25, max: 31, min: 18 },
  { month: 'Mar', avg: 28, max: 34, min: 22 },
  { month: 'Apr', avg: 31, max: 37, min: 25 },
  { month: 'May', avg: 33, max: 40, min: 27 },
  { month: 'Jun', avg: 31, max: 36, min: 26 },
  { month: 'Jul', avg: 29, max: 33, min: 25 },
  { month: 'Aug', avg: 29, max: 33, min: 25 },
  { month: 'Sep', avg: 29, max: 33, min: 25 },
  { month: 'Oct', avg: 28, max: 32, min: 23 },
  { month: 'Nov', avg: 25, max: 30, min: 19 },
  { month: 'Dec', avg: 22, max: 28, min: 16 },
];

export const annualRainfall = [
  { year: '2015', mm: 1085 },
  { year: '2016', mm: 980 },
  { year: '2017', mm: 1150 },
  { year: '2018', mm: 1020 },
  { year: '2019', mm: 1280 },
  { year: '2020', mm: 1340 },
  { year: '2021', mm: 1190 },
  { year: '2022', mm: 950 },
  { year: '2023', mm: 1100 },
  { year: '2024', mm: 1165 },
];

export const annualTemp = [
  { year: '2015', avg: 27.8 },
  { year: '2016', avg: 28.1 },
  { year: '2017', avg: 28.0 },
  { year: '2018', avg: 28.3 },
  { year: '2019', avg: 28.6 },
  { year: '2020', avg: 28.2 },
  { year: '2021', avg: 28.4 },
  { year: '2022', avg: 28.7 },
  { year: '2023', avg: 28.9 },
  { year: '2024', avg: 29.1 },
];

export const climateSummary = {
  avgAnnualRainfall: 1126,
  wettestYear: '2020',
  driestYear: '2022',
  avgTemp: 28.4,
  tempRise: 1.3, // degrees since 2015
};
