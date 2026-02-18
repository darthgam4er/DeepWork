import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<'div'> {
    children?: ReactNode
    startColor?: string
    endColor?: string
    glowOpacity?: number
    animate?: any // allow framer motion animate prop
}

export function GlassCard({
    children,
    className,
    startColor = 'rgba(255, 255, 255, 0.05)',
    endColor = 'rgba(255, 255, 255, 0.01)',
    glowOpacity = 0.5,
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl",
                "bg-gradient-to-br from-[var(--glass-start)] to-[var(--glass-end)]",
                className
            )}
            style={{
                '--glass-start': startColor,
                '--glass-end': endColor,
            } as React.CSSProperties}
            {...props}
        >
            {/* Inner Glow / Noise Texture Overlay (Optional) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-noise" />

            {/* Top Shine */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Ambient Background Glow */}
            <div
                className="absolute -inset-1/2 blur-3xl opacity-20 pointer-events-none radial-gradient-glow"
                style={{ background: `radial-gradient(circle, var(--primary) 0%, transparent 70%)`, opacity: glowOpacity * 0.2 }}
            />
        </motion.div>
    )
}
