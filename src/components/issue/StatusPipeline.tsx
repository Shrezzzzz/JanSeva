import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { IssueStatus } from '../../types/issue.types';

const STEPS: { status: IssueStatus; label: string; short: string }[] = [
  { status: 'Reported',   label: 'Reported',   short: 'R'  },
  { status: 'Verified',   label: 'Verified',   short: 'V'  },
  { status: 'Assigned',   label: 'Assigned',   short: 'A'  },
  { status: 'InProgress', label: 'In Progress',short: '🔧' },
  { status: 'Resolved',   label: 'Resolved',   short: '✓'  },
  { status: 'Closed',     label: 'Closed',     short: 'C'  },
];

const ORDER: Record<IssueStatus, number> = {
  Reported: 0, Verified: 1, Assigned: 2, InProgress: 3, Resolved: 4, Closed: 5,
};

interface StatusPipelineProps {
  status: IssueStatus;
}

export default function StatusPipeline({ status }: StatusPipelineProps) {
  const currentIdx = ORDER[status];
  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        const pending = i > currentIdx;
        return (
          <div key={step.status} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all duration-300',
                done    && 'bg-[#1A6B3C] border-[#1A6B3C] text-white',
                active  && 'bg-[#1A6B3C] border-[#1A6B3C] text-white animate-[pulse-glow_2s_ease-in-out_infinite]',
                pending && 'bg-white border-[#E5E5E0] text-[#6F6F6F]',
              )}>
                {done ? <Check size={14} /> : <span>{i + 1}</span>}
              </div>
              <span className={clsx('text-xs hidden sm:block', active ? 'text-[#0D0D0B] font-medium' : 'text-[#6F6F6F]')}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx('flex-1 h-0.5 mx-1 rounded-full transition-colors duration-500', i < currentIdx ? 'bg-[#1A6B3C]' : 'bg-[#E5E5E0]')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
