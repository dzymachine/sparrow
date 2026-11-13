import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, Filter } from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';

export default function AccountVaultView() {
  const { workspace } = useDiscovery();
  const { accountVault, privacyMode } = workspace;
  const [filterOwner, setFilterOwner] = useState<string>('all');

  const filteredAccounts = accountVault.filter((a) => {
    if (filterOwner === 'all') return true;
    if (filterOwner === 'unlisted') return a.isUnlistedDiscovery;
    return a.owner.toLowerCase().includes(filterOwner.toLowerCase());
  });

  const totalAssets = accountVault.reduce((acc, a) => acc + (a.balance || 0), 0);
  const unlistedAssets = accountVault.filter((a) => a.isUnlistedDiscovery).reduce((acc, a) => acc + (a.balance || 0), 0);

  const maskValue = (val: number) => {
    if (privacyMode) return '••••••';
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2DBD0] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
            Account Vault & Discovered Holdings
          </h1>
          <p className="text-xs text-[#5C4E43] mt-1">
            Reconciled marital inventory · California Family Code § 760 presumption of community ownership
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8C7D73]">Filter:</span>
          {['all', 'Joint', 'Spouse', 'Mine', 'unlisted'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterOwner(f)}
              className={`px-2.5 py-1 text-xs rounded-lg transition capitalize ${
                filterOwner === f
                  ? 'bg-[#435C4D] text-white font-medium'
                  : 'bg-white border border-[#E2DBD0] text-[#5C4E43] hover:text-[#261E19]'
              }`}
            >
              {f === 'unlisted' ? 'Unlisted Leads' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Total Documented Assets
          </span>
          <div className="text-xl font-mono tabular-nums font-semibold text-[#261E19] mt-1">
            {maskValue(totalAssets)}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Across {accountVault.length} verified and discovered holdings
          </span>
        </div>

        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            Unlisted Discovery Leads
          </span>
          <div className="text-xl font-mono tabular-nums font-semibold text-amber-900 mt-1">
            {maskValue(unlistedAssets)}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            From Schedule B lines and monthly bank transfers
          </span>
        </div>

        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7D73] block">
            50% Community Entitlement
          </span>
          <div className="text-xl font-mono tabular-nums font-semibold text-[#435C4D] mt-1">
            {maskValue(Math.round(totalAssets / 2))}
          </div>
          <span className="text-xs text-[#5C4E43] mt-1 block">
            Equal division standard under Cal. Fam. Code § 2550
          </span>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-[#E2DBD0] rounded-xl overflow-hidden shadow-none">
        <div className="p-4.5 border-b border-[#E2DBD0] flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#261E19]">
            Documented Holdings ({filteredAccounts.length})
          </h3>
          <span className="text-xs text-[#8C7D73]">
            Zero-pill metadata discipline · Tabular numeric balances
          </span>
        </div>

        <div className="divide-y divide-[#F0EAE1] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F6] text-[#8C7D73] border-b border-[#E2DBD0] font-normal uppercase tracking-wider text-[11px]">
                <th className="p-3.5 pl-4">Account & Institution</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Owner</th>
                <th className="p-3.5">Balance</th>
                <th className="p-3.5">QDRO</th>
                <th className="p-3.5">Source & Discovery Provenance</th>
                <th className="p-3.5 pr-4">Legal Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1] text-[#5C4E43]">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-[#FAF9F6] transition">
                  <td className="p-3.5 pl-4">
                    <strong className="text-[#261E19] font-medium block">
                      {account.name}
                    </strong>
                    <span className="text-[11px] text-[#8C7D73]">
                      {account.institution} {account.accountNumberMasked ? `· ${account.accountNumberMasked}` : ''}
                    </span>
                  </td>

                  <td className="p-3.5 font-mono text-xs">
                    {account.accountType}
                  </td>

                  <td className="p-3.5">
                    <span className={`text-[11px] font-medium ${
                      account.owner === 'Unlisted / Needs Discovery' ? 'text-amber-800' : 'text-[#261E19]'
                    }`}>
                      {account.owner}
                    </span>
                  </td>

                  <td className="p-3.5 font-mono tabular-nums font-medium text-[#261E19]">
                    {maskValue(account.balance)}
                  </td>

                  <td className="p-3.5">
                    {account.requiresQDRO ? (
                      <span className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                        QDRO
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#8C7D73]">Standard</span>
                    )}
                  </td>

                  <td className="p-3.5 max-w-xs">
                    <div className="text-[11px] text-[#5C4E43] truncate font-mono">
                      {account.sourceDocument}
                    </div>
                    {account.discoveryFlag && (
                      <div className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 line-clamp-1">
                        {account.discoveryFlag}
                      </div>
                    )}
                  </td>

                  <td className="p-3.5 pr-4">
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      account.status === 'Verified'
                        ? 'bg-[#E6ECE6] text-[#435C4D]'
                        : account.status === 'Needs Subpoena'
                        ? 'bg-amber-100 text-amber-900 font-medium'
                        : 'bg-[#E2DBD0] text-[#261E19]'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
