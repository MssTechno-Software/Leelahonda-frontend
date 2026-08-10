import React, { useState, useEffect } from 'react';

// Custom Animation Keyframes (SVG stroke draw, fill, shine, scale)
const animationStyle = `
  @keyframes lmStrokeDraw {
    0% { stroke-dashoffset: 2000; }
    100% { stroke-dashoffset: 0; }
  }

  @keyframes lmFillText {
    0% { fill: transparent; stroke-width: 1.5px; }
    100% { fill: #e31e24; stroke-width: 0px; }
  }

  @keyframes lmFillBlueSwoosh {
    0% { fill: transparent; stroke-width: 1.5px; }
    100% { fill: #121c4e; stroke-width: 0px; }
  }

  @keyframes lmFillRedSwoosh {
    0% { fill: transparent; stroke-width: 1.5px; }
    100% { fill: #e31e24; stroke-width: 0px; }
  }

  @keyframes lmShineSweep {
    0% { transform: translateX(-100%); }
    35%, 100% { transform: translateX(100%); }
  }

  @keyframes lmPulseScale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }

  @keyframes lmDotPulse {
    0%, 20% { opacity: 0; }
    40%, 100% { opacity: 1; }
  }

  /* SVG Draw & Fill Classes */
  .animate-lm-draw-text {
    stroke-dasharray: 2000;
    stroke-dashoffset: 2000;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: #e31e24;
    fill: transparent;
    animation: 
      lmStrokeDraw 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards,
      lmFillText 0.6s ease-out 2.0s forwards;
  }

  .animate-lm-draw-blue {
    stroke-dasharray: 2000;
    stroke-dashoffset: 2000;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: #121c4e;
    fill: transparent;
    animation: 
      lmStrokeDraw 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards,
      lmFillBlueSwoosh 0.6s ease-out 2.4s forwards;
  }

  .animate-lm-draw-red {
    stroke-dasharray: 2000;
    stroke-dashoffset: 2000;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: #e31e24;
    fill: transparent;
    animation: 
      lmStrokeDraw 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards,
      lmFillRedSwoosh 0.6s ease-out 2.8s forwards;
  }

  /* Breathing Scale Animation */
  .animate-lm-scale-loop {
    animation: lmPulseScale 3.5s ease-in-out infinite 3.4s;
  }

  /* Shine Effect Sweep */
  .animate-lm-shine {
    animation: lmShineSweep 3.2s ease-in-out infinite 3.5s;
  }

  /* Loading Dots Sequence */
  .animate-lm-dot-1 { animation: lmDotPulse 1.5s infinite 0.0s; }
  .animate-lm-dot-2 { animation: lmDotPulse 1.5s infinite 0.3s; }
  .animate-lm-dot-3 { animation: lmDotPulse 1.5s infinite 0.6s; }
`;

/**
 * LeelamayiLoader Component
 * 
 * @param {boolean} loading - Controls mounting state. Setting to false triggers smooth fade-out.
 * @param {number} fadeDuration - Fade out duration in milliseconds (default: 600ms).
 */
const LeelamayiLoader = ({
    loading = true,
    fadeDuration = 600,
    message = "Loading...",
    subMessage = "",
    disableBackdropBlur = false,
}) => {
    const [shouldRender, setShouldRender] = useState(loading);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        if (loading) {
            setShouldRender(true);
            setIsFadingOut(false);
        } else {
            setIsFadingOut(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, fadeDuration);
            return () => clearTimeout(timer);
        }
    }, [loading, fadeDuration]);

    if (!shouldRender) return null;

    return (
        <>
            <style>{animationStyle}</style>

            {/* Floating Overlay with subtle blur & black tint */}
            <div
                role="status"
                aria-live="polite"
                aria-label="Loading Leelamayi application"
                style={{
                    transitionDuration: `${fadeDuration}ms`,
                }}
                className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center
                 bg-white/30
              ${!disableBackdropBlur ? "backdrop-blur-md" : ""}
                pointer-events-auto
              transition-all ease-in-out
                 ${isFadingOut
                        ? "opacity-0 scale-95"
                        : "opacity-100 scale-100"
                    }
                  `}
            >
                <div className="relative flex flex-col items-center justify-center p-4">

                    {/* Soft Ambient Radial Glow Behind Logo */}
                    <div className="absolute inset-0 bg-radial from-red-500/10 via-blue-500/5 to-transparent blur-3xl rounded-full scale-125 pointer-events-none" />

                    {/* Logo Box Container */}
                    <div className="relative z-10 w-[220px] sm:w-[280px] md:w-[320px] h-auto animate-lm-scale-loop will-change-transform">
                        <svg
                            className="w-full h-auto overflow-visible"
                            viewBox="0 0 1000 320"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                {/* Clean Subtle Glow Filter */}
                                <filter id="lm-glow-filter" x="-10%" y="-10%" width="120%" height="120%">
                                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>

                                {/* Shine Sweep Linear Gradient */}
                                <linearGradient id="lm-shine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                                    <stop offset="45%" stopColor="rgba(255,255,255,0.1)" />
                                    <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
                                    <stop offset="55%" stopColor="rgba(255,255,255,0.1)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>

                                {/* Mask for Shine Sweep */}
                                <mask id="lm-logo-mask">
                                    <g fill="#FFFFFF">
                                        {/* Lower Red Arc Mask */}
                                        <path d="M 95,85 C 60,130 45,185 65,215 C 85,245 160,265 290,270 C 460,276 590,265 630,250 C 480,260 280,255 160,230 C 90,215 75,180 100,130 C 110,110 125,95 140,80 Z" />
                                        {/* Upper Blue Arc Mask */}
                                        <path d="M 370,35 C 520,22 740,32 910,88 C 965,110 970,152 905,200 C 940,158 938,118 880,95 C 735,38 520,42 370,55 Z" />
                                        {/* Text Mask */}
                                        <path d="M 175,115 H 205 V 195 H 240 V 220 H 175 Z" />
                                        <path d="M 252,115 H 318 V 140 H 283 V 158 H 312 V 181 H 283 V 198 H 322 V 220 H 252 Z" />
                                        <path d="M 332,115 H 398 V 140 H 363 V 158 H 392 V 181 H 363 V 198 H 402 V 220 H 332 Z" />
                                        <path d="M 412,115 H 442 V 195 H 477 V 220 H 412 Z" />
                                        <path d="M 488,220 L 528,115 H 562 L 602,220 H 568 L 560,192 H 530 L 522,220 Z M 537,168 H 553 L 545,140 Z" />
                                        <path d="M 612,115 H 644 L 661,171 L 678,115 H 710 V 220 H 683 V 150 L 667,202 H 655 L 639,150 V 220 H 612 Z" />
                                        <path d="M 720,220 L 760,115 H 794 L 834,220 H 800 L 792,192 H 762 L 754,220 Z M 769,168 H 785 L 777,140 Z" />
                                        <path d="M 844,115 H 872 V 220 H 844 Z" />
                                    </g>
                                </mask>
                            </defs>

                            {/* 1 & 2: RED LEELAMAYI TEXT */}
                            <g filter="url(#lm-glow-filter)">
                                <path className="animate-lm-draw-text" d="M 175,115 H 205 V 195 H 240 V 220 H 175 Z" />
                                <path className="animate-lm-draw-text" d="M 252,115 H 318 V 140 H 283 V 158 H 312 V 181 H 283 V 198 H 322 V 220 H 252 Z" />
                                <path className="animate-lm-draw-text" d="M 332,115 H 398 V 140 H 363 V 158 H 392 V 181 H 363 V 198 H 402 V 220 H 332 Z" />
                                <path className="animate-lm-draw-text" d="M 412,115 H 442 V 195 H 477 V 220 H 412 Z" />
                                <path className="animate-lm-draw-text" d="M 488,220 L 528,115 H 562 L 602,220 H 568 L 560,192 H 530 L 522,220 Z M 537,168 H 553 L 545,140 Z" />
                                <path className="animate-lm-draw-text" d="M 612,115 H 644 L 661,171 L 678,115 H 710 V 220 H 683 V 150 L 667,202 H 655 L 639,150 V 220 H 612 Z" />
                                <path className="animate-lm-draw-text" d="M 720,220 L 760,115 H 794 L 834,220 H 800 L 792,192 H 762 L 754,220 Z M 769,168 H 785 L 777,140 Z" />
                                <path className="animate-lm-draw-text" d="M 844,115 H 872 V 220 H 844 Z" />
                            </g>

                            {/* 3: UPPER BLUE SWOOSH */}
                            <path
                                className="animate-lm-draw-blue"
                                filter="url(#lm-glow-filter)"
                                d="M 370,35 C 520,22 740,32 910,88 C 965,110 970,152 905,200 C 940,158 938,118 880,95 C 735,38 520,42 370,55 Z"
                            />

                            {/* 4: LOWER RED SWOOSH */}
                            <path
                                className="animate-lm-draw-red"
                                filter="url(#lm-glow-filter)"
                                d="M 95,85 C 60,130 45,185 65,215 C 85,245 160,265 290,270 C 460,276 590,265 630,250 C 480,260 280,255 160,230 C 90,215 75,180 100,130 C 110,110 125,95 140,80 Z"
                            />

                            {/* SHINE SWEEP OVERLAY */}
                            <rect
                                x="-200"
                                y="0"
                                width="1400"
                                height="320"
                                fill="url(#lm-shine-gradient)"
                                mask="url(#lm-logo-mask)"
                                className="animate-lm-shine -translate-x-full"
                            />
                        </svg>
                    </div>

                    {/* Loading Message */}
                    <div className="relative z-10 mt-5 flex flex-col items-center select-none">
                        <div className="font-sans text-sm sm:text-base font-semibold text-gray-700 flex items-center">
                            <span>{message}</span>
                            <span className="inline-flex w-6 text-left ml-1 font-bold">
                                <span className="opacity-0 animate-lm-dot-1">.</span>
                                <span className="opacity-0 animate-lm-dot-2">.</span>
                                <span className="opacity-0 animate-lm-dot-3">.</span>
                            </span>
                        </div>

                        {subMessage && (
                            <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center max-w-xs">
                                {subMessage}
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default LeelamayiLoader;