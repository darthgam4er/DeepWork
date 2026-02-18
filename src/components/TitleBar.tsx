import { Minus, Square, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { formatTime, cn } from '@/lib/utils'
import { springBouncy } from '@/lib/animations'

export function TitleBar() {
    const timer = useAppStore((s) => s.timer)
    const settings = useAppStore((s) => s.settings)
    const themes = useAppStore((s) => s.themes)
    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isRetro = activeTheme?.style === 'retro'
    const isDeadpool = activeTheme?.style === 'deadpool'

    const handleMinimize = () => window.electronAPI?.minimize()
    const handleMaximize = () => window.electronAPI?.maximize()
    const handleClose = () => window.electronAPI?.close()

    return (
        <header className="drag-region flex items-center justify-between h-10 px-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {isRetro ? (
                        <>
                            <div className="w-1.5 h-1.5 bg-[hsl(var(--primary))] animate-terminal-blink" />
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--muted-foreground))]">
                                VAULT-TEC
                            </span>
                            <span className="text-[10px] text-[hsl(var(--border))]">//</span>
                            <span className="text-[10px] tracking-[0.15em] uppercase text-[hsl(var(--foreground))] glow-text">
                                DEEPWORK
                            </span>
                        </>
                    ) : isDeadpool ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce-slow" />
                            <span className="text-xs font-bold tracking-wider text-[hsl(var(--foreground))] uppercase" style={{ fontFamily: 'Bangers' }}>
                                DEADPOOL'S POMO
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                            <span className="text-xs font-semibold tracking-wider text-[hsl(var(--foreground))]">
                                DeepWork
                            </span>
                        </>
                    )}
                </div>
                <AnimatePresence>
                    {timer.status === 'running' && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8, x: -8 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -8 }}
                            transition={springBouncy}
                            className={cn(
                                "text-xs font-mono text-[hsl(var(--primary))] px-2 py-0.5 border",
                                isRetro ? "border-[hsl(var(--border))] glow-text" : "rounded-full bg-[hsl(var(--primary)_/_0.1)] border-[hsl(var(--primary)_/_0.2)]"
                            )}
                        >
                            ⏱ {formatTime(timer.remaining)}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div className="no-drag flex items-center gap-0.5">
                <motion.button
                    onClick={handleMinimize}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[hsl(var(--secondary))] transition-colors"
                    aria-label="Minimize"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Minus className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                </motion.button>
                <motion.button
                    onClick={handleMaximize}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[hsl(var(--secondary))] transition-colors"
                    aria-label="Maximize"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Square className="w-2.5 h-2.5 text-[hsl(var(--muted-foreground))]" />
                </motion.button>
                <motion.button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 transition-colors group"
                    aria-label="Close"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X className="w-3 h-3 text-[hsl(var(--muted-foreground))] group-hover:text-red-400" />
                </motion.button>
            </div>
        </header>
    )
}
