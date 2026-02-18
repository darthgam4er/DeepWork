import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { formatTime, cn } from '@/lib/utils'
import { Play, Pause, RotateCcw, SkipForward, Target, Radio, BrainCircuit, PictureInPicture2 } from 'lucide-react'
import { springBouncy } from '@/lib/animations'
import { Confetti, CelebrationPulse } from '@/components/Confetti'

export function Timer() {
    const timer = useAppStore((s) => s.timer)
    const settings = useAppStore((s) => s.settings)
    const tasks = useAppStore((s) => s.tasks)
    const activeTaskId = useAppStore((s) => s.activeTaskId)
    const setActiveTask = useAppStore((s) => s.setActiveTask)
    const startTimer = useAppStore((s) => s.startTimer)
    const pauseTimer = useAppStore((s) => s.pauseTimer)
    const resumeTimer = useAppStore((s) => s.resumeTimer)
    const resetTimer = useAppStore((s) => s.resetTimer)
    const skipToNext = useAppStore((s) => s.skipToNext)

    const themes = useAppStore((s) => s.themes)
    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isRetro = activeTheme?.style === 'retro'
    const isDeadpool = activeTheme?.style === 'deadpool'

    const [showCelebration, setShowCelebration] = useState(false)
    const [prevSessionCount, setPrevSessionCount] = useState(timer.sessionCount)

    useEffect(() => {
        if (timer.sessionCount > prevSessionCount) {
            setShowCelebration(true)
            setPrevSessionCount(timer.sessionCount)
        }
    }, [timer.sessionCount, prevSessionCount])

    useEffect(() => {
        const removeListener = window.electronAPI?.onToggleTimer(() => {
            const { status } = useAppStore.getState().timer
            if (status === 'idle') startTimer()
            else if (status === 'running') pauseTimer()
            else if (status === 'paused') resumeTimer()
        })
        return () => removeListener?.()
    }, [])

    const progress = timer.totalDuration > 0 ? 1 - timer.remaining / timer.totalDuration : 0
    const ringRadius = 120
    const circumference = 2 * Math.PI * ringRadius
    const strokeDashoffset = circumference * (1 - progress)

    const modeLabel = isRetro
        ? (timer.mode === 'shortBreak' ? 'SHORT BREAK' : timer.mode === 'longBreak' ? 'LONG BREAK' : 'FOCUS MODE')
        : isDeadpool
            ? (timer.mode === 'shortBreak' ? 'TACO BREAK' : timer.mode === 'longBreak' ? 'CHIMICHANGA TIME' : 'MAXIMUM EFFORT')
            : (timer.mode === 'shortBreak' ? 'Short Break' : timer.mode === 'longBreak' ? 'Long Break' : 'Focus Session')

    const activeTasks = tasks.filter((t) => t.status !== 'done')
    const activeTask = tasks.find((t) => t.id === activeTaskId)
    const sessionInCycle = timer.sessionCount % settings.sessionsBeforeLongBreak

    return (
        <div className="h-full w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-5">
            <Confetti trigger={showCelebration} onComplete={() => setShowCelebration(false)} />
            <CelebrationPulse trigger={showCelebration} />

            {/* Main Timer Area */}
            <motion.section
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "flex-1 flex flex-col relative overflow-hidden",
                    isRetro
                        ? "border border-[hsl(var(--border))] bg-[hsl(var(--card))] pipboy-border"
                        : "border border-[hsl(var(--border))] bg-[hsl(var(--card))] rounded-2xl"
                )}
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between p-4 shrink-0">
                    <div className="flex items-center gap-2">
                        {isRetro && <Radio className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />}
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            Round {sessionInCycle + (timer.mode === 'work' ? 1 : 0)} of {settings.sessionsBeforeLongBreak}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={() => window.electronAPI?.openMini()}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            transition={springBouncy}
                            className="p-2 border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors rounded-lg"
                            title="Mini Mode"
                        >
                            <PictureInPicture2 className="w-3.5 h-3.5" />
                        </motion.button>
                    </div>
                </div>

                {/* Center: Ring + Time + Controls */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-4">

                    {/* Mode Tabs */}
                    <div className="flex p-1 bg-[hsl(var(--secondary)_/_0.5)] rounded-xl mb-4 relative">
                        {(['work', 'shortBreak', 'longBreak'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => timer.status === 'idle' && useAppStore.getState().setMode(mode)}
                                disabled={timer.status !== 'idle'}
                                className={cn(
                                    'px-4 py-1.5 text-[11px] font-medium rounded-lg transition-all relative z-10',
                                    timer.mode === mode
                                        ? 'text-[hsl(var(--foreground))]'
                                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
                                    timer.status !== 'idle' && 'opacity-40 cursor-not-allowed'
                                )}
                            >
                                {timer.mode === mode && (
                                    <motion.div
                                        layoutId="timer-mode-pill"
                                        className="absolute inset-0 bg-[hsl(var(--background))] rounded-lg shadow-sm"
                                        transition={springBouncy}
                                    />
                                )}
                                <span className="relative z-10">
                                    {mode === 'work' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Timer Ring */}
                    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
                            <circle
                                cx="140" cy="140" r={ringRadius}
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth={isRetro ? "2" : "8"}
                                className="opacity-20"
                            />
                            <motion.circle
                                cx="140" cy="140" r={ringRadius}
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth={isRetro ? "4" : "8"}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-linear"
                                style={{
                                    filter: isRetro ? 'drop-shadow(0 0 10px hsl(var(--primary)))' : 'none',
                                }}
                            />
                        </svg>

                        {/* Pulse when running */}
                        {timer.status === 'running' && (
                            <div
                                className="absolute w-[240px] h-[240px] animate-cosmic-pulse rounded-full z-0"
                                style={{
                                    backgroundColor: 'hsl(var(--primary) / 0.06)',
                                    boxShadow: '0 0 30px hsl(var(--primary) / 0.15)',
                                    pointerEvents: 'none'
                                }}
                            />
                        )}

                        {/* Time Display */}
                        <div className="text-center z-10">
                            <p className={cn(
                                "text-5xl text-[hsl(var(--foreground))] tabular-nums leading-none",
                                isRetro ? "font-mono glow-text" : "font-bold tracking-tight"
                            )}>
                                {formatTime(timer.remaining)}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--primary))] mt-2 font-medium">
                                {modeLabel}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 mt-4">
                        <motion.button
                            onClick={resetTimer}
                            whileHover={{ scale: 1.1, rotate: -90 }}
                            whileTap={{ scale: 0.85 }}
                            transition={springBouncy}
                            className={cn(
                                "p-3 border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors",
                                isRetro ? "" : "rounded-xl"
                            )}
                            title="Reset"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                            onClick={() => {
                                if (timer.status === 'idle') startTimer()
                                else if (timer.status === 'running') pauseTimer()
                                else resumeTimer()
                            }}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.92 }}
                            transition={springBouncy}
                            className={cn(
                                "w-16 h-16 flex items-center justify-center transition-all shadow-lg",
                                isRetro ? "border-2 border-[hsl(var(--primary))] glow-primary" : "rounded-2xl",
                                timer.status === 'running'
                                    ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
                                    : "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--primary)_/_0.3)]"
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {timer.status === 'running' ? (
                                    <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={springBouncy}>
                                        <Pause className="w-6 h-6" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={springBouncy}>
                                        <Play className="w-6 h-6 ml-0.5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <motion.button
                            onClick={skipToNext}
                            whileHover={{ scale: 1.1, x: 3 }}
                            whileTap={{ scale: 0.85 }}
                            transition={springBouncy}
                            className={cn(
                                "p-3 border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors",
                                isRetro ? "" : "rounded-xl"
                            )}
                            title="Skip"
                        >
                            <SkipForward className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {/* Cycle Dots */}
                    <div className="flex items-center gap-2 mt-4">
                        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ ...springBouncy, delay: i * 0.05 }}
                                className={cn(
                                    'w-2 h-2 rounded-full transition-colors',
                                    i < sessionInCycle
                                        ? 'bg-[hsl(var(--primary))] shadow-[0_0_6px_hsl(var(--primary)_/_0.5)]'
                                        : 'bg-[hsl(var(--muted))]'
                                )}
                            />
                        ))}
                    </div>

                    {/* Task Selector */}
                    <div className="mt-4 flex items-center gap-2 px-4 py-2 border border-[hsl(var(--border))] bg-[hsl(var(--secondary)_/_0.5)] rounded-xl max-w-[280px]">
                        <Target className="w-3.5 h-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <select
                            value={activeTaskId ?? ''}
                            onChange={(e) => setActiveTask(e.target.value || null)}
                            className="bg-transparent border-none text-xs text-[hsl(var(--foreground))] focus:ring-0 cursor-pointer flex-1 outline-none truncate"
                        >
                            <option value="" className="bg-[hsl(var(--card))]">Select a task...</option>
                            {activeTasks.map((t) => (
                                <option key={t.id} value={t.id} className="bg-[hsl(var(--card))]">{t.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </motion.section>

            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col gap-3 w-[260px] shrink-0">
                {/* Active Task Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        "flex-1 border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col min-h-0",
                        isRetro ? "pipboy-border" : "rounded-2xl"
                    )}
                >
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <h3 className="text-xs font-semibold text-[hsl(var(--foreground))]">
                            {isRetro ? 'ACTIVE QUEST' : 'Current Task'}
                        </h3>
                    </div>

                    {activeTask ? (
                        <div className="flex-1 flex flex-col justify-center gap-4 overflow-y-auto">
                            <div>
                                <h4 className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-2">{activeTask.title}</h4>
                                <span className={cn(
                                    "inline-flex mt-2 px-2 py-0.5 text-[9px] uppercase tracking-wider rounded-full border font-medium",
                                    activeTask.priority === 'high' ? "border-red-500/30 text-red-400 bg-red-500/10" :
                                        activeTask.priority === 'medium' ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                                            "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                )}>
                                    {activeTask.priority}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
                                    <span>Progress</span>
                                    <span className="font-mono">{Math.round((activeTask.completedPomodoros / Math.max(1, activeTask.estimatedPomodoros)) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-[hsl(var(--secondary))] overflow-hidden rounded-full">
                                    <motion.div
                                        className="h-full bg-[hsl(var(--primary))] rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (activeTask.completedPomodoros / Math.max(1, activeTask.estimatedPomodoros)) * 100)}%` }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </div>
                                <p className="text-center text-[10px] text-[hsl(var(--muted-foreground))]">
                                    {activeTask.completedPomodoros} of {activeTask.estimatedPomodoros} sessions
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                            <Target className="w-6 h-6 mb-2 text-[hsl(var(--muted-foreground))]" />
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">No task selected</p>
                        </div>
                    )}
                </motion.div>

                {/* Cycle Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn(
                        "border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shrink-0",
                        isRetro ? "pipboy-border" : "rounded-2xl"
                    )}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <BrainCircuit className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <h3 className="text-xs font-semibold text-[hsl(var(--foreground))]">Cycle Progress</h3>
                    </div>

                    <div className="flex items-baseline gap-1 mb-3">
                        <span className={cn(
                            "text-3xl text-[hsl(var(--foreground))]",
                            isRetro ? "font-mono glow-text" : "font-bold"
                        )}>
                            {sessionInCycle}
                        </span>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                            / {settings.sessionsBeforeLongBreak}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 h-8">
                        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ ...springBouncy, delay: i * 0.08 }}
                                className={cn(
                                    isRetro ? 'rounded-sm' : 'rounded-lg',
                                    i < sessionInCycle
                                        ? 'bg-[hsl(var(--primary))] shadow-[0_0_6px_hsl(var(--primary)_/_0.4)]'
                                        : 'bg-[hsl(var(--secondary))]'
                                )}
                            />
                        ))}
                    </div>
                </motion.div>
            </aside>
        </div>
    )
}
