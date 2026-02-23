// src/components/pet/CyberFoxSVG.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface CyberFoxSVGProps {
    animState: 'idle' | 'sleeping' | 'focusing' | 'happy' | 'sad' | 'low-power' | 'celebration';
    level?: number;
    equippedItems?: Record<string, string>;
    className?: string;
}

export const CyberFoxSVG: React.FC<CyberFoxSVGProps> = ({ animState, level = 1, equippedItems = {}, className = '' }) => {
    // ─── Animation Variants ───
    const bodyVariants = {
        idle: { y: [0, -3, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
        sleeping: { y: [0, 2, 0], scaleY: [1, 0.95, 1], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } },
        focusing: { y: [0, -1, 0], transition: { repeat: Infinity, duration: 1, ease: "easeInOut" } },
        happy: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 0.5, ease: "easeOut" } },
        sad: { y: 2, scaleY: 0.95, transition: { duration: 0.5 } },
        'low-power': { y: [0, 1, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } },
        celebration: { y: [0, -15, 0], rotate: [0, -5, 5, 0], transition: { repeat: Infinity, duration: 0.4, ease: "easeOut" } }
    };

    const tailVariants = {
        idle: { rotate: [0, 10, -5, 0], originX: 0, originY: 1, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
        sleeping: { rotate: 20, originX: 0, originY: 1, transition: { duration: 1 } },
        focusing: { rotate: [0, 5, 0], originX: 0, originY: 1, transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
        happy: { rotate: [0, 30, -10, 0], originX: 0, originY: 1, transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" } },
        sad: { rotate: -20, originX: 0, originY: 1, transition: { duration: 0.5 } },
        'low-power': { rotate: [20, 25, 20], originX: 0, originY: 1, transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } },
        celebration: { rotate: [0, 45, -20, 0], originX: 0, originY: 1, transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" } }
    };

    const earVariants = {
        idle: { rotate: [0, 5, -2, 0], originX: 0.5, originY: 1, transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } },
        sleeping: { rotate: -15, originX: 0.5, originY: 1, transition: { duration: 1 } },
        focusing: { rotate: [0, 2, 0], originX: 0.5, originY: 1, transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" } },
        happy: { rotate: [0, 15, -5, 0], originX: 0.5, originY: 1, transition: { repeat: Infinity, duration: 0.6, ease: "easeInOut" } },
        sad: { rotate: -30, originX: 0.5, originY: 1, transition: { duration: 0.5 } },
        'low-power': { rotate: [-10, -12, -10], originX: 0.5, originY: 1, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
        celebration: { rotate: [0, 25, -15, 0], originX: 0.5, originY: 1, transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" } }
    };

    const eyeVariants = {
        idle: { scaleY: [1, 1, 0.1, 1, 1], transition: { repeat: Infinity, duration: 5, times: [0, 0.45, 0.5, 0.55, 1] } },
        sleeping: { scaleY: 0.1, transition: { duration: 0.5 } },
        focusing: { scaleY: [1, 0.9, 1], transition: { repeat: Infinity, duration: 2 } },
        happy: { scaleY: [1, 0.2, 1], transition: { repeat: Infinity, duration: 1.5 } },
        sad: { scaleY: 1, opacity: 0.8, transition: { duration: 0.5 } },
        'low-power': { scaleY: 0.4, opacity: 0.6, transition: { duration: 0.5 } },
        celebration: { scaleY: [1, 0.1, 1], transition: { repeat: Infinity, duration: 0.8 } }
    };

    const zzzVariants = {
        sleeping: { opacity: [0, 1, 0], y: [0, -15, -30], x: [0, 5, -5], transition: { repeat: Infinity, duration: 3, ease: "linear", delay: 0.5 } },
        hidden: { opacity: 0 }
    };

    const isHolo = equippedItems.skin === 'skin_holographic';

    // Matrix background — dark panel with raining green columns and glowing dots
    const matrixColumns = Array.from({ length: 8 }).map((_, i) => {
        const x = 6 + i * 12;
        const speed = 1.5 + (i % 3) * 0.8;
        return (
            <motion.line
                key={`col-${i}`}
                x1={x} y1="0"
                x2={x} y2="100"
                stroke="#00ff00"
                strokeWidth="1"
                strokeDasharray="3 6"
                initial={{ strokeDashoffset: 50 }}
                animate={{ strokeDashoffset: -50 }}
                transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
                opacity={0.4 + (i % 2) * 0.15}
            />
        );
    });

    // Horizontal grid lines
    const matrixRows = [20, 40, 60, 80].map((y, i) => (
        <line
            key={`row-${i}`}
            x1="0" y1={y} x2="100" y2={y}
            stroke="#00ff00"
            strokeWidth="0.3"
            opacity="0.15"
        />
    ));

    // Glowing dots that fall
    const matrixDots = Array.from({ length: 12 }).map((_, i) => {
        const x = 5 + ((i * 8) % 90);
        const delay = (i * 0.4) % 3;
        const size = 1 + (i % 3) * 0.5;
        return (
            <motion.circle
                key={`dot-${i}`}
                cx={x} r={size}
                fill="#00ff00"
                initial={{ cy: -5, opacity: 0.8 }}
                animate={{ cy: 105, opacity: [0.8, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 + (i % 4) * 0.5, ease: "linear", delay }}
                style={{ filter: 'drop-shadow(0 0 2px #00ff00)' }}
            />
        );
    });

    return (
        <svg
            viewBox="0 0 100 100"
            className={`w-full h-full drop-shadow-[0_10px_20px_rgba(255,123,0,0.15)] transition-all duration-1000 ${animState === 'low-power' ? 'grayscale opacity-75 drop-shadow-none' : ''} ${className}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="foxBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isHolo ? "#00f3ff" : "#ff7b00"} stopOpacity={isHolo ? 0.6 : 1} />
                    <stop offset="100%" stopColor={isHolo ? "#0066ff" : "#cc4400"} stopOpacity={isHolo ? 0.4 : 1} />
                </linearGradient>
                <linearGradient id="foxBelly" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isHolo ? "#e0ffff" : "#fffaf0"} stopOpacity={isHolo ? 0.8 : 1} />
                    <stop offset="100%" stopColor={isHolo ? "#b0e2ff" : "#e2d5c1"} stopOpacity={isHolo ? 0.6 : 1} />
                </linearGradient>
                <linearGradient id="cyberAccents" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f3ff" />
                    <stop offset="100%" stopColor="#0066ff" />
                </linearGradient>
            </defs>

            {/* Background Item */}
            {equippedItems.background === 'bg_matrix' && (
                <g className="matrix-bg">
                    {/* Dark backdrop */}
                    <rect x="0" y="0" width="100" height="100" rx="10" fill="#0a0a0a" opacity="0.6" />
                    {matrixRows}
                    {matrixColumns}
                    {matrixDots}
                </g>
            )}

            {/* ZZZ Particles (only show when sleeping) */}
            <motion.text
                x="60" y="30"
                fontFamily="sans-serif"
                fontSize="12"
                fontWeight="bold"
                fill="#00f3ff"
                variants={zzzVariants}
                initial="hidden"
                animate={animState === 'sleeping' ? 'sleeping' : 'hidden'}
            >
                Z
            </motion.text>
            <motion.text
                x="70" y="20"
                fontFamily="sans-serif"
                fontSize="8"
                fontWeight="bold"
                fill="#00f3ff"
                variants={zzzVariants}
                initial="hidden"
                animate={animState === 'sleeping' ? 'sleeping' : 'hidden'}
                style={{ animationDelay: '1s' }}
            >
                z
            </motion.text>

            <motion.g variants={bodyVariants} animate={animState} initial="idle">

                {/* Head Halo Item */}
                {equippedItems.head === 'head_halo' && (
                    <motion.ellipse
                        cx="50" cy="15" rx="15" ry="4"
                        fill="none" stroke="#fff" strokeWidth="1.5"
                        style={{ filter: 'drop-shadow(0 0 4px #00f3ff)' }}
                        animate={{ y: [-2, 2, -2], rotateX: [10, -10, 10] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        opacity={animState === 'sleeping' ? 0.2 : 0.8}
                    />
                )}

                {/* Tail */}
                <motion.g variants={tailVariants} animate={animState} initial="idle" style={{ transformOrigin: "20px 80px" }}>
                    <path d="M25 80 Q5 90 10 60 Q20 40 30 75 Z" fill="url(#foxBody)" />
                    <path d="M10 60 Q12 45 30 75 Q25 65 10 60 Z" fill={isHolo ? "none" : "#fffaf0"} stroke={isHolo ? "#00f3ff" : "none"} />
                </motion.g>

                {/* Body (Sitting silhouette) */}
                <path d="M30 85 C25 60 30 40 50 40 C70 40 75 60 70 85 C65 90 35 90 30 85 Z" fill="url(#foxBody)" />
                {/* Belly */}
                <path d="M40 85 C35 65 40 50 50 50 C60 50 65 65 60 85 C55 88 45 88 40 85 Z" fill="url(#foxBelly)" />

                {/* Level 10+ Cyber Plating */}
                {level >= 10 && !isHolo && (
                    <g opacity="0.8">
                        {/* Shoulder plates */}
                        <path d="M32 55 L38 48 L42 55 Z" fill="#2a2a35" stroke="url(#cyberAccents)" strokeWidth="1" />
                        <path d="M68 55 L62 48 L58 55 Z" fill="#2a2a35" stroke="url(#cyberAccents)" strokeWidth="1" />
                        {/* Chest core */}
                        <circle cx="50" cy="65" r="4" fill="#000" stroke="url(#cyberAccents)" strokeWidth="1.5" />
                        <circle cx="50" cy="65" r="2" fill="url(#cyberAccents)" opacity={animState === 'focusing' ? 1 : 0.5} />
                    </g>
                )}

                {/* Head Group */}
                <g>
                    {/* Ears */}
                    <motion.g variants={earVariants} animate={animState} initial="idle" style={{ transformOrigin: "35px 35px" }}>
                        <path d="M30 40 L25 15 L45 35 Z" fill="url(#foxBody)" />
                        <path d="M32 38 L28 20 L42 34 Z" fill={isHolo ? "none" : "#2a2a35"} stroke={isHolo ? "#00f3ff" : "none"} />
                        <path d="M32 38 L28 20 L42 34 Z" fill="url(#cyberAccents)" opacity={animState === 'focusing' ? 0.8 : 0.3} />
                    </motion.g>
                    <motion.g variants={earVariants} animate={animState} initial="idle" style={{ transformOrigin: "65px 35px" }}>
                        <path d="M70 40 L75 15 L55 35 Z" fill="url(#foxBody)" />
                        <path d="M68 38 L72 20 L58 34 Z" fill={isHolo ? "none" : "#2a2a35"} stroke={isHolo ? "#00f3ff" : "none"} />
                        <path d="M68 38 L72 20 L58 34 Z" fill="url(#cyberAccents)" opacity={animState === 'focusing' ? 0.8 : 0.3} />
                    </motion.g>

                    {/* Head Base */}
                    <path d="M25 35 C25 20 75 20 75 35 C85 55 50 65 50 65 C50 65 15 55 25 35 Z" fill="url(#foxBody)" />
                    {/* Snout Area */}
                    <path d="M35 45 C35 45 50 60 65 45 C75 55 50 65 50 65 C50 65 25 55 35 45 Z" fill="url(#foxBelly)" />
                    {/* Nose */}
                    <circle cx="50" cy="60" r="3" fill="#1a1a24" />

                    {/* Cyber Visor / Glasses */}
                    {equippedItems.visor === 'visor_neon_pink' ? (
                        <g>
                            <path d="M28 40 C28 34 72 34 72 40 C72 48 62 50 50 50 C38 50 28 48 28 40 Z" fill="#ff00ff" opacity="0.6" style={{ filter: 'drop-shadow(0 0 5px #ff00ff)' }} />
                            <path d="M32 40 Q40 38 48 40 L45 42 Q38 40 34 42 Z" fill="white" opacity="0.8" />
                        </g>
                    ) : equippedItems.visor === 'visor_gold' ? (
                        <g>
                            <path d="M30 40 C30 35 70 35 70 40 C70 45 60 48 50 48 C40 48 30 45 30 40 Z" fill="#ffd700" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }} />
                            <path d="M35 42 Q40 44 45 42" stroke="#000" strokeWidth="1" fill="none" opacity="0.5" />
                            <path d="M55 42 Q60 44 65 42" stroke="#000" strokeWidth="1" fill="none" opacity="0.5" />
                        </g>
                    ) : level >= 10 && !isHolo ? (
                        <g>
                            {/* Upgraded Cyber Visor */}
                            <path d="M28 40 C28 34 72 34 72 40 C72 48 62 54 50 54 C38 54 28 48 28 40 Z" fill="#0b0b14" opacity="0.9" />
                            <path d="M30 42 C30 38 70 38 70 42 C70 48 60 52 50 52 C40 52 30 48 30 42 Z" fill="url(#cyberAccents)" opacity="0.4" />
                            <path d="M32 40 Q40 38 48 40 L45 42 Q38 40 34 42 Z" fill="white" opacity="0.5" />
                        </g>
                    ) : !isHolo ? (
                        <path d="M30 42 C30 38 70 38 70 42 C70 48 60 52 50 52 C40 52 30 48 30 42 Z" fill="#1a1a24" opacity="0.8" />
                    ) : null}

                    {/* Dynamic Scanner Anim over Visor */}
                    {(!equippedItems.visor && level < 10 && !isHolo) && (
                        <motion.path
                            d="M32 43 C32 40 68 40 68 43 C68 47 60 50 50 50 C40 50 32 47 32 43 Z"
                            fill="url(#cyberAccents)"
                            animate={{ opacity: animState === 'focusing' ? [0.6, 1, 0.6] : 0 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                    )}

                    {/* Eyes - Handled naturally even with visors */}
                    <motion.g variants={eyeVariants} animate={animState} initial="idle" style={{ transformOrigin: "50px 45px" }}>
                        <ellipse cx="40" cy="45" rx="3" ry="4" fill="#00f3ff" />
                        <ellipse cx="60" cy="45" rx="3" ry="4" fill="#00f3ff" />
                        {/* Eye reflections */}
                        <circle cx="41" cy="44" r="1" fill="white" />
                        <circle cx="61" cy="44" r="1" fill="white" />
                    </motion.g>
                </g>

                {/* Floating Holographic Ring (Only visible during focusing) */}
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: animState === 'focusing' ? [0, 0.5, 0] : 0,
                        scale: animState === 'focusing' ? [0.8, 1.2, 1.5] : 0.8
                    }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                >
                    <ellipse cx="50" cy="80" rx="40" ry="10" fill="none" stroke="url(#cyberAccents)" strokeWidth="2" style={{ filter: 'blur(2px)' }} />
                </motion.g>
            </motion.g>
        </svg>
    );
};
