import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Sparkles, LogOut, User, LogIn, AlertOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Quick Discreet Exit function for user safety
  const handleQuickExit = () => {
    // Overwrite history and navigate immediately to a neutral everyday website
    window.location.replace('https://weather.com');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-brand-200/60">
      {/* Top Safety Bar for Discreet Exit */}
      <div className="bg-amber-50 border-b border-amber-200/50 px-4 py-1.5 text-xs text-amber-900 flex justify-between items-center">
        <div className="flex items-center gap-1.5 font-medium">
          <Shield className="w-3.5 h-3.5 text-amber-700" />
          <span>Your privacy & safety matter. If you need to quickly leave this page:</span>
        </div>
        <button
          onClick={handleQuickExit}
          title="Instantly opens Weather.com"
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-0.5 rounded shadow-sm transition text-xs"
        >
          <AlertOctagon className="w-3 h-3" />
          Quick Safe Exit
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-700/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-brand-900 tracking-tight">Know What's Yours</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 border border-brand-200">
                  ruthAI
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block -mt-0.5">Empathetic Divorce Financial Discovery</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link 
              to="/" 
              className={`hover:text-brand-800 transition ${location.pathname === '/' ? 'text-brand-800 font-semibold' : ''}`}
            >
              Overview
            </Link>
            <Link 
              to="/dashboard" 
              className={`hover:text-brand-800 transition ${location.pathname === '/dashboard' ? 'text-brand-800 font-semibold' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/onboarding" 
              className={`hover:text-brand-800 transition ${location.pathname === '/onboarding' ? 'text-brand-800 font-semibold' : ''}`}
            >
              Onboarding
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-brand-200 rounded-full px-3 py-1.5 shadow-sm hover:border-brand-400 transition"
                >
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  <span className="max-w-[120px] truncate">{currentUser.displayName || currentUser.email}</span>
                  {currentUser.isDemo && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 rounded-full">Demo</span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-brand-800 rounded-full hover:bg-brand-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="text-xs sm:text-sm font-medium text-slate-700 hover:text-brand-800 px-3 py-2 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="text-xs sm:text-sm font-semibold bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
