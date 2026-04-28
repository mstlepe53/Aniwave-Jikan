import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../constants/avatars';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-[70vh] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-[2rem] bg-gray-950 text-white overflow-hidden shadow-2xl shadow-gray-950/20">
          <div className="p-6 sm:p-10 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.35),_transparent_30%)]">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
              <Shield className="w-4 h-4" />
              Protected route
            </div>
            <div className="mt-6 flex items-center gap-4">
              {user && (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.username}
                  className="w-14 h-14 rounded-2xl border-2 border-white/20 object-cover bg-white/10 shadow-lg"
                />
              )}
              <div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Welcome, {user?.username}</h1>
                <p className="mt-1 text-gray-300 text-sm">Your session is active and secure.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Link to="/profile" className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              {user && (
                <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-12 h-12 rounded-xl object-cover" />
              )}
              <User className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-black dark:text-white">My Profile</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Edit your avatar, username, and bio.</p>
          </Link>

          <button onClick={handleLogout} className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-left shadow-sm hover:shadow-lg transition-shadow">
            <LogOut className="w-8 h-8 text-red-500" />
            <h2 className="mt-4 text-xl font-black dark:text-white">Log out</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Clear your local session and return to browsing.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
