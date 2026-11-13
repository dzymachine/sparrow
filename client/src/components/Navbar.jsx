import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Feather, LogOut, User, Eye, EyeOff, RotateCcw, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDiscovery } from '../context/DiscoveryContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { workspace, togglePrivacyMode, resetWorkspace } = useDiscovery();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/92 backdrop-blur-md border-b border-[#4F5E47]/10">
      {/* Top Safety Bar */}
      <div className="bg-[#F4EFEA] border-b border-[#E2DAD0] px-4 py-1.5 text-xs text-[#5F635E] flex justify-between items-center">
        <div className="flex items-center gap-2 font-normal">
          <Feather className="w-3.5 h-3.5 text-[#4F5E47]" />
          <span>Confidential sanctuary</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePrivacyMode}
            title={workspace.privacyMode ? 'Show numeric amounts' : 'Mask sensitive numeric amounts'}
            className="flex items-center gap-1.5 text-[#5F635E] hover:text-[#1c1c19] text-xs px-2.5 py-0.5 rounded-full border border-[#E2DAD0] bg-white transition"
          >
            {workspace.privacyMode ? <EyeOff className="w-3 h-3 text-[#A07E5F]" /> : <Eye className="w-3 h-3 text-[#5F635E]" />}
            <span>{workspace.privacyMode ? 'Discreet Mode Active' : 'Discreet Mode'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#4F5E47] flex items-center justify-center text-[#FAF7F2] shadow-sm group-hover:bg-[#384631] transition">
              <Feather className="w-4 h-4 text-[#FAF7F2]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-xl text-[#1c1c19] tracking-tight">Sparrow</span>
                <span className="text-xs text-[#A07E5F]">·</span>
                <span className="text-xs text-[#5F635E]">Know What's Yours</span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#5F635E]">
            <Link 
              to="/discovery" 
              className={`hover:text-[#1c1c19] transition ${location.pathname === '/discovery' ? 'text-[#384631] font-semibold' : ''}`}
            >
              Financial Discovery
            </Link>
            <Link 
              to="/checklist" 
              className={`hover:text-[#1c1c19] transition ${location.pathname === '/checklist' ? 'text-[#384631] font-semibold' : ''}`}
            >
              Document Checklist
            </Link>
            <Link 
              to="/consult" 
              className={`hover:text-[#1c1c19] transition ${location.pathname === '/consult' ? 'text-[#384631] font-semibold' : ''}`}
            >
              Consult a Pro
            </Link>
          </nav>

          {/* User actions & Reset Workspace */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={resetWorkspace}
              title="Reset all discovery test files to clean baseline"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#5F635E] hover:text-[#1c1c19] border border-[#E2DAD0] rounded-full bg-white transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#2C332A] bg-white border border-[#E2DAD0] rounded-full px-3 py-1 hover:border-[#A07E5F] transition"
                >
                  <User className="w-3.5 h-3.5 text-[#4F5E47]" />
                  <span className="max-w-[110px] truncate">{currentUser.displayName || currentUser.email}</span>
                </Link>
                <Link
                  to="/settings"
                  className={`p-1.5 rounded-full transition ${
                    location.pathname === '/settings'
                      ? 'text-[#384631] bg-[#EDE6DD]'
                      : 'text-[#5F635E] hover:text-[#1c1c19] hover:bg-[#F4EFEA]'
                  }`}
                  title="Settings"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-[#5F635E] hover:text-[#1c1c19] rounded-full hover:bg-[#F4EFEA] transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="text-xs font-medium text-[#5F635E] hover:text-[#1c1c19] px-3 py-1.5 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/auth"
                  className="text-xs font-medium text-[#FAF7F2] bg-[#4F5E47] hover:bg-[#384631] px-4 py-1.5 rounded-full transition"
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
