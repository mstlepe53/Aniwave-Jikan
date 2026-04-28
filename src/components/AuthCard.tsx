import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-10 md:py-16 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(135deg,_#f8fafc,_#eef2ff)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_32%),linear-gradient(135deg,_#020617,_#111827)]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        <div className="hidden lg:block">
          <div className="inline-flex mb-8">
            <Logo size="lg" />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-gray-950 dark:text-white leading-tight">
            Your premium drama space, now personalized.
          </h1>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 max-w-xl">
            Create a secure account foundation for saved sessions, protected pages, and future community features.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
            {['Secure JWT', 'Private Routes', 'Clean Profile'].map(item => (
              <div key={item} className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white dark:border-gray-800 rounded-[2rem] shadow-2xl shadow-blue-950/10 dark:shadow-black/30 p-6 sm:p-8">
            <div className="mb-7">
              <div className="lg:hidden mb-6">
                <Logo />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            {children}
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {footerText}{' '}
              <Link to={footerLink} className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}