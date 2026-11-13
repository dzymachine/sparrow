import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  TrendingUp,
  Printer,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
import FlightPathWidget from '../components/FlightPathWidget';
import FinancialInfographicSidebar from '../components/dashboard/FinancialInfographicSidebar';
import TimelineInfographicSidebar from '../components/dashboard/TimelineInfographicSidebar';

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
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    refreshLifeProjection();
  }, [refreshLifeProjection]);

  const {
    accountVault,
    housingSandbox,
    baseline,
    ledgerProtection,
    privacyMode
  } = workspace;
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[292px_minmax(0,1fr)_292px] gap-6 items-start">
        {/* Left Sidebar: Financial Snapshot Infographic */}
        <div className="order-2 md:col-span-1 xl:order-1 xl:sticky xl:top-28">
          <FinancialInfographicSidebar
            privacyMode={privacyMode}
            accountVault={accountVault}
            housingSandbox={housingSandbox}
            baseline={baseline}
            checklist={checklist}
            lifeProjection={lifeProjection}
            userAssetShare={userAssetShare}
            liquidShare={liquidShare}
            retirementShare={retirementShare}
            homeEquityShare={homeEquityShare}
            potentialUndisclosedShare={potentialUndisclosedShare}
            flaggedLeadsCount={flaggedLeadsCount}
          />
        </div>

        {/* Center Main Dashboard */}
        <div className="order-1 md:col-span-2 xl:col-span-1 xl:order-2 min-w-0 space-y-8">
      {/* 1. Calm Header with Discreet Controls */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
              Welcome, {currentUser?.displayName || 'Sarah'}
            </h1>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E6ECE6] text-[#435C4D]">
              {stateName} · {propertyRule}
            </span>
          </div>
          <p className="text-sm text-[#5C4E43] mt-1">
            Your private financial picture—what’s yours, what’s missing, and what life looks like next.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePrivacyMode}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#5C4E43] hover:text-[#261E19] bg-white border border-[#E2DBD0] rounded-lg transition"
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{privacyMode ? 'Show Numbers' : 'Hide Numbers'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportDiscoveryPacket('print')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Lawyer Brief</span>
          </button>
        </div>
      </header>

      {/* 2. "What's Actually Yours" — Apple Inset Grouped Reality Strip */}
      <section className="bg-white border border-[#E2DBD0] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F0EAE1] overflow-hidden">
        {/* Metric 1: Estimated Asset Share */}
        <div className="p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5C4E43]">
              <span>Your Est. Asset Share</span>
              <Scale className="w-4 h-4 text-[#435C4D]" />
            </div>
            <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19] mt-2">
              {maskValue(userAssetShare)}
            </div>
          </div>
          <div className="text-xs text-[#5C4E43] pt-2.5 border-t border-[#F0EAE1] space-y-1">
            {lifeProjection?.canCalculate ? (
              <>
                <div className="flex justify-between">
                  <span>Liquid / Cash</span>
                  <span className="font-mono tabular-nums text-[#261E19]">{maskValue(liquidShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Home Equity</span>
                  <span className="font-mono tabular-nums text-[#261E19]">{maskValue(homeEquityShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retirement (QDRO)</span>
                  <span className="font-mono tabular-nums text-[#261E19]">{maskValue(retirementShare)}</span>
                </div>
              </>
            ) : (
              <span>50% baseline of {accountVault.length} accounts</span>
            )}
          </div>
        </div>

        {/* Metric 2: Flagged / Undisclosed Leads */}
        <Link
          to="/discovery"
          className="p-5 flex flex-col justify-between space-y-3 hover:bg-[#FAF9F6] transition group"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5C4E43]">
              <span>Flagged / Unlisted Leads</span>
              <AlertTriangle
                className={`w-4 h-4 ${
                  flaggedLeadsCount > 0 ? 'text-amber-600' : 'text-[#8C7D73]'
                }`}
              />
            </div>
            <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19] mt-2">
              {flaggedLeadsCount > 0 ? `+${maskValue(potentialUndisclosedShare)}` : '$0'}
            </div>
          </div>
          <div className="text-xs text-[#5C4E43] pt-2.5 border-t border-[#F0EAE1] flex items-center justify-between">
            <span>
              {flaggedLeadsCount > 0
                ? `${flaggedLeadsCount} account${flaggedLeadsCount > 1 ? 's' : ''} to verify`
                : 'No hidden leads flagged'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8C7D73] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* Metric 3: If You Divorced Today (Monthly Take-Home) */}
        <Link
          to="/discovery#projection-engine"
          className="p-5 flex flex-col justify-between space-y-3 hover:bg-[#FAF9F6] transition group"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5C4E43]">
              <span>If You Divorced Today</span>
              <TrendingUp className="w-4 h-4 text-[#435C4D]" />
            </div>
            <div className="text-2xl font-mono tabular-nums font-semibold text-[#435C4D] mt-2">
              {isCalculatingProjection && !lifeProjection
                ? '...'
                : lifeProjection?.canCalculate
                ? `${maskValue(lifeProjection.monthlyTakeHome?.totalMonthlyTakeHome)}/mo`
                : 'Needs Info'}
            </div>
          </div>
          <div className="text-xs text-[#5C4E43] pt-2.5 border-t border-[#F0EAE1] flex items-center justify-between">
            <span>
              {lifeProjection?.canCalculate
                ? `Includes ${maskValue(
                    (lifeProjection.monthlyTakeHome?.spousalSupport?.monthlyMid || 0) +
                      (lifeProjection.monthlyTakeHome?.childSupport?.monthlyMid || 0)
                  )} est. support`
                : `${lifeProjection?.missingFields?.length || 2}+ details needed`}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8C7D73] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* Metric 4: Readiness Snapshot */}
        <Link
          to="/checklist"
          className="p-5 flex flex-col justify-between space-y-3 hover:bg-[#FAF9F6] transition group"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#5C4E43]">
              <span>Readiness Progress</span>
              <CheckCircle2 className="w-4 h-4 text-[#435C4D]" />
            </div>
            <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19] mt-2">
              {collectedCategoriesCount}
              <span className="text-sm font-normal text-[#8C7D73]"> / 7 files</span>
            </div>
          </div>
          <div className="text-xs text-[#5C4E43] pt-2.5 border-t border-[#F0EAE1] flex items-center justify-between">
            <span>
              {divorceChecklist?.isPursuingDivorce && checklistSummary
                ? `Checklist: ${checklistSummary.completedCount}/${checklistSummary.totalCount} (${checklistSummary.percentComplete}%)`
                : 'Checklist paused'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8C7D73] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>
      </section>

      {/* Interactive Sparrow Flight Path */}
      <FlightPathWidget />

      {/* 3. "Where You May Be Exposed" — Apple Inset Grouped List */}
      <section className="bg-white border border-[#E2DBD0] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E2DBD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-medium text-[#261E19] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#435C4D]" />
              <span>Where You May Be Exposed</span>
            </h2>
            <p className="text-xs text-[#5C4E43] mt-0.5">
              Specific patterns and missing disclosures surfaced from your profile and uploaded records.
            </p>
          </div>
          <Link
            to="/discovery"
            className="text-xs font-medium text-[#435C4D] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Discovery</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {exposureAlerts.length === 0 ? (
          <div className="p-6 text-xs text-[#5C4E43]">
            No urgent exposure flags right now. Upload tax returns, bank statements, or retirement letters in Financial Discovery to scan for hidden leads.
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#F0EAE1]">
              {(showAllAlerts ? exposureAlerts : exposureAlerts.slice(0, 2)).map((alert) => (
                <Link
                  key={alert.id}
                  to={alert.to}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F6] transition group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        alert.severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#E6ECE6] text-[#435C4D]'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-semibold text-[#261E19]">{alert.title}</h3>
                      <p className="text-xs text-[#5C4E43] leading-relaxed">{alert.detail}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-[#435C4D] shrink-0 pl-11 sm:pl-0">
                    <span>{alert.cta}</span>
                    <ChevronRight className="w-4 h-4 text-[#8C7D73] group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              ))}
            </div>

            {exposureAlerts.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllAlerts((prev) => !prev)}
                className="w-full px-6 py-3 bg-[#FAF9F6] border-t border-[#F0EAE1] text-xs font-medium text-[#435C4D] hover:text-[#261E19] flex items-center justify-center gap-1.5 transition"
              >
                {showAllAlerts ? (
                  <>
                    <span>Show fewer alerts</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Show all {exposureAlerts.length} alerts</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </section>

      {/* 4. "Your Next Best Step" (Apple Inset Grouped Action Pair) */}
      <section className="bg-white border border-[#E2DBD0] rounded-2xl grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#F0EAE1] overflow-hidden">
        <div className="p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#435C4D]">
              <FileSearch className="w-4 h-4" />
              <span>Next Step in Financial Discovery</span>
            </div>
            <h3 className="text-sm font-medium text-[#261E19]">
              {nextMissingCategory
                ? `Gather: ${nextMissingCategory.label}`
                : 'All 7 Financial Categories Addressed'}
            </h3>
            <p className="text-xs text-[#5C4E43] leading-relaxed">
              {nextMissingCategory
                ? 'Upload what you have—even partial or blurry files—or mark it skipped so your projection and lawyer brief stay accurate.'
                : 'Your core financial categories are complete. Review your Post-Divorce Projection anytime.'}
            </p>
          </div>
          <Link
            to="/discovery"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg transition self-start"
          >
            <span>{nextMissingCategory ? 'Go to Financial Discovery' : 'Review Discovery & Projection'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#435C4D]">
                <FileText className="w-4 h-4" />
                <span>Next Step in Court Checklist</span>
              </div>
              {divorceChecklist?.isPursuingDivorce && checklistSummary && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E6ECE6] text-[#435C4D]">
                  {checklistSummary.percentComplete}% Done
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-[#261E19]">
              {!divorceChecklist?.isPursuingDivorce
                ? 'Checklist Paused (Exploration Mode)'
                : currentChecklistStage
                ? `Current Stage: ${currentChecklistStage.title}`
                : 'All Court Checklist Stages Complete'}
            </h3>
            {divorceChecklist?.isPursuingDivorce && checklistSummary && (
              <div className="w-full bg-[#F0EAE1] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#435C4D] h-full rounded-full transition-all duration-300"
                  style={{ width: `${checklistSummary.percentComplete}%` }}
                />
              </div>
            )}
            <p className="text-xs text-[#5C4E43] leading-relaxed">
              {!divorceChecklist?.isPursuingDivorce
                ? 'Whenever you decide to pursue separation or divorce, generate your tailored California court form checklist in one click.'
                : `${checklistSummary?.completedCount ?? 0} completed · ${checklistSummary?.signedReadyCount ?? 0} signed/ready · ${checklistSummary?.inProgressCount ?? 0} in progress.`}
            </p>
          </div>
          <Link
            to="/checklist"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[#261E19] bg-[#FAF9F6] hover:bg-[#F0EAE1] border border-[#E2DBD0] rounded-lg transition self-start"
          >
            <span>Open Divorce Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 5. "Questions for Your Lawyer" — Apple Inset Grouped List */}
      <section className="bg-white border border-[#E2DBD0] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E2DBD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-medium text-[#261E19] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#435C4D]" />
              <span>Questions Prepared for Your Lawyer Consultation</span>
            </h2>
            <p className="text-xs text-[#5C4E43] mt-0.5">
              Walk into your first consultation focused on what matters—so you don’t waste billable hours on basics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportDiscoveryPacket('print')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#435C4D] bg-[#E6ECE6] hover:bg-[#d7e2d7] rounded-lg transition self-start sm:self-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save Brief</span>
          </button>
        </div>

        <ul className="divide-y divide-[#F0EAE1]">
          {lawyerQuestions.map((q, idx) => (
            <li
              key={idx}
              className="px-6 py-3.5 flex items-start gap-3 text-xs text-[#261E19]"
            >
              <HelpCircle className="w-4 h-4 text-[#435C4D] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{q}</span>
            </li>
          ))}
        </ul>

        <div className="px-6 py-3 bg-[#FAF9F6] border-t border-[#E2DBD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5C4E43]">
          <span>
            Educational financial discovery &amp; planning tool only—not legal or tax advice.
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#261E19] font-medium">
            <PhoneCall className="w-3.5 h-3.5 text-[#435C4D]" />
            <span>Confidential support: 1-800-799-SAFE (7233)</span>
          </span>
        </div>
      </section>

      {/* 6. Consult a Professional */}
      <section className="bg-white border border-[#E2DBD0] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#435C4D]">
            <MapPin className="w-4 h-4" />
            <span>Local Family Law Directory</span>
          </div>
          <h2 className="text-base font-semibold text-[#261E19]">
            Ready to speak with a family law attorney or mediator?
          </h2>
          <p className="text-xs text-[#5C4E43] leading-relaxed">
            Search family law lawyers, divorce mediators, and legal aid offices near your ZIP code or current location on an interactive map, then bring your Sparrow Discovery Brief to your consultation.
          </p>
        </div>
        <Link
          to="/consult"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg shadow-xs transition shrink-0 self-start md:self-auto"
        >
          <Scale className="w-4 h-4" />
          <span>Consult a Professional</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
        </div>

        {/* Right Sidebar: Divorce Timeline & Readiness Infographic */}
        <div className="order-3 md:col-span-1 xl:order-3 xl:sticky xl:top-28">
          <TimelineInfographicSidebar
            stateName={stateName}
            divorceChecklist={divorceChecklist}
            collectedCategoriesCount={collectedCategoriesCount}
            lawyerQuestionsCount={lawyerQuestions.length}
            hasProjection={Boolean(lifeProjection?.canCalculate)}
            assetSplitDeadlines={ledgerProtection?.assetSplitDeadlines || []}
            beneficiaryRequirements={ledgerProtection?.beneficiaryRequirements || []}
            onExportBrief={() => exportDiscoveryPacket('print')}
          />
        </div>
      </div>
    </div>
  );
}
