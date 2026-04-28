import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const Home       = lazy(() => import('./pages/Home'));
const AnimeDetail= lazy(() => import('./pages/AnimeDetail'));
const Watch      = lazy(() => import('./pages/Watch'));
const AnimeListing = lazy(() => import('./pages/AnimeListing'));
const Search     = lazy(() => import('./pages/Search'));
const GenresHub  = lazy(() => import('./pages/GenresHub'));
const NotFound   = lazy(() => import('./pages/NotFound'));
const Login      = lazy(() => import('./pages/Login'));
const Signup     = lazy(() => import('./pages/Signup'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Profile    = lazy(() => import('./pages/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));

function Loader() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>;
}
function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Lazy><Home /></Lazy>} />

          {/* Anime detail + watch */}
          <Route path="anime/:id" element={<Lazy><AnimeDetail /></Lazy>} />
          <Route path="watch/:id/:episode" element={<ErrorBoundary><Lazy><Watch /></Lazy></ErrorBoundary>} />

          {/* Listings */}
          <Route path="trending"  element={<Lazy><AnimeListing type="trending" /></Lazy>} />
          <Route path="popular"   element={<Lazy><AnimeListing type="popular" /></Lazy>} />
          <Route path="top-rated" element={<Lazy><AnimeListing type="top-rated" /></Lazy>} />
          <Route path="seasonal"  element={<Lazy><AnimeListing type="seasonal" /></Lazy>} />
          <Route path="movies"    element={<Lazy><AnimeListing type="movies" /></Lazy>} />
          <Route path="genre/:slug" element={<Lazy><AnimeListing type="genre" /></Lazy>} />

          {/* Browse */}
          <Route path="genres" element={<Lazy><GenresHub /></Lazy>} />
          <Route path="search" element={<Lazy><Search /></Lazy>} />

          {/* Auth */}
          <Route path="login"  element={<Lazy><Login /></Lazy>} />
          <Route path="signup" element={<Lazy><Signup /></Lazy>} />

          {/* User */}
          <Route path="dashboard" element={<Lazy><ProtectedRoute><Dashboard /></ProtectedRoute></Lazy>} />
          <Route path="profile"   element={<Lazy><ProtectedRoute><Profile /></ProtectedRoute></Lazy>} />
          <Route path="user/:username" element={<Lazy><PublicProfile /></Lazy>} />
          <Route path="leaderboard" element={<Lazy><Leaderboard /></Lazy>} />

          <Route path="*" element={<Lazy><NotFound /></Lazy>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
