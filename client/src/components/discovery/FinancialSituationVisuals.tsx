import React from 'react';

interface FinancialSituationVisualsProps {
  totalAssets: number;
  retirementAssets: number;
  liquidOtherAssets: number;
  unlistedAssets: number;
  mortgageDebt: number;
  netEstate: number;
  totalMonthlyInflowWithSupport: number;
  mustPaysTotal: number;
  lifeKidsTotal: number;
  totalMonthlyOutflow: number;
  monthlyCushion: number;
  privacyMode: boolean;
}

export default function FinancialSituationVisuals({
  totalAssets,
  retirementAssets,
  liquidOtherAssets,
  unlistedAssets,
  mortgageDebt,
  netEstate,
  totalMonthlyInflowWithSupport,
  mustPaysTotal,
  lifeKidsTotal,
  totalMonthlyOutflow,
  monthlyCushion,
  privacyMode
}: FinancialSituationVisualsProps) {
  const maskMoney = (val: number) => {
    if (privacyMode) return '••••••';
    return `$${Math.round(val).toLocaleString()}`;
  };

  // 1. Donut Chart Math (radius = 42, circumference = 2 * pi * 42 ≈ 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const assetDenom = totalAssets > 0 ? totalAssets : 1;
  const retFrac = totalAssets > 0 ? retirementAssets / assetDenom : 0;
  const liqFrac = totalAssets > 0 ? liquidOtherAssets / assetDenom : 0;
  const unlFrac = totalAssets > 0 ? unlistedAssets / assetDenom : 0;

  const retLen = retFrac * circumference;
  const liqLen = liqFrac * circumference;
  const unlLen = unlFrac * circumference;

  // 2. Semi-circle Gauge Math (radius = 48, half circumference = pi * 48 ≈ 150.8)
  const gaugeRadius = 48;
  const halfCirc = Math.PI * gaugeRadius;
  const inflowSafe = Math.max(totalMonthlyInflowWithSupport, 1);
  const expenseRatio = Math.min(1, Math.max(0, totalMonthlyOutflow / inflowSafe));
  const expenseArc = expenseRatio * halfCirc;
  const expensePct = totalMonthlyInflowWithSupport > 0
    ? Math.round((totalMonthlyOutflow / totalMonthlyInflowWithSupport) * 100)
    : 0;

  // 3. 50/50 Share Math
  const estimatedHalfShare = Math.max(0, Math.round(netEstate / 2));
  const potentialHalfUnlisted = Math.round(unlistedAssets / 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
      {/* VISUAL 1: Donut Chart — Where Your Money Lives */}
      <div className="p-4 rounded-xl border border-[#E2DBD0] bg-[#FAF9F6] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#261E19]">Where Your Money Lives</span>
          <span className="text-[11px] font-mono text-[#8C7D73]">
            Debt: {maskMoney(mortgageDebt)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="55"
                cy="55"
                r={radius}
                fill="none"
                stroke="#E2DBD0"
                strokeWidth="12"
              />
              {totalAssets > 0 && (
                <>
                  {/* Retirement */}
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="#435C4D"
                    strokeWidth="12"
                    strokeDasharray={`${retLen} ${circumference}`}
                    strokeDashoffset={0}
                  />
                  {/* Spendable Cash & Savings */}
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="#839E8D"
                    strokeWidth="12"
                    strokeDasharray={`${liqLen} ${circumference}`}
                    strokeDashoffset={-retLen}
                  />
                  {/* Accounts to Verify */}
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="12"
                    strokeDasharray={`${unlLen} ${circumference}`}
                    strokeDashoffset={-(retLen + liqLen)}
                  />
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase tracking-wider text-[#8C7D73]">Assets</span>
              <span className="text-xs font-mono font-semibold text-[#261E19]">
                {maskMoney(totalAssets)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1.5 text-[#5C4E43] truncate">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#435C4D] shrink-0" />
                Retirement
              </span>
              <span className="font-mono text-[#261E19]">{maskMoney(retirementAssets)}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1.5 text-[#5C4E43] truncate">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#839E8D] shrink-0" />
                Cash &amp; Savings
              </span>
              <span className="font-mono text-[#261E19]">{maskMoney(liquidOtherAssets)}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1.5 text-[#5C4E43] truncate">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 shrink-0" />
                To Verify
              </span>
              <span className="font-mono text-[#261E19]">{maskMoney(unlistedAssets)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* VISUAL 2: Semi-Circular Gauge — Monthly Cashflow & Cushion */}
      <div className="p-4 rounded-xl border border-[#E2DBD0] bg-[#FAF9F6] flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#261E19]">Monthly Cushion Gauge</span>
          <span className={`font-mono text-[11px] font-medium ${monthlyCushion >= 0 ? 'text-[#435C4D]' : 'text-rose-700'}`}>
            {monthlyCushion >= 0 ? `+${maskMoney(monthlyCushion)}/mo` : `${maskMoney(monthlyCushion)}/mo`}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-44 h-24 flex items-end justify-center">
            <svg viewBox="0 0 120 68" className="w-full h-full overflow-visible">
              {/* Track arc */}
              <path
                d="M 12 60 A 48 48 0 0 1 108 60"
                fill="none"
                stroke="#E2DBD0"
                strokeWidth="11"
                strokeLinecap="round"
              />
              {/* Filled expense ratio arc */}
              <path
                d="M 12 60 A 48 48 0 0 1 108 60"
                fill="none"
                stroke={expensePct > 90 ? '#9F1239' : expensePct > 75 ? '#D97706' : '#435C4D'}
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${expenseArc} ${halfCirc}`}
              />
            </svg>
            <div className="absolute bottom-1 text-center">
              <div className="text-sm font-mono font-semibold text-[#261E19]">
                {totalMonthlyInflowWithSupport > 0 ? `${expensePct}% used` : 'No income yet'}
              </div>
              <div className="text-[10px] text-[#8C7D73]">
                {maskMoney(totalMonthlyOutflow)} of {maskMoney(totalMonthlyInflowWithSupport)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#5C4E43] pt-1 border-t border-[#E2DBD0]/70">
          <span>Must-Pays: <strong className="font-mono text-[#261E19]">{maskMoney(mustPaysTotal)}</strong></span>
          <span>Life &amp; Kids: <strong className="font-mono text-[#261E19]">{maskMoney(lifeKidsTotal)}</strong></span>
        </div>
      </div>

      {/* VISUAL 3: 50/50 Community Share Balance Graphic */}
      <div className="p-4 rounded-xl border border-[#E2DBD0] bg-[#FAF9F6] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#261E19]">50/50 Marital Split View</span>
          <span className="text-[11px] font-mono text-[#435C4D]">
            Net: {maskMoney(netEstate)}
          </span>
        </div>

        {/* Custom SVG Split Tree / Balance Connector */}
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="px-3 py-1 rounded-full bg-white border border-[#E2DBD0] text-[11px] font-medium text-[#261E19]">
              Combined Net Estate: <span className="font-mono">{maskMoney(netEstate)}</span>
            </div>
          </div>

          <svg viewBox="0 0 220 26" className="w-full h-6">
            <line x1="110" y1="0" x2="110" y2="10" stroke="#8C7D73" strokeWidth="1.5" />
            <line x1="55" y1="10" x2="165" y2="10" stroke="#8C7D73" strokeWidth="1.5" />
            <line x1="55" y1="10" x2="55" y2="26" stroke="#435C4D" strokeWidth="1.5" />
            <line x1="165" y1="10" x2="165" y2="26" stroke="#8C7D73" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="110" cy="10" r="3" fill="#435C4D" />
          </svg>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[#E6ECE6]/70 border border-[#435C4D]/30 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#435C4D] font-medium">
                Your 50% Share
              </div>
              <div className="text-sm font-mono font-semibold text-[#261E19] mt-0.5">
                {maskMoney(estimatedHalfShare)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#E2DBD0] text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#8C7D73] font-medium">
                Spouse 50% Share
              </div>
              <div className="text-sm font-mono font-semibold text-[#5C4E43] mt-0.5">
                {maskMoney(estimatedHalfShare)}
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-[#5C4E43] text-center">
          {potentialHalfUnlisted > 0
            ? `Includes up to +${maskMoney(potentialHalfUnlisted)} from accounts to verify`
            : 'Equal division baseline before support adjustments'}
        </div>
      </div>
    </div>
  );
}
