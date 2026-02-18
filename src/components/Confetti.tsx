import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Particle {
    id: number
    x: number
    y: number
    color: string
    rotation: number
    scale: number
    vx: number
    vy: number
    shape: 'circle' | 'square' | 'star'
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9A9E', '#A8E6CF']

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min
}

interface ConfettiProps {
    trigger: boolean
    onComplete?: () => void
    particleCount?: number
    duration?: number
}

export function Confetti({ trigger, onComplete, particleCount = 40, duration = 2000 }: ConfettiProps) {
    const [particles, setParticles] = useState<Particle[]>([])

    const burst = useCallback(() => {
        const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
            id: Date.now() + i,
            x: 50 + randomBetween(-10, 10),
            y: 50,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: randomBetween(0, 360),
            scale: randomBetween(0.5, 1.2),
            vx: randomBetween(-40, 40),
            vy: randomBetween(-60, -20),
            shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
        }))
        setParticles(newParticles)
        setTimeout(() => {
            setParticles([])
            onComplete?.()
        }, duration)
    }, [particleCount, duration, onComplete])

    useEffect(() => {
        if (trigger) burst()
    }, [trigger, burst])

    return (
        <AnimatePresence>
            {particles.length > 0 && (
                <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                scale: 0,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                left: `${p.x + p.vx}%`,
                                top: `${p.y + p.vy + 80}%`,
                                scale: p.scale,
                                rotate: p.rotation + randomBetween(180, 720),
                                opacity: 0,
                            }}
                            transition={{ duration: duration / 1000, ease: 'easeOut' }}
                            className="absolute"
                            style={{ width: 8, height: 8 }}
                        >
                            {p.shape === 'circle' && (
                                <div className="w-full h-full rounded-full" style={{ background: p.color }} />
                            )}
                            {p.shape === 'square' && (
                                <div className="w-full h-full rounded-sm" style={{ background: p.color }} />
                            )}
                            {p.shape === 'star' && (
                                <div className="w-full h-full" style={{ color: p.color, fontSize: 10 }}>✦</div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    )
}

// Celebration pulse ring effect
export function CelebrationPulse({ trigger }: { trigger: boolean }) {
    return (
        <AnimatePresence>
            {trigger && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 3, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center"
                >
                    <div className="w-32 h-32 rounded-full border-4 border-[hsl(var(--primary))]" />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
