import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Scale,
  Sparkles,
  FileText
} from 'lucide-react';
import {
  AssetSplitDeadlineItem,
  BeneficiaryRequirementItem
} from '../../types/discovery';

interface TimelineInfographicSidebarProps {
  stateName: string;
  divorceChecklist: any;
  collectedCategoriesCount: number;
  lawyerQuestionsCount: number;
  hasProjection: boolean;
  assetSplitDeadlines: AssetSplitDeadlineItem[];
  beneficiaryRequirements: BeneficiaryRequirementItem[];
  onExportBrief: () => void;
}

const DEFAULT_TIMELINE_STAGES = [
  {
    id: 'stage_1_filing',
    order: 1,
    shortTitle: 'Initial Filing & Petition',
    window: 'Weeks 1–2',
    note: 'Petition, Summons & Service'
  },
  {
    id: 'stage_2_disclosures',
    order: 2,
    shortTitle: 'Mandatory Disclosures',
    window: 'By Day 60',
    note: 'Income, Expenses, Assets & Debts'
  },
  {
    id: 'stage_3_discovery_orders',
    order: 3,
    shortTitle: 'Temporary Orders & Discovery',
    window: 'Months 2–4',
    note: 'Support, Custody & Subpoenas'
  },
  {
    id: 'stage_4_settlement_trial',
    order: 4,
    shortTitle: 'Settlement or Trial Prep',
    window: 'Months 4–6',
    note: 'MSA Negotiation or Hearing'
  },
  {
    id: 'stage_5_judgment_post',
    order: 5,
    shortTitle: 'Final Judgment & QDROs',
    window: 'Month 6+',
    note: 'Decree, Deeds & Account Splits'
  }
];

export default function TimelineInfographicSidebar({
  stateName,
  divorceChecklist,
  collectedCategoriesCount,
  lawyerQuestionsCount,
  hasProjection,
  assetSplitDeadlines,
  beneficiaryRequirements,
  onExportBrief
}: TimelineInfographicSidebarProps) {
  const isPursuing = Boolean(divorceChecklist?.isPursuingDivorce);
  const liveStages: any[] = Array.isArray(divorceChecklist?.stages)
    ? divorceChecklist.stages
    : [];

  // Merge live checklist stage progress with clean timeline metadata
  const timelineNodes = DEFAULT_TIMELINE_STAGES.map((def, idx) => {
    const matched =
      liveStages.find((s) => s.id === def.id || s.order === def.order) || liveStages[idx];
    const totalCount = matched?.totalCount ?? 0;
    const completedCount = matched?.completedCount ?? 0;
    const isComplete = isPursuing && totalCount > 0 && completedCount >= totalCount;
    return {
      ...def,
      title: matched?.title ? matched.title.replace(/^Stage \d+:\s*/i, '') : def.shortTitle,
      totalCount,
      completedCount,
      isComplete
    };
  });

  const firstIncompleteIdx = timelineNodes.findIndex((n) => !n.isComplete);
  const activeIdx = isPursuing
    ? firstIncompleteIdx === -1
      ? timelineNodes.length - 1
      : firstIncompleteIdx
    : 0;

  // Overall Consultation Readiness Score (0–100)
  const discoveryScore = Math.round((collectedCategoriesCount / 7) * 50);
  const checklistPct = isPursuing
    ? divorceChecklist?.summary?.percentComplete ?? 0
    : 0;
  const checklistScore = Math.round((checklistPct / 100) * 30);
  const projectionScore = hasProjection ? 20 : 10;
  const readinessScore = Math.min(100, discoveryScore + checklistScore + projectionScore);

  const ringR = 22;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (readinessScore / 100) * ringC;

  const isCalifornia = stateName === 'California';
  const pendingDeadlinesCount =
    assetSplitDeadlines.filter((d) => d.status !== 'Satisfied').length +
    beneficiaryRequirements.filter((b) => b.status !== 'Compliant').length;

  return (
    <aside aria-label="Divorce Timeline & Readiness Infographic" className="space-y-4">
      {/* Header Pill */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#546347] flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          <span>Divorce Timeline</span>
        </span>
        <Link
          to="/checklist"
          className="text-[11px] font-medium text-[#435C4D] hover:underline inline-flex items-center gap-0.5"
        >
          <span>Checklist</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* CARD 1: 5-Stage Vertical Process Timeline */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold text-[#261E19] font-sans">
              {stateName} Roadmap
            </h2>
            <p className="text-[11px] text-[#8C7D73]">
              {isPursuing
                ? `${divorceChecklist?.summary?.completedCount ?? 0} of ${
                    divorceChecklist?.summary?.totalCount ?? 0
                  } court steps done`
                : 'Exploration mode · typical sequence'}
            </p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E6ECE6] text-[#435C4D] shrink-0">
            {isPursuing ? `${checklistPct}%` : 'Preview'}
          </span>
        </div>

        {/* Vertical Metro Track */}
        <ol className="relative space-y-3.5">
          {timelineNodes.map((node, idx) => {
            const isActive = idx === activeIdx;
            const isPast = isPursuing && node.isComplete;
            const isLast = idx === timelineNodes.length - 1;
            const stagePct =
              node.totalCount > 0
                ? Math.round((node.completedCount / node.totalCount) * 100)
                : 0;

            return (
              <li key={node.id} className="relative pl-7">
                {/* Connecting Vertical Line */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[9px] top-5 -bottom-3.5 w-[2px] ${
                      isPast ? 'bg-[#435C4D]' : 'bg-[#E2DBD0]'
                    }`}
                  />
                )}

                {/* Milestone Node */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold transition ${
                    isPast
                      ? 'bg-[#435C4D] text-white'
                      : isActive
                      ? 'bg-[#FAF7F2] border-2 border-[#435C4D] text-[#435C4D] ring-4 ring-[#E6ECE6]'
                      : 'bg-[#FAF7F2] border border-[#D4CBBF] text-[#8C7D73]'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="w-3 h-3" /> : node.order}
                </span>

                {/* Stage Content */}
                <div
                  className={`rounded-xl px-2.5 py-2 transition ${
                    isActive
                      ? 'bg-[#FAF7F2] border border-[#E2DBD0]'
                      : 'hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-[11px] font-semibold leading-tight ${
                        isActive || isPast ? 'text-[#261E19]' : 'text-[#5C4E43]'
                      }`}
                    >
                      {node.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C7D73] shrink-0">
                      {node.window}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#8C7D73] mt-0.5 leading-snug">
                    {node.note}
                  </p>

                  {isPursuing && node.totalCount > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[#EAE3D8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#435C4D] rounded-full transition-all duration-300"
                          style={{ width: `${stagePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-[#5C4E43]">
                        {node.completedCount}/{node.totalCount}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* CARD 2: Statutory & Execution Milestones */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#261E19] font-sans flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#A07E5F]" />
            <span>Key Statutory Windows</span>
          </h2>
          {pendingDeadlinesCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#FBF5E8] text-[#8A6116] border border-[#EAD9B7]">
              {pendingDeadlinesCount} active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
            <div className="text-[10px] uppercase tracking-wider text-[#8C7D73]">
              Disclosures
            </div>
            <div className="text-sm font-mono font-semibold text-[#261E19] mt-0.5">
              60 Days
            </div>
            <div className="text-[10px] text-[#5C4E43] mt-0.5 leading-tight">
              {isCalifornia ? 'Cal. Fam. Code § 2104' : 'Preliminary exchange'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
            <div className="text-[10px] uppercase tracking-wider text-[#8C7D73]">
              Min. Finalization
            </div>
            <div className="text-sm font-mono font-semibold text-[#261E19] mt-0.5">
              {isCalifornia ? '6 Mos + 1d' : 'State Rule'}
            </div>
            <div className="text-[10px] text-[#5C4E43] mt-0.5 leading-tight">
              {isCalifornia ? 'Cooling-off from service' : 'Varies by filing type'}
            </div>
          </div>
        </div>

        {assetSplitDeadlines.length > 0 && (
          <div className="pt-2 border-t border-[#F0EAE1] space-y-1.5">
            {assetSplitDeadlines.slice(0, 2).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="text-[#5C4E43] truncate">{d.asset}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4EFEA] text-[#5C4E43] shrink-0">
                  {d.deadline}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CARD 3: Consultation Readiness Ring */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r={ringR}
                fill="none"
                stroke="#F0EAE1"
                strokeWidth="5"
              />
              <circle
                cx="28"
                cy="28"
                r={ringR}
                fill="none"
                stroke="#435C4D"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-xs font-mono tabular-nums font-semibold text-[#261E19]">
              {readinessScore}%
            </span>
          </div>

          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-[#261E19] font-sans flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#435C4D]" />
              <span>Brief Readiness</span>
            </h2>
            <p className="text-[11px] text-[#5C4E43] leading-snug mt-0.5">
              Preparedness for your first attorney or mediator consult.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-[#F0EAE1] text-[11px]">
          <div className="flex items-center justify-between text-[#5C4E43]">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-[#435C4D]" />
              <span>Discovery Files</span>
            </span>
            <span className="font-mono tabular-nums text-[#261E19] font-medium">
              {collectedCategoriesCount}/7
            </span>
          </div>
          <div className="flex items-center justify-between text-[#5C4E43]">
            <span className="inline-flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-[#435C4D]" />
              <span>Lawyer Questions</span>
            </span>
            <span className="font-mono tabular-nums text-[#261E19] font-medium">
              {lawyerQuestionsCount} ready
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onExportBrief}
          className="w-full py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] border border-[#E2DBD0] text-[11px] font-medium text-[#261E19] transition"
        >
          Print / Save Lawyer Brief
        </button>
      </div>
    </aside>
  );
}
