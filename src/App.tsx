import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { Film, BookmarkCheck, Users, Heart, Calendar, Menu, X, User, Sparkles, CheckCircle, Tv } from 'lucide-react';
import { MovieSearch } from './components/MovieSearch';
import { MovieList } from './components/MovieList';
import { TVShowList } from './components/TVShowList';
import { LoginScreen } from './components/LoginScreen';
import { UserMenu } from './components/UserMenu';
import { UpcomingMovies } from './components/UpcomingMovies';
import { NowPlayingMovies } from './components/NowPlayingMovies';
import { WatchedMovies } from './components/WatchedMovies';
import { ScheduleDashboard } from './components/ScheduleDashboard';
import { PersonalProfile } from './components/PersonalProfile';
import { MovieRecommendations } from './components/MovieRecommendations';
import { WeeklyActivity } from './components/WeeklyActivity';
import { MediaTypeToggle } from './components/MediaTypeToggle';
import { useWatchlist } from './hooks/useWatchlist';
import { useAuth } from './lib/auth';
import { supabase } from './lib/supabase';
import type { Movie } from './lib/tmdb';
import { MovieModal } from './components/MovieModal';

const queryClient = new QueryClient();

function MovieTracker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'movies' | 'tv'>('movies');
  const [selectedRecommendation, setSelectedRecommendation] = useState<{
    movie: Movie;
    fromUser: string;
  } | null>(null);

  const {
    personalList,
    personalWatchlist,
    sharedWatchlist,
    watchedMovies,
    ratings,
    addToPersonal,
    addToPersonalWatchlist,
    addToShared,
    removeFromPersonal,
    removeFromShared,
    rateMovie,
    rateWantToSee,
    scheduleMovie,
    toggleWatched,
  } = useWatchlist(user?.id || '');

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch recommendations on login
  useEffect(() => {
    if (user) {
      const fetchRecommendations = async () => {
        const { data } = await supabase
          .from('recommendations')
          .select('*')
          .eq('to_user_id', user.id)
          .eq('status', 'pending');
        
        if (data && data.length > 0) {
          setSelectedRecommendation({
            movie: data[0].movie_data,
            fromUser: data[0].from_user_id
          });
        }
      };

      fetchRecommendations();
    }
  }, [user]);

  // If not logged in, show login screen
  if (!user) {
    return <LoginScreen />;
  }

  const handleAddToPersonal = async (movie: Movie) => {
    try {
      await addToPersonal.mutateAsync(movie);
      navigate('/personal');
    } catch (error) {
      console.error('Failed to add movie to personal list:', error);
      throw error;
    }
  };

  const handleAddToPersonalWatchlist = async (movie: Movie) => {
    try {
      await addToPersonalWatchlist.mutateAsync(movie);
      navigate('/watchlist');
    } catch (error) {
      console.error('Failed to add movie to personal watchlist:', error);
      throw error;
    }
  };

  const handleAddToShared = async (movie: Movie) => {
    try {
      await addToShared.mutateAsync(movie);
      navigate('/shared');
    } catch (error) {
      console.error('Failed to add movie to shared watchlist:', error);
      throw error;
    }
  };

  const handleRemoveFromPersonal = async (movieId: number) => {
    try {
      await removeFromPersonal.mutateAsync(movieId);
    } catch (error) {
      console.error('Failed to remove movie from personal list:', error);
      throw error;
    }
  };

  const handleRemoveFromShared = async (movieId: number) => {
    try {
      await removeFromShared.mutateAsync(movieId);
    } catch (error) {
      console.error('Failed to remove movie from shared list:', error);
      throw error;
    }
  };

  const handleRecommendationAction = async (accepted: boolean) => {
    if (selectedRecommendation) {
      // Update recommendation status
      await supabase
        .from('recommendations')
        .update({ status: accepted ? 'accepted' : 'rejected' })
        .eq('to_user_id', user.id)
        .eq('from_user_id', selectedRecommendation.fromUser)
        .eq('movie_data->id', selectedRecommendation.movie.id);

      // If accepted, add to personal watchlist
      if (accepted) {
        await handleAddToPersonalWatchlist(selectedRecommendation.movie);
      }

      setSelectedRecommendation(null);
    }
  };

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        location.pathname === to
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground'
      }`}
      onClick={() => setMobileMenuOpen(false)}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-auto sm:h-16">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 text-primary hover:text-primary/90">
                {mediaType === 'movies' ? (
                  <Film className="h-7 w-7" />
                ) : (
                  <Tv className="h-7 w-7" />
                )}
                <h1 className="text-xl font-bold text-foreground hidden sm:block">Bios App</h1>
              </Link>
            </div>

            {/* Media type toggle */}
            <div className="hidden sm:block">
              <MediaTypeToggle
                type={mediaType}
                onChange={setMediaType}
              />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden sm:flex space-x-2">
              <NavLink to="/personal" icon={BookmarkCheck}>Personal List</NavLink>
              <NavLink to="/profile" icon={User}>Profile</NavLink>
              <NavLink to="/recommendations" icon={Sparkles}>For You</NavLink>
              <NavLink to="/watchlist" icon={Heart}>Watchlist</NavLink>
              <NavLink to="/watched" icon={CheckCircle}>Watched</NavLink>
              <NavLink to="/shared" icon={Users}>Shared</NavLink>
            </nav>

            <UserMenu />
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-background">
            <div className="container py-2 space-y-1">
              {/* Media type toggle for mobile */}
              <div className="py-2">
                <MediaTypeToggle
                  type={mediaType}
                  onChange={setMediaType}
                />
              </div>
              <NavLink to="/personal" icon={BookmarkCheck}>Personal List</NavLink>
              <NavLink to="/profile" icon={User}>Profile</NavLink>
              <NavLink to="/recommendations" icon={Sparkles}>For You</NavLink>
              <NavLink to="/watchlist" icon={Heart}>Watchlist</NavLink>
              <NavLink to="/watched" icon={CheckCircle}>Watched</NavLink>
              <NavLink to="/shared" icon={Users}>Shared</NavLink>
            </div>
          </div>
        )}

        {/* Global search bar */}
        <div className="container py-3 px-4">
          <MovieSearch
            onMovieSelect={handleAddToPersonalWatchlist}
            onAddToPersonal={handleAddToPersonal}
            onAddToShared={handleAddToShared}
          />
        </div>
      </header>

      <main className="container py-4 px-4">
        {selectedRecommendation && (
          <MovieModal
            movie={selectedRecommendation.movie}
            onClose={() => handleRecommendationAction(false)}
            onAddToPersonal={() => handleAddToPersonal(selectedRecommendation.movie)}
            onAddToPersonalWatchlist={() => handleRecommendationAction(true)}
            onAddToShared={() => handleAddToShared(selectedRecommendation.movie)}
            fromUser={selectedRecommendation.fromUser}
          />
        )}

        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-6">
                <ScheduleDashboard 
                  movies={sharedWatchlist?.map(sw => ({
                    movie: sw.movie_data,
                    scheduledFor: sw.scheduled_for,
                    averageRating: sw.averageWantToSeeRating,
                    voteCount: sw.voteCount
                  })) ?? []}
                />
                <WeeklyActivity />
                <NowPlayingMovies />
                <UpcomingMovies />
              </div>
            }
          />
          <Route
            path="/personal"
            element={
              <MovieList
                title="Personal List"
                description="Movies you've watched and rated"
                movies={personalList?.map(pw => ({
                  movie: pw.movie_data,
                  rating: ratings?.find(r => r.movie_id === pw.movie_id)?.rating,
                  addedBy: pw.user_id,
                  watched: pw.watched
                })) ?? []}
                onRate={(movieId, rating) => rateMovie.mutate({ movieId, rating })}
                onAddToShared={handleAddToShared}
                onRemove={handleRemoveFromPersonal}
                onToggleWatched={toggleWatched.mutateAsync}
                isShared={false}
                showFilters={true}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <div className="card p-6">
                <h2 className="text-2xl font-semibold mb-6">Personal Profile</h2>
                <PersonalProfile 
                  movies={personalList?.map(pw => ({
                    movie: pw.movie_data,
                    rating: ratings?.find(r => r.movie_id === pw.movie_id)?.rating
                  })) ?? []}
                />
              </div>
            }
          />
          <Route
            path="/recommendations"
            element={
              <div className="card p-6">
                <h2 className="text-2xl font-semibold mb-6">Recommended Movies</h2>
                <MovieRecommendations 
                  watchedMovies={personalList?.map(pw => ({
                    movie: pw.movie_data,
                    rating: ratings?.find(r => r.movie_id === pw.movie_id)?.rating
                  })) ?? []}
                  onAddToPersonal={handleAddToPersonal}
                  onAddToPersonalWatchlist={handleAddToPersonalWatchlist}
                  onAddToShared={handleAddToShared}
                />
              </div>
            }
          />
          <Route
            path="/watchlist"
            element={
              <MovieList
                title="Personal Watchlist"
                description="Movies you want to watch"
                movies={personalWatchlist?.map(pw => ({
                  movie: pw.movie_data,
                  rating: pw.want_to_see_rating,
                  addedBy: pw.user_id
                })) ?? []}
                onRate={(movieId, rating) => rateWantToSee.mutate({ movieId, rating })}
                onAddToShared={handleAddToShared}
                onRemove={handleRemoveFromPersonal}
                isShared={false}
                ratingLabel="Want to see"
              />
            }
          />
          <Route
            path="/watched"
            element={
              <div className="card p-6">
                <h2 className="text-2xl font-semibold mb-6">Watched Movies</h2>
                <WatchedMovies movies={watchedMovies || []} />
              </div>
            }
          />
          <Route
            path="/shared"
            element={
              <MovieList
                title="Shared Watchlist"
                description="Movies to watch together"
                movies={sharedWatchlist?.map(sw => ({
                  movie: sw.movie_data,
                  scheduledFor: sw.scheduled_for,
                  addedBy: sw.added_by,
                  rating: sw.userWantToSeeRating,
                  averageRating: sw.averageWantToSeeRating,
                  voteCount: sw.voteCount
                })) ?? []}
                onRate={(movieId, rating) => rateWantToSee.mutate({ movieId, rating })}
                onSchedule={(movieId, date) => scheduleMovie.mutate({ movieId, date })}
                onRemove={handleRemoveFromShared}
                isShared={true}
                ratingLabel="Want to see"
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
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