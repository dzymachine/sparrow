import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Sparkles, LogOut, User, LogIn, AlertOctagon, Eye, EyeOff, RotateCcw, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDiscovery } from '../context/DiscoveryContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { workspace, togglePrivacyMode, resetWorkspace } = useDiscovery();
  const navigate = useNavigate();
  const location = useLocation();

  // Quick Discreet Exit function for user safety
  const handleQuickExit = () => {
    // Overwrite history and navigate immediately to weather.com
    window.location.replace('https://weather.com');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#E2DBD0]">
      {/* Top Safety Bar for Discreet Exit */}
      <div className="bg-[#F4EFEB] border-b border-[#E2DBD0] px-4 py-1.5 text-xs text-[#5C4E43] flex justify-between items-center">
        <div className="flex items-center gap-2 font-normal">
          <Shield className="w-3.5 h-3.5 text-[#435C4D]" />
          <span>Confidential & discreet · Press <kbd className="px-1 py-0.2 bg-white rounded border border-[#E2DBD0] text-[10px] font-mono">Esc</kbd> twice quickly or click to safely leave:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePrivacyMode}
            title={workspace.privacyMode ? 'Show numeric amounts' : 'Mask sensitive numeric amounts'}
            className="flex items-center gap-1 text-[#5C4E43] hover:text-[#261E19] text-xs px-2 py-0.5 rounded border border-[#E2DBD0] bg-white transition"
          >
            {workspace.privacyMode ? <EyeOff className="w-3 h-3 text-amber-800" /> : <Eye className="w-3 h-3 text-[#5C4E43]" />}
            <span>{workspace.privacyMode ? 'Discreet Mode Active' : 'Discreet Mode'}</span>
          </button>

          <button
            onClick={handleQuickExit}
            title="Instantly redirects to Weather.com and clears session"
            className="flex items-center gap-1 bg-[#7e4d41] hover:bg-[#5c3228] text-white font-medium px-2.5 py-0.5 rounded shadow-xs transition text-xs"
          >
            <AlertOctagon className="w-3 h-3" />
            <span>Quick Safe Exit</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#435C4D] flex items-center justify-center text-white shadow-xs group-hover:bg-[#354A3E] transition">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-base text-[#261E19] tracking-tight">Sparrow</span>
                <span className="text-xs text-[#8C7D73]">·</span>
                <span className="text-xs text-[#5C4E43]">Know What's Yours</span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#5C4E43]">
            <Link 
              to="/dashboard" 
              className={`hover:text-[#261E19] transition ${location.pathname === '/dashboard' ? 'text-[#261E19] font-semibold' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/discovery" 
              className={`hover:text-[#261E19] transition ${location.pathname === '/discovery' ? 'text-[#261E19] font-semibold' : ''}`}
            >
              Financial Discovery
            </Link>
            <Link 
              to="/consult" 
              className={`hover:text-[#261E19] transition ${location.pathname === '/consult' ? 'text-[#261E19] font-semibold' : ''}`}
            >
              Consult a Pro
            </Link>
          </nav>

          {/* User actions & Reset Workspace */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={resetWorkspace}
              title="Reset all discovery test files to clean baseline"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#8C7D73] hover:text-[#261E19] border border-[#E2DBD0] rounded-lg bg-white transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#261E19] bg-white border border-[#E2DBD0] rounded-lg px-2.5 py-1 shadow-xs hover:border-[#8C7D73] transition"
                >
                  <User className="w-3.5 h-3.5 text-[#435C4D]" />
                  <span className="max-w-[110px] truncate">{currentUser.displayName || currentUser.email}</span>
                </Link>
                <Link
                  to="/settings"
                  className={`p-1.5 rounded-lg transition ${
                    location.pathname === '/settings'
                      ? 'text-[#261E19] bg-[#F4EFEB]'
                      : 'text-[#8C7D73] hover:text-[#261E19] hover:bg-[#F4EFEB]'
                  }`}
                  title="Settings"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-[#8C7D73] hover:text-[#261E19] rounded-lg hover:bg-[#F4EFEB] transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="text-xs font-medium text-[#5C4E43] hover:text-[#261E19] px-3 py-1.5 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/auth"
                  className="text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] px-3 py-1.5 rounded-lg shadow-xs transition"
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
