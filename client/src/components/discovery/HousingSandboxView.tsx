import React, { useState } from 'react';
import { Home, AlertTriangle, CheckCircle, Info, Calculator } from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';

export default function HousingSandboxView() {
  const { workspace } = useDiscovery();
  const { housingSandbox, baseline, privacyMode } = workspace;

  const [customHomeValue, setCustomHomeValue] = useState(housingSandbox.estimatedHomeValue);
  const [customMortgage, setCustomMortgage] = useState(housingSandbox.mortgageBalance);
  const [customIncome, setCustomIncome] = useState(baseline.userNetPaycheck + baseline.spousalSupport);

  const netHomeEquity = customHomeValue - customMortgage;
  const fiftyPercentEquityShare = Math.round(netHomeEquity / 2);

  // Estimated new mortgage payment if forced to refinance at current ~6.8% rate to buy out spouse share
  const newBuyoutLoanAmount = customMortgage + fiftyPercentEquityShare;
  const estRefinancedMonthlyPayment = Math.round((newBuyoutLoanAmount * 0.0065) + housingSandbox.escrow);

  const currentHousingRatio = Math.round((housingSandbox.monthlyMortgageTotal / (customIncome || 1)) * 100);
  const refinancedHousingRatio = Math.round((estRefinancedMonthlyPayment / (customIncome || 1)) * 100);

  const maskValue = (val: number) => {
    if (privacyMode) return '••••••';
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2DBD0] pb-4">
        <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
          Housing Sandbox & Community Equity Simulator
        </h1>
        <p className="text-xs text-[#5C4E43] mt-1">
          California Family Code § 2550 equal division of real property · Grounded in verified mortgage statements
        </p>
      </div>

      {/* Property Overview Card */}
      <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#F0EAE1] pb-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
              Verified Residential Real Estate
            </span>
            <strong className="text-base text-[#261E19] font-medium block mt-0.5">
              {housingSandbox.propertyAddress}
            </strong>
          </div>
          <span className="text-xs text-[#8C7D73] font-mono">
            Status: {housingSandbox.coBorrowerStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[#8C7D73] block text-[11px]">Remaining Mortgage</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
              {maskValue(housingSandbox.mortgageBalance)}
            </span>
          </div>

          <div>
            <span className="text-[#8C7D73] block text-[11px]">Locked Interest Rate</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-[#435C4D]">
              {housingSandbox.interestRate}% Fixed
            </span>
          </div>

          <div>
            <span className="text-[#8C7D73] block text-[11px]">Current Payment (PITI)</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
              {maskValue(housingSandbox.monthlyMortgageTotal)} / mo
            </span>
          </div>

          <div>
            <span className="text-[#8C7D73] block text-[11px]">Net Community Equity</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
              {maskValue(netHomeEquity)}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario A: Buyout & Keep Home */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
            <div>
              <h3 className="text-sm font-medium text-[#261E19]">
                Scenario A · Sole Buyout & Refinance
              </h3>
              <p className="text-xs text-[#5C4E43]">
                Refinancing into your sole name and delivering 50% equity cash to your spouse
              </p>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              refinancedHousingRatio > 45 ? 'bg-amber-100 text-amber-900 font-medium' : 'bg-[#E6ECE6] text-[#435C4D]'
            }`}>
              {refinancedHousingRatio}% of Income
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E2DBD0] space-y-1">
              <span className="text-[#8C7D73] block text-[11px]">Equalization Payout Owed to Spouse</span>
              <div className="text-lg font-mono tabular-nums font-semibold text-[#261E19]">
                {maskValue(fiftyPercentEquityShare)}
              </div>
              <p className="text-[11px] text-[#5C4E43]">
                You must pay this cash lump-sum or offset with retirement/cash accounts.
              </p>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E2DBD0] space-y-1">
              <span className="text-[#8C7D73] block text-[11px]">Projected New Monthly Mortgage at Today's Rates (~6.8%)</span>
              <div className="text-lg font-mono tabular-nums font-semibold text-[#261E19]">
                {maskValue(estRefinancedMonthlyPayment)} / mo
              </div>
              <p className="text-[11px] text-[#5C4E43]">
                Increases monthly housing expense by ~{maskValue(estRefinancedMonthlyPayment - housingSandbox.monthlyMortgageTotal)}/mo because you forfeit the 3.25% locked rate.
              </p>
            </div>

            {refinancedHousingRatio > 45 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Advisory Warning:</strong> The refinanced housing payment would consume {refinancedHousingRatio}% of your post-divorce income, exceeding the recommended 45% safety ceiling.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scenario B: Sell & Divide Net Equity */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
            <div>
              <h3 className="text-sm font-medium text-[#261E19]">
                Scenario B · Sell & Equal Distribution
              </h3>
              <p className="text-xs text-[#5C4E43]">
                Listing the home for public sale and splitting net proceeds 50/50
              </p>
            </div>
            <span className="text-xs font-mono bg-[#E6ECE6] text-[#435C4D] px-2 py-0.5 rounded font-medium">
              Immediate Liquidity
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E2DBD0] space-y-1">
              <span className="text-[#8C7D73] block text-[11px]">Estimated Cash Lump Sum to You</span>
              <div className="text-xl font-mono tabular-nums font-semibold text-[#435C4D]">
                +{maskValue(fiftyPercentEquityShare)}
              </div>
              <p className="text-[11px] text-[#5C4E43]">
                Net after payoff of remaining mortgage principal (before broker closing commissions).
              </p>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E2DBD0] space-y-1">
              <span className="text-[#8C7D73] block text-[11px]">Financial Flexibility</span>
              <p className="text-[11px] text-[#5C4E43] leading-relaxed">
                Relieves you of sole maintenance, property tax risk, and high refinance interest rates. Provides unrestricted emergency cash reserves for renting or purchasing when ready.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E2DBD0] text-[#5C4E43] text-xs">
              <strong>Attorney Note:</strong> Many women keep the house out of emotional safety, only to face house-poor stress. Scenario B guarantees clean liquidity without spousal buyout disputes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
