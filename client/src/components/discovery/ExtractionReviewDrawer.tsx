import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  Sparkles, 
  Layers, 
  HelpCircle,
  ExternalLink,
  Save,
  Trash2
} from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';
import { ExtractedDocument, VaultAccount, RecurringExpenseItem } from '../../types/discovery';

export default function ExtractionReviewDrawer() {
  const { activeReviewDoc, closeReviewDrawer, approveAndSyncDocument, deleteDocument } = useDiscovery();

  if (!activeReviewDoc) return null;

  const [editedDoc, setEditedDoc] = useState<ExtractedDocument>(activeReviewDoc);
  const [activeTab, setActiveTab] = useState<'summary' | 'accounts' | 'expenses' | 'unlisted'>('summary');

  useEffect(() => {
    setEditedDoc(activeReviewDoc);
  }, [activeReviewDoc]);

  const handleApproveSync = () => {
    approveAndSyncDocument(editedDoc.id, editedDoc);
  };

  const { extractedData, plainEnglishSummary, documentClassification } = editedDoc;

  // Extract counts for inline metadata
  const scheduleBCount = extractedData?.taxReturn?.scheduleBPayers?.length || 0;
  const recurringCount = extractedData?.bankOrCredit?.recurringExpenses?.length || 0;
  const flaggedTransferCount = extractedData?.bankOrCredit?.flaggedTransfersOrCharges?.length || 0;
  const unlistedCount = editedDoc.unlistedAccounts?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#261E19]/40 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-2xl bg-[#F8F6F2] border-l border-[#E2DBD0] h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 bg-white border-b border-[#E2DBD0] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#435C4D]">
                  {editedDoc.categoryLabel}
                </span>
                <span className="text-xs text-[#8C7D73]">·</span>
                <span className="text-xs font-mono text-[#8C7D73]">
                  Gemini Extraction ({Math.round(editedDoc.confidenceScore * 100)}% Match)
                </span>
              </div>
              <h3 className="text-lg font-medium text-[#261E19] mt-0.5 tracking-tight truncate max-w-md">
                {editedDoc.fileName}
              </h3>
            </div>

            <button
              onClick={closeReviewDrawer}
              className="p-1.5 text-[#8C7D73] hover:text-[#261E19] hover:bg-[#F4EFEB] rounded-lg transition"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-4 border-b border-[#E2DBD0] mt-4 -mb-5 text-xs font-medium text-[#5C4E43]">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-2.5 transition border-b-2 ${
                activeTab === 'summary'
                  ? 'border-[#435C4D] text-[#261E19] font-semibold'
                  : 'border-transparent hover:text-[#261E19]'
              }`}
            >
              Plain-English Overview
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'accounts'
                  ? 'border-[#435C4D] text-[#261E19] font-semibold'
                  : 'border-transparent hover:text-[#261E19]'
              }`}
            >
              <span>Accounts & Values</span>
              {(extractedData?.retirement || scheduleBCount > 0) && (
                <span className="text-[10px] font-mono bg-[#E2DBD0] text-[#261E19] px-1.5 py-0.2 rounded-full">
                  {scheduleBCount + (extractedData?.retirement ? 1 : 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'border-[#435C4D] text-[#261E19] font-semibold'
                  : 'border-transparent hover:text-[#261E19]'
              }`}
            >
              <span>Monthly Baseline</span>
              {recurringCount > 0 && (
                <span className="text-[10px] font-mono bg-[#E2DBD0] text-[#261E19] px-1.5 py-0.2 rounded-full">
                  {recurringCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('unlisted')}
              className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'unlisted'
                  ? 'border-[#435C4D] text-[#261E19] font-semibold'
                  : 'border-transparent hover:text-[#261E19]'
              }`}
            >
              <span>Unlisted Accounts</span>
              {(unlistedCount > 0 || flaggedTransferCount > 0) && (
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full">
                  {unlistedCount + flaggedTransferCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: PLAIN-ENGLISH SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Plain English 2-Sentence Meaning Card */}
              <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#435C4D]">
                  <Sparkles className="w-4 h-4" />
                  <span>What This Document Means For You</span>
                </div>
                <p className="text-sm text-[#261E19] leading-relaxed">
                  {plainEnglishSummary}
                </p>
                <div className="text-[11px] text-[#8C7D73] pt-1">
                  California Law Context · Extracted securely on your local workspace
                </div>
              </div>

              {/* Classification Metadata */}
              <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                <div className="text-xs uppercase tracking-wider font-medium text-[#8C7D73]">
                  Document Details
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-[#5C4E43]">
                  <div>
                    <span className="text-[#8C7D73] block text-[11px]">Issuer / Institution</span>
                    <strong className="text-[#261E19] font-medium">{documentClassification.institutionOrIssuer}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C7D73] block text-[11px]">Identified Form / Statement</span>
                    <strong className="text-[#261E19] font-medium">{documentClassification.documentType}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C7D73] block text-[11px]">Tax Year / Billing Period</span>
                    <strong className="text-[#261E19] font-medium">{documentClassification.documentYearOrPeriod}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C7D73] block text-[11px]">Sync Status</span>
                    <strong className="text-[#435C4D] font-medium">
                      {editedDoc.status === 'Reviewed' ? '✓ Synced to Workspace' : 'Ready for User Approval'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Items extracted by Gemini */}
              {editedDoc.actionItems && editedDoc.actionItems.length > 0 && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                  <div className="text-xs uppercase tracking-wider font-medium text-[#8C7D73]">
                    Recommended Discovery Next Steps
                  </div>
                  <div className="space-y-2.5">
                    {editedDoc.actionItems.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-[#F0EAE1] bg-[#FAF9F6] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-[#261E19] font-medium">{item.action}</strong>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            item.priority === 'Critical' ? 'bg-amber-100 text-amber-900' : 'bg-[#E2DBD0] text-[#261E19]'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C4E43]">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACCOUNTS & VALUES */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* Form 1040 Income & Wages */}
              {extractedData?.taxReturn && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                  <div className="text-xs font-medium text-[#261E19]">
                    IRS Form 1040 Earned Wages & Adjusted Gross Income
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E2DBD0]">
                      <span className="text-[#8C7D73] block text-[11px]">Adjusted Gross Income</span>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
                        ${extractedData.taxReturn.adjustedGrossIncome?.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E2DBD0]">
                      <span className="text-[#8C7D73] block text-[11px]">Your Wages (W-2)</span>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
                        ${extractedData.taxReturn.userWages?.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E2DBD0]">
                      <span className="text-[#8C7D73] block text-[11px]">Spouse Wages (W-2)</span>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
                        ${extractedData.taxReturn.spouseWages?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Retirement Accounts & QDRO */}
              {extractedData?.retirement && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-[#261E19]">
                      Retirement & Pension Account ({extractedData.retirement.institution})
                    </div>
                    {extractedData.retirement.requiresQDRO && (
                      <span className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                        QDRO Required
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#8C7D73] block text-[11px]">Plan Balance</span>
                      <span className="text-base font-mono tabular-nums font-semibold text-[#261E19]">
                        ${extractedData.retirement.currentBalance?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8C7D73] block text-[11px]">Account Owner</span>
                      <span className="text-xs font-medium text-[#261E19]">
                        {extractedData.retirement.accountOwner} (Employer Plan)
                      </span>
                    </div>
                  </div>
                  {extractedData.retirement.qdroExplanation && (
                    <div className="p-2.5 bg-[#F4EFEB] rounded-lg text-[11px] text-[#5C4E43] leading-relaxed">
                      <strong>Legal Division Note:</strong> {extractedData.retirement.qdroExplanation}
                    </div>
                  )}
                </div>
              )}

              {/* Property & Mortgage Statement */}
              {extractedData?.property && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                  <div className="text-xs font-medium text-[#261E19]">
                    Residential Mortgage & Escrow Breakdown
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#8C7D73] block text-[11px]">Principal Balance</span>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
                        ${extractedData.property.loanBalance?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8C7D73] block text-[11px]">Interest Rate</span>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
                        {extractedData.property.interestRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8C7D73] block text-[11px]">Monthly PITI Total</span>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#261E19]">
                        ${extractedData.property.monthlyPayment?.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#5C4E43] pt-1 border-t border-[#F0EAE1]">
                    Borrowers: <span className="font-medium text-[#261E19]">{extractedData.property.coBorrowerStatus}</span>
                  </div>
                </div>
              )}

              {/* Schedule B Discovered Dividend & Interest Payers */}
              {extractedData?.taxReturn?.scheduleBPayers && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                  <div className="text-xs font-medium text-[#261E19]">
                    Schedule B Interest & Dividend Payers (Discovery Leads)
                  </div>
                  <div className="space-y-2">
                    {extractedData.taxReturn.scheduleBPayers.map((payer, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-[#F0EAE1] bg-[#FAF9F6] text-xs flex items-center justify-between">
                        <div>
                          <strong className="text-[#261E19] font-medium">{payer.payerName}</strong>
                          <span className="text-[#8C7D73] text-[11px] block">{payer.discoveryReason}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono tabular-nums font-semibold text-[#261E19]">
                            ${payer.amount?.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#8C7D73] block capitalize">{payer.payerType} payout</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MONTHLY BASELINE EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="text-xs text-[#5C4E43]">
                Recurring expenses automatically mapped into Foothold's two simple buckets: <strong>Bucket A (Must-Pays)</strong> and <strong>Bucket B (Life & Kids)</strong>.
              </div>

              {extractedData?.bankOrCredit?.recurringExpenses && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl divide-y divide-[#F0EAE1] overflow-hidden">
                  {extractedData.bankOrCredit.recurringExpenses.map((exp, idx) => (
                    <div key={idx} className="p-3 text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-[#261E19] font-medium">{exp.name}</strong>
                        <div className="text-[11px] text-[#8C7D73] flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            exp.bucket === 'bucket_a_must_pays' ? 'bg-[#E6ECE6] text-[#435C4D]' : 'bg-[#FAF9F6] text-[#5C4E43]'
                          }`}>
                            {exp.bucket === 'bucket_a_must_pays' ? 'Bucket A · Must-Pays' : 'Bucket B · Life & Kids'}
                          </span>
                          <span>·</span>
                          <span>{exp.category}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono tabular-nums font-semibold text-[#261E19]">
                          ${exp.amount?.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#8C7D73] block">monthly</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: UNLISTED & TRANSFERS */}
          {activeTab === 'unlisted' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 space-y-1">
                <strong>Forensic Discovery Leads:</strong> These accounts or transactions were uncovered through automatic Schedule B analysis or bank transfers and do not appear in initial informal disclosures.
              </div>

              {/* Flagged Transfers */}
              {extractedData?.bankOrCredit?.flaggedTransfersOrCharges && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                  <div className="text-xs font-medium text-[#261E19]">
                    Recurring External Transfers / Unfamiliar Charges
                  </div>
                  <div className="space-y-2">
                    {extractedData.bankOrCredit.flaggedTransfersOrCharges.map((trans, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-[#261E19] font-medium">{trans.description}</strong>
                          <span className="font-mono tabular-nums font-semibold text-rose-800">
                            ${trans.amount?.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C4E43]">{trans.flagReason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unlisted Accounts Table */}
              {editedDoc.unlistedAccounts && editedDoc.unlistedAccounts.length > 0 && (
                <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
                  <div className="text-xs font-medium text-[#261E19]">
                    Accounts Requiring Formal Legal Subpoena (FL-140/FL-142)
                  </div>
                  <div className="space-y-2">
                    {editedDoc.unlistedAccounts.map((unl, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-[#E2DBD0] bg-[#FAF9F6] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-[#261E19] font-medium">{unl.institution}</strong>
                          <span className="font-mono tabular-nums font-semibold text-[#261E19]">
                            Est. ${unl.estimatedBalance?.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8C7D73]">
                          Source: {unl.source} · Owner: {unl.owner}
                        </div>
                        <p className="text-[11px] text-[#5C4E43] pt-0.5">{unl.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Bottom Action Footer */}
        <div className="p-4.5 bg-white border-t border-[#E2DBD0] shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={() => deleteDocument(editedDoc.id)}
            className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 px-3 py-2 rounded-lg hover:bg-rose-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove File</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={closeReviewDrawer}
              className="px-4 py-2 text-xs font-medium text-[#5C4E43] hover:text-[#261E19] border border-[#E2DBD0] rounded-lg transition"
            >
              Close
            </button>

            <button
              onClick={handleApproveSync}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg shadow-sm transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve & Sync to Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
