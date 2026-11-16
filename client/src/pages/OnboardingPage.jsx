import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Check, Shield, Minus, Plus, ChevronDown } from 'lucide-react';
import { useAgentMemory } from '../context/AgentMemoryContext';
import { useSmoothNavigate } from '../context/TransitionContext';

const COMMUNITY_PROPERTY_STATES = new Set([
  'Arizona',
  'California',
  'Idaho',
  'Louisiana',
  'Nevada',
  'New Mexico',
  'Texas',
  'Washington',
  'Wisconsin'
]);

const US_STATE_NAMES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming'
];

const US_STATES = US_STATE_NAMES.map((name) => ({
  name,
  type: COMMUNITY_PROPERTY_STATES.has(name)
    ? 'Community Property'
    : 'Equitable Distribution'
}));

const TOTAL_STEPS = 11;

export default function OnboardingPage() {
  const { saveOnboardingProfile, isSyncing } = useAgentMemory();
  const smoothNavigate = useSmoothNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState('entering'); // 'entering' | 'visible' | 'exiting'
  const isTransitioningRef = useRef(false);
  const timerRef = useRef(null);
  const advanceTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    goal: 'pursuing_divorce',
    stateJurisdiction: 'California',
    marriageLengthYears: 15,
    hasChildren: true,
    childrenCount: 2,
    divorcePathway: 'unsure',
    hasPrenup: 'no',
    ownsHome: true,
    hasRetirementAccounts: true,
    needsFeeWaiver: false,
    needsProtectiveOrder: false,
    financialRole: 'spouse_handled_all',
    accountVisibility: 'partial_visibility',
    fearOfHiddenAssets: true,
    primaryConcerns: [
      'keeping_marital_home',
      'discovering_hidden_accounts',
      'securing_spousal_support'
    ],
    safetyDiscreetMode: true
  });

  // Initial fade-in on mount
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setPhase('visible');
      });
      timerRef.current = raf2;
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const transitionTo = useCallback((nextIndex) => {
    if (isTransitioningRef.current) return;
    if (nextIndex < 0 || nextIndex >= TOTAL_STEPS) return;

    isTransitioningRef.current = true;
    setPhase('exiting');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStepIndex(nextIndex);
      setPhase('entering');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('visible');
          isTransitioningRef.current = false;
        });
      });
    }, 280);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex < TOTAL_STEPS - 1) {
      transitionTo(stepIndex + 1);
    }
  }, [stepIndex, transitionTo]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      transitionTo(stepIndex - 1);
    }
  }, [stepIndex, transitionTo]);

  const selectAndAdvance = (updater) => {
    if (isTransitioningRef.current) return;
    setFormData(updater);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      transitionTo(stepIndex + 1);
    }, 220);
  };

  const handleConcernToggle = (concernKey) => {
    setFormData((prev) => {
      const exists = prev.primaryConcerns.includes(concernKey);
      return {
        ...prev,
        primaryConcerns: exists
          ? prev.primaryConcerns.filter((c) => c !== concernKey)
          : [...prev.primaryConcerns, concernKey]
      };
    });
  };

  const handleFinish = async () => {
    try {
      await saveOnboardingProfile(formData);
      smoothNavigate('/dashboard');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      smoothNavigate('/dashboard');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (stepIndex === 1 || stepIndex === 2 || stepIndex === 3)) {
      e.preventDefault();
      handleNext();
    }
  };

  const progressPercent = ((stepIndex + 1) / TOTAL_STEPS) * 100;

  const phaseClasses =
    phase === 'visible'
      ? 'opacity-100 translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
      : phase === 'exiting'
      ? 'opacity-0 -translate-y-1.5 transition-all duration-300 ease-out pointer-events-none'
      : 'opacity-0 translate-y-2 transition-none';

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-between max-w-xl mx-auto px-6 py-10 sm:py-14">
      {/* Minimal Progress Hairline */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-[#5F635E]/80 tracking-wide">
          <span>{stepIndex === TOTAL_STEPS - 1 ? 'Ready' : 'Private Intake'}</span>
          <span className="font-mono">
            {stepIndex + 1} / {TOTAL_STEPS}
          </span>
        </div>
        <div className="w-full bg-[#EDE6DD] h-[2px] rounded-full overflow-hidden">
          <div
            className="bg-[#4F5E47]/75 h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Single Question Stage */}
      <div className={`my-auto py-10 ${phaseClasses}`} onKeyDown={handleKeyDown}>
        {/* 1. Goal */}
        {stepIndex === 0 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                What brings you here today?
              </h1>
              <p className="text-sm text-[#5F635E]">
                Take your time. Everything here stays private.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'pursuing_divorce',
                  title: 'Pursuing a divorce',
                  desc: 'Prepare my checklist and financial picture'
                },
                {
                  id: 'legal_separation',
                  title: 'Legal separation',
                  desc: 'Explore separation filings and disclosures'
                },
                {
                  id: 'exploring_options',
                  title: 'Just exploring',
                  desc: 'Learn my rights and organize quietly'
                }
              ].map((g) => {
                const selected = formData.goal === g.id;
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => selectAndAdvance((prev) => ({ ...prev, goal: g.id }))}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                      selected
                        ? 'border-[#4F5E47] bg-[#F4EFEA] text-[#1c1c19]'
                        : 'border-[#E2DAD0] bg-white/80 hover:border-[#8A9A7B] hover:bg-white text-[#2C332A]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-[#1c1c19]">{g.title}</div>
                      <div className="text-xs text-[#5F635E] mt-0.5">{g.desc}</div>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#4F5E47] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. State Jurisdiction */}
        {stepIndex === 1 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                Where are you filing?
              </h1>
              <p className="text-sm text-[#5F635E]">
                Your state shapes how property and support are approached.
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="state-jurisdiction-select" className="sr-only">
                Filing state
              </label>
              <div className="relative">
                <select
                  id="state-jurisdiction-select"
                  value={formData.stateJurisdiction}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, stateJurisdiction: e.target.value }))
                  }
                  className="w-full appearance-none rounded-2xl border border-[#E2DAD0] bg-white px-5 py-4 pr-12 text-sm font-medium text-[#1c1c19] transition focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F] hover:border-[#8A9A7B] cursor-pointer"
                >
                  {US_STATES.map((st) => (
                    <option key={st.name} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#5F635E] pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
              </div>

              {(() => {
                const selectedState = US_STATES.find((st) => st.name === formData.stateJurisdiction);
                return selectedState ? (
                  <p className="text-xs text-[#A07E5F] px-1">
                    {selectedState.name} follows <span className="font-medium">{selectedState.type}</span> guidelines.
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* 3. Years of Marriage */}
        {stepIndex === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                How many years have you been married?
              </h1>
              <p className="text-sm text-[#5F635E]">
                An estimate is completely fine.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Decrease years"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    marriageLengthYears: Math.max(1, Number(prev.marriageLengthYears) - 1)
                  }))
                }
                className="w-12 h-12 rounded-2xl border border-[#E2DAD0] bg-white hover:border-[#8A9A7B] flex items-center justify-center text-[#4F5E47] transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                max="60"
                autoFocus
                value={formData.marriageLengthYears}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    marriageLengthYears: Math.max(0, Number(e.target.value))
                  })
                }
                className="w-28 text-center py-3 rounded-2xl bg-white border border-[#E2DAD0] text-[#1c1c19] font-mono text-2xl focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
              />
              <button
                type="button"
                aria-label="Increase years"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    marriageLengthYears: Math.min(60, Number(prev.marriageLengthYears) + 1)
                  }))
                }
                className="w-12 h-12 rounded-2xl border border-[#E2DAD0] bg-white hover:border-[#8A9A7B] flex items-center justify-center text-[#4F5E47] transition"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#5F635E]">years</span>
            </div>
          </div>
        )}

        {/* 4. Children / Dependents */}
        {stepIndex === 3 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                How many children or dependents do you have?
              </h1>
              <p className="text-sm text-[#5F635E]">
                Enter 0 if none.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Decrease children count"
                onClick={() =>
                  setFormData((prev) => {
                    const next = Math.max(0, Number(prev.childrenCount) - 1);
                    return { ...prev, childrenCount: next, hasChildren: next > 0 };
                  })
                }
                className="w-12 h-12 rounded-2xl border border-[#E2DAD0] bg-white hover:border-[#8A9A7B] flex items-center justify-center text-[#4F5E47] transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                max="10"
                autoFocus
                value={formData.childrenCount}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setFormData({
                    ...formData,
                    childrenCount: val,
                    hasChildren: val > 0
                  });
                }}
                className="w-28 text-center py-3 rounded-2xl bg-white border border-[#E2DAD0] text-[#1c1c19] font-mono text-2xl focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
              />
              <button
                type="button"
                aria-label="Increase children count"
                onClick={() =>
                  setFormData((prev) => {
                    const next = Math.min(10, Number(prev.childrenCount) + 1);
                    return { ...prev, childrenCount: next, hasChildren: next > 0 };
                  })
                }
                className="w-12 h-12 rounded-2xl border border-[#E2DAD0] bg-white hover:border-[#8A9A7B] flex items-center justify-center text-[#4F5E47] transition"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#5F635E]">
                {formData.childrenCount === 1 ? 'dependent' : 'dependents'}
              </span>
            </div>
          </div>
        )}

        {/* 5. Financial Role */}
        {stepIndex === 4 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                How were finances handled in your household?
              </h1>
              <p className="text-sm text-[#5F635E]">
                There is zero judgment here.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'spouse_handled_all',
                  title: 'My spouse managed everything',
                  desc: 'I had little or no visibility into accounts and taxes'
                },
                {
                  id: 'shared_daily_expenses_only',
                  title: 'I managed daily household expenses',
                  desc: 'I saw checking, while investments and loans were separate'
                },
                {
                  id: 'equal_partnership',
                  title: 'We handled finances jointly',
                  desc: 'Both names are on accounts, and I want to verify everything'
                }
              ].map((opt) => {
                const selected = formData.financialRole === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() =>
                      selectAndAdvance((prev) => ({ ...prev, financialRole: opt.id }))
                    }
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      selected
                        ? 'border-[#4F5E47] bg-[#F4EFEA] text-[#1c1c19]'
                        : 'border-[#E2DAD0] bg-white/80 hover:border-[#8A9A7B] hover:bg-white text-[#2C332A]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-[#1c1c19]">{opt.title}</div>
                      <div className="text-xs text-[#5F635E] mt-0.5">{opt.desc}</div>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#4F5E47] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Divorce Pathway */}
        {stepIndex === 5 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                Which best describes your situation right now?
              </h1>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'amicable_uncontested',
                  title: 'Amicable / Uncontested',
                  desc: 'We expect to agree on terms'
                },
                {
                  id: 'contested_or_uncooperative',
                  title: 'Contested / Uncooperative',
                  desc: 'My spouse may withhold information or contest'
                },
                {
                  id: 'unsure',
                  title: 'Unsure / Early stage',
                  desc: 'I am not sure how my spouse will react yet'
                }
              ].map((opt) => {
                const selected = formData.divorcePathway === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() =>
                      selectAndAdvance((prev) => ({ ...prev, divorcePathway: opt.id }))
                    }
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      selected
                        ? 'border-[#4F5E47] bg-[#F4EFEA] text-[#1c1c19]'
                        : 'border-[#E2DAD0] bg-white/80 hover:border-[#8A9A7B] hover:bg-white text-[#2C332A]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-[#1c1c19]">{opt.title}</div>
                      <div className="text-xs text-[#5F635E] mt-0.5">{opt.desc}</div>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#4F5E47] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Prenup */}
        {stepIndex === 6 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                Do you have a prenuptial or postnuptial agreement?
              </h1>
            </div>

            <div className="space-y-3">
              {[
                { id: 'no', label: 'No agreement' },
                { id: 'yes', label: 'Yes, signed' },
                { id: 'unsure', label: 'I am unsure' }
              ].map((p) => {
                const selected = formData.hasPrenup === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => selectAndAdvance((prev) => ({ ...prev, hasPrenup: p.id }))}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                      selected
                        ? 'border-[#4F5E47] bg-[#F4EFEA] text-[#1c1c19]'
                        : 'border-[#E2DAD0] bg-white/80 hover:border-[#8A9A7B] hover:bg-white text-[#2C332A]'
                    }`}
                  >
                    <span className="text-sm font-medium">{p.label}</span>
                    {selected && <Check className="w-4 h-4 text-[#4F5E47] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. Household & Filing Factors */}
        {stepIndex === 7 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                Do any of these apply to you?
              </h1>
              <p className="text-sm text-[#5F635E]">
                Select any that fit, or continue if none apply.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'ownsHome', label: 'We own a home or real estate together' },
                { key: 'hasRetirementAccounts', label: 'There are 401(k), IRA, or pension accounts' },
                { key: 'needsFeeWaiver', label: 'I may need a court filing fee waiver' },
                { key: 'needsProtectiveOrder', label: 'I need protective or restraining order forms' }
              ].map((item) => {
                const checked = Boolean(formData[item.key]);
                return (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      checked
                        ? 'border-[#4F5E47] bg-[#F4EFEA] text-[#1c1c19]'
                        : 'border-[#E2DAD0] bg-white/80 hover:border-[#8A9A7B] hover:bg-white text-[#2C332A]'
                    }`}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                        checked
                          ? 'bg-[#4F5E47] border-[#4F5E47] text-[#FAF7F2]'
                          : 'border-[#C5C8BE] bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 9. Hidden Account Screening */}
        {stepIndex === 8 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                Should Sparrow watch for unlisted accounts?
              </h1>
              <p className="text-sm text-[#5F635E]">
                We can gently flag discrepancies across tax forms and statements.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  val: true,
                  title: 'Yes, enable hidden account screening',
                  desc: 'Flag interest schedules or unusual transfers automatically'
                },
                {
                  val: false,
                  title: 'No, skip this for now',
                  desc: 'You can turn this on later in settings'
                }
              ].map((opt) => {
                const selected = formData.fearOfHiddenAssets === opt.val;
                return (
                  <button
                    type="button"
                    key={String(opt.val)}
                    onClick={() =>
                      selectAndAdvance((prev) => ({ ...prev, fearOfHiddenAssets: opt.val }))
                    }
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      selected
                        ? 'border-[#4F5E47] bg-[#F4EFEA] text-[#1c1c19]'
                        : 'border-[#E2DAD0] bg-white/80 hover:border-[#8A9A7B] hover:bg-white text-[#2C332A]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-[#1c1c19]">{opt.title}</div>
                      <div className="text-xs text-[#5F635E] mt-0.5">{opt.desc}</div>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#4F5E47] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. Primary Priorities */}
        {stepIndex === 9 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                What matters most to you right now?
              </h1>
              <p className="text-sm text-[#5F635E]">
                Select as many as you like.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { id: 'keeping_marital_home', label: 'Keeping the marital home' },
                { id: 'discovering_hidden_accounts', label: 'Uncovering hidden accounts or debt' },
                { id: 'securing_spousal_support', label: 'Understanding spousal support' },
                { id: 'protecting_retirement_share', label: 'Dividing retirement & pensions' },
                { id: 'child_support_costs', label: 'Child custody & healthcare costs' },
                { id: 'establishing_credit', label: 'Building independent credit' },
                { id: 'lawyer_prep_brief', label: 'Preparing an organized brief for a lawyer' }
              ].map((item) => {
                const isSelected = formData.primaryConcerns.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleConcernToggle(item.id)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-[#4F5E47] bg-[#F4EFEA] text-[#1c1c19]'
                        : 'border-[#E2DAD0] bg-white/80 hover:border-[#8A9A7B] hover:bg-white text-[#5F635E]'
                    }`}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                        isSelected
                          ? 'bg-[#4F5E47] border-[#4F5E47] text-[#FAF7F2]'
                          : 'border-[#C5C8BE] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 11. Completion & Safety Reassurance */}
        {stepIndex === 10 && (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs text-[#4F5E47] font-medium">
                <Shield className="w-4 h-4" />
                <span>Your space is private</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c1c19] leading-snug tracking-tight">
                You’re ready.
              </h1>
              <p className="text-sm text-[#5F635E] leading-relaxed">
                Your workspace is quietly tailored to your answers. If you ever need to step away quickly, press <kbd className="px-1.5 py-0.5 bg-white rounded border border-[#E2DAD0] text-[11px] font-mono text-[#2C332A]">Esc</kbd> twice to leave immediately.
              </p>
            </div>

            <div>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleFinish}
                className="inline-flex items-center gap-2.5 bg-[#4F5E47] hover:bg-[#384631] text-[#FAF7F2] font-medium text-sm px-7 py-3.5 rounded-2xl transition disabled:opacity-50"
              >
                <span>{isSyncing ? 'Preparing your workspace...' : 'Enter Your Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Footer Navigation */}
      <div className="flex items-center justify-between pt-4">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F635E] hover:text-[#1c1c19] py-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {stepIndex < TOTAL_STEPS - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 bg-[#4F5E47] hover:bg-[#384631] text-[#FAF7F2] font-medium text-xs px-5 py-2.5 rounded-xl transition"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
