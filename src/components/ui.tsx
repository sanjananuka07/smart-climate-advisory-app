import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-lg font-bold text-gray-900 dark:text-gray-100 ${className}`}>{children}</h2>;
}

export function StatCard({
  icon,
  label,
  value,
  unit,
  accent = 'brand',
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  accent?: 'brand' | 'accent' | 'amber' | 'rose';
}) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-700/30 dark:text-brand-300',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-700/30 dark:text-accent-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-700/30 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-700/30 dark:text-rose-300',
  };
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[accent]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
        {value}
        {unit && <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>}
      </p>
    </Card>
  );
}
