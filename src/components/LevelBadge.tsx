interface LevelBadgeProps {
  level: number;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
}

// Returns a color class based on level range
function getLevelColor(level: number): string {
  if (level >= 30) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
  if (level >= 20) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (level >= 10) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (level >= 5)  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (level >= 2)  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
}

export default function LevelBadge({ level, size = 'sm', showLabel = false }: LevelBadgeProps) {
  const safeLevel = Math.max(1, Math.floor(level));

  const sizeClass = {
    xs: 'text-[10px] px-1 py-0 leading-4',
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full border font-semibold tabular-nums select-none ${sizeClass} ${getLevelColor(safeLevel)}`}
      title={`Level ${safeLevel}`}
    >
      <span className="leading-none">Lv</span>
      <span className="leading-none">{safeLevel}</span>
      {showLabel && <span className="ml-0.5 font-normal opacity-75">lvl</span>}
    </span>
  );
}
