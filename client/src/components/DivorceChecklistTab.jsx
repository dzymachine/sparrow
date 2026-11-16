import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  FileSignature,
  FileText,
  ExternalLink,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  AlertCircle,
  Info,
  Upload
} from 'lucide-react';
import { useAgentMemory } from '../context/AgentMemoryContext';
import { api } from '../services/api';
import GuidedDocumentModal from './GuidedDocumentModal';

const STATUS_OPTIONS = [
  { id: 'not_started', label: 'Not Started', badgeClass: 'bg-[#F4EFEA] text-[#5C4E43] border-[#E2DBD0]' },
  { id: 'in_progress', label: 'In Progress', badgeClass: 'bg-[#FBF5E8] text-[#8A6116] border-[#EAD9B7]' },
  { id: 'signed_ready', label: 'Signed / Ready', badgeClass: 'bg-[#EEF2F7] text-[#325178] border-[#D4DFEC]' },
  { id: 'completed', label: 'Completed', badgeClass: 'bg-[#E6ECE6] text-[#354A3E] border-[#C8D7C9]' }
];

const SEGMENT_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'signed_ready', label: 'Signed' },
  { id: 'completed', label: 'Done' }
];

export default function DivorceChecklistTab() {
  const {
    activeUserId,
    profile,
    divorceChecklist,
    updateDocumentChecklistItem,
    uploadCompletedChecklistDoc,
    saveOnboardingProfile,
    isSyncing
  } = useAgentMemory();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedStages, setExpandedStages] = useState({});
  const [expandedDetails, setExpandedDetails] = useState({});
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [activeFormDoc, setActiveFormDoc] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Focus Mode: by default, expand only the first stage that still has incomplete items
  useEffect(() => {
    if (!divorceChecklist?.stages?.length) return;
    setExpandedStages((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const firstIncomplete = divorceChecklist.stages.find((s) => s.completedCount < s.totalCount);
      const targetId = firstIncomplete ? firstIncomplete.id : divorceChecklist.stages[0].id;
      return { [targetId]: true };
    });
  }, [divorceChecklist]);

  const toggleStage = (stageId) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const toggleDetails = (docId) => {
    setExpandedDetails((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const allExpanded = Boolean(
    divorceChecklist?.stages?.length &&
      divorceChecklist.stages.every((s) => expandedStages[s.id])
  );

  const handleToggleAllStages = () => {
    if (!divorceChecklist?.stages) return;
    if (allExpanded) {
      const firstIncomplete = divorceChecklist.stages.find((s) => s.completedCount < s.totalCount);
      const targetId = firstIncomplete ? firstIncomplete.id : divorceChecklist.stages[0].id;
      setExpandedStages({ [targetId]: true });
    } else {
      const next = {};
      for (const s of divorceChecklist.stages) {
        next[s.id] = true;
      }
      setExpandedStages(next);
    }
  };

  const handleActivateDivorceChecklist = async () => {
    await saveOnboardingProfile({
      ...(profile || {}),
      goal: 'pursuing_divorce'
    });
  };

  const handleToggleExternalComplete = async (item) => {
    const isCurrentlyCompleted = item.status === 'completed';
    if (isCurrentlyCompleted) {
      const fallbackStatus = item.openedAt || item.fieldCompletionPercent > 0 ? 'in_progress' : 'not_started';
      await updateDocumentChecklistItem(item.id, {
        status: fallbackStatus,
        completedExternally: false
      });
    } else {
      await updateDocumentChecklistItem(item.id, {
        status: 'completed',
        completedExternally: true
      });
    }
  };

  const handleTrackExternalOpen = async (item) => {
    if (item.status === 'not_started') {
      await updateDocumentChecklistItem(item.id, { opened: true });
    }
  };

  const handleUploadCompleted = async (docId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingDocId(docId);
    try {
      await uploadCompletedChecklistDoc(docId, file);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingDocId(null);
      event.target.value = '';
    }
  };

  const handleOpenNote = (item) => {
    setExpandedDetails((prev) => ({ ...prev, [item.id]: true }));
    setEditingNoteId(item.id);
    setNoteDraft(item.notes || '');
  };

  const handleSaveNote = async (docId) => {
    await updateDocumentChecklistItem(docId, { notes: noteDraft.trim() });
    setEditingNoteId(null);
  };

  const handleExportChecklist = () => {
    if (!divorceChecklist) return;
    const lines = [
      'SPARROW | TAILORED DIVORCE DOCUMENT CHECKLIST',
      `Jurisdiction: ${divorceChecklist.stateJurisdiction}`,
      `Situation: ${(divorceChecklist.situationTags || []).join(' • ')}`,
      `Progress: ${divorceChecklist.summary.completedCount} of ${divorceChecklist.summary.totalCount} completed (${divorceChecklist.summary.percentComplete}%)`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '============================================================\n'
    ];

    for (const stage of divorceChecklist.stages || []) {
      lines.push(`${stage.title.toUpperCase()} (${stage.completedCount}/${stage.totalCount} completed)`);
      lines.push(stage.subtitle);
      lines.push('------------------------------------------------------------');
      for (const item of stage.items) {
        const statusLabel = STATUS_OPTIONS.find((s) => s.id === item.status)?.label || item.status;
        lines.push(`[${statusLabel}] ${item.title} (${item.formCode})`);
        lines.push(`   Action: ${item.actionType} | Who Signs: ${item.whoSigns} | Priority: ${item.priority}`);
        if (item.pdfUrl) {
          lines.push(`   PDF Download: ${item.pdfUrl}`);
        } else if (item.officialLink) {
          lines.push(`   Court Portal: ${item.officialLink}`);
        }
        if (item.notes) {
          lines.push(`   Your Notes: ${item.notes}`);
        }
        lines.push('');
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sparrow_Divorce_Document_Checklist_${divorceChecklist.stateJurisdiction}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isFiltering = Boolean(searchQuery.trim() || statusFilter !== 'all' || actionFilter !== 'all');

  const filteredStages = useMemo(() => {
    if (!divorceChecklist?.stages) return [];
    const q = searchQuery.trim().toLowerCase();

    return divorceChecklist.stages
      .map((stage) => {
        const filteredItems = stage.items.filter((item) => {
          if (statusFilter !== 'all' && item.status !== statusFilter) return false;
          if (actionFilter !== 'all' && item.actionType !== actionFilter) return false;
          if (q) {
            const haystack = `${item.title} ${item.formCode} ${item.description} ${item.reasonIncluded}`.toLowerCase();
            if (!haystack.includes(q)) return false;
          }
          return true;
        });
        return { ...stage, filteredItems };
      })
      .filter((stage) => stage.filteredItems.length > 0);
  }, [divorceChecklist, searchQuery, statusFilter, actionFilter]);

  if (!divorceChecklist) {
    return (
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-10 text-center text-sm text-[#5C4E43]">
        Loading your tailored document checklist...
      </div>
    );
  }

  if (!divorceChecklist.isPursuingDivorce) {
    return (
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-8 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#E6ECE6] text-[#435C4D] flex items-center justify-center flex-shrink-0">
            <FileSignature className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[#261E19] tracking-tight">
              Document Checklist (Paused in Exploration Mode)
            </h2>
            <p className="text-sm text-[#5C4E43] leading-relaxed max-w-2xl">
              During onboarding, you selected <strong>Just Exploring</strong>. Whenever you decide to pursue a divorce or legal separation, we will generate a tailored checklist of every court form and financial document you need to fill out and sign.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleActivateDivorceChecklist}
                className="inline-flex items-center gap-2 bg-[#435C4D] hover:bg-[#354A3E] text-white font-medium text-xs px-4 py-2.5 rounded-lg transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Generating Checklist...' : 'Generate My Document Checklist'}</span>
              </button>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#261E19] bg-[#FAF9F6] hover:bg-[#F0EAE1] px-4 py-2.5 rounded-lg border border-[#E2DBD0] transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#5C4E43]" />
                <span>Review Onboarding Answers</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { summary, situationTags } = divorceChecklist;

  return (
    <div className="space-y-6">
      {/* 1. Apple HIG Page Header & Toolbar Actions */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
            Document Checklist
          </h1>
          <p className="text-sm text-[#5C4E43]">
            Every form you need to fill out, sign, or upload—organized one stage at a time.
          </p>
          {situationTags && situationTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {situationTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#FAF9F6] text-[#5C4E43] border border-[#E2DBD0]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleToggleAllStages}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#261E19] bg-white hover:bg-[#FAF9F6] px-3.5 py-2 rounded-lg border border-[#E2DBD0] transition"
          >
            {allExpanded ? 'Focus Current Stage' : 'Expand All Stages'}
          </button>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#261E19] bg-white hover:bg-[#FAF9F6] px-3.5 py-2 rounded-lg border border-[#E2DBD0] transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5C4E43]" />
            <span>Edit Situation</span>
          </Link>
          <button
            type="button"
            onClick={handleExportChecklist}
            className="inline-flex items-center gap-1.5 bg-[#435C4D] hover:bg-[#354A3E] text-white font-medium text-xs px-3.5 py-2 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* 2. Inset-Grouped Progress & Filter Card */}
      <section className="bg-white border border-[#E2DBD0] rounded-2xl overflow-hidden">
        {/* Progress Strip */}
        <div className="p-5 space-y-3 border-b border-[#E2DBD0] bg-[#FAF9F6]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-[#261E19]">
                Readiness Progress
              </span>
              <span className="text-xs font-mono tabular-nums text-[#5C4E43]">
                {summary.completedCount} of {summary.totalCount} completed ({summary.percentComplete}%)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums text-[#5C4E43]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#435C4D]" />
                <span>{summary.completedCount} Done</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#325178]" />
                <span>{summary.signedReadyCount} Signed / Ready</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8A6116]" />
                <span>{summary.inProgressCount} In Progress</span>
              </span>
            </div>
          </div>

          <div className="w-full bg-[#EDE6DD] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#435C4D] h-full transition-all duration-300 rounded-full"
              style={{ width: `${summary.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Segmented Control + Search & Action Filter */}
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Apple HIG Segmented Control for Status */}
          <div
            role="tablist"
            aria-label="Filter documents by status"
            className="inline-flex items-center p-1 rounded-xl bg-[#F4EFEA] border border-[#E2DBD0] overflow-x-auto"
          >
            {SEGMENT_OPTIONS.map((seg) => {
              const isSelected = statusFilter === seg.id;
              return (
                <button
                  key={seg.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setStatusFilter(seg.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-white text-[#261E19] shadow-xs'
                      : 'text-[#5C4E43] hover:text-[#261E19]'
                  }`}
                >
                  {seg.label}
                </button>
              );
            })}
          </div>

          {/* Search & Action Type */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8C7D73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search form (e.g. FL-100, QDRO)..."
                aria-label="Search checklist forms"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E2DBD0] bg-[#FAF9F6] focus:bg-white text-xs text-[#261E19] placeholder:text-[#8C7D73] focus:outline-none focus:ring-2 focus:ring-[#435C4D]/30 focus:border-[#435C4D]"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by action type"
              className="px-3 py-1.5 rounded-lg border border-[#E2DBD0] text-xs text-[#261E19] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#435C4D]/30 focus:border-[#435C4D]"
            >
              <option value="all">All Action Types</option>
              <option value="Fill & File">Fill & File</option>
              <option value="Sign & Serve">Sign & Serve</option>
              <option value="Gather & Upload">Gather & Upload</option>
              <option value="Notarize & Record">Notarize & Record</option>
              <option value="Judge Signature">Judge Signature</option>
              <option value="Attorney / Plan Admin">Attorney / Plan Admin</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Stage-by-Stage Inset-Grouped Document Lists */}
      {filteredStages.length === 0 ? (
        <div className="bg-white border border-[#E2DBD0] rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#261E19]">No documents match your current filters</p>
          <p className="text-xs text-[#5C4E43]">Try clearing your search query or switching the status filter to All.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setActionFilter('all');
            }}
            className="mt-2 inline-flex items-center px-3.5 py-1.5 rounded-lg border border-[#E2DBD0] bg-[#FAF9F6] hover:bg-[#F0EAE1] text-xs font-medium text-[#261E19] transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStages.map((stage) => {
            const isExpanded = isFiltering || Boolean(expandedStages[stage.id]);
            const stageComplete = stage.completedCount === stage.totalCount && stage.totalCount > 0;

            return (
              <section
                key={stage.id}
                className="bg-white border border-[#E2DBD0] rounded-2xl overflow-hidden"
              >
                {/* Stage Disclosure Header */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.id)}
                  aria-expanded={isExpanded}
                  className="w-full px-6 py-4 bg-[#FAF9F6] hover:bg-[#F4EFEA]/80 flex items-center justify-between gap-4 text-left transition"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-medium text-[#261E19] text-base">
                        {stage.title}
                      </h2>
                      <span
                        className={`text-[11px] font-medium tabular-nums px-2.5 py-0.5 rounded-full border ${
                          stageComplete
                            ? 'bg-[#E6ECE6] text-[#354A3E] border-[#C8D7C9]'
                            : 'bg-white text-[#5C4E43] border-[#E2DBD0]'
                        }`}
                      >
                        {stage.completedCount}/{stage.totalCount} done
                      </span>
                    </div>
                    <p className="text-xs text-[#5C4E43]">{stage.subtitle}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#8C7D73] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#8C7D73] flex-shrink-0" />
                  )}
                </button>

                {/* Stage Document Rows */}
                {isExpanded && (
                  <div className="divide-y divide-[#F0EAE1] border-t border-[#E2DBD0]">
                    {stage.filteredItems.map((item) => {
                      const statusMeta = STATUS_OPTIONS.find((s) => s.id === item.status) || STATUS_OPTIONS[0];
                      const isDone = item.status === 'completed';
                      const showDetails = Boolean(expandedDetails[item.id]);
                      const autoStatusLabel =
                        item.status === 'in_progress' && item.fieldCompletionPercent > 0
                          ? `In Progress · ${item.fieldCompletionPercent}%`
                          : item.status === 'in_progress'
                          ? 'Opened'
                          : item.status === 'completed' && item.completedExternally
                          ? 'Completed (External)'
                          : statusMeta.label;

                      return (
                        <div
                          key={item.id}
                          className={`px-6 py-4 transition ${isDone ? 'bg-[#FAF9F6]/60' : 'hover:bg-[#FAF9F6]/70'}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Leading: Accessible Check Button + Title + Quiet Metadata */}
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleExternalComplete(item)}
                                aria-label={isDone ? `Unmark ${item.title} as completed` : `Mark ${item.title} as completed`}
                                title={isDone ? 'Uncheck external completion' : 'Check off as completed externally'}
                                className="mt-0.5 w-7 h-7 -ml-1 rounded-full flex items-center justify-center flex-shrink-0 text-[#8C7D73] hover:text-[#435C4D] hover:bg-[#E6ECE6]/60 transition"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#435C4D]" />
                                ) : item.status === 'in_progress' || item.status === 'signed_ready' ? (
                                  <Clock className="w-5 h-5 text-[#8A6116]" />
                                ) : (
                                  <Circle className="w-5 h-5 text-[#C7BEB2]" />
                                )}
                              </button>

                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`font-medium text-sm ${isDone ? 'line-through text-[#8C7D73]' : 'text-[#261E19]'}`}>
                                    {item.title}
                                  </span>
                                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#F4EFEA] text-[#5C4E43] border border-[#E2DBD0]/80">
                                    {item.formCode}
                                  </span>
                                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                                    {autoStatusLabel}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5C4E43]">
                                  <span className="inline-flex items-center gap-1 font-medium text-[#435C4D]">
                                    <FileText className="w-3.5 h-3.5" />
                                    {item.actionType}
                                  </span>
                                  <span className="text-[#C7BEB2]">·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <FileSignature className="w-3.5 h-3.5 text-[#8C7D73]" />
                                    Signs: {item.whoSigns}
                                  </span>
                                  <span className="text-[#C7BEB2]">·</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleDetails(item.id)}
                                    aria-expanded={showDetails}
                                    className="inline-flex items-center gap-1 font-medium text-[#5C4E43] hover:text-[#261E19] transition"
                                  >
                                    <Info className="w-3.5 h-3.5 text-[#8C7D73]" />
                                    <span>{showDetails ? 'Hide details' : 'Why & details'}</span>
                                  </button>
                                  {item.notes && !showDetails && (
                                    <>
                                      <span className="text-[#C7BEB2]">·</span>
                                      <span className="text-[#8A6116] font-medium">Has note</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Trailing: Primary DocuSign-style Fill & Sign + Upload + Blank PDF */}
                            <div className="flex flex-wrap items-center gap-2 pl-9 md:pl-0 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveFormDoc(item)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#435C4D] hover:bg-[#354A3E] text-white text-xs font-medium transition"
                              >
                                <FileSignature className="w-3.5 h-3.5" />
                                <span>Fill &amp; Sign PDF</span>
                              </button>

                              <label
                                title="Upload an already-completed copy of this document"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF9F6] hover:bg-[#F0EAE1] text-[#261E19] border border-[#E2DBD0] text-xs font-medium cursor-pointer transition"
                              >
                                <Upload className="w-3.5 h-3.5 text-[#5C4E43]" />
                                <span>
                                  {uploadingDocId === item.id
                                    ? 'Uploading...'
                                    : item.uploadedFile
                                    ? 'Replace'
                                    : 'Upload'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                  onChange={(e) => handleUploadCompleted(item.id, e)}
                                  className="hidden"
                                />
                              </label>

                              {item.pdfUrl ? (
                                <a
                                  href={item.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  onClick={() => handleTrackExternalOpen(item)}
                                  title="Download Blank Official Court PDF"
                                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-[#FAF9F6] text-[#5C4E43] border border-[#E2DBD0] text-xs font-medium transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Blank</span>
                                </a>
                              ) : item.pdfAvailability === 'portal_only' && item.officialLink ? (
                                <a
                                  href={item.officialLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleTrackExternalOpen(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-[#FAF9F6] text-[#5C4E43] border border-[#E2DBD0] text-xs font-medium transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Portal</span>
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {/* Uploaded File Badge */}
                          {item.uploadedFile && (
                            <div className="mt-2.5 pl-9 flex items-center gap-2 text-xs">
                              <a
                                href={api.getUploadedDocumentUrl(activeUserId, item.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6ECE6] text-[#354A3E] border border-[#C8D7C9] font-medium hover:bg-[#DAE5DA] transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#435C4D]" />
                                <span>Uploaded: {item.uploadedFile.fileName}</span>
                              </a>
                            </div>
                          )}

                          {/* Progressive Disclosure: Description, Why Included, Notes, Self-Help */}
                          {showDetails && (
                            <div className="mt-3.5 pl-9 space-y-3">
                              <p className="text-xs text-[#5C4E43] leading-relaxed">
                                {item.description}
                              </p>

                              <div className="flex items-start gap-2 text-xs text-[#261E19] bg-[#FAF9F6] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5">
                                <AlertCircle className="w-4 h-4 text-[#435C4D] flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong className="font-medium">Why it’s in your list:</strong>{' '}
                                  <span className="text-[#5C4E43]">{item.reasonIncluded}</span>
                                </span>
                              </div>

                              {editingNoteId === item.id ? (
                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    placeholder="Add a note (e.g. filed 11/10, waiting on spouse W-2)..."
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2DBD0] text-xs text-[#261E19] focus:outline-none focus:ring-2 focus:ring-[#435C4D]/30 focus:border-[#435C4D]"
                                  />
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveNote(item.id)}
                                      className="px-3 py-1.5 bg-[#435C4D] text-white rounded-lg text-xs font-medium hover:bg-[#354A3E] transition"
                                    >
                                      Save Note
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingNoteId(null)}
                                      className="px-3 py-1.5 bg-[#F4EFEA] text-[#5C4E43] rounded-lg text-xs font-medium hover:bg-[#EAE2D9] transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                  {item.notes && (
                                    <span className="text-xs text-[#261E19] bg-[#FBF5E8] border border-[#EAD9B7] px-2.5 py-1 rounded-lg">
                                      Note: {item.notes}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenNote(item)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#5C4E43] hover:text-[#261E19] transition"
                                  >
                                    <StickyNote className="w-3.5 h-3.5 text-[#8C7D73]" />
                                    <span>{item.notes ? 'Edit Note' : 'Add Note'}</span>
                                  </button>
                                  {item.officialLink && (
                                    <a
                                      href={item.officialLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-medium text-[#435C4D] hover:underline"
                                    >
                                      <span>Official Self-Help Guide</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {activeFormDoc && (
        <GuidedDocumentModal
          docItem={activeFormDoc}
          onClose={() => setActiveFormDoc(null)}
        />
      )}
    </div>
  );
}
