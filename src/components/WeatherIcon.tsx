import { Cloud, CloudRain, CloudDrizzle, Sun, CloudSun, Wind, type LucideProps } from 'lucide-react';

export function WeatherIcon({ type, ...props }: { type: string } & LucideProps) {
  switch (type) {
    case 'sunny':
      return <Sun {...props} />;
    case 'partly-cloudy':
      return <CloudSun {...props} />;
    case 'cloudy':
      return <Cloud {...props} />;
    case 'rain':
      return <CloudRain {...props} />;
    case 'drizzle':
      return <CloudDrizzle {...props} />;
    case 'wind':
      return <Wind {...props} />;
    default:
      return <CloudSun {...props} />;
  }
}
