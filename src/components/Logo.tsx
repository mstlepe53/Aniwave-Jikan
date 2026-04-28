import { Link } from 'react-router-dom';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center select-none ${className}`} aria-label="ANIWAVE – Home">
      <span
        className="font-black tracking-tight leading-none"
        style={{ fontSize: '1.45rem', letterSpacing: '-0.02em', fontWeight: 900 }}
      >
        <span className="text-gray-900 dark:text-white">ANI</span>
        <span className="text-indigo-500 dark:text-indigo-400">WAVE</span>
      </span>
    </Link>
  );
}
