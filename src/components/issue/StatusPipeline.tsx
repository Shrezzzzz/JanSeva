import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { IssueStatus } from '../../types/issue.types';

// Full lifecycle in order. Rejected is a transient state (not a forward step)
// so we exclude it from the linear pipeline display.
const STEPS: { status: IssueStatus; label: string }[] = [
  { status: 'Reported',          label: 'Reported'     },
  { status: 'Verified',          label: 'Verified'     },
  { status: 'Assigned',          label: 'Assigned'     },
  { status: 'Accepted',          label: 'Accepted'     },
  { status: 'InProgress',        label: 'In Progress'  },
  { status: 'NeedsVerification', label: 'Verification' },
  { status: 'Resolved',          label: 'Resolved'     },
  { status: 'Closed',            label: 'Closed'       },
];

const ORDER: Record<IssueStatus, number> = {
  Reported:          0,
  Verified:          1,
  Assigned:          2,
  Accepted:          3,
  InProgress:        4,
  Completed:         4, // same visual position as InProgress (sub-state)
  NeedsVerification: 5,
  Rejected:          4, // shown at InProgress position when rejected
  Resolved:          6,
  Closed:            7,
};

interface StatusPipelineProps {
  status: IssueStatus;
}

export default function StatusPipeline({ status }: StatusPipelineProps) {
  const currentIdx = ORDER[status];

  // For Rejected, show a warning tint on the pipeline
  const isRejected = status === 'Rejected';

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        const pending = i > currentIdx;
        return (
          <div key={step.status} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all duration-300 shrink-0',
                done    && 'bg-[#1A6B3C] border-[#1A6B3C] text-white',
                active  && !isRejected && 'bg-[#1A6B3C] border-[#1A6B3C] text-white',
                active  && isRejected  && 'bg-red-600 border-red-600 text-white',
                pending && 'bg-white border-[#E5E5E0] text-[#6F6F6F]',
              )}>
                {done ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <span className={clsx(
                'text-[10px] hidden sm:block truncate max-w-[56px] text-center leading-tight',
                active  && !isRejected && 'text-[#0D0D0B] font-semibold',
                active  && isRejected  && 'text-red-600 font-semibold',
                !active && 'text-[#6F6F6F]',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx(
                'flex-1 h-0.5 mx-1 rounded-full transition-colors duration-500',
                i < currentIdx ? 'bg-[#1A6B3C]' : 'bg-[#E5E5E0]',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
