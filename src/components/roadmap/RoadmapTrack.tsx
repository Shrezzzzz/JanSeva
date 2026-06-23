import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { ROUTES } from '../../config/routes';

interface Stage {
  id: number;
  label: string;
  icon: string;
  color: string;
  href: string;
  description: string;
}

const STAGES: Stage[] = [
  { id: 0, label: 'Report',    icon: '📸', color: '#1A6B3C', href: ROUTES.REPORT,       description: 'Snap a photo and report the issue in seconds.' },
  { id: 1, label: 'Locate',    icon: '📍', color: '#0284C7', href: ROUTES.MAP,           description: 'Pin it on the map with GPS precision.' },
  { id: 2, label: 'Verify',    icon: '👥', color: '#7C3AED', href: ROUTES.MAP,           description: 'Neighbours confirm the issue is real.' },
  { id: 3, label: 'Assign',    icon: '⚙️', color: '#D97706', href: ROUTES.TRACK,         description: 'Auto-routed to the right municipal department.' },
  { id: 4, label: 'Resolve',   icon: '🔧', color: '#DC2626', href: ROUTES.TRACK,         description: 'Authorities fix it and upload proof.' },
  { id: 5, label: 'Celebrate', icon: '🏆', color: '#F59E0B', href: ROUTES.GAMIFICATION,  description: 'You earn XP, badges, and community recognition.' },
];

// Evenly spaced X positions for 6 nodes in a 1100-wide SVG
const NODE_X = STAGES.map((_, i) => 100 + i * 180); // 100, 280, 460, 640, 820, 1000
const ROAD_Y = 100;
const NODE_R = 28;

interface SvgNodeProps {
  stage: Stage;
  cx: number;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}

function SvgNode({ stage, cx, active, completed, onClick }: SvgNodeProps) {
  const fill   = completed ? '#1A6B3C' : 'white';
  const stroke = completed ? '#1A6B3C' : stage.color;

  return (
    <g
      transform={`translate(${cx}, ${ROAD_Y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`Stage: ${stage.label}`}
    >
      {/* Glow ring when active */}
      {active && (
        <circle r={NODE_R + 8} fill="none" stroke={stage.color} strokeWidth={2} opacity={0.35}>
          <animate attributeName="r" values={`${NODE_R + 4};${NODE_R + 12};${NODE_R + 4}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.1;0.35" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r={NODE_R} fill={fill} stroke={stroke} strokeWidth={3} />
      {/* Icon or checkmark */}
      {completed ? (
        <text textAnchor="middle" dominantBaseline="central" fontSize="18" fill="white">✓</text>
      ) : (
        <text textAnchor="middle" dominantBaseline="central" fontSize="18">{stage.icon}</text>
      )}
      {/* Label below */}
      <text
        y={NODE_R + 18}
        textAnchor="middle"
        fontSize="12"
        fontWeight={active ? '600' : '400'}
        fill={active ? '#0D0D0B' : '#6F6F6F'}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {stage.label}
      </text>
    </g>
  );
}

export default function RoadmapTrack() {
  const navigate   = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active,    setActive]    = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) startAnimation(); },
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  function startAnimation() {
    let step = 0;
    const iv = setInterval(() => {
      setActive(step);
      if (step > 0) setCompleted((c) => (c.includes(step - 1) ? c : [...c, step - 1]));
      step += 1;
      if (step >= STAGES.length) clearInterval(iv);
    }, 600);
  }

  const dotX = NODE_X[active];

  return (
    <section ref={sectionRef} className="bg-[#F7F7F5] py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-medium text-[#1A6B3C] uppercase tracking-widest">The Journey</span>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl text-[#0D0D0B]">From Report to Resolution</h2>
          <p className="mt-3 text-[#6F6F6F] max-w-xl mx-auto">
            Every civic issue follows a clear path. Here's how JanSeva makes it happen.
          </p>
        </div>

        {/* ── Desktop: SVG road ── */}
        <svg
          viewBox="0 0 1100 160"
          className="w-full hidden sm:block"
          aria-label="Civic issue roadmap"
          role="img"
        >
          {/* Road base — asphalt */}
          <rect x="0" y={ROAD_Y - 30} width="1100" height="60" rx="8" fill="#2C2C2A" />

          {/* Lane dashes */}
          {[80, 200, 320, 440, 560, 680, 800, 920, 1040].map((x) => (
            <rect key={x} x={x} y={ROAD_Y - 3} width="60" height="6" rx="3" fill="white" opacity="0.35" />
          ))}

          {/* Progress fill between completed nodes */}
          {NODE_X.slice(0, -1).map((x, i) => (
            <rect
              key={i}
              x={x}
              y={ROAD_Y - 3}
              width={completed.includes(i) ? NODE_X[i + 1] - x : 0}
              height="6"
              rx="3"
              fill="#1A6B3C"
              style={{ transition: 'width 0.6s ease' }}
            />
          ))}

          {/* Animated traveler dot */}
          <circle
            cx={dotX}
            cy={ROAD_Y}
            r={10}
            fill="#1A6B3C"
            style={{
              transition: 'cx 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: 'drop-shadow(0 0 8px rgba(26,107,60,0.85))',
            }}
          />

          {/* Stage nodes */}
          {STAGES.map((stage, i) => (
            <SvgNode
              key={stage.id}
              stage={stage}
              cx={NODE_X[i]}
              active={active === i}
              completed={completed.includes(i)}
              onClick={() => navigate(stage.href)}
            />
          ))}
        </svg>

        {/* ── Mobile: vertical stack ── */}
        <div className="flex flex-col items-center gap-0 sm:hidden">
          {STAGES.map((stage, i) => {
            const isCompleted = completed.includes(i);
            const isActive    = active === i;
            return (
              <div key={stage.id} className="flex flex-col items-center">
                <button
                  onClick={() => navigate(stage.href)}
                  aria-label={`Stage: ${stage.label}`}
                  className="flex items-center gap-4 w-full max-w-xs"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl border-4 flex-shrink-0 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#1A6B3C] border-[#1A6B3C]'
                        : isActive
                        ? 'bg-white shadow-lg'
                        : 'bg-white'
                    }`}
                    style={{ borderColor: isCompleted ? '#1A6B3C' : stage.color }}
                  >
                    {isCompleted ? <CheckCircle size={22} className="text-white" /> : <span>{stage.icon}</span>}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${isActive ? 'text-[#0D0D0B]' : 'text-[#6F6F6F]'}`}>
                      {stage.label}
                    </p>
                    <p className="text-xs text-[#6F6F6F] leading-snug">{stage.description}</p>
                  </div>
                </button>
                {i < STAGES.length - 1 && (
                  <div className="w-0.5 h-8 ml-7 self-start bg-[#E5E5E0] rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Active stage description (desktop) */}
        <div className="mt-10 text-center min-h-[2rem] hidden sm:block">
          <p className="text-sm text-[#6F6F6F] animate-fade-rise" key={active}>
            <strong className="text-[#0D0D0B]">
              Stage {active + 1} — {STAGES[active].label}:
            </strong>{' '}
            {STAGES[active].description}
          </p>
        </div>
      </div>
    </section>
  );
}
