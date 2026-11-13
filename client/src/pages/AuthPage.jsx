import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, Sparkles, Lock, ArrowRight, Check, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSmoothNavigate } from '../context/TransitionContext';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const { signIn, signUp, loginWithGoogle, loginWithDemo, currentUser } = useAuth();
  const navigate = useNavigate();
  const smoothNavigate = useSmoothNavigate();

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSubmitted(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name);
        smoothNavigate('/onboarding');
      } else {
        await signIn(email, password);
        smoothNavigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    setSubmitted(true);
    try {
      await loginWithGoogle();
      smoothNavigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Google Sign-In failed: ' + err.message);
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    loginWithDemo();
    smoothNavigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] bg-[#FAF7F2] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-7 bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl p-8 sm:p-10 shadow-serene animate-fade-in">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#EDE6DD] text-[#4F5E47] mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] tracking-tight">
            {isSignUp ? 'Create your private account' : 'Welcome back to Sparrow'}
          </h2>
          <p className="text-xs sm:text-sm text-[#5F635E]">
            {isSignUp
              ? 'Your private financial discovery workspace begins here.'
              : 'Log in to access your document vault and divorce projections.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#F4EFEA] p-1 rounded-xl text-sm font-medium text-[#5F635E] border border-[#E2DAD0]/60">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              !isSignUp ? 'bg-[#FFFFFF] text-[#1c1c19] shadow-serene' : 'hover:text-[#1c1c19]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              isSignUp ? 'bg-[#FFFFFF] text-[#1c1c19] shadow-serene' : 'hover:text-[#1c1c19]'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FAF2F0] border border-[#D9B3AC] text-[#A86851] text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Instant Access for Evaluator / Hackathon Demo */}
        <button
          type="button"
          onClick={handleDemoAccess}
          className="w-full flex items-center justify-center gap-2 bg-[#F4EFEA] hover:bg-[#EDE6DD] text-[#4F5E47] font-medium py-2.5 px-4 rounded-xl border border-[#8A9A7B]/60 transition text-sm"
        >
          <Eye className="w-4 h-4 text-[#A07E5F]" />
          <span>One-Click Demo Mode (Instant Evaluation)</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E2DAD0]"></div>
          <span className="flex-shrink mx-4 text-[#5F635E] text-xs font-medium uppercase tracking-wider">or sign in with</span>
          <div className="flex-grow border-t border-[#E2DAD0]"></div>
        </div>

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-[#F4EFEA] text-[#4F5E47] font-medium py-2.5 px-4 rounded-xl border border-[#8A9A7B] transition text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>Continue with Google Dev Account</span>
        </button>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                Your Preferred Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2DAD0] text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F] text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2DAD0] text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2DAD0] text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#4F5E47] hover:bg-[#384631] text-[#FAF7F2] font-medium py-3 px-4 rounded-xl transition text-sm disabled:opacity-50"
          >
            <span>{isSignUp ? 'Create Private Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Privacy Note */}
        <div className="pt-2 text-center text-xs text-[#5F635E] flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#4F5E47]" />
          <span>Your session is private. Use the Quick Safe Exit bar anytime.</span>
        </div>
      </div>
    </div>
  );
}
