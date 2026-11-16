import React, { useState } from 'react';
import {
  Feather,
  FolderOpen,
  KeyRound,
  BadgeCheck,
  Unlock,
  Cpu,
  GitBranch,
  Scale,
  Wallet,
  LineChart,
  CheckCircle2,
  Sunrise,
  Eye,
  Home,
  HeartPulse,
  ClipboardCheck,
  FileDown,
  FileText,
  ListChecks,
  PiggyBank
} from 'lucide-react';

interface PerchFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PerchConfig {
  id: number;
  label: string;
  shortTitle: string;
  subtitle: string;
  statusTitle: string;
  left: string;
  fill: string;
  tilt: string;
  stageLabel: string;
  heading: string;
  badgeIcon: React.ReactNode;
  badgeText: string;
  stageIcon: React.ReactNode;
  description: string;
  features: [PerchFeature, PerchFeature];
  footerIcon: React.ReactNode;
  footerNote: string;
  nextPerch: number;
  nextLabel: string;
}

const PERCHES: PerchConfig[] = [
  {
    id: 1,
    label: 'Perch 01',
    shortTitle: 'Quiet Discovery',
    subtitle: 'Groundwork',
    statusTitle: 'Perch 01 • Quiet Discovery',
    left: '12.5%',
    fill: '0%',
    tilt: '0deg',
    stageLabel: 'Active Stage • Step 1',
    heading: 'Perch 01: Quiet Discovery',
    stageIcon: <FolderOpen className="w-6 h-6" />,
    badgeIcon: <KeyRound className="w-4 h-4 text-[#546347]" />,
    badgeText: 'No Passwords Required',
    description:
      'In many partnerships, one person unconsciously takes on all logins, passwords, and tax preparations. Sparrow shows you how to obtain certified public documents, tax returns, and basic account histories independently—without alerting your spouse or triggering conflict.',
    features: [
      {
        icon: <BadgeCheck className="w-4 h-4 text-[#546347]" />,
        title: 'IRS Form 1040 Guide',
        description:
          'Understand Page 1 lines 8 & 9 (Schedule 1) to identify undisclosed investment accounts and passive business distributions without asking for credentials.'
      },
      {
        icon: <Unlock className="w-4 h-4 text-[#546347]" />,
        title: 'Direct Access Channels',
        description:
          'Learn legal steps to request your own joint bank records directly from institutions with simple primary identification at any physical branch.'
      }
    ],
    footerIcon: <Cpu className="w-4 h-4 text-[#546347]" />,
    footerNote: 'Local memory autosave: Nothing is stored in cloud databases.',
    nextPerch: 2,
    nextLabel: 'Advance to Perch 02: Asset Mapping →'
  },
  {
    id: 2,
    label: 'Perch 02',
    shortTitle: 'Asset Mapping',
    subtitle: 'Clarity',
    statusTitle: 'Perch 02 • Asset Mapping',
    left: '37.5%',
    fill: '33.3%',
    tilt: '4deg',
    stageLabel: 'Active Stage • Step 2',
    heading: 'Perch 02: Asset Mapping',
    stageIcon: <GitBranch className="w-6 h-6" />,
    badgeIcon: <Scale className="w-4 h-4 text-[#546347]" />,
    badgeText: 'Equitable Division',
    description:
      'Marital property law varies across states, but the principle is universal: you are entitled to know the full scope of what was built during the partnership. We map complex assets into simple categories: retirement accounts, home equity, hidden account indicators, and debt attribution.',
    features: [
      {
        icon: <Wallet className="w-4 h-4 text-[#546347]" />,
        title: 'Marital Equity vs Separate Property',
        description:
          'Dissect inheritances, pre-marital savings, and joint contributions without paying expensive preliminary billable hours to an accountant.'
      },
      {
        icon: <LineChart className="w-4 h-4 text-[#546347]" />,
        title: 'Pension & 401(k) Retirement Splits (QDRO)',
        description:
          'Understand how pensions and 401(k) retirement funds are partitioned via Qualified Domestic Relations Orders without penalty fees.'
      }
    ],
    footerIcon: <CheckCircle2 className="w-4 h-4 text-[#546347]" />,
    footerNote: 'Detect hidden accounts and assign liabilities transparently.',
    nextPerch: 3,
    nextLabel: 'Advance to Perch 03: Post-Separation Horizon →'
  },
  {
    id: 3,
    label: 'Perch 03',
    shortTitle: 'Post-Separation',
    subtitle: '5-Yr Horizon',
    statusTitle: 'Perch 03 • Post-Separation Horizon',
    left: '62.5%',
    fill: '66.6%',
    tilt: '-2deg',
    stageLabel: 'Active Stage • Step 3',
    heading: 'Perch 03: Post-Separation Horizon',
    stageIcon: <Sunrise className="w-6 h-6" />,
    badgeIcon: <Eye className="w-4 h-4 text-[#546347]" />,
    badgeText: '5-Year Forward Modeling',
    description:
      'The central question keeping women awake at night is: "Will I and my children be okay?" Our scenario planner models 5-year budget feasibility, the keep-vs-sell home calculation, independent cash flow projections, and health insurance continuity.',
    features: [
      {
        icon: <Home className="w-4 h-4 text-[#546347]" />,
        title: 'Keep vs Sell Home Modeling',
        description:
          'Run mortgage refinancing math, property taxes, maintenance reserves, and utility realities on a single income stream with zero guesswork.'
      },
      {
        icon: <HeartPulse className="w-4 h-4 text-[#546347]" />,
        title: 'Cash Flow & Healthcare Transition',
        description:
          'Simulate COBRA vs private marketplace health coverage costs alongside child support timing and rebound earning curves.'
      }
    ],
    footerIcon: <CheckCircle2 className="w-4 h-4 text-[#546347]" />,
    footerNote: 'Plan realistically for future stability without fear.',
    nextPerch: 4,
    nextLabel: 'Advance to Perch 04: Consultation Readiness →'
  },
  {
    id: 4,
    label: 'Perch 04',
    shortTitle: 'Consultation',
    subtitle: 'Brief Ready',
    statusTitle: 'Perch 04 • Consultation Readiness',
    left: '87.5%',
    fill: '100%',
    tilt: '5deg',
    stageLabel: 'Active Stage • Step 4',
    heading: 'Perch 04: Consultation Readiness',
    stageIcon: <ClipboardCheck className="w-6 h-6" />,
    badgeIcon: <FileDown className="w-4 h-4 text-[#546347]" />,
    badgeText: 'Brief Ready',
    description:
      'Attorneys bill $350 to $700 per hour just to sort through disorganized shoe boxes of receipts. Sparrow compiles your verified asset matrix into a 1-click private brief, complete with a structured question checklist and fee transparency guide.',
    features: [
      {
        icon: <FileText className="w-4 h-4 text-[#546347]" />,
        title: '1-Click Private Case Dossier',
        description:
          'Walk into your initial consultation with a structured, professional financial summary ready for attorneys or mediators.'
      },
      {
        icon: <ListChecks className="w-4 h-4 text-[#546347]" />,
        title: 'Attorney Checklist & Fee Transparency',
        description:
          'Know exactly what questions to ask during intake consultations to avoid retainer waste and evaluate advocate fit.'
      }
    ],
    footerIcon: <PiggyBank className="w-4 h-4 text-[#546347]" />,
    footerNote: 'Save up to 40% on preliminary legal retainer hours.',
    nextPerch: 1,
    nextLabel: '↺ Return to Perch 01'
  }
];

export default function FlightPathWidget() {
  const [activePerch, setActivePerch] = useState<number>(1);
  const [hoveredPerch, setHoveredPerch] = useState<number | null>(null);

  const displayedBirdPerch = PERCHES[(hoveredPerch ?? activePerch) - 1];
  const activePerchData = PERCHES[activePerch - 1];

  return (
    <section
      id="flight-path-preview"
      className="bg-white/95 border border-[#E2DBD0] rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm"
    >
      {/* Section Header with Flight Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#546347] font-semibold flex items-center gap-2">
            <Feather className="w-3.5 h-3.5" />
            The Sparrow Flight Path
          </span>
          <h2 className="font-editorial-heading text-2xl sm:text-3xl text-[#1f291e] font-normal">
            Four gentle perches toward complete autonomy.
          </h2>
          <p className="text-xs sm:text-sm text-[#444841]">
            Click or hover any perch to guide the sparrow along your path. The card below updates to show the details for where your sparrow is perched.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#edf2e8] border border-[#4F5E47]/20 text-[#2c3b26] self-start md:self-auto shrink-0 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#384631] shadow-[0_0_8px_rgba(56,70,49,0.7)] animate-pulse" />
          <span className="text-xs font-medium">{displayedBirdPerch.statusTitle}</span>
        </div>
      </div>

      {/* Interactive Flight Path Ribbon & Smoothly Gliding Sparrow Indicator */}
      <div className="relative w-full rounded-2xl bg-[#eff4ec] border border-[#4F5E47]/20 p-5 sm:p-7 overflow-hidden shadow-inner">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 120">
            <path
              d="M 0 60 Q 250 20, 500 60 T 1000 60"
              fill="none"
              stroke="#BBCCAA"
              strokeDasharray="4 8"
              strokeWidth="1"
            />
            <path
              d="M 0 85 Q 250 110, 500 80 T 1000 75"
              fill="none"
              stroke="#D7E8CA"
              strokeDasharray="6 12"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Connecting line */}
          <div className="hidden sm:block absolute top-7 left-[8%] right-[8%] h-0.5 bg-[#c5c8be]/40 z-0" />
          <div
            className="hidden sm:block absolute top-7 left-[8%] h-0.5 bg-[#384631] transition-all duration-500 ease-out z-0"
            style={{ width: displayedBirdPerch.fill }}
          />

          {/* Interactive Perch Waypoint Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            {PERCHES.map((perch) => {
              const isSelected = activePerch === perch.id;
              return (
                <button
                  key={perch.id}
                  type="button"
                  onClick={() => setActivePerch(perch.id)}
                  onMouseEnter={() => setHoveredPerch(perch.id)}
                  onMouseLeave={() => setHoveredPerch(null)}
                  className={`group flex flex-col items-center text-center p-3.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white shadow-sm border-[#384631]/40 ring-2 ring-[#384631]/20'
                      : 'border-transparent hover:bg-white/80'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-transform duration-300 group-hover:scale-110 ${
                      isSelected
                        ? 'bg-[#384631] text-white shadow-sm'
                        : 'bg-[#e6ece2] text-[#444841]'
                    }`}
                  >
                    {perch.id}
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-[#546347] font-semibold mt-2.5">
                    {perch.label}
                  </span>
                  <span className="text-xs sm:text-sm text-[#1c1c19] font-medium leading-tight">
                    {perch.shortTitle}
                  </span>
                  <span className="text-[11px] text-[#444841] mt-0.5">{perch.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gliding Sparrow Indicator */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute top-1 pointer-events-none transition-all duration-500 ease-out z-20"
          style={{
            left: displayedBirdPerch.left,
            transform: `translateX(-50%) rotate(${displayedBirdPerch.tilt})`
          }}
        >
          <div className="sparrow-body-bob relative filter drop-shadow-[0_4px_12px_rgba(56,70,49,0.3)]">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 72 72">
              <defs>
                <linearGradient id="sparrowFeatherGrad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#4F5E47" />
                  <stop offset="45%" stopColor="#384631" />
                  <stop offset="100%" stopColor="#A07E5F" />
                </linearGradient>
                <linearGradient id="sparrowWingGrad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#715438" />
                  <stop offset="60%" stopColor="#4F5E47" />
                  <stop offset="100%" stopColor="#BBCCAA" />
                </linearGradient>
              </defs>
              <path
                d="M 12 48 C 17 46 22 43 27 40 L 21 49 C 17 50 14 50 12 48 Z"
                fill="#715438"
                opacity="0.9"
              />
              <path
                d="M 9 52 C 15 50 20 46 25 43 L 18 55 C 13 56 10 54 9 52 Z"
                fill="#583D23"
              />
              <path
                d="M 23 42 C 28 44 37 45 44 41 C 51 37 56 31 60 27 C 62 25 64 24 66 23 C 65 25 63 27 61 29 C 58 34 53 40 45 44 C 36 48 27 47 23 42 Z"
                fill="url(#sparrowFeatherGrad)"
              />
              <path
                d="M 33 42 C 38 45 45 44 50 40 C 53 37 56 33 58 30 C 56 32 53 35 48 37 C 42 39 36 39 33 42 Z"
                fill="#E7BF9C"
                opacity="0.95"
              />
              <circle cx="58" cy="27" fill="#384631" r="4.5" />
              <polygon fill="#A07E5F" points="62,26.5 68,27.5 62,29" />
              <circle cx="59.2" cy="26.3" fill="#FCF9F4" r="0.9" />
              <g className="sparrow-wing-movement">
                <path
                  d="M 32 38 C 30 28 34 16 46 8 C 42 15 40 23 42 32 C 40 34 36 36 32 38 Z"
                  fill="url(#sparrowWingGrad)"
                  opacity="0.92"
                />
                <path
                  d="M 37 34 C 35 24 40 14 49 7 C 46 14 45 22 47 30 C 43 32 40 33 37 34 Z"
                  fill="#BBCCAF"
                  opacity="0.75"
                />
                <path
                  d="M 27 39 C 24 33 26 24 34 17 C 32 23 32 29 35 36 Z"
                  fill="#715438"
                  opacity="0.65"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Focused Single Content Card: Displays ONLY the active perch info */}
      <div className="w-full bg-[#fcfdfb] p-6 sm:p-8 rounded-2xl border border-[#4F5E47]/20 shadow-xs transition-all duration-300 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#4F5E47]/15">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-[#384631]/10 text-[#384631] flex items-center justify-center shrink-0">
              {activePerchData.stageIcon}
            </span>
            <div>
              <span className="text-[11px] text-[#546347] font-semibold uppercase tracking-wider">
                {activePerchData.stageLabel}
              </span>
              <h3 className="font-editorial-heading text-xl sm:text-2xl text-[#1f291e] font-normal">
                {activePerchData.heading}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#edf2e8] border border-[#4F5E47]/15 text-[#2c3b26] text-xs font-medium">
            {activePerchData.badgeIcon}
            <span>{activePerchData.badgeText}</span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#1f291e] leading-relaxed">
          {activePerchData.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {activePerchData.features.map((feat) => (
            <div
              key={feat.title}
              className="p-4 rounded-2xl bg-[#edf2e8]/75 border border-[#4F5E47]/15 space-y-1.5"
            >
              <div className="flex items-center gap-2 text-[#2c3b26] text-xs sm:text-sm font-semibold">
                {feat.icon}
                <span>{feat.title}</span>
              </div>
              <p className="text-xs text-[#444841] leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#4F5E47]/15">
          <div className="flex items-center gap-2 text-[#444841] text-xs">
            {activePerchData.footerIcon}
            <span>{activePerchData.footerNote}</span>
          </div>
          <button
            type="button"
            onClick={() => setActivePerch(activePerchData.nextPerch)}
            className="text-xs text-[#2c3b26] hover:underline cursor-pointer font-medium"
          >
            {activePerchData.nextLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
