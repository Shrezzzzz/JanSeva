import type { Pet } from '../../types/user.types';

interface CivicPetProps {
  pet: Pet;
  size?: number; // px, default 60
}

const MOOD_EMOJI: Record<string, string> = {
  happy:   '😊',
  excited: '🤩',
  tired:   '😴',
  sad:     '😢',
  hungry:  '😋',
};

// SVG creature that evolves by stage
function PetSVG({ stage, size }: { stage: number; size: number }) {
  if (stage === 0) {
    // Egg
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-label="Pet egg">
        <ellipse cx="30" cy="33" rx="18" ry="22" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
        <ellipse cx="30" cy="33" rx="18" ry="22" fill="url(#eggShine)" />
        {/* Crack hint */}
        <path d="M28 22 L30 26 L27 30" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
          <radialGradient id="eggShine" cx="35%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  if (stage === 1) {
    // Hatched sprout-creature
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-label="Civic pet stage 1">
        {/* Body */}
        <circle cx="30" cy="36" r="14" fill="#1A6B3C" />
        {/* Eyes */}
        <circle cx="25" cy="33" r="3" fill="white" />
        <circle cx="35" cy="33" r="3" fill="white" />
        <circle cx="26" cy="33" r="1.5" fill="#0D0D0B" />
        <circle cx="36" cy="33" r="1.5" fill="#0D0D0B" />
        {/* Smile */}
        <path d="M24 39 Q30 43 36 39" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Ear-leaves */}
        <ellipse cx="18" cy="28" rx="4" ry="6" fill="#1A6B3C" transform="rotate(-20 18 28)" />
        <ellipse cx="42" cy="28" rx="4" ry="6" fill="#1A6B3C" transform="rotate(20 42 28)" />
        {/* Shell base */}
        <path d="M16 44 Q30 50 44 44" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <style>{`
          @keyframes petBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        `}</style>
        <g style={{ animation: 'petBob 2s ease-in-out infinite' }}>
          {/* Animated bounce wraps whole body — CSS animation on SVG group */}
        </g>
      </svg>
    );
  }

  // Stage 2+ — evolved creature
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-label="Civic pet evolved">
      {/* Wings */}
      <ellipse cx="12" cy="28" rx="8" ry="5" fill="#E8F5EE" transform="rotate(-15 12 28)" />
      <ellipse cx="48" cy="28" rx="8" ry="5" fill="#E8F5EE" transform="rotate(15 48 28)" />
      {/* Body */}
      <circle cx="30" cy="34" r="16" fill="#1A6B3C" />
      {/* Eyes — bigger */}
      <circle cx="24" cy="30" r="4" fill="white" />
      <circle cx="36" cy="30" r="4" fill="white" />
      <circle cx="25" cy="30" r="2" fill="#0D0D0B" />
      <circle cx="37" cy="30" r="2" fill="#0D0D0B" />
      {/* Star sparkle on forehead */}
      <path d="M30 18 L31 22 L35 22 L32 24 L33 28 L30 26 L27 28 L28 24 L25 22 L29 22 Z" fill="#F59E0B" />
      {/* Smile */}
      <path d="M22 38 Q30 44 38 38" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function CivicPet({ pet, size = 60 }: CivicPetProps) {
  const moodEmoji = MOOD_EMOJI[pet.mood] ?? '😊';

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{ width: size, height: size }}
        className="drop-shadow-md"
        aria-label={`${pet.name} the civic pet`}
      >
        <PetSVG stage={pet.stage} size={size} />
      </div>
      <div className="text-center leading-none">
        <p className="text-xs font-medium text-[#0D0D0B]">{pet.name}</p>
        <span className="text-sm">{moodEmoji}</span>
      </div>
    </div>
  );
}
