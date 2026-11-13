import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  TrendingUp,
  Printer,
  ArrowRight,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  Scale,
  Sparkles,
  FileText,
  PhoneCall,
  HelpCircle,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgentMemory } from '../context/AgentMemoryContext';
import { useDiscovery } from '../context/DiscoveryContext';

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

function formatMoney(val: number | null | undefined) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '$0';
  return `$${Math.round(Number(val)).toLocaleString()}`;
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const {
    profile,
    agentMemory,
    wikiData,
    divorceChecklist,
    lifeProjection,
    isCalculatingProjection,
    refreshLifeProjection
  } = useAgentMemory() as any;
  const { workspace, checklist, exportDiscoveryPacket, togglePrivacyMode } = useDiscovery();

  useEffect(() => {
    refreshLifeProjection();
  }, [refreshLifeProjection]);

  const { accountVault, housingSandbox, privacyMode } = workspace;
  const collectedCategoriesCount = checklist.filter((c) => c.status !== 'Missing').length;
  const nextMissingCategory = checklist.find((c) => c.status === 'Missing') || null;

  // Compute asset shares from live projection if available, otherwise fallback to discovery vault
  const totalVaultAssets = accountVault.reduce((acc, a) => acc + (a.balance || 0), 0);
  const vaultMortgage = housingSandbox.mortgageBalance || 0;
  const fallbackNetEstate = Math.max(0, totalVaultAssets - vaultMortgage);

  const userAssetShare = lifeProjection?.canCalculate
    ? lifeProjection.assetDivision?.userConfirmedNetWorth ?? Math.round(fallbackNetEstate * 0.5)
    : Math.round(fallbackNetEstate * 0.5);

  const liquidShare = lifeProjection?.canCalculate
    ? lifeProjection.assetDivision?.breakdown?.liquidAndOther?.userShare ?? 0
    : 0;
  const retirementShare = lifeProjection?.canCalculate
    ? lifeProjection.assetDivision?.breakdown?.retirement?.userShare ?? 0
    : 0;
  const homeEquityShare = lifeProjection?.canCalculate
    ? lifeProjection.assetDivision?.breakdown?.homeEquity?.userShare ?? 0
    : 0;

  // Undisclosed / Flagged Leads from Discovery Vault + Agent Memory + Projection
  const vaultUnlistedLeads = accountVault.filter((a) => a.isUnlistedDiscovery);
  const projectionLeads = lifeProjection?.assetDivision?.undisclosedLeads || [];
  const potentialUndisclosedShare =
    lifeProjection?.assetDivision?.userPotentialUndisclosedShare ||
    Math.round(vaultUnlistedLeads.reduce((sum, a) => sum + (a.balance || 0), 0) * 0.5);
  const flaggedLeadsCount = Math.max(vaultUnlistedLeads.length, projectionLeads.length);

  const stateName = profile?.stateJurisdiction || 'California';
  const propertyRule = COMMUNITY_PROPERTY_STATES.has(stateName)
    ? 'Community Property (50/50)'
    : 'Equitable Distribution';

  const checklistSummary = divorceChecklist?.summary;
  const currentChecklistStage = divorceChecklist?.stages?.find(
    (s: any) => s.completedCount < s.totalCount
  );

  const maskValue = (val: number | null | undefined) => {
    if (privacyMode) return '••••••';
    return formatMoney(val);
  };

  // Build "Where You May Be Exposed" women-specific alerts from live data
  const exposureAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      detail: string;
      severity: 'high' | 'medium';
      to: string;
      cta: string;
    }> = [];

    if (flaggedLeadsCount > 0) {
      const leadName =
        projectionLeads[0]?.name || vaultUnlistedLeads[0]?.institution || 'Tax Schedule B account';
      alerts.push({
        id: 'hidden-leads',
        title: `${flaggedLeadsCount} Potential Undisclosed Account${flaggedLeadsCount > 1 ? 's' : ''} Found`,
        detail: `${leadName} appeared in your tax/statement records but wasn't listed voluntarily. Your 50% share could add +${maskValue(potentialUndisclosedShare)}.`,
        severity: 'high',
        to: '/discovery',
        cta: 'Inspect Lead'
      });
    }

    if (
      lifeProjection?.canCalculate &&
      lifeProjection?.housingComparison?.hasHome &&
      lifeProjection?.housingComparison?.scenarioKeepHome?.housingToIncomeRatio > 40
    ) {
      const ratio = lifeProjection.housingComparison.scenarioKeepHome.housingToIncomeRatio;
      alerts.push({
        id: 'housing-trap',
        title: `Keeping the Home Takes ${ratio}% of Projected Income`,
        detail:
          'Housing above 40% of post-divorce take-home pay can drain cash reserves. Compare keeping vs. selling & dividing equity before negotiating.',
        severity: 'high',
        to: '/discovery#projection-engine',
        cta: 'Compare Options'
      });
    }

    if (profile?.hasRetirementAccounts || retirementShare > 0) {
      alerts.push({
        id: 'qdro-alert',
        title: 'Retirement Accounts Require a QDRO Order',
        detail:
          'A divorce decree alone does not split a 401(k) or pension. Make sure a Qualified Domestic Relations Order (QDRO) is drafted before finalizing.',
        severity: 'medium',
        to: '/checklist',
        cta: 'Check QDRO Step'
      });
    }

    if (
      lifeProjection?.canCalculate &&
      (lifeProjection?.inputsSnapshot?.healthInsuranceMonthlyCost === null ||
        lifeProjection?.inputsSnapshot?.healthInsuranceMonthlyCost === undefined)
    ) {
      alerts.push({
        id: 'healthcare-gap',
        title: 'Post-Divorce Health Coverage Not Yet Budgeted',
        detail:
          'If you are on your spouse’s employer plan, factor in COBRA or marketplace coverage so your monthly budget isn’t blindsided.',
        severity: 'medium',
        to: '/discovery#projection-engine',
        cta: 'Add Estimate'
      });
    }

    if (nextMissingCategory) {
      alerts.push({
        id: 'missing-docs',
        title: `Missing Document Gap: ${nextMissingCategory.label}`,
        detail:
          'Uploading this helps verify income, support, and hidden transfers—or gives you a clear list of what your lawyer should request via FL-140.',
        severity: 'medium',
        to: '/discovery',
        cta: 'Upload or Skip'
      });
    }

    return alerts.slice(0, 4);
  }, [
    flaggedLeadsCount,
    projectionLeads,
    vaultUnlistedLeads,
    potentialUndisclosedShare,
    lifeProjection,
    profile?.hasRetirementAccounts,
    retirementShare,
    nextMissingCategory,
    privacyMode
  ]);

  // Top Lawyer Questions from agentMemory + wiki
  const lawyerQuestions = useMemo(() => {
    const questions: string[] = [];
    if (Array.isArray(agentMemory?.keyQuestionsForLawyer)) {
      questions.push(...agentMemory.keyQuestionsForLawyer);
    }
    const wikiQuestions = (wikiData?.sections?.lawyer_readiness?.facts || [])
      .map((f: any) => f.text)
      .filter((t: string) => /\?|question|subpoena|qdro|support/i.test(t));
    for (const q of wikiQuestions) {
      const cleaned = q.replace(/^Open question:\s*/i, '').trim();
      if (!questions.some((existing) => existing.toLowerCase() === cleaned.toLowerCase())) {
        questions.push(cleaned);
      }
    }
    if (questions.length === 0) {
      questions.push(
        `What spousal support duration applies to a ${profile?.marriageLengthYears || 'long-term'} year marriage in ${stateName}?`,
        'Which missing accounts should we formally request in Preliminary Declarations of Disclosure?'
      );
    }
    return questions.slice(0, 3);
  }, [agentMemory?.keyQuestionsForLawyer, wikiData, profile?.marriageLengthYears, stateName]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Calm Header with Discreet Controls */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c1c19] tracking-tight">
              Welcome, {currentUser?.displayName || 'Sarah'}
            </h1>
            <span className="text-[11px] font-medium px-3 py-0.5 rounded-full bg-[#EDE6DD] text-[#4F5E47] border border-[#4F5E47]/10">
              {stateName} · {propertyRule}
            </span>
          </div>
          <p className="text-sm text-[#5F635E] mt-1.5">
            Your private financial picture—what’s yours, what’s missing, and what life looks like next.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePrivacyMode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#4F5E47] hover:bg-[#F4EFEA] bg-transparent border border-[#8A9A7B] rounded-xl transition"
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{privacyMode ? 'Show Numbers' : 'Hide Numbers'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportDiscoveryPacket('print')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF7F2] bg-[#4F5E47] hover:bg-[#384631] rounded-xl transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Lawyer Brief</span>
          </button>
        </div>
      </header>

      {/* 2. "What's Actually Yours" — 4 Headline Reality Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '60ms' }}>
        {/* Card 1: Estimated Asset Share */}
        <div className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5F635E]">
              <span>Your Est. Asset Share</span>
              <Scale className="w-3.5 h-3.5 text-[#4F5E47]" />
            </div>
            <div className="text-2xl font-mono font-semibold text-[#1c1c19] mt-2">
              {maskValue(userAssetShare)}
            </div>
          </div>
          <div className="text-[11px] text-[#5F635E] mt-2 pt-2 border-t border-[#E2DAD0]/70 space-y-0.5">
            {lifeProjection?.canCalculate ? (
              <>
                <div className="flex justify-between">
                  <span>Liquid / Cash</span>
                  <span className="font-mono text-[#1c1c19]">{maskValue(liquidShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Home Equity</span>
                  <span className="font-mono text-[#1c1c19]">{maskValue(homeEquityShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retirement (QDRO)</span>
                  <span className="font-mono text-[#1c1c19]">{maskValue(retirementShare)}</span>
                </div>
              </>
            ) : (
              <span>50% baseline of {accountVault.length} discovered accounts</span>
            )}
          </div>
        </div>

        {/* Card 2: Flagged / Undisclosed Leads */}
        <Link
          to="/discovery"
          className="bg-[#FFFFFF] border border-[#4F5E47]/10 hover:border-[#A07E5F]/50 rounded-2xl shadow-serene p-5 flex flex-col justify-between transition group"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5F635E]">
              <span>Flagged / Unlisted Leads</span>
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  flaggedLeadsCount > 0 ? 'text-[#A86851]' : 'text-[#5F635E]'
                }`}
              />
            </div>
            <div className="text-2xl font-mono font-semibold text-[#1c1c19] mt-2">
              {flaggedLeadsCount > 0 ? `+${maskValue(potentialUndisclosedShare)}` : '$0'}
            </div>
          </div>
          <div className="text-[11px] text-[#5F635E] mt-2 pt-2 border-t border-[#E2DAD0]/70 flex items-center justify-between">
            <span>
              {flaggedLeadsCount > 0
                ? `${flaggedLeadsCount} account${flaggedLeadsCount > 1 ? 's' : ''} to verify`
                : 'No hidden leads flagged yet'}
            </span>
            <ArrowRight className="w-3 h-3 text-[#A07E5F] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* Card 3: If You Divorced Today (Monthly Take-Home) */}
        <Link
          to="/discovery#projection-engine"
          className="bg-[#FFFFFF] border border-[#4F5E47]/10 hover:border-[#4F5E47]/40 rounded-2xl shadow-serene p-5 flex flex-col justify-between transition group"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5F635E]">
              <span>If You Divorced Today</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#4F5E47]" />
            </div>
            <div className="text-2xl font-mono font-semibold text-[#4F5E47] mt-2">
              {isCalculatingProjection && !lifeProjection
                ? '...'
                : lifeProjection?.canCalculate
                ? `${maskValue(lifeProjection.monthlyTakeHome?.totalMonthlyTakeHome)}/mo`
                : 'Needs Info'}
            </div>
          </div>
          <div className="text-[11px] text-[#5F635E] mt-2 pt-2 border-t border-[#E2DAD0]/70 flex items-center justify-between">
            <span>
              {lifeProjection?.canCalculate
                ? `Includes ${maskValue(
                    (lifeProjection.monthlyTakeHome?.spousalSupport?.monthlyMid || 0) +
                      (lifeProjection.monthlyTakeHome?.childSupport?.monthlyMid || 0)
                  )} est. support`
                : `${lifeProjection?.missingFields?.length || 2}+ details needed to estimate`}
            </span>
            <ArrowRight className="w-3 h-3 text-[#A07E5F] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* Card 4: Readiness Snapshot */}
        <div className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5F635E]">
              <span>Readiness Progress</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4F5E47]" />
            </div>
            <div className="text-2xl font-mono font-semibold text-[#1c1c19] mt-2">
              {collectedCategoriesCount}
              <span className="text-sm font-normal text-[#5F635E]"> / 7 files</span>
            </div>
          </div>
          <div className="text-[11px] text-[#5F635E] mt-2 pt-2 border-t border-[#E2DAD0]/70">
            {divorceChecklist?.isPursuingDivorce && checklistSummary
              ? `Court checklist: ${checklistSummary.completedCount}/${checklistSummary.totalCount} (${checklistSummary.percentComplete}%)`
              : 'Court checklist paused (Exploration)'}
          </div>
        </div>
      </section>

      {/* 3. "Where You May Be Exposed" — Red Flags & Women-Specific Alerts */}
      <section className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene p-6 space-y-4 animate-fade-in" style={{ animationDelay: '120ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-normal text-[#1c1c19] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4F5E47]" />
              <span>Where You May Be Exposed</span>
            </h2>
            <p className="text-xs text-[#5F635E] mt-0.5">
              Specific patterns and missing disclosures surfaced from your profile and uploaded records.
            </p>
          </div>
          <Link
            to="/discovery"
            className="text-xs font-medium text-[#A07E5F] hover:text-[#583d23] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Discovery Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {exposureAlerts.length === 0 ? (
          <div className="bg-[#F4EFEA] border border-[#E2DAD0] rounded-xl p-4 text-xs text-[#5F635E]">
            No urgent exposure flags right now. Upload tax returns, bank statements, or retirement letters in Financial Discovery to scan for hidden leads.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exposureAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl p-4 border flex flex-col justify-between gap-3 ${
                  alert.severity === 'high'
                    ? 'bg-[#FAF2F0] border-[#D9B3AC]'
                    : 'bg-[#F4EFEA] border-[#E2DAD0]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        alert.severity === 'high' ? 'text-[#A86851]' : 'text-[#4F5E47]'
                      }`}
                    />
                    <h3 className="text-xs font-semibold text-[#1c1c19]">{alert.title}</h3>
                  </div>
                  <p className="text-xs text-[#5F635E] leading-relaxed pl-6">{alert.detail}</p>
                </div>
                <div className="pl-6">
                  <Link
                    to={alert.to}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#4F5E47] hover:text-[#384631]"
                  >
                    <span>{alert.cta}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. "Your Next Best Step" (Anti-Overwhelm Guided Actions) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '180ms' }}>
        <div className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#A07E5F]">
              <FileSearch className="w-4 h-4" />
              <span>Next Step in Financial Discovery</span>
            </div>
            <h3 className="font-serif text-lg font-normal text-[#1c1c19]">
              {nextMissingCategory
                ? `Gather: ${nextMissingCategory.label}`
                : 'All 7 Financial Categories Addressed'}
            </h3>
            <p className="text-xs text-[#5F635E] leading-relaxed">
              {nextMissingCategory
                ? 'Upload what you have—even partial or blurry files—or mark it skipped so your projection and lawyer brief stay accurate.'
                : 'Your core financial categories are complete. Review your Post-Divorce Projection anytime.'}
            </p>
          </div>
          <Link
            to="/discovery"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#FAF7F2] bg-[#4F5E47] hover:bg-[#384631] rounded-xl transition self-start"
          >
            <span>{nextMissingCategory ? 'Go to Financial Discovery' : 'Review Discovery & Projection'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#A07E5F]">
                <FileText className="w-4 h-4" />
                <span>Next Step in Court Checklist</span>
              </div>
              {divorceChecklist?.isPursuingDivorce && checklistSummary && (
                <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#EDE6DD] text-[#4F5E47]">
                  {checklistSummary.percentComplete}% Done
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg font-normal text-[#1c1c19]">
              {!divorceChecklist?.isPursuingDivorce
                ? 'Checklist Paused (Exploration Mode)'
                : currentChecklistStage
                ? `Current Stage: ${currentChecklistStage.title}`
                : 'All Court Checklist Stages Complete'}
            </h3>
            {divorceChecklist?.isPursuingDivorce && checklistSummary && (
              <div className="w-full bg-[#EDE6DD] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#4F5E47] h-full rounded-full transition-all duration-300"
                  style={{ width: `${checklistSummary.percentComplete}%` }}
                />
              </div>
            )}
            <p className="text-xs text-[#5F635E] leading-relaxed">
              {!divorceChecklist?.isPursuingDivorce
                ? 'Whenever you decide to pursue separation or divorce, generate your tailored California court form checklist in one click.'
                : `${checklistSummary?.completedCount ?? 0} completed · ${checklistSummary?.signedReadyCount ?? 0} signed/ready · ${checklistSummary?.inProgressCount ?? 0} in progress.`}
            </p>
          </div>
          <Link
            to="/checklist"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#4F5E47] bg-transparent hover:bg-[#F4EFEA] border border-[#8A9A7B] rounded-xl transition self-start"
          >
            <span>Open Divorce Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 5. "Questions for Your Lawyer" Preview & Support */}
      <section className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene p-6 space-y-4 animate-fade-in" style={{ animationDelay: '120ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-normal text-[#1c1c19] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A07E5F]" />
              <span>Questions Prepared for Your Lawyer Consultation</span>
            </h2>
            <p className="text-xs text-[#5F635E] mt-0.5">
              Walk into your first consultation focused on what matters—so you don’t waste billable hours on basics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportDiscoveryPacket('print')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#4F5E47] bg-transparent border border-[#8A9A7B] hover:bg-[#F4EFEA] rounded-xl transition self-start sm:self-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save Brief</span>
          </button>
        </div>

        <ul className="space-y-2">
          {lawyerQuestions.map((q, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F4EFEA] border border-[#E2DAD0] text-xs text-[#2C332A]"
            >
              <HelpCircle className="w-4 h-4 text-[#4F5E47] shrink-0 mt-0.5" />
              <span>{q}</span>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-[#E2DAD0]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#5F635E]">
          <span>
            Educational financial discovery &amp; planning tool only—not legal or tax advice.
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#1c1c19] font-medium bg-[#FAF2F0] border border-[#D9B3AC] px-3 py-1 rounded-full">
            <PhoneCall className="w-3.5 h-3.5 text-[#A86851]" />
            <span>Need confidential support? National DV Hotline: 1-800-799-SAFE (7233)</span>
          </span>
        </div>
      </section>

      {/* 6. Consult a Professional (Family Law Lawyers & Offices Near You) */}
      <section className="bg-[#F4EFEA] border border-[#4F5E47]/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A07E5F]">
            <MapPin className="w-4 h-4" />
            <span>Local Family Law Directory</span>
          </div>
          <h2 className="font-serif text-xl font-normal text-[#1c1c19]">
            Ready to speak with a family law attorney or mediator?
          </h2>
          <p className="text-xs text-[#5F635E] leading-relaxed">
            Search family law lawyers, divorce mediators, and legal aid offices near your ZIP code or current location on an interactive map, then bring your Sparrow Discovery Brief to your consultation.
          </p>
        </div>
        <Link
          to="/consult"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium text-[#FAF7F2] bg-[#4F5E47] hover:bg-[#384631] rounded-xl transition shrink-0 self-start md:self-auto"
        >
          <Scale className="w-4 h-4" />
          <span>Consult a Professional</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  );
}
