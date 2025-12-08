import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Scan, Trophy, Backpack, Settings, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Pokeball from "./Pokeball";

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();

  // --- DETECCIÓN AUTOMÁTICA DE PREMIOS ---
useEffect(() => {
  if (!profile?.id) return;

  let isChecking = false;

  const checkAwards = async () => {
    if (isChecking) return;
    isChecking = true;

    const { data, error } = await supabase
      .from("award_winners")
      .select(`
        id,
        viewed,
        award_id,
        award:awards(
          id,
          category,
          description,
          pokemon_gif,
          total_winners,
          created_at
        )
      `)
      .eq("user_id", profile.id)
      .eq("viewed", false)
      .order("created_at", { ascending: true })
      .limit(1);

    isChecking = false;

    if (error) {
      console.error("Error checking notifications:", error);
      return;
    }

    const pending = data?.[0];

    if (pending?.award) {
      if (location.pathname !== "/award-notification") {
        navigate("/award-notification", {
          state: {
            award: pending.award,
            awardWinnerId: pending.id, 
          },
        });
      }
    }
  };

  checkAwards();

  const interval = setInterval(checkAwards, 5000);
  return () => clearInterval(interval);
}, [profile?.id, location.pathname]);

  const navItems = [
    { path: "/scan", icon: Scan, label: "Escanear" },
    { path: "/pokedex", icon: Backpack, label: "Pokédex" },
    { path: "/leaderboard", icon: Trophy, label: "Ranking" },
    { path: "/guess", icon: Sparkles, label: "Adivinar" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      {/* TOP BAR */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Pokeball size={32} />
            <span className="font-display text-xs text-pokemon-yellow">PokeCapture</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="p-2 rounded-full bg-muted hover:bg-muted/80">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Link>
            )}

            <motion.img
              src={profile?.avatar_url}
              className="w-9 h-9 rounded-full border border-border object-cover"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-muted hover:bg-destructive/20"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* BOTTOM NAV */}
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
                <Link key={path} to={path} className="flex flex-col items-center gap-1">
                  <div
                    className={`p-2 rounded-xl ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>
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
