import React from 'react';
import { Link } from 'react-router-dom';
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
    window: 'Wks 1–2'
  },
  {
    id: 'stage_2_disclosures',
    order: 2,
    shortTitle: 'Mandatory Disclosures',
    window: 'Day 60'
  },
  {
    id: 'stage_3_discovery_orders',
    order: 3,
    shortTitle: 'Temporary Orders',
    window: 'Mos 2–4'
  },
  {
    id: 'stage_4_settlement_trial',
    order: 4,
    shortTitle: 'Settlement or Trial',
    window: 'Mos 4–6'
  },
  {
    id: 'stage_5_judgment_post',
    order: 5,
    shortTitle: 'Final Judgment & QDRO',
    window: 'Mo 6+'
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

  const checklistPct = isPursuing
    ? divorceChecklist?.summary?.percentComplete ?? 0
    : 0;

  const discoveryScore = Math.round((collectedCategoriesCount / 7) * 50);
  const checklistScore = Math.round((checklistPct / 100) * 30);
  const projectionScore = hasProjection ? 20 : 10;
  const readinessScore = Math.min(100, discoveryScore + checklistScore + projectionScore);

  const isCalifornia = stateName === 'California';
  const pendingDeadlinesCount =
    assetSplitDeadlines.filter((d) => d.status !== 'Satisfied').length +
    beneficiaryRequirements.filter((b) => b.status !== 'Compliant').length;

  return (
    <aside aria-label="Divorce Timeline" className="space-y-4">
      {/* Section Eyebrow */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#787774]">
          Divorce Timeline
        </span>
        <Link
          to="/checklist"
          className="text-[11px] font-medium text-[#2F3437] hover:text-[#111111] transition-colors"
        >
          Checklist →
        </Link>
      </div>

      {/* Card 1: Minimalist Vertical Roadmap */}
      <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 space-y-5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xs font-medium text-[#111111] font-sans">
              {stateName} Process
            </h2>
            <p className="text-[11px] text-[#787774] mt-0.5">
              {isPursuing ? `${checklistPct}% completed` : 'Typical 5-stage sequence'}
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.05em] px-2 py-0.5 rounded-full bg-[#EDF3EC] text-[#346538]">
            {isPursuing ? 'Active' : 'Preview'}
          </span>
        </div>

        {/* Clean Vertical Track */}
        <ol className="relative space-y-4">
          {timelineNodes.map((node, idx) => {
            const isActive = idx === activeIdx;
            const isPast = isPursuing && node.isComplete;
            const isLast = idx === timelineNodes.length - 1;

            return (
              <li key={node.id} className="relative pl-6">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[6px] top-4 -bottom-4 w-px ${
                      isPast ? 'bg-[#346538]' : 'bg-[#EAEAEA]'
                    }`}
                  />
                )}

                {/* Geometric Node Indicator */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    isPast
                      ? 'bg-[#346538]'
                      : isActive
                      ? 'bg-white border-2 border-[#111111]'
                      : 'bg-white border border-[#D4D4D2]'
                  }`}
                >
                  {isPast && (
                    <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {isActive && !isPast && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                  )}
                </span>

                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-xs leading-[1.4] ${
                      isActive
                        ? 'font-medium text-[#111111]'
                        : isPast
                        ? 'text-[#2F3437]'
                        : 'text-[#787774]'
                    }`}
                  >
                    {node.title}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-[#787774] shrink-0">
                    {node.window}
                  </span>
                </div>

                {isActive && isPursuing && node.totalCount > 0 && (
                  <div className="text-[11px] font-mono tabular-nums text-[#787774] mt-0.5">
                    {node.completedCount} of {node.totalCount} forms done
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* Quiet Statutory Windows */}
        <div className="pt-4 border-t border-[#EAEAEA] grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.05em] text-[#787774]">
              Disclosures
            </div>
            <div className="text-xs font-mono font-medium text-[#111111] mt-0.5">
              60 Days
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.05em] text-[#787774]">
              Min. Finalization
            </div>
            <div className="text-xs font-mono font-medium text-[#111111] mt-0.5">
              {isCalifornia ? '6 Mos + 1d' : 'State Rule'}
            </div>
          </div>
        </div>

        {pendingDeadlinesCount > 0 && (
          <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#787774]">
            <span>Active asset deadlines</span>
            <span className="font-mono tabular-nums text-[#111111]">
              {pendingDeadlinesCount}
            </span>
          </div>
        )}
      </section>

      {/* Card 2: Consultation Readiness */}
      <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-[#111111]">Brief Readiness</span>
          <span className="font-serif text-2xl tracking-[-0.02em] leading-none text-[#111111] tabular-nums">
            {readinessScore}%
          </span>
        </div>

        <div className="w-full h-1.5 bg-[#F7F6F3] rounded-sm overflow-hidden">
          <div
            className="h-full bg-[#111111] transition-all duration-500"
            style={{ width: `${readinessScore}%` }}
          />
        </div>

        <div className="divide-y divide-[#EAEAEA] border-t border-[#EAEAEA] text-xs">
          <div className="py-2 flex items-center justify-between">
            <span className="text-[#787774]">Discovery files</span>
            <span className="font-mono tabular-nums text-[#111111]">
              {collectedCategoriesCount}/7
            </span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-[#787774]">Lawyer questions</span>
            <span className="font-mono tabular-nums text-[#111111]">
              {lawyerQuestionsCount} ready
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onExportBrief}
          className="w-full py-2 px-3 rounded-md bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-xs font-medium text-white transition"
        >
          Export Lawyer Brief
        </button>
      </section>
    </aside>
  );
}
