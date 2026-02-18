import { motion } from 'framer-motion'
import { pageVariants } from '@/lib/animations'

interface PageTransitionProps {
    children: React.ReactNode
    pageKey: string
}

export function PageTransition({ children, pageKey }: PageTransitionProps) {
    return (
        <motion.div
            key={pageKey}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
        >
            {children}
        </motion.div>
    )
}
