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
                    "flex-1 flex flex-col relative overflow-hidden transition-all duration-500",
                    isRetro
                        ? "border border-[hsl(var(--border))] bg-[hsl(var(--card))] pipboy-border"
                        : "card-panel group hover:shadow-xl hover:shadow-black/5"
                )}
            >
                {/* Glow Effects */}
                {!isRetro && (
                    <>
                        <div className="absolute -left-32 -top-32 w-64 h-64 rounded-full bg-primary/20 blur-[60px] opacity-40 transition-all duration-700 group-hover:opacity-60 group-hover:scale-110 pointer-events-none" />
                        <div className="absolute -right-32 -bottom-32 w-64 h-64 rounded-full bg-primary/10 blur-[60px] opacity-30 transition-all duration-700 group-hover:opacity-50 group-hover:scale-110 pointer-events-none" />
                    </>
                )}

                {/* Top Bar */}
                <div className="flex items-center justify-between p-5 md:p-6 shrink-0 relative z-10">
                    <div className="flex items-center gap-2">
                        {isRetro ? (
                            <Radio className="w-4 h-4 text-primary" />
                        ) : (
                            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shadow-sm backdrop-blur-sm">
                                <Target className="w-4 h-4 drop-shadow-sm" />
                            </div>
                        )}
                        <span className="text-xs md:text-sm font-bold text-foreground tracking-tight">
                            Round {sessionInCycle + (timer.mode === 'work' ? 1 : 0)} <span className="text-muted-foreground opacity-60 mx-1">/</span> {settings.sessionsBeforeLongBreak}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={() => window.electronAPI?.openMini()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={springBouncy}
                            className="glass-button p-2.5 rounded-xl border border-border/50 bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shadow-sm"
                            title="Mini Mode"
                            aria-label="Enter Mini Mode"
                        >
                            <PictureInPicture2 className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Center: Ring + Time + Controls */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-6 relative z-10">

                    {/* Mode Tabs */}
                    <div className="flex p-1 bg-secondary/60 backdrop-blur-md rounded-xl md:rounded-2xl mb-6 relative border border-black/5 dark:border-white/5 shadow-inner">
                        {(['work', 'shortBreak', 'longBreak'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => timer.status === 'idle' && useAppStore.getState().setMode(mode)}
                                disabled={timer.status !== 'idle'}
                                className={cn(
                                    'px-5 py-2 text-xs md:text-sm font-bold tracking-tight rounded-lg md:rounded-xl transition-all relative z-10',
                                    timer.mode === mode
                                        ? 'text-foreground drop-shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                    timer.status !== 'idle' && 'opacity-40 cursor-not-allowed'
                                )}
                            >
                                {timer.mode === mode && (
                                    <motion.div
                                        layoutId="timer-mode-pill"
                                        className="absolute inset-0 bg-background rounded-lg md:rounded-xl shadow-md border border-border/50"
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
                    <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] flex items-center justify-center drop-shadow-2xl">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-md" viewBox="0 0 280 280">
                            <circle
                                cx="140" cy="140" r={ringRadius}
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth={isRetro ? "2" : "12"}
                                className="opacity-20"
                            />
                            {/* Glow layer for stroke */}
                            {!isRetro && (
                                <motion.circle
                                    cx="140" cy="140" r={ringRadius}
                                    fill="none"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-1000 ease-linear opacity-30"
                                    style={{ filter: 'blur(6px)' }}
                                />
                            )}
                            {/* Real stroke */}
                            <motion.circle
                                cx="140" cy="140" r={ringRadius}
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth={isRetro ? "4" : "12"}
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
                                className="absolute w-[240px] h-[240px] md:w-[280px] md:h-[280px] animate-cosmic-pulse rounded-full z-0"
                                style={{
                                    backgroundColor: 'hsl(var(--primary) / 0.08)',
                                    boxShadow: '0 0 40px hsl(var(--primary) / 0.2)',
                                    pointerEvents: 'none'
                                }}
                            />
                        )}

                        {/* Time Display */}
                        <div className="text-center z-10 flex flex-col items-center">
                            <p className={cn(
                                "text-6xl md:text-7xl tabular-nums leading-none",
                                isRetro
                                    ? "font-mono glow-text text-foreground"
                                    : isDeadpool
                                        ? "font-black tracking-wide text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                        : "font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent drop-shadow-sm"
                            )}>
                                {formatTime(timer.remaining)}
                            </p>
                            <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-primary mt-3 md:mt-4 font-bold drop-shadow-sm">
                                {modeLabel}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-5 mt-6 md:mt-8">
                        <motion.button
                            onClick={resetTimer}
                            whileHover={{ scale: 1.1, rotate: -90 }}
                            whileTap={{ scale: 0.85 }}
                            transition={springBouncy}
                            className={cn(
                                "p-3.5 xl:p-4 text-muted-foreground hover:text-foreground transition-all",
                                isRetro ? "border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]" : "glass-button rounded-2xl bg-secondary/50 border border-border/50 shadow-sm"
                            )}
                            title="Reset"
                            aria-label="Reset Timer"
                        >
                            <RotateCcw className="w-5 h-5 drop-shadow-sm" />
                        </motion.button>

                        <motion.button
                            onClick={() => {
                                if (timer.status === 'idle') startTimer()
                                else if (timer.status === 'running') pauseTimer()
                                else resumeTimer()
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={springBouncy}
                            className={cn(
                                "w-20 h-20 md:w-24 md:h-24 flex items-center justify-center transition-all shadow-xl group",
                                isRetro ? "border-2 border-primary glow-primary shadow-[0_0_15px_hsl(var(--primary))]" : "rounded-full relative",
                                timer.status === 'running'
                                    ? "bg-secondary/40 text-foreground border border-border/50 backdrop-blur-md hover:bg-secondary/60"
                                    : "bg-gradient-to-br from-primary to-primary/80 border border-primary/20 text-primary-foreground shadow-[0_8px_32px_-8px_rgba(var(--primary),0.5)] hover:shadow-[0_12px_40px_-8px_rgba(var(--primary),0.6)]"
                            )}
                            aria-label={timer.status === 'running' ? "Pause Timer" : "Start Timer"}
                            title={timer.status === 'running' ? "Pause" : "Start"}
                        >
                            {!isRetro && timer.status !== 'running' && (
                                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            <AnimatePresence mode="wait">
                                {timer.status === 'running' ? (
                                    <motion.div key="pause" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={springBouncy} className="relative z-10">
                                        <Pause className="w-8 h-8 md:w-10 md:h-10 drop-shadow-sm" fill="currentColor" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="play" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }} transition={springBouncy} className="relative z-10">
                                        <Play className="w-8 h-8 md:w-10 md:h-10 ml-1.5 drop-shadow-sm" fill="currentColor" />
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
                                "p-3.5 xl:p-4 text-muted-foreground hover:text-foreground transition-all",
                                isRetro ? "border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]" : "glass-button rounded-2xl bg-secondary/50 border border-border/50 shadow-sm"
                            )}
                            title="Skip"
                            aria-label="Skip to next session"
                        >
                            <SkipForward className="w-5 h-5 drop-shadow-sm" />
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
            <aside className="hidden lg:flex flex-col gap-4 w-[280px] shrink-0">
                {/* Active Task Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        "flex-1 p-6 flex flex-col min-h-0 transition-all duration-500 hover:shadow-xl",
                        isRetro ? "pipboy-border bg-[hsl(var(--card))]" : "card-panel relative overflow-hidden"
                    )}
                >
                    {!isRetro && <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-[40px] opacity-50 pointer-events-none" />}
                    <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
                        <div className={cn("p-1.5 rounded-lg text-primary shadow-sm backdrop-blur-sm", isRetro ? "" : "bg-primary/10 border border-primary/20")}>
                            <Target className="w-4 h-4 drop-shadow-sm" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight">
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
                        "p-6 shrink-0 transition-all duration-500 hover:shadow-xl",
                        isRetro ? "pipboy-border bg-[hsl(var(--card))]" : "card-panel relative overflow-hidden"
                    )}
                >
                    {!isRetro && <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-blue-500/10 blur-[30px] opacity-40 pointer-events-none" />}

                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className={cn("p-1.5 rounded-lg text-blue-500 shadow-sm backdrop-blur-sm", isRetro ? "" : "bg-blue-500/10 border border-blue-500/20")}>
                            <BrainCircuit className="w-4 h-4 drop-shadow-sm" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight">Cycle Progress</h3>
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
