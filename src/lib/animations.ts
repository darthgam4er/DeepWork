import type { Variants, Transition } from 'framer-motion'

// ─── Spring Configs ───
export const springBouncy: Transition = { type: 'spring', stiffness: 400, damping: 17 }
export const springSmooth: Transition = { type: 'spring', stiffness: 300, damping: 30 }
export const springStiff: Transition = { type: 'spring', stiffness: 500, damping: 30 }

// ─── Page Transition ───
export const pageVariants: Variants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.2, ease: 'easeIn' } },
}

// ─── Stagger Container ───
export const staggerContainer: Variants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

export const staggerContainerFast: Variants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.04 } },
}

// ─── Stagger Item ───
export const staggerItem: Variants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

export const staggerItemScale: Variants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { ...springBouncy } },
}

// ─── Fade In ───
export const fadeIn: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

// ─── Slide Up ───
export const slideUp: Variants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

// ─── Scale In (for modals) ───
export const scaleIn: Variants = {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1, transition: springBouncy },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

// ─── Hover Lift ───
export const hoverLift = {
    whileHover: { y: -3, transition: springSmooth },
    whileTap: { scale: 0.97, transition: springStiff },
}

// ─── Button Press ───
export const buttonPress = {
    whileHover: { scale: 1.04, transition: springBouncy },
    whileTap: { scale: 0.93, transition: springStiff },
}

// ─── Card Hover ───
export const cardHover = {
    whileHover: { y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', transition: springSmooth },
    whileTap: { scale: 0.98, transition: springStiff },
}

// ─── Modal Backdrop ───
export const backdropVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

// ─── Nav Indicator ───
export const navIndicator = {
    layoutId: 'nav-indicator',
    transition: springBouncy,
}

// ─── Counter Animation Helper ───
export function useAnimatedCounter(target: number, duration = 600): number {
    // This is a pure function helper - actual hook is in the component
    return target
}

// ─── Confetti Colors ───
export const confettiColors = [
    'hsl(var(--primary))',
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
]
