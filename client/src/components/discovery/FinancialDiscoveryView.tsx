import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  ArrowRight,
  Shield,
  Layers,
  FileCheck,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';
import { DiscoveryCategoryKey } from '../../types/discovery';

export default function FinancialDiscoveryView() {
  const { 
    checklist, 
    workspace, 
    uploadFileAndAnalyze, 
    loadSampleDocument, 
    openReviewDrawer, 
    isAnalyzing, 
    analyzingFileName, 
    analysisError 
  } = useDiscovery();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { documents, accountVault, privacyMode } = workspace;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFileAndAnalyze(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFileAndAnalyze(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const SAMPLE_BUTTONS = [
    { id: 'tax_1040_2024', label: 'Form 1040 & Sched B', category: 'Tax Return', desc: 'W-2s & $5k Dividend Accounts' },
    { id: 'retirement_401k', label: 'Fidelity 401(k) Plan', category: 'Retirement', desc: '$428k Vested & QDRO Flag' },
    { id: 'mortgage_statement', label: 'Wells Fargo Mortgage', category: 'Property', desc: '$384k Loan & 3.25% Rate' },
    { id: 'bank_checking_statement', label: 'Chase Checking Feed', category: 'Bank CSV', desc: '$3.2k Budget & Transfer Flag' },
    { id: 'marital_agreement', label: 'Support Stipulation', category: 'Legal', desc: '$3.8k Support & 60/40 Split' },
    { id: 'paystub_insurance', label: 'Tech Corp Pay Stub', category: 'Pay Stub', desc: '$12.8k Gross & Health Beneficiary' }
  ];

  return (
    <div className="space-y-8">
      {/* View Header with Calm Reassurance */}
      <div className="border-b border-[#E2DBD0] pb-4">
        <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
          Financial Discovery & Document Intelligence
        </h1>
        <p className="text-xs text-[#5C4E43] mt-1 max-w-3xl leading-relaxed">
          Upload whatever financial and legal records you have—even if you do not know how to read them. 
          The engine securely classifies files, detects unlisted accounts from Schedule B interest and recurring transfers, 
          and translates complex statements into plain-English rights before syncing to your workspace.
        </p>
      </div>

      {/* STAGE 1: Drag-and-Drop Upload Zone & 1-Click Test Documents */}
      <div className="space-y-4">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all bg-white ${
            dragActive
              ? 'border-[#435C4D] bg-[#F4F7F4]'
              : 'border-[#E2DBD0] hover:border-[#8C7D73]'
          }`}
        >
          <div className="max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E2DBD0] text-[#435C4D] flex items-center justify-center mx-auto">
              {isAnalyzing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-[#435C4D]" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            {isAnalyzing ? (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[#261E19]">
                  Analyzing {analyzingFileName}...
                </h3>
                <p className="text-xs text-[#5C4E43]">
                  Gemini intelligence is classifying document types, extracting line items, and checking for unlisted accounts.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[#261E19]">
                  Drop financial files here, or browse your device
                </h3>
                <p className="text-xs text-[#5C4E43]">
                  PDFs, bank CSV statements, or smartphone photos of tax forms (Form 1040, W-2, pay stubs, 401k).
                </p>
              </div>
            )}

            {analysisError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
                onChange={handleFileInputChange}
                className="hidden"
                id="doc-upload-input"
              />
              <label
                htmlFor="doc-upload-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg shadow-sm transition"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Select File from Computer</span>
              </label>
            </div>
          </div>
        </div>

        {/* 1-Click Test Documents for Instant Demo */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-[#261E19]">
              <Sparkles className="w-4 h-4 text-[#435C4D]" />
              <span>Or test the engine with realistic sample documents (1-Click Extraction)</span>
            </div>
            <span className="text-[11px] text-[#8C7D73]">Zero data entered manually</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {SAMPLE_BUTTONS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => loadSampleDocument(sample.id)}
                disabled={isAnalyzing}
                className="p-2.5 rounded-lg border border-[#E2DBD0] bg-[#FAF9F6] hover:bg-white hover:border-[#435C4D] text-left transition space-y-0.5 group disabled:opacity-50"
              >
                <span className="text-[10px] text-[#435C4D] font-mono block uppercase">
                  {sample.category}
                </span>
                <strong className="text-xs text-[#261E19] group-hover:text-[#435C4D] block truncate font-medium">
                  {sample.label}
                </strong>
                <span className="text-[10px] text-[#8C7D73] block truncate">
                  {sample.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STAGE 2: The 7 Core Categories Checklist */}
      <div className="bg-white border border-[#E2DBD0] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#F0EAE1] pb-3">
          <div>
            <h3 className="text-base font-medium text-[#261E19]">
              Required Documents Checklist (California Statutory Requirements)
            </h3>
            <p className="text-xs text-[#5C4E43] mt-0.5">
              These 7 core discovery categories substantiate your legal rights under Cal. Fam. Code §§ 2102, 2104, and 2550.
            </p>
          </div>
          <span className="text-xs font-mono text-[#8C7D73] self-start sm:self-auto">
            {checklist.filter((c) => c.status === 'Reviewed').length} of 7 Verified & Synced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checklist.map((item) => {
            const isMissing = item.status === 'Missing';
            const isUploaded = item.status === 'Uploaded';
            const isReviewed = item.status === 'Reviewed';

            return (
              <div
                key={item.key}
                className="p-3.5 rounded-xl border border-[#E2DBD0] bg-[#FAF9F6] flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#261E19]">{item.title}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isReviewed
                          ? 'bg-[#E6ECE6] text-[#435C4D]'
                          : isUploaded
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-[#E2DBD0] text-[#5C4E43]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C4E43] mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2DBD0]/60 flex items-center justify-between text-[11px] text-[#8C7D73]">
                  <span>{item.recommendedCount}</span>
                  <span className="font-mono text-[10px]">{item.uploadedCount} on file</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAGE 3: Discovered Files & Review Drawer Triggers */}
      <div className="bg-white border border-[#E2DBD0] rounded-xl overflow-hidden shadow-none">
        <div className="p-5 border-b border-[#E2DBD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-[#261E19]">
              Uploaded Files & Grounded Findings ({documents.length})
            </h3>
            <p className="text-xs text-[#5C4E43] mt-0.5">
              Click any document to inspect its plain-English summary, edit extracted line items, or approve syncing.
            </p>
          </div>

          <div className="text-xs text-[#8C7D73]">
            {documents.filter((d) => d.status === 'Reviewed').length} Approved · {documents.filter((d) => d.status === 'Uploaded').length} Pending Review
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#8C7D73] space-y-2">
            <FileText className="w-8 h-8 mx-auto text-[#ADC2B5]" />
            <p>No documents uploaded yet. Upload a statement above or click a 1-click test document to start.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EAE1]">
            {documents.map((doc) => {
              const hasUnlisted = (doc.unlistedAccounts && doc.unlistedAccounts.length > 0) ||
                (doc.extractedData?.taxReturn?.scheduleBPayers?.some((p) => p.potentialHiddenAccount));

              return (
                <div
                  key={doc.id}
                  onClick={() => openReviewDrawer(doc.id)}
                  className="p-4.5 hover:bg-[#FAF9F6] transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-medium text-[#261E19] group-hover:text-[#435C4D] transition">
                        {doc.fileName}
                      </strong>
                      <span className="text-xs text-[#8C7D73]">·</span>
                      <span className="text-xs text-[#5C4E43]">{doc.categoryLabel}</span>
                      <span className="text-xs text-[#8C7D73]">·</span>
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded ${
                        doc.status === 'Reviewed' ? 'bg-[#E6ECE6] text-[#435C4D]' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {doc.status === 'Reviewed' ? '✓ Synced' : 'Needs Review'}
                      </span>
                      {hasUnlisted && (
                        <span className="text-[10px] font-mono text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded">
                          Schedule B / Transfer Lead
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5C4E43] line-clamp-2 leading-relaxed">
                      {doc.plainEnglishSummary}
                    </p>

                    <div className="text-[11px] text-[#8C7D73] flex items-center gap-3 pt-0.5">
                      <span>Source: {doc.documentClassification.institutionOrIssuer}</span>
                      <span>·</span>
                      <span>Confidence: {Math.round(doc.confidenceScore * 100)}%</span>
                      <span>·</span>
                      <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReviewDrawer(doc.id);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[#261E19] bg-white border border-[#E2DBD0] hover:border-[#435C4D] rounded-lg transition"
                    >
                      {doc.status === 'Reviewed' ? 'View Findings' : 'Review & Sync'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
