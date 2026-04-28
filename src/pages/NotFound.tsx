import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Film } from 'lucide-react';

const REDIRECT_SECONDS = 5;

export default function NotFound() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Big 404 number */}
        <div className="relative mb-6 select-none">
          <span className="text-[10rem] font-black leading-none text-gray-100 dark:text-gray-800">
            404
          </span>
          <Film className="w-16 h-16 text-blue-500 absolute inset-0 m-auto" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
          <br />
          Redirecting you home in{' '}
          <span className="font-bold text-blue-500">{countdown}</span> second{countdown !== 1 ? 's' : ''}…
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>

        {/* Countdown ring */}
        <div className="mt-8 flex justify-center">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="100"
              strokeDashoffset={100 - (countdown / REDIRECT_SECONDS) * 100}
              strokeLinecap="round"
              className="text-blue-500 transition-all duration-1000"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
