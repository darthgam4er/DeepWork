import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LiquidProgressProps {
    value: number // 0 to 100
    max: number
    size?: number
    strokeWidth?: number
    color?: string
}

export function LiquidProgress({
    value,
    max,
    size = 280,
    strokeWidth = 12,
    color = 'hsl(var(--primary))'
}: LiquidProgressProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const progress = Math.min(Math.max(value / max, 0), 1)
    const dashOffset = circumference - progress * circumference

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* Outer Glow Ring (Static) */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse-slow"
                style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
            />

            {/* SVG Ring */}
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="rotate-[-90deg] drop-shadow-2xl"
            >
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="opacity-[0.1]"
                />

                {/* Progress */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{
                        duration: 1,
                        ease: [0.16, 1, 0.3, 1] // Spring-like ease
                    }}
                    className="shadow-[0_0_20px_var(--primary)]"
                />
            </svg>

            {/* Inner "Liquid" Simulation using layered shadows/blurs if wanted, 
                but for now keeping it clean and "Command Center" style with just the ring */}
        </div>
    )
}
