import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [navigate, user]);

  function updateField(field: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.username.trim()) {
      setError('Username is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Start with a secure account for protected ANIWAVE pages."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Log in"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Username</span>
          <div className="mt-2 relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={form.username}
              onChange={e => updateField('username', e.target.value)}
              autoComplete="username"
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-11 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="DramaFan"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Email</span>
          <div className="mt-2 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              autoComplete="email"
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-11 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
        </label>

        {(['password', 'confirmPassword'] as const).map(field => (
          <label key={field} className="block">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{field === 'password' ? 'Password' : 'Confirm password'}</span>
            <div className="mt-2 relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form[field]}
                onChange={e => updateField(field, e.target.value)}
                autoComplete={field === 'password' ? 'new-password' : 'new-password'}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-11 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder={field === 'password' ? 'At least 8 characters' : 'Repeat password'}
              />
              {field === 'password' && (
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </label>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gray-950 hover:bg-gray-800 disabled:opacity-70 text-white font-black py-3.5 shadow-lg shadow-gray-950/20 transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <Link to="/" className="block text-center text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          Back to browsing
        </Link>
      </form>
    </AuthCard>
  );
}