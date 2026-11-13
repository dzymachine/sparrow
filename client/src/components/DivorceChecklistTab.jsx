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
  { id: 'not_started', label: 'Not Started', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'in_progress', label: 'In Progress', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'signed_ready', label: 'Signed / Ready', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'completed', label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
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
      'RUTH AI | TAILORED DIVORCE DOCUMENT CHECKLIST',
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
      <div className="bg-white border border-brand-200/80 rounded-3xl p-8 text-center text-sm text-slate-500">
        Loading your tailored divorce document checklist...
      </div>
    );
  }

  if (!divorceChecklist.isPursuingDivorce) {
    return (
      <div className="bg-white border border-brand-200/80 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
            <FileSignature className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Divorce Document Checklist (Paused in Exploration Mode)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              During onboarding, you selected <strong>Just Exploring</strong>. Whenever you decide you want to pursue a divorce or legal separation, we will generate a step-by-step checklist of every court form and financial document you need to fill out and sign.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleActivateDivorceChecklist}
                className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSyncing ? 'Generating Checklist...' : "I'm Pursuing a Divorce — Generate My Checklist"}</span>
              </button>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
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
    <div className="space-y-5">
      {/* Calm Progress & Situation Header */}
      <div className="bg-white border border-brand-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-brand-700" />
              <h3 className="font-bold text-slate-900 text-lg">
                Step-by-Step Divorce Document Checklist
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Take it one stage at a time. Only your current stage is expanded below—download official PDFs directly where available.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAllStages}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              {allExpanded ? 'Focus Current Stage' : 'Expand All Stages'}
            </button>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit Situation</span>
            </Link>
            <button
              type="button"
              onClick={handleExportChecklist}
              className="inline-flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Situation Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(situationTags || []).map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200/70"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Compact Progress Bar */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-bold text-slate-800">
              {summary.completedCount} of {summary.totalCount} documents completed ({summary.percentComplete}%)
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="text-emerald-700 font-semibold">{summary.completedCount} Done</span>
              <span className="text-indigo-700">{summary.signedReadyCount} Signed/Ready</span>
              <span className="text-amber-700">{summary.inProgressCount} In Progress</span>
            </div>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${summary.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search form (e.g. FL-100, QDRO)..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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

      {/* Stage-by-Stage Document Groups */}
      {filteredStages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-500">
          No documents match your current search or filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStages.map((stage) => {
            const isExpanded = isFiltering || Boolean(expandedStages[stage.id]);
            const stageComplete = stage.completedCount === stage.totalCount && stage.totalCount > 0;

            return (
              <div
                key={stage.id}
                className="bg-white border border-brand-200/80 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Stage Header */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/70 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {stage.title}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        stageComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {stage.completedCount}/{stage.totalCount} done
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{stage.subtitle}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {/* Stage Document Rows */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {stage.filteredItems.map((item) => {
                      const statusMeta = STATUS_OPTIONS.find((s) => s.id === item.status) || STATUS_OPTIONS[0];
                      const isDone = item.status === 'completed';
                      const showDetails = Boolean(expandedDetails[item.id]);
                      const autoStatusLabel =
                        item.status === 'in_progress' && item.fieldCompletionPercent > 0
                          ? `In Progress • ${item.fieldCompletionPercent}%`
                          : item.status === 'in_progress'
                          ? 'Opened'
                          : item.status === 'completed' && item.completedExternally
                          ? 'Completed (External)'
                          : statusMeta.label;

                      return (
                        <div
                          key={item.id}
                          className={`px-5 py-4 transition ${isDone ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Left: Status Icon + Title + Key Metadata */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleExternalComplete(item)}
                                title={isDone ? 'Uncheck external completion' : 'Check off as completed externally'}
                                className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-emerald-600 transition"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : item.status === 'in_progress' || item.status === 'signed_ready' ? (
                                  <Clock className="w-5 h-5 text-amber-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300" />
                                )}
                              </button>

                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`font-semibold text-sm ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                    {item.title}
                                  </span>
                                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {item.formCode}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                                    {autoStatusLabel}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                  <span className="inline-flex items-center gap-1 font-medium text-brand-800">
                                    <FileText className="w-3 h-3" />
                                    {item.actionType}
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <FileSignature className="w-3 h-3" />
                                    Signs: {item.whoSigns}
                                  </span>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleDetails(item.id)}
                                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-brand-700"
                                  >
                                    <Info className="w-3 h-3" />
                                    <span>{showDetails ? 'Hide details' : 'Why & details'}</span>
                                  </button>
                                  {item.notes && !showDetails && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-700 font-medium">Has note</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Fill & Download PDF + Upload Completed + Blank PDF / Portal */}
                            <div className="flex flex-wrap items-center gap-2 pl-8 md:pl-0 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveFormDoc(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition"
                              >
                                <FileSignature className="w-3.5 h-3.5" />
                                <span>Fill &amp; Download PDF</span>
                              </button>

                              <label
                                title="Upload an already-completed copy of this document"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer transition"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>
                                  {uploadingDocId === item.id
                                    ? 'Uploading...'
                                    : item.uploadedFile
                                    ? 'Replace Upload'
                                    : 'Upload Completed'}
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Blank PDF</span>
                                </a>
                              ) : item.pdfAvailability === 'portal_only' && item.officialLink ? (
                                <a
                                  href={item.officialLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleTrackExternalOpen(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Portal</span>
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {/* Uploaded File Badge (if user uploaded a completed copy) */}
                          {item.uploadedFile && (
                            <div className="mt-2 pl-8 flex items-center gap-2 text-xs">
                              <a
                                href={api.getUploadedDocumentUrl(activeUserId, item.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium hover:bg-emerald-100 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Uploaded: {item.uploadedFile.fileName}</span>
                              </a>
                            </div>
                          )}

                          {/* Expandable Details & Notes */}
                          {showDetails && (
                            <div className="mt-3 pl-8 space-y-2.5">
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {item.description}
                              </p>

                              <div className="flex items-start gap-1.5 text-[11px] text-brand-900 bg-brand-50/60 border border-brand-200/60 rounded-xl px-3 py-2">
                                <AlertCircle className="w-3.5 h-3.5 text-brand-700 flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong>Why it's in your list:</strong> {item.reasonIncluded}
                                </span>
                              </div>

                              {editingNoteId === item.id ? (
                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    placeholder="Add a note (e.g. filed 11/10, waiting on spouse W-2)..."
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                                  />
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveNote(item.id)}
                                      className="px-3 py-1.5 bg-brand-700 text-white rounded-lg text-xs font-semibold hover:bg-brand-800"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingNoteId(null)}
                                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                  {item.notes && (
                                    <span className="text-xs text-slate-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                      Note: {item.notes}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenNote(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-brand-700"
                                  >
                                    <StickyNote className="w-3 h-3" />
                                    <span>{item.notes ? 'Edit Note' : 'Add Note'}</span>
                                  </button>
                                  {item.officialLink && (
                                    <a
                                      href={item.officialLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
                                    >
                                      <span>Self-Help Guide</span>
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
              </div>
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
