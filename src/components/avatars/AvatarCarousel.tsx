import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import {
  getAllAvatars,
  getAvatarById,
  normalizeAvatarId,
  type AvatarId,
} from './avatar-data';
import AvatarInfo from './AvatarInfo';

const TOTAL = getAllAvatars().length;
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`;

interface AvatarCarouselProps {
  userXP: number;
  selectedAvatar?: string | null;
  saving?: boolean;
  saved?: boolean;
  onSelect?: (avatarId: AvatarId) => void;
  onBack?: () => void;
  className?: string;
  mode?: 'page' | 'profile';
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}

function roleStyle(role: 'center' | 'left' | 'right' | 'back', isMobile: boolean): React.CSSProperties {
  const transition =
    'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1), bottom 650ms cubic-bezier(0.4,0,0.2,1), height 650ms cubic-bezier(0.4,0,0.2,1)';
  const base: React.CSSProperties = {
    position: 'absolute',
    aspectRatio: '0.6 / 1',
    transformOrigin: 'bottom center',
    transition,
    willChange: 'transform, filter, opacity',
  };

  if (role === 'center') {
    return {
      ...base,
      left: '50%',
      bottom: isMobile ? '20%' : '6%',
      height: isMobile ? '58%' : '82%',
      transform: 'translateX(-50%) scale(1)',
      filter: 'none',
      opacity: 1,
      zIndex: 20,
    };
  }

  if (role === 'left') {
    return {
      ...base,
      left: isMobile ? '18%' : '24%',
      bottom: isMobile ? '32%' : '14%',
      height: isMobile ? '17%' : '30%',
      transform: 'translateX(-50%) scale(1)',
      filter: 'blur(2px)',
      opacity: 0.82,
      zIndex: 10,
    };
  }

  if (role === 'right') {
    return {
      ...base,
      left: isMobile ? '82%' : '76%',
      bottom: isMobile ? '32%' : '14%',
      height: isMobile ? '17%' : '30%',
      transform: 'translateX(-50%) scale(1)',
      filter: 'blur(2px)',
      opacity: 0.82,
      zIndex: 10,
    };
  }

  return {
    ...base,
    left: '50%',
    bottom: isMobile ? '34%' : '18%',
    height: isMobile ? '13%' : '21%',
    transform: 'translateX(-50%) scale(1)',
    filter: 'blur(4px)',
    opacity: 0.95,
    zIndex: 5,
  };
}

function NavButton({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  const label = direction === 'prev' ? 'Previous avatar' : 'Next avatar';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white transition hover:scale-105 hover:bg-white/10 sm:h-16 sm:w-16"
    >
      {direction === 'prev' ? <ArrowLeft size={26} strokeWidth={2.25} /> : <ArrowRight size={26} strokeWidth={2.25} />}
    </button>
  );
}

export default function AvatarCarousel({
  userXP,
  selectedAvatar,
  saving,
  saved,
  onSelect,
  onBack,
  className,
  mode = 'page',
}: AvatarCarouselProps) {
  const avatars = useMemo(() => getAllAvatars(), []);
  const normalizedSelected = normalizeAvatarId(selectedAvatar);
  const selectedIndex = avatars.findIndex((avatar) => avatar.id === normalizedSelected);
  const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    avatars.forEach((avatar) => {
      const img = new Image();
      img.src = avatar.src;
    });
  }, [avatars]);

  const go = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimating) return;
      setIsAnimating(true);
      setActiveIndex((previous) => (direction === 'next' ? (previous + 1) % TOTAL : (previous + TOTAL - 1) % TOTAL));
      window.setTimeout(() => setIsAnimating(false), 650);
    },
    [isAnimating],
  );

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go('next');
      if (event.key === 'ArrowLeft') go('prev');
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [go]);

  const active = avatars[activeIndex] ?? getAvatarById(normalizedSelected);
  const unlocked = userXP >= active.xp;
  const isActive = normalizedSelected === active.id;

  const centerIdx = activeIndex;
  const leftIdx = (activeIndex + TOTAL - 1) % TOTAL;
  const rightIdx = (activeIndex + 1) % TOTAL;
  const backIdx = (activeIndex + 2) % TOTAL;

  function getRole(index: number): 'center' | 'left' | 'right' | 'back' | null {
    if (index === centerIdx) return 'center';
    if (index === leftIdx) return 'left';
    if (index === rightIdx) return 'right';
    if (index === backIdx) return 'back';
    return null;
  }

  function selectActive() {
    if (!unlocked || saving) return;
    onSelect?.(active.id);
  }

  return (
    <section
      className={clsx('relative w-full overflow-hidden', mode === 'page' ? 'min-h-screen' : 'min-h-[calc(100vh-6rem)]', className)}
      style={{
        backgroundColor: active.background,
        transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div className="relative h-screen min-h-[42rem] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-50 bg-repeat opacity-40"
          style={{ backgroundImage: GRAIN_URI, backgroundSize: '200px 200px' }}
        />

        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[18%] z-[2] flex select-none justify-center overflow-hidden">
          <span className="whitespace-nowrap font-['Anton',sans-serif] text-[clamp(84px,24vw,340px)] font-black uppercase leading-none text-white opacity-100">
            {active.ghostText}
          </span>
        </div>

        <div className="absolute left-4 top-6 z-[60] sm:left-8">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">JanSeva</span>
          )}
        </div>

        <div className="absolute inset-0 z-[3]">
          {avatars.map((avatar, index) => {
            const role = getRole(index);
            if (!role) return null;
            const locked = userXP < avatar.xp;
            return (
              <button
                key={avatar.id}
                type="button"
                disabled={role === 'center' || locked}
                onClick={() => {
                  if (role === 'left') go('prev');
                  if (role === 'right') go('next');
                }}
                className={clsx('border-0 bg-transparent p-0', (role === 'left' || role === 'right') && !locked && 'cursor-pointer')}
                style={roleStyle(role, isMobile)}
                aria-label={`${avatar.title} ${avatar.gender}`}
              >
                <img
                  src={avatar.src}
                  alt={`${avatar.title} ${avatar.gender}`}
                  draggable={false}
                  className={clsx('block h-full w-full select-none object-contain object-bottom transition', locked && 'grayscale')}
                  style={{ opacity: locked ? 0.48 : 1 }}
                />
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-6 left-4 z-[60] max-w-xs sm:bottom-20 sm:left-24">
          <AvatarInfo avatar={active} userXP={userXP} isActive={isActive} />
          <div className="mt-5 flex items-center gap-3">
            <NavButton direction="prev" onClick={() => go('prev')} />
            <NavButton direction="next" onClick={() => go('next')} />
          </div>
          <button
            type="button"
            onClick={selectActive}
            disabled={!unlocked || saving}
            className="mt-4 rounded-lg bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-55"
            style={{ color: active.background }}
          >
            {!unlocked ? `${active.xp} XP to unlock` : saving ? 'Saving...' : saved ? 'Saved' : isActive ? 'Active Avatar' : 'Set as Active'}
          </button>
        </div>

        <div className="absolute bottom-6 right-4 z-[60] text-right sm:bottom-20 sm:right-10">
          <p className="font-['Anton',sans-serif] text-[clamp(20px,4vw,56px)] uppercase leading-none tracking-normal text-white">
            {active.gender}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
            {userXP.toLocaleString()} XP
          </p>
        </div>
      </div>
    </section>
  );
}
