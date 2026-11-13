import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSearch, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Sparkles,
  HelpCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { currentUser, loginWithDemo } = useAuth();

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Soft decorative gradient backdrop */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.brand.100),theme(colors.slate.50))] opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-900 border border-brand-200 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Google AI Hackathon for Women's Social Good</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              If he handled all the money,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-amber-700">
                you can still do this.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
              Divorce hits women's finances hardest when they were kept out of the accounts. 
              <strong> Know What's Yours</strong> reconstructs your household finances from whatever messy documents you can find—citing every account, debt, and entitlement so you don't get shortchanged.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to={currentUser ? "/dashboard" : "/auth?mode=signup"}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-base"
              >
                <span>{currentUser ? "Go to Your Dashboard" : "Start Your Free Evaluation"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              {!currentUser && (
                <Link
                  to="/dashboard"
                  onClick={() => loginWithDemo()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl border border-slate-300 shadow-sm transition-all text-base"
                >
                  <Eye className="w-4 h-4 text-brand-600" />
                  <span>Try Demo Account (Instant Access)</span>
                </Link>
              )}
            </div>

            {/* Privacy trust banner */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                100% Private & Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Zero Training on Your Personal Files
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                Page-by-Page Citations
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The Divorce Gender Gap: Shocking Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl mb-10">
            <span className="text-brand-300 uppercase font-semibold text-xs tracking-wider">The Reality Nobody Talks About</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">
              Why traditional divorce tools fail women
            </h2>
            <p className="text-brand-100 text-sm sm:text-base mt-2">
              Most calculators ask: <em>"What is your fair share?"</em> and require you to type in what you own. But if you were never given the passwords or tax returns, you can't type what you don't know exists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-800/60 border border-brand-700/60 rounded-2xl p-6">
              <div className="text-4xl font-extrabold text-amber-300 mb-2">41% vs 23%</div>
              <h3 className="font-semibold text-white text-base mb-1">Severe Income Drop</h3>
              <p className="text-xs text-brand-200 leading-relaxed">
                Women's household income drops by an average of 41% after divorce, nearly double the 23% decline for men (U.S. GAO Study).
              </p>
            </div>

            <div className="bg-brand-800/60 border border-brand-700/60 rounded-2xl p-6">
              <div className="text-4xl font-extrabold text-amber-300 mb-2">-41%</div>
              <h3 className="font-semibold text-white text-base mb-1">Retirement Savings Hit</h3>
              <p className="text-xs text-brand-200 leading-relaxed">
                Women over 50 face a 41% drop in retirement savings, while needing funds to stretch 21+ more years on average.
              </p>
            </div>

            <div className="bg-brand-800/60 border border-brand-700/60 rounded-2xl p-6">
              <div className="text-4xl font-extrabold text-amber-300 mb-2">1 in 2</div>
              <h3 className="font-semibold text-white text-base mb-1">Financial Reliance</h3>
              <p className="text-xs text-brand-200 leading-relaxed">
                More than half of divorces involve a spouse who had zero visibility into household accounts, investments, or debt obligations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-brand-700 font-semibold text-xs tracking-wider uppercase">How It Works</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            The 4 Pillars of Financial Clarity
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Built to take you from overwhelmed and in the dark to equipped and legally prepared.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1: Financial Discovery Engine (Showpiece) */}
          <div className="bg-white border border-brand-200/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-6">
              <FileSearch className="w-6 h-6" />
            </div>
            <div className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 mb-3">
              Showpiece AI Engine
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              1. Multimodal Document Discovery
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Upload whatever paperwork you can access: messy tax returns, pay stubs, bank statements, or mortgage slips. 
              Gemini cross-references Schedule B interest items and dividend lines to surface hidden accounts, undisclosed brokerage funds, and missing filings.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Every claim cited to the exact document page
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Detects gaps and documents referenced but missing
              </li>
            </ul>
          </div>

          {/* Pillar 2: Entitlements Checklist */}
          <div className="bg-white border border-brand-200/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 mb-3">
              State-Specific Rights
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              2. "What You May Be Entitled To" Checklist
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Plain-language guidance tailored to your jurisdiction (Community Property vs Equitable Distribution). 
              Understand rights to 401(k) / pension division through QDROs, spousal maintenance duration, COBRA health continuation, and marital debt protection.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Plain-language legal explanations, no jargon
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Interactive checklist that tracks your readiness
              </li>
            </ul>
          </div>

          {/* Pillar 3: Post-Divorce Life Projection */}
          <div className="bg-white border border-brand-200/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 mb-3">
              5-Year Scenario Simulator
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              3. "Can I Afford The House?" Life Projection
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Women are often steered toward fighting for the marital home, only to find property taxes, insurance, and maintenance unaffordable on a single income. 
              Our simulator models month-by-month cash flows under 3 realistic settlement scenarios.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Simulates child care costs and spousal support phaseouts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Refinancing rate calculator and cash-buffer targets
              </li>
            </ul>
          </div>

          {/* Pillar 4: Lawyer Prep Brief */}
          <div className="bg-white border border-brand-200/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <div className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 mb-3">
              Save $400/Hour
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              4. Lawyer Consultation Dossier
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Don't waste expensive billable hours having an attorney search for basic document references. 
              Download a 2-page brief summarizing discovered accounts, red flags, and 5 targeted questions to ask your counsel on day one.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Instant printable PDF / Markdown export
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Grounded questions specific to your state laws
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Grounded Story Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-700">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-amber-950">
                "She walked room to room cataloguing every household item, but had no idea what was in the 401(k)."
              </h3>
              <p className="text-sm text-amber-900/80 leading-relaxed">
                This project was inspired by a real story: a mother of two going through a divorce who was never the one handling family investments or tax filings. 
                She spent hours counting furniture for attorneys, while missing out on significant settlement entitlements simply because nobody showed her where to look.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-brand-800">
                <span>RuthAI was built so no woman has to face that uncertainty alone.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900">
          Ready to take control of your financial story?
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Start your confidential evaluation today. It takes less than 3 minutes to complete the initial assessment.
        </p>
        <div className="pt-2">
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition text-base"
          >
            <span>Begin Guided Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FileCheckIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="m9 15 2 2 4-4"/>
    </svg>
  );
}
