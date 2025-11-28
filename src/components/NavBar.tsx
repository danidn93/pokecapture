import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scan, Trophy, Backpack, Settings, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Pokeball from './Pokeball';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();

  const navItems = [
    { path: '/scan', icon: Scan, label: 'Escanear' },
    { path: '/pokedex', icon: Backpack, label: 'Pokédex' },
    { path: '/leaderboard', icon: Trophy, label: 'Ranking' },
    { path: '/guess', icon: Sparkles, label: 'Adivinar' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Top bar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Pokeball size={32} />
            <span className="font-display text-xs text-pokemon-yellow">
              PokeCapture
            </span>
          </Link>

          <div className="flex items-center gap-3">

            {isAdmin && (
              <Link
                to="/admin"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Link>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-2">
              {profile?.avatar_url ? (
                <motion.img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-border shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {profile?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}

              <span className="text-sm font-body text-foreground hidden sm:block">
                {profile?.username || 'Entrenador'}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-muted hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Bottom navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-t border-border safe-area-bottom"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;

              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center gap-1 py-2 px-4"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-glow-red'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <span
                    className={`text-xs font-body ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default NavBar;
