import React from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  FileCheck2,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { CategoryChecklistItem, DiscoveryWorkspaceState } from '../../types/discovery';

interface FinancialInfographicSidebarProps {
  privacyMode: boolean;
  accountVault: DiscoveryWorkspaceState['accountVault'];
  housingSandbox: DiscoveryWorkspaceState['housingSandbox'];
  baseline: DiscoveryWorkspaceState['baseline'];
  checklist: CategoryChecklistItem[];
  lifeProjection: any;
  userAssetShare: number;
  liquidShare: number;
  retirementShare: number;
  homeEquityShare: number;
  potentialUndisclosedShare: number;
  flaggedLeadsCount: number;
}

function formatMoney(val: number | null | undefined) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '$0';
  return `$${Math.round(Number(val)).toLocaleString()}`;
}

export default function FinancialInfographicSidebar({
  privacyMode,
  accountVault,
  housingSandbox,
  baseline,
  checklist,
  lifeProjection,
  userAssetShare,
  liquidShare,
  retirementShare,
  homeEquityShare,
  potentialUndisclosedShare,
  flaggedLeadsCount
}: FinancialInfographicSidebarProps) {
  const mask = (val: number | null | undefined) => {
    if (privacyMode) return '••••••';
    return formatMoney(val);
  };

  // Fallback asset breakdown from vault if lifeProjection isn't ready
  const vaultRetirement = accountVault
    .filter((a) => !a.isUnlistedDiscovery && /401|ira|pension|retire/i.test(a.accountType + a.name))
    .reduce((s, a) => s + (a.balance || 0), 0);
  const vaultLiquid = accountVault
    .filter((a) => !a.isUnlistedDiscovery && !/401|ira|pension|retire/i.test(a.accountType + a.name))
    .reduce((s, a) => s + (a.balance || 0), 0);
  const vaultUnlisted = accountVault
    .filter((a) => a.isUnlistedDiscovery)
    .reduce((s, a) => s + (a.balance || 0), 0);
  const vaultHomeEquity = Math.max(
    0,
    (housingSandbox?.estimatedHomeValue || 0) - (housingSandbox?.mortgageBalance || 0)
  );

  const hasProjection = Boolean(lifeProjection?.canCalculate);

  const retVal = hasProjection ? Math.max(0, retirementShare) : Math.round(vaultRetirement * 0.5);
  const liqVal = hasProjection ? Math.max(0, liquidShare) : Math.round(vaultLiquid * 0.5);
  const homeVal = hasProjection ? Math.max(0, homeEquityShare) : Math.round(vaultHomeEquity * 0.5);
  const flaggedVal = Math.max(0, potentialUndisclosedShare || Math.round(vaultUnlisted * 0.5));

  const totalConfirmedShare = retVal + liqVal + homeVal;
  const donutTotal = totalConfirmedShare + flaggedVal;
  const denom = donutTotal > 0 ? donutTotal : 1;

  // SVG Donut math (r = 36, C = 2 * pi * 36 ≈ 226.19)
  const r = 36;
  const C = 2 * Math.PI * r;
  const retLen = (retVal / denom) * C;
  const liqLen = (liqVal / denom) * C;
  const homeLen = (homeVal / denom) * C;
  const flaggedLen = (flaggedVal / denom) * C;

  const totalDebt = hasProjection
    ? lifeProjection?.assetDivision?.totalDebts ?? housingSandbox?.mortgageBalance ?? 0
    : housingSandbox?.mortgageBalance ?? 0;

  // Monthly Cash Flow Infographic data
  const baselineOutflow = [...(baseline?.mustPays || []), ...(baseline?.lifeAndKids || [])].reduce(
    (s, e) => s + (e.amount || 0),
    0
  );
  const monthlyInflow = hasProjection
    ? lifeProjection?.monthlyCashFlow?.totalMonthlyTakeHome ?? 0
    : 0;
  const monthlyOutflow = hasProjection
    ? lifeProjection?.monthlyCashFlow?.totalMonthlyExpenses ?? 0
    : baselineOutflow;
  const monthlyNet = hasProjection
    ? lifeProjection?.monthlyCashFlow?.monthlyNetCashFlow ?? monthlyInflow - monthlyOutflow
    : 0;
  const housingRatio = hasProjection
    ? lifeProjection?.monthlyCashFlow?.housingToIncomeRatio ?? 0
    : 0;

  const earnedNet = hasProjection ? lifeProjection?.monthlyTakeHome?.earnedIncome ?? 0 : 0;
  const spousalMid = hasProjection
    ? lifeProjection?.monthlyTakeHome?.spousalSupport?.monthlyMid ?? 0
    : 0;
  const childMid = hasProjection
    ? lifeProjection?.monthlyTakeHome?.childSupport?.monthlyMid ?? 0
    : 0;

  const maxFlow = Math.max(monthlyInflow, monthlyOutflow, 1);
  const inflowPct = Math.min(100, Math.round((monthlyInflow / maxFlow) * 100));
  const outflowPct = Math.min(100, Math.round((monthlyOutflow / maxFlow) * 100));

  // Discovery 7-category coverage
  const reviewedCount = checklist.filter((c) => c.status === 'Reviewed').length;
  const uploadedCount = checklist.filter((c) => c.status === 'Uploaded').length;
  const missingCount = checklist.filter((c) => c.status === 'Missing').length;
  const coveredCount = reviewedCount + uploadedCount;

  const pct = (v: number) => (donutTotal > 0 ? Math.round((v / donutTotal) * 100) : 0);

  return (
    <aside aria-label="Financial Snapshot Infographic" className="space-y-4">
      {/* Header Pill */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#546347] flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5" />
          <span>Financial Infographic</span>
        </span>
        <Link
          to="/discovery"
          className="text-[11px] font-medium text-[#435C4D] hover:underline inline-flex items-center gap-0.5"
        >
          <span>Full View</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* CARD 1: Estate & Asset Mix Donut */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold text-[#261E19] font-sans">
              Your 50% Estate Breakdown
            </h2>
            <p className="text-[11px] text-[#8C7D73]">
              Confirmed share + flagged leads
            </p>
          </div>
          {totalDebt > 0 && (
            <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E2DBD0] text-[#5C4E43] shrink-0">
              Debt {mask(totalDebt)}
            </span>
          )}
        </div>

        {/* SVG Donut + Center Readout */}
        <div className="flex items-center justify-center py-1">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={r}
                fill="none"
                stroke="#F0EAE1"
                strokeWidth="11"
              />
              {donutTotal > 0 && (
                <>
                  <circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="none"
                    stroke="#435C4D"
                    strokeWidth="11"
                    strokeDasharray={`${retLen} ${C}`}
                    strokeDashoffset={0}
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="none"
                    stroke="#839E8D"
                    strokeWidth="11"
                    strokeDasharray={`${liqLen} ${C}`}
                    strokeDashoffset={-retLen}
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="none"
                    stroke="#A07E5F"
                    strokeWidth="11"
                    strokeDasharray={`${homeLen} ${C}`}
                    strokeDashoffset={-(retLen + liqLen)}
                    className="transition-all duration-500"
                  />
                  {flaggedVal > 0 && (
                    <circle
                      cx="48"
                      cy="48"
                      r={r}
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="11"
                      strokeDasharray={`${flaggedLen} ${C}`}
                      strokeDashoffset={-(retLen + liqLen + homeLen)}
                      className="transition-all duration-500"
                    />
                  )}
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <span className="text-[9px] uppercase tracking-wider text-[#8C7D73]">
                Est. Share
              </span>
              <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
                {mask(userAssetShare)}
              </span>
            </div>
          </div>
        </div>

        {/* Segmented Legend Rows with Mini Proportion Bars */}
        <div className="space-y-2 pt-1 border-t border-[#F0EAE1]">
          {[
            { label: 'Retirement (QDRO)', value: retVal, color: '#435C4D' },
            { label: 'Liquid & Cash', value: liqVal, color: '#839E8D' },
            { label: 'Home Equity', value: homeVal, color: '#A07E5F' },
            ...(flaggedVal > 0
              ? [{ label: `Flagged (${flaggedLeadsCount})`, value: flaggedVal, color: '#D97706' }]
              : [])
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-[#5C4E43] truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="font-mono tabular-nums text-[#261E19] font-medium shrink-0">
                  {mask(item.value)}
                  <span className="text-[10px] text-[#8C7D73] ml-1">({pct(item.value)}%)</span>
                </span>
              </div>
              <div className="w-full h-1 bg-[#F4EFEA] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct(item.value)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 2: Monthly Cash Flow Waterfall */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#261E19] font-sans flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#435C4D]" />
              <span>Monthly Cash Flow</span>
            </h2>
            <p className="text-[11px] text-[#8C7D73]">Post-divorce inflow vs. outflow</p>
          </div>
          {hasProjection && (
            <span
              className={`text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-full ${
                monthlyNet >= 0
                  ? 'bg-[#E6ECE6] text-[#354A3E]'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {monthlyNet >= 0 ? '+' : ''}
              {mask(monthlyNet)}
            </span>
          )}
        </div>

        {hasProjection ? (
          <div className="space-y-3">
            {/* Inflow vs Outflow Comparative Bars */}
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#5C4E43]">Projected Inflow</span>
                  <span className="font-mono tabular-nums font-medium text-[#261E19]">
                    {mask(monthlyInflow)}/mo
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F4EFEA] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#435C4D] transition-all duration-500"
                    style={{
                      width: `${
                        monthlyInflow > 0 ? Math.round((earnedNet / maxFlow) * 100) : 0
                      }%`
                    }}
                    title="Earned Net Income"
                  />
                  <div
                    className="h-full bg-[#839E8D] transition-all duration-500"
                    style={{
                      width: `${
                        monthlyInflow > 0
                          ? Math.max(0, inflowPct - Math.round((earnedNet / maxFlow) * 100))
                          : 0
                      }%`
                    }}
                    title="Estimated Support"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#8C7D73]">
                  <span>Earned: {mask(earnedNet)}</span>
                  <span>Support: {mask(spousalMid + childMid)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#5C4E43]">Est. Outflow</span>
                  <span className="font-mono tabular-nums font-medium text-[#261E19]">
                    {mask(monthlyOutflow)}/mo
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F4EFEA] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      monthlyOutflow > monthlyInflow ? 'bg-amber-600' : 'bg-[#A07E5F]'
                    }`}
                    style={{ width: `${outflowPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Housing-to-Income Ratio Meter */}
            {housingRatio > 0 && (
              <div className="pt-2.5 border-t border-[#F0EAE1] flex items-center justify-between text-[11px]">
                <span className="text-[#5C4E43] flex items-center gap-1">
                  {housingRatio > 40 && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                  <span>Housing Load</span>
                </span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    housingRatio > 40 ? 'text-amber-700' : 'text-[#435C4D]'
                  }`}
                >
                  {housingRatio}% of income
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] space-y-2">
            <p className="text-[11px] text-[#5C4E43] leading-relaxed">
              Add income &amp; living estimates to unlock your post-divorce monthly cash flow meter.
            </p>
            <Link
              to="/discovery#projection-engine"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#435C4D] hover:underline"
            >
              <span>Complete 2-min estimate</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* CARD 3: 7-Category Discovery Coverage */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#261E19] font-sans flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-[#435C4D]" />
            <span>Discovery Coverage</span>
          </h2>
          <span className="text-[11px] font-mono tabular-nums font-semibold text-[#435C4D]">
            {coveredCount}/7
          </span>
        </div>

        {/* 7-Segment Infographic Bar */}
        <div className="grid grid-cols-7 gap-1" role="img" aria-label={`${coveredCount} of 7 discovery categories covered`}>
          {checklist.map((item) => {
            const bg =
              item.status === 'Reviewed'
                ? 'bg-[#435C4D]'
                : item.status === 'Uploaded'
                ? 'bg-[#839E8D]'
                : 'bg-[#E2DBD0]';
            return (
              <div
                key={item.key}
                title={`${item.title}: ${item.status}`}
                className={`h-2 rounded-full ${bg} transition-colors`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#5C4E43]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#435C4D]" />
            {reviewedCount} Verified
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#839E8D]" />
            {uploadedCount} Uploaded
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E2DBD0]" />
            {missingCount} Missing
          </span>
        </div>

        {flaggedLeadsCount > 0 && (
          <Link
            to="/discovery"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 hover:bg-amber-50 transition"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                {flaggedLeadsCount} unlisted lead{flaggedLeadsCount > 1 ? 's' : ''}
              </span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
          </Link>
        )}
      </div>
    </aside>
  );
}
