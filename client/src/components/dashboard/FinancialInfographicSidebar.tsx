import React from 'react';
import { Link } from 'react-router-dom';
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

  // Fallback breakdown from vault when projection is incomplete
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

  const totalEstate = retVal + liqVal + homeVal + flaggedVal;
  const pct = (v: number) => (totalEstate > 0 ? Math.round((v / totalEstate) * 100) : 0);

  const totalDebt = hasProjection
    ? lifeProjection?.assetDivision?.totalDebts ?? housingSandbox?.mortgageBalance ?? 0
    : housingSandbox?.mortgageBalance ?? 0;

  // Monthly cash flow
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

  const maxFlow = Math.max(monthlyInflow, monthlyOutflow, 1);
  const inflowWidth = Math.min(100, Math.round((monthlyInflow / maxFlow) * 100));
  const outflowWidth = Math.min(100, Math.round((monthlyOutflow / maxFlow) * 100));

  const coveredCount = checklist.filter((c) => c.status !== 'Missing').length;

  const segments = [
    { label: 'Retirement', value: retVal, color: '#346538' },
    { label: 'Cash & Liquid', value: liqVal, color: '#839E8D' },
    { label: 'Home Equity', value: homeVal, color: '#C5B8A5' },
    ...(flaggedVal > 0 ? [{ label: `Unlisted (${flaggedLeadsCount})`, value: flaggedVal, color: '#D9A441' }] : [])
  ];

  return (
    <aside aria-label="Financial Snapshot" className="space-y-4">
      {/* Section Eyebrow */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#787774]">
          Financial Snapshot
        </span>
        <Link
          to="/discovery"
          className="text-[11px] font-medium text-[#2F3437] hover:text-[#111111] transition-colors"
        >
          Details →
        </Link>
      </div>

      {/* Card 1: Estate Breakdown */}
      <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 space-y-5">
        <div className="space-y-1">
          <div className="text-[11px] text-[#787774]">Estimated 50% Share</div>
          <div className="font-serif text-3xl tracking-[-0.03em] leading-[1.1] text-[#111111] tabular-nums">
            {mask(userAssetShare)}
          </div>
          {totalDebt > 0 && (
            <div className="text-[11px] text-[#787774] pt-0.5 tabular-nums">
              Net of {mask(totalDebt)} shared debt
            </div>
          )}
        </div>

        {/* Single Minimalist Stacked Bar */}
        <div className="space-y-2">
          <div
            className="w-full h-2 rounded-sm bg-[#F7F6F3] overflow-hidden flex gap-px"
            role="img"
            aria-label="Asset allocation breakdown"
          >
            {totalEstate > 0 &&
              segments.map((seg) =>
                seg.value > 0 ? (
                  <div
                    key={seg.label}
                    style={{ width: `${pct(seg.value)}%`, backgroundColor: seg.color }}
                    className="h-full transition-all duration-500"
                    title={`${seg.label}: ${pct(seg.value)}%`}
                  />
                ) : null
              )}
          </div>
        </div>

        {/* Clean Hairline Rows */}
        <div className="divide-y divide-[#EAEAEA] border-t border-[#EAEAEA]">
          {segments.map((seg) => (
            <div key={seg.label} className="py-2.5 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-2 text-[#2F3437]">
                <span
                  className="w-2 h-2 rounded-[2px] shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span>{seg.label}</span>
              </span>
              <span className="font-mono tabular-nums text-[#111111]">
                {mask(seg.value)}
                <span className="text-[#787774] ml-1.5 text-[11px]">{pct(seg.value)}%</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Card 2: Monthly Cash Flow & Discovery */}
      <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#111111]">Monthly Cash Flow</span>
          {hasProjection && (
            <span
              className={`text-[10px] font-mono tabular-nums uppercase tracking-[0.04em] px-2 py-0.5 rounded-full ${
                monthlyNet >= 0
                  ? 'bg-[#EDF3EC] text-[#346538]'
                  : 'bg-[#FDEBEC] text-[#9F2F2D]'
              }`}
            >
              {monthlyNet >= 0 ? '+' : ''}
              {mask(monthlyNet)}/mo
            </span>
          )}
        </div>

        {hasProjection ? (
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#787774]">Inflow</span>
                <span className="font-mono tabular-nums text-[#111111]">
                  {mask(monthlyInflow)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#F7F6F3] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#346538] transition-all duration-500"
                  style={{ width: `${inflowWidth}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#787774]">Outflow</span>
                <span className="font-mono tabular-nums text-[#111111]">
                  {mask(monthlyOutflow)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#F7F6F3] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#2F3437] transition-all duration-500"
                  style={{ width: `${outflowWidth}%` }}
                />
              </div>
            </div>

            {housingRatio > 0 && (
              <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-[11px]">
                <span className="text-[#787774]">Housing load</span>
                <span
                  className={`font-mono tabular-nums ${
                    housingRatio > 40 ? 'text-[#9F2F2D] font-medium' : 'text-[#2F3437]'
                  }`}
                >
                  {housingRatio}% of income
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-[#787774] leading-[1.6]">
              Add income &amp; living estimates to preview your post-divorce monthly balance.
            </p>
            <Link
              to="/discovery#projection-engine"
              className="inline-block text-xs font-medium text-[#111111] underline underline-offset-4 decoration-[#EAEAEA] hover:decoration-[#111111] transition-colors"
            >
              Add estimates →
            </Link>
          </div>
        )}

        {/* Discovery Coverage Strip */}
        <div className="pt-4 border-t border-[#EAEAEA] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#787774]">Discovery Files</span>
            <span className="font-mono tabular-nums text-[#111111]">
              {coveredCount} / 7
            </span>
          </div>

          <div
            className="grid grid-cols-7 gap-1"
            role="img"
            aria-label={`${coveredCount} of 7 discovery categories covered`}
          >
            {checklist.map((item) => (
              <div
                key={item.key}
                title={`${item.title}: ${item.status}`}
                className={`h-1.5 rounded-[2px] transition-colors ${
                  item.status === 'Reviewed'
                    ? 'bg-[#346538]'
                    : item.status === 'Uploaded'
                    ? 'bg-[#94B097]'
                    : 'bg-[#EAEAEA]'
                }`}
              />
            ))}
          </div>

          {flaggedLeadsCount > 0 && (
            <Link
              to="/discovery"
              className="mt-1 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#FBF3DB] text-[#956400] text-[11px] font-medium"
            >
              <span>
                {flaggedLeadsCount} unlisted lead{flaggedLeadsCount > 1 ? 's' : ''} flagged
              </span>
              <span>→</span>
            </Link>
          )}
        </div>
      </section>
    </aside>
  );
}
