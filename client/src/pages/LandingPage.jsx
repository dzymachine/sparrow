import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  TrendingUp,
  FileText,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Feather,
  AlertOctagon,
} from 'lucide-react';
import { useSmoothNavigate } from '../context/TransitionContext';
import {
  VideoBackground,
  SpotlightCard,
  ShimmerButton,
  BlurFade,
} from '../components/LandingEffects';

export default function LandingPage() {
  const smoothNavigate = useSmoothNavigate();

  const handleEnterPlatform = () => {
    smoothNavigate('/auth?mode=login');
  };

  const handleSmoothLink = (e, to) => {
    e.preventDefault();
    smoothNavigate(to);
  };

  const handleQuickExit = () => {
    window.location.replace('https://weather.com');
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-white">
      {/* Full-Page Replaying Veo Video Background: Sparrow Taking Flight */}
      <VideoBackground
        videoSrc="/sparrow-flight.mp4"
        posterSrc="/sparrow-poster.jpg"
      />

      {/* Minimal Floating Top Bar: Brand Left + Small Sign Up / Login Top Right */}
      <header className="relative z-20 w-full">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-200 group-hover:bg-white/25 transition">
              <Feather className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-base text-white tracking-tight">
                Sparrow
              </span>
              <span className="hidden sm:inline text-xs text-white/40">·</span>
              <span className="hidden sm:inline text-xs text-stone-200/80">
                Know What&apos;s Yours
              </span>
            </div>
          </Link>

          {/* Small Sign Up / Login + Safe Exit on Top Right */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickExit}
              title="Quick Safe Exit to Weather.com"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-200/90 hover:text-white bg-black/25 hover:bg-[#7e4d41]/80 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-lg transition"
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Safe Exit</span>
            </button>

            <Link
              to="/auth?mode=login"
              onClick={(e) => handleSmoothLink(e, '/auth?mode=login')}
              className="text-xs font-medium text-stone-100 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg transition"
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              onClick={(e) => handleSmoothLink(e, '/auth?mode=signup')}
              className="text-xs font-semibold text-[#1C1512] bg-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg shadow-md transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Foreground Content Layer */}
      <div className="relative z-10 space-y-28 pb-24">
        {/* 1. Centered Fullscreen Hero over Replaying Veo Video */}
        <section className="relative min-h-[calc(100vh-5.5rem)] flex flex-col justify-center pt-4 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl mx-auto text-center space-y-7">
              {/* Editorial Metaphor Headline */}
              <BlurFade delay={50}>
                <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-semibold text-white tracking-tight leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
                  It&apos;s scary to fly away{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-[#ADC2B5]">
                    for the first time.
                  </span>
                </h1>
              </BlurFade>

              {/* Sparrow Marriage-Flight Quip / Metaphor */}
              <BlurFade delay={150}>
                <p className="text-lg sm:text-xl text-stone-100/95 leading-relaxed max-w-2xl mx-auto font-normal drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
                  Leaving a marriage—especially when you were kept out of the accounts—feels like
                  stepping off a branch into open air.{' '}
                  <strong className="text-white font-semibold">Sparrow</strong> gives you steady
                  wings before you leap: uncovering hidden assets, mapping what&apos;s yours, and
                  helping you land safely.
                </p>
              </BlurFade>

              {/* Centered Entry into the Platform */}
              <BlurFade delay={250}>
                <div className="flex items-center justify-center pt-3">
                  <ShimmerButton
                    type="button"
                    onClick={handleEnterPlatform}
                    className="w-full sm:w-auto px-9 py-4 text-base"
                  >
                    <span>Enter Sparrow Platform</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </ShimmerButton>
                </div>
              </BlurFade>
            </div>
          </div>

          {/* Subtle Scroll Indicator */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/70 text-[11px] tracking-widest uppercase">
            <span>Why Sparrow</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </section>

        {/* 2. The Divorce Gender Gap: Glassmorphic Statistics */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlurFade>
            <SpotlightCard className="p-8 sm:p-12">
              <div className="max-w-3xl mb-10">
                <span className="text-amber-200/90 uppercase font-semibold text-xs tracking-widest">
                  The Reality Nobody Talks About
                </span>
                <h2 className="text-2xl sm:text-4xl font-semibold text-white mt-2">
                  Why traditional divorce tools fail women
                </h2>
                <p className="text-stone-200/90 text-sm sm:text-base mt-3 leading-relaxed">
                  Most calculators ask: <em>&ldquo;What is your fair share?&rdquo;</em> and require you
                  to type in what you own. But if you were never given the passwords or tax returns,
                  you can&apos;t type what you don&apos;t know exists.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/15 rounded-2xl p-6 hover:bg-white/10 transition">
                  <div className="text-4xl font-bold text-amber-200 font-mono mb-2">
                    41% vs 23%
                  </div>
                  <h3 className="font-semibold text-white text-base mb-1.5">
                    Severe Income Drop
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Women&apos;s household income drops by an average of 41% after divorce, nearly
                    double the 23% decline for men (U.S. GAO Study).
                  </p>
                </div>

                <div className="bg-white/5 border border-white/15 rounded-2xl p-6 hover:bg-white/10 transition">
                  <div className="text-4xl font-bold text-amber-200 font-mono mb-2">-41%</div>
                  <h3 className="font-semibold text-white text-base mb-1.5">
                    Retirement Savings Hit
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Women over 50 face a 41% drop in retirement savings, while needing funds to
                    stretch 21+ more years on average.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/15 rounded-2xl p-6 hover:bg-white/10 transition">
                  <div className="text-4xl font-bold text-amber-200 font-mono mb-2">1 in 2</div>
                  <h3 className="font-semibold text-white text-base mb-1.5">
                    Financial Reliance
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    More than half of divorces involve a spouse who had zero visibility into
                    household accounts, investments, or debt obligations.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </BlurFade>
        </section>

        {/* 3. The 4 Core Pillars: 21st.dev Bento Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlurFade>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-amber-200 font-semibold text-xs tracking-widest uppercase">
                How Sparrow Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mt-2">
                The 4 Pillars of Financial Clarity
              </h2>
              <p className="text-stone-200/85 text-sm sm:text-base mt-3">
                Built to take you from overwhelmed and in the dark to equipped and legally prepared.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Pillar 1 */}
            <BlurFade delay={50}>
              <SpotlightCard className="p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-200/15 border border-amber-200/30 text-amber-200 flex items-center justify-center">
                    <FileSearch className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-200/15 text-amber-100 border border-amber-200/25">
                    Showpiece AI Engine
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  1. Multimodal Document Discovery
                </h3>
                <p className="text-stone-200/90 text-sm leading-relaxed mb-5">
                  Upload whatever paperwork you can access: messy tax returns, pay stubs, bank
                  statements, or mortgage slips. Gemini cross-references Schedule B interest items
                  and dividend lines to surface hidden accounts, undisclosed brokerage funds, and
                  missing filings.
                </p>
                <ul className="text-xs text-stone-300 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Every claim cited to the exact document page</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Detects gaps and documents referenced but missing</span>
                  </li>
                </ul>
              </SpotlightCard>
            </BlurFade>

            {/* Pillar 2 */}
            <BlurFade delay={120}>
              <SpotlightCard className="p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#ADC2B5]/15 border border-[#ADC2B5]/30 text-[#ADC2B5] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#ADC2B5]/15 text-[#D1DDD6] border border-[#ADC2B5]/25">
                    State-Specific Rights
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  2. &ldquo;What You May Be Entitled To&rdquo; Checklist
                </h3>
                <p className="text-stone-200/90 text-sm leading-relaxed mb-5">
                  Plain-language guidance tailored to your jurisdiction (Community Property vs
                  Equitable Distribution). Understand rights to 401(k) / pension division through
                  QDROs, spousal maintenance duration, COBRA health continuation, and marital debt
                  protection.
                </p>
                <ul className="text-xs text-stone-300 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Plain-language legal explanations, no jargon</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Interactive checklist that tracks your readiness</span>
                  </li>
                </ul>
              </SpotlightCard>
            </BlurFade>

            {/* Pillar 3 */}
            <BlurFade delay={190}>
              <SpotlightCard className="p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-sky-300/15 border border-sky-300/30 text-sky-200 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-300/15 text-sky-100 border border-sky-300/25">
                    5-Year Scenario Simulator
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  3. &ldquo;Can I Afford The House?&rdquo; Life Projection
                </h3>
                <p className="text-stone-200/90 text-sm leading-relaxed mb-5">
                  Women are often steered toward fighting for the marital home, only to find property
                  taxes, insurance, and maintenance unaffordable on a single income. Our simulator
                  models month-by-month cash flows under 3 realistic settlement scenarios.
                </p>
                <ul className="text-xs text-stone-300 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Simulates child care costs and spousal support phaseouts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Refinancing rate calculator and cash-buffer targets</span>
                  </li>
                </ul>
              </SpotlightCard>
            </BlurFade>

            {/* Pillar 4 */}
            <BlurFade delay={260}>
              <SpotlightCard className="p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-300/15 border border-purple-300/30 text-purple-200 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-300/15 text-purple-100 border border-purple-300/25">
                    Save $400/Hour
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  4. Lawyer Consultation Dossier
                </h3>
                <p className="text-stone-200/90 text-sm leading-relaxed mb-5">
                  Don&apos;t waste expensive billable hours having an attorney search for basic
                  document references. Download a 2-page brief summarizing discovered accounts, red
                  flags, and 5 targeted questions to ask your counsel on day one.
                </p>
                <ul className="text-xs text-stone-300 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Instant printable PDF / Markdown export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ADC2B5] shrink-0" />
                    <span>Grounded questions specific to your state laws</span>
                  </li>
                </ul>
              </SpotlightCard>
            </BlurFade>
          </div>
        </section>

        {/* 4. Grounded Story Callout */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlurFade>
            <SpotlightCard className="p-8 sm:p-10 bg-[#241A14]/65 border-amber-200/25">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="p-3.5 bg-amber-200/15 border border-amber-200/25 rounded-2xl text-amber-200 shrink-0">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug">
                    &ldquo;She walked room to room cataloguing every household item, but had no idea
                    what was in the 401(k).&rdquo;
                  </h3>
                  <p className="text-sm text-stone-200/90 leading-relaxed">
                    This project was inspired by a real story: a mother of two going through a
                    divorce who was never the one handling family investments or tax filings. She
                    spent hours counting furniture for attorneys, while missing out on significant
                    settlement entitlements simply because nobody showed her where to look.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-amber-200">
                    <Feather className="w-3.5 h-3.5" />
                    <span>Sparrow was built so no woman has to face that uncertainty alone.</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </BlurFade>
        </section>

        {/* 5. Bottom CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BlurFade>
            <SpotlightCard className="p-10 sm:p-14 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-semibold text-white">
                Ready to take flight on your own terms?
              </h2>
              <p className="text-stone-200/90 text-sm sm:text-base max-w-xl mx-auto">
                Enter Sparrow for free and uncover what&apos;s yours in under 3 minutes.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <ShimmerButton
                  type="button"
                  onClick={handleEnterPlatform}
                  className="w-full sm:w-auto px-8 py-3.5 text-base"
                >
                  <span>Enter Sparrow Platform</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </ShimmerButton>

                <Link
                  to="/consult"
                  onClick={(e) => handleSmoothLink(e, '/consult')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold px-6 py-3.5 rounded-xl border border-white/25 transition text-base"
                >
                  <span>Consult a Professional</span>
                  <ArrowRight className="w-4 h-4 text-amber-200" />
                </Link>
              </div>
            </SpotlightCard>
          </BlurFade>
        </section>
      </div>
    </div>
  );
}
