import React from 'react';
import { DollarSign, Shield, ArrowUpRight, ArrowDownRight, Layers, CheckCircle } from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';

export default function MyNewBaselineView() {
  const { workspace } = useDiscovery();
  const { baseline, privacyMode } = workspace;

  const mustPaysTotal = baseline.mustPays.reduce((acc, e) => acc + e.amount, 0);
  const lifeKidsTotal = baseline.lifeAndKids.reduce((acc, e) => acc + e.amount, 0);
  const totalLivingEssentials = mustPaysTotal + lifeKidsTotal;
  const breathingRoom = baseline.monthlyInflow - totalLivingEssentials;

  const maskValue = (val: number) => {
    if (privacyMode) return '••••••';
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2DBD0] pb-4">
        <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
          My New Baseline (Monthly Cash Flow)
        </h1>
        <p className="text-xs text-[#5C4E43] mt-1">
          Grounded living expenses extracted from bank & pay records · Structured for California Judicial Council Form FL-150
        </p>
      </div>

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Observed Monthly Inflow
          </span>
          <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19] mt-1">
            {maskValue(baseline.monthlyInflow)}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Net paychecks & deposits
          </span>
        </div>

        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Bucket A · Must-Pays
          </span>
          <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19] mt-1">
            {maskValue(mustPaysTotal)}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Housing, utilities, food & debt
          </span>
        </div>

        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Bucket B · Life & Kids
          </span>
          <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19] mt-1">
            {maskValue(lifeKidsTotal)}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Healthcare, tutoring & transit
          </span>
        </div>

        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Monthly Breathing Room
          </span>
          <div className={`text-2xl font-mono tabular-nums font-semibold mt-1 ${
            breathingRoom >= 0 ? 'text-[#435C4D]' : 'text-rose-700'
          }`}>
            {breathingRoom >= 0 ? '+' : ''}{maskValue(breathingRoom)}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            {breathingRoom >= 0 ? 'Cash buffer after all essentials' : 'Monthly deficit before support'}
          </span>
        </div>
      </div>

      {/* The Two Buckets Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bucket A: Must-Pays */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
            <div>
              <h3 className="text-sm font-medium text-[#261E19]">
                Bucket A · Must-Pays ({baseline.mustPays.length})
              </h3>
              <p className="text-xs text-[#5C4E43]">
                Core survival essentials: shelter, utilities, nutrition, childcare, minimum debt
              </p>
            </div>
            <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
              {maskValue(mustPaysTotal)} <span className="text-xs font-normal text-[#8C7D73]">/ mo</span>
            </span>
          </div>

          <div className="space-y-2">
            {baseline.mustPays.map((exp) => (
              <div key={exp.id} className="p-3 rounded-lg border border-[#F0EAE1] bg-[#FAF9F6] flex items-center justify-between text-xs">
                <div>
                  <strong className="text-[#261E19] font-medium">{exp.name}</strong>
                  <div className="text-[11px] text-[#8C7D73] flex items-center gap-1.5 mt-0.5">
                    <span>{exp.category}</span>
                    <span>·</span>
                    <span>Source: {exp.sourceDocName || 'Bank Feed'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono tabular-nums font-semibold text-[#261E19]">
                    {maskValue(exp.amount)}
                  </span>
                  <span className="text-[10px] text-[#8C7D73] block">monthly</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bucket B: Life & Kids */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
            <div>
              <h3 className="text-sm font-medium text-[#261E19]">
                Bucket B · Life & Kids ({baseline.lifeAndKids.length})
              </h3>
              <p className="text-xs text-[#5C4E43]">
                Children’s health, education, extracurriculars, transit & well-being
              </p>
            </div>
            <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
              {maskValue(lifeKidsTotal)} <span className="text-xs font-normal text-[#8C7D73]">/ mo</span>
            </span>
          </div>

          <div className="space-y-2">
            {baseline.lifeAndKids.map((exp) => (
              <div key={exp.id} className="p-3 rounded-lg border border-[#F0EAE1] bg-[#FAF9F6] flex items-center justify-between text-xs">
                <div>
                  <strong className="text-[#261E19] font-medium">{exp.name}</strong>
                  <div className="text-[11px] text-[#8C7D73] flex items-center gap-1.5 mt-0.5">
                    <span>{exp.category}</span>
                    <span>·</span>
                    <span>Source: {exp.sourceDocName || 'Bank Feed'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono tabular-nums font-semibold text-[#261E19]">
                    {maskValue(exp.amount)}
                  </span>
                  <span className="text-[10px] text-[#8C7D73] block">monthly</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
