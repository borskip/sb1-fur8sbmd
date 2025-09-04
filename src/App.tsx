import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Film, Search, TrendingUp, Clock, Star, User, Settings, Plus, Zap } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { MyMovies } from './pages/MyMovies';
import { Profile } from './pages/Profile';
import { LoginScreen } from './components/LoginScreen';
import { QuickAdd } from './components/QuickAdd';
import { useAuth } from './lib/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: TrendingUp, label: 'Dashboard' },
    { path: '/discover', icon: Search, label: 'Discover' },
    { path: '/my-movies', icon: Film, label: 'My Movies' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:relative md:border-t-0 md:border-r md:w-64 md:h-screen md:py-6">
      <div className="flex justify-around md:flex-col md:space-y-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === path
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs md:text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function MovieTracker() {
  const { user } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/my-movies" element={<MyMovies />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Quick Add FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-20 right-4 md:bottom-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showQuickAdd && (
        <QuickAdd onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MovieTracker />
    </QueryClientProvider>
  );
}

export default App;