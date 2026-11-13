import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

/**
 * Full-bleed Veo video background with cinematic scrim & Ken-Burns poster fallback.
 * Place your Veo-generated video at: ruthAI/client/public/sparrow-flight.mp4
 */
export function VideoBackground({
  videoSrc = '/sparrow-flight.mp4',
  posterSrc = '/sparrow-poster.jpg',
}) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setHasVideo(true);
    const handleError = () => setHasVideo(false);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-screen h-screen z-0 overflow-hidden bg-[#18120E] pointer-events-none select-none">
        {/* Fallback / Poster image */}
        <img
          src={posterSrc}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
            hasVideo ? 'opacity-30' : 'opacity-100'
          }`}
        />

        {/* Veo Video Layer (un-cropped so the entire frame is visible) */}
        {hasVideo && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            autoPlay
            loop
            muted
            playsInline
            poster={posterSrc}
            onError={() => setHasVideo(false)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {/* Cinematic dark-warm scrim so overlaid typography stays crisp & accessible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(22, 16, 13, 0.45) 0%, rgba(22, 16, 13, 0.25) 40%, rgba(22, 16, 13, 0.55) 80%, rgba(20, 15, 12, 0.78) 100%)',
          }}
        />
        {/* Subtle radial spotlight behind hero center */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 45% at 50% 25%, rgba(217, 155, 82, 0.14) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Discreet 21st.dev-style floating media control pill */}
      {hasVideo && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
          className="fixed bottom-5 left-5 z-30 hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1512]/70 hover:bg-[#1C1512]/90 backdrop-blur-md border border-white/15 text-[11px] font-medium text-amber-100/85 shadow-lg transition"
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isPlaying ? 'Pause Video' : 'Play Video'}</span>
        </button>
      )}
    </>
  );
}

/**
 * 21st.dev-inspired Spotlight Glass Card with cursor-following radial glow
 */
export function SpotlightCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCoords((prev) => ({ ...prev, active: false }))}
      className={`group relative overflow-hidden rounded-2xl bg-[#1B1410]/55 backdrop-blur-xl border border-white/15 hover:border-amber-200/35 shadow-[0_8px_32px_rgba(0,0,0,0.28)] transition-all duration-300 ${className}`}
    >
      {/* Cursor-tracking spotlight */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: coords.active ? 1 : 0,
          background: `radial-gradient(420px circle at ${coords.x}px ${coords.y}px, rgba(251, 191, 36, 0.14), transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * 21st.dev-inspired Shimmer CTA Button
 */
export function ShimmerButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#435C4D] via-[#4F6D5B] to-[#354A3E] text-white font-semibold shadow-[0_10px_30px_rgba(67,92,77,0.45)] border border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_14px_36px_rgba(67,92,77,0.6)] active:scale-[0.99] ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-sweep"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

/**
 * 21st.dev-inspired BlurFade entrance wrapper
 */
export function BlurFade({ children, delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`${visible ? 'animate-fade-up-blur' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}
