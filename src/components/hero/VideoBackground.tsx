import { useEffect, useRef } from 'react';
import { HERO_VIDEO_URL } from '../../utils/constants';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const FADE_DURATION = 0.5;

    function tick() {
      if (!video) return;
      const { currentTime, duration } = video;
      if (!duration) { rafRef.current = requestAnimationFrame(tick); return; }

      if (currentTime < FADE_DURATION) {
        video.style.opacity = String(currentTime / FADE_DURATION);
      } else if (currentTime > duration - FADE_DURATION) {
        video.style.opacity = String((duration - currentTime) / FADE_DURATION);
      } else {
        video.style.opacity = '1';
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    const handleEnded = () => {
      if (!video) return;
      video.style.opacity = '0';
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => null);
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={HERO_VIDEO_URL}
      autoPlay
      muted
      playsInline
      aria-hidden
      style={{
        position: 'absolute',
        top: '300px',
        inset: 'auto 0 0 0',
        width: '100%',
        height: 'calc(100% - 300px)',
        objectFit: 'cover',
        opacity: 0,
        willChange: 'opacity',
      }}
    />
  );
}
