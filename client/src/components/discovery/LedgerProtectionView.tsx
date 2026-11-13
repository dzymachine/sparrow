import React from 'react';
import { Shield, Clock, Users, HeartHandshake, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';

export default function LedgerProtectionView() {
  const { workspace } = useDiscovery();
  const { ledgerProtection, privacyMode } = workspace;

  const maskValue = (val: number) => {
    if (privacyMode) return '••••••';
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2DBD0] pb-4">
        <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
          Ledger & Protection (Support & Stipulations)
        </h1>
        <p className="text-xs text-[#5C4E43] mt-1">
          Court obligations, co-parenting split ratios, and beneficiary protection deadlines extracted from marital stipulations
        </p>
      </div>

      {/* Support Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Guideline Spousal Maintenance
          </span>
          <div className="text-xl font-mono tabular-nums font-semibold text-[#261E19] mt-1">
            {maskValue(ledgerProtection.spousalSupportMonthly)} <span className="text-xs font-normal text-[#8C7D73]">/ mo</span>
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Under Cal. Fam. Code § 4320 statutory factors
          </span>
        </div>

        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Child Support Obligation
          </span>
          <div className="text-xl font-mono tabular-nums font-semibold text-[#261E19] mt-1">
            {maskValue(ledgerProtection.childSupportMonthly)} <span className="text-xs font-normal text-[#8C7D73]">/ mo</span>
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Based on 2 minor children & parent incomes
          </span>
        </div>

        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Co-Parenting Time Share
          </span>
          <div className="text-xl font-mono tabular-nums font-semibold text-[#435C4D] mt-1">
            {ledgerProtection.coparentingSplitRatio}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Physical custody time allocation
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Stipulation Financial Obligations */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
          <div className="border-b border-[#F0EAE1] pb-3">
            <h3 className="text-sm font-medium text-[#261E19]">
              Stipulated Financial Obligations ({ledgerProtection.obligations.length})
            </h3>
            <p className="text-xs text-[#5C4E43]">
              Binding terms extracted from draft marital agreements and temporary court orders
            </p>
          </div>

          <div className="space-y-2.5">
            {ledgerProtection.obligations.map((ob, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-[#F0EAE1] bg-[#FAF9F6] text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#435C4D] shrink-0 mt-0.5" />
                <p className="text-[#261E19] leading-relaxed">{ob}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Beneficiary Requirements & Deadlines */}
        <div className="space-y-6">
          {/* Life Insurance & Beneficiary Mandates */}
          <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
            <div className="border-b border-[#F0EAE1] pb-3">
              <h3 className="text-sm font-medium text-[#261E19]">
                Beneficiary Security Mandates
              </h3>
              <p className="text-xs text-[#5C4E43]">
                Cal. Fam. Code § 4360 insurance requirements securing future child & spousal support
              </p>
            </div>

            <div className="space-y-2.5">
              {ledgerProtection.beneficiaryRequirements.map((ben) => (
                <div key={ben.id} className="p-3.5 rounded-lg border border-amber-200/80 bg-amber-50/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#261E19] font-medium">{ben.policyOrAccount}</strong>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      {ben.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5C4E43]">
                    Designation: <strong>{ben.beneficiary}</strong>
                  </div>
                  <p className="text-[11px] text-[#5C4E43] leading-relaxed">
                    {ben.requirement}
                  </p>
                  {ben.deadline && (
                    <div className="text-[10px] text-amber-800 font-mono pt-1">
                      Verification Window: {ben.deadline}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Asset Division Deadlines */}
          <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
            <div className="border-b border-[#F0EAE1] pb-3">
              <h3 className="text-sm font-medium text-[#261E19]">
                Critical Asset-Split Deadlines
              </h3>
              <p className="text-xs text-[#5C4E43]">
                Strict timelines that could trigger forced property sales or forfeiture if missed
              </p>
            </div>

            <div className="space-y-2.5">
              {ledgerProtection.assetSplitDeadlines.map((dl) => (
                <div key={dl.id} className="p-3 rounded-lg border border-[#F0EAE1] bg-[#FAF9F6] text-xs flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <strong className="text-[#261E19] font-medium">{dl.asset}</strong>
                    <p className="text-[11px] text-[#5C4E43]">{dl.requirement}</p>
                    <span className="text-[10px] text-[#7e4d41] font-mono block pt-0.5">
                      Deadline: {dl.deadline}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E2DBD0] text-[#261E19] shrink-0">
                    {dl.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
