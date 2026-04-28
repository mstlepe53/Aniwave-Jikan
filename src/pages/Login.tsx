import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState((location.state as { message?: string } | null)?.message || '');

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [from, navigate, user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue to your private ANIWAVE space."
      footerText="New to ANIWAVE?"
      footerLink="/signup"
      footerLinkText="Create an account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Email</span>
          <div className="mt-2 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-11 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Password</span>
          <div className="mt-2 relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-11 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="Your password"
            />
            <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gray-950 hover:bg-gray-800 disabled:opacity-70 text-white font-black py-3.5 shadow-lg shadow-gray-950/20 transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <Link to="/" className="block text-center text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          Back to browsing
        </Link>
      </form>
    </AuthCard>
  );
}