import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { formatTime, formatDuration, cn } from '@/lib/utils'
import { Flame, Target, Clock, CheckCircle2, Play, ChevronRight, Radio, ArrowRight, Zap, TrendingUp, Sparkles } from 'lucide-react'
import { PetCompanion } from '@/components/pet/PetCompanion'
import { springBouncy, staggerContainer, staggerItem } from '@/lib/animations'

type Page = 'dashboard' | 'timer' | 'tasks' | 'analytics' | 'themes' | 'settings' | 'schedule'

interface DashboardProps {
    onNavigate: (page: Page) => void
}

function getGreeting(): string {
    const h = new Date().getHours()
    if (h < 5) return 'Good late night'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

export function Dashboard({ onNavigate }: DashboardProps) {
    const timer = useAppStore((s) => s.timer)
    const tasks = useAppStore((s) => s.tasks)
    const sessions = useAppStore((s) => s.sessions)
    const settings = useAppStore((s) => s.settings)
    const themes = useAppStore((s) => s.themes)
    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isRetro = activeTheme?.style === 'retro'
    const isDeadpool = activeTheme?.style === 'deadpool'
    const activeTaskId = useAppStore((s) => s.activeTaskId)
    const startTimer = useAppStore((s) => s.startTimer)

    const today = new Date().toISOString().split('T')[0]
    const todaySessions = sessions.filter(
        (s) => s.type === 'work' && s.completed && s.startedAt.startsWith(today)
    )
    const todayMinutes = Math.round(todaySessions.reduce((acc, s) => acc + s.elapsed, 0) / 60)
    const todaySessionCount = todaySessions.length

    const streak = useMemo(() => {
        let count = 0
        const d = new Date()
        for (let i = 0; i < 365; i++) {
            const dateStr = d.toISOString().split('T')[0]
            const has = sessions.some(s => s.type === 'work' && s.completed && s.startedAt.startsWith(dateStr))
            if (has) { count++; d.setDate(d.getDate() - 1) }
            else if (i === 0) { d.setDate(d.getDate() - 1) }
            else break
        }
        return count
    }, [sessions])

    // Last 7 days mini sparkline data
    const last7 = useMemo(() => {
        const days: number[] = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            const mins = Math.round(sessions.filter(s => s.type === 'work' && s.completed && s.startedAt.startsWith(dateStr)).reduce((a, s) => a + s.elapsed, 0) / 60)
            days.push(mins)
        }
        return days
    }, [sessions])

    const activeTasks = tasks.filter((t) => t.status !== 'done')
    const completedToday = tasks.filter(
        (t) => t.status === 'done' && t.completedAt?.startsWith(today)
    ).length
    const activeTask = tasks.find((t) => t.id === activeTaskId) ?? activeTasks[0]

    const progress = timer.totalDuration > 0 ? 1 - timer.remaining / timer.totalDuration : 0
    const ringRadius = 70
    const circumference = 2 * Math.PI * ringRadius
    const strokeDashoffset = circumference * (1 - progress)
    const sessionInCycle = timer.sessionCount % settings.sessionsBeforeLongBreak
    const modeLabel = timer.mode === 'shortBreak' ? 'Short Break' : timer.mode === 'longBreak' ? 'Long Break' : 'Focus'

    const max7 = Math.max(...last7, 1)

    // Base card styling for premium look
    const cardBaseClasses = cn(
        "relative overflow-hidden border border-[hsl(var(--border)_/_0.6)] bg-[hsl(var(--card)_/_0.6)] backdrop-blur-xl transition-all duration-300",
        isRetro ? "pipboy-border" : "rounded-3xl shadow-sm hover:shadow-md hover:border-[hsl(var(--primary)_/_0.3)]"
    )

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="h-full w-full max-w-6xl mx-auto space-y-6 pb-6"
        >
            {/* Greeting Row */}
            <motion.div variants={staggerItem} className="flex items-end justify-between px-2">
                <div>
                    {isRetro ? (
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] flex items-center gap-2 mb-1">
                                <Radio className="w-3 h-3 animate-pulse" /> Signal Acquired
                            </span>
                            <h1 className="text-2xl glow-text tracking-wider">COMMAND CENTER</h1>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute -inset-1 blur-2xl opacity-20 bg-gradient-to-r from-[hsl(var(--primary))] to-transparent -z-10 rounded-full" />
                            <h1 className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                                {getGreeting()} <Sparkles className="w-6 h-6 text-[hsl(var(--primary))] animate-pulse" />
                            </h1>
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mt-1">
                                {isDeadpool ? "Let's break some records, bub." : "Here's your focus overview for today."}
                            </p>
                        </div>
                    )}
                </div>
                <div className={cn(
                    "hidden md:flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border",
                    isRetro
                        ? "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary)_/_0.5)] border-[hsl(var(--border))]"
                        : "text-[hsl(var(--foreground))] bg-[hsl(var(--card)_/_0.8)] backdrop-blur-md border-[hsl(var(--border)_/_0.6)] shadow-sm"
                )}>
                    <Clock className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                    {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
            </motion.div>

            {/* Top Row: Timer + Stats + Pet */}
            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_260px] gap-5">
                {/* Timer Card */}
                <motion.div
                    variants={staggerItem}
                    className={cn(
                        cardBaseClasses,
                        "p-6 flex flex-col items-center justify-center gap-5 w-full bg-gradient-to-b from-[hsl(var(--card)_/_0.8)] to-[hsl(var(--secondary)_/_0.3)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    )}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary))] rounded-full blur-[80px] opacity-10 pointer-events-none" />

                    <div className="relative w-[180px] h-[180px] flex items-center justify-center drop-shadow-xl">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" className="opacity-20" />
                            <circle
                                cx="80" cy="80" r={ringRadius}
                                fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-linear"
                            />
                            {/* Inner glowing ring on active */}
                            {timer.status !== 'idle' && progress > 0 && (
                                <circle
                                    cx="80" cy="80" r={ringRadius}
                                    fill="none" stroke="hsl(var(--primary))" strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-1000 ease-linear opacity-20 blur-sm"
                                />
                            )}
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                            <p className={cn(
                                "text-4xl tabular-nums leading-none tracking-tight",
                                isRetro ? "font-mono glow-text text-[hsl(var(--primary))]" : "font-extrabold text-[hsl(var(--foreground))] drop-shadow-sm"
                            )}>
                                {formatTime(timer.remaining)}
                            </p>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold mt-2 px-2 py-0.5 rounded-full bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)_/_0.2)]">
                                {modeLabel}
                            </span>
                        </div>
                    </div>

                    {/* Cycle dots */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--background)_/_0.5)] border border-[hsl(var(--border)_/_0.5)]">
                        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                            <div key={i} className={cn(
                                'w-2 h-2 rounded-full transition-all duration-300',
                                i < sessionInCycle
                                    ? 'bg-[hsl(var(--primary))] shadow-[0_0_8px_hsl(var(--primary)_/_0.8)] scale-110'
                                    : 'bg-[hsl(var(--muted)_/_0.5)]'
                            )} />
                        ))}
                    </div>

                    {timer.status === 'idle' ? (
                        <motion.button
                            onClick={() => startTimer('work')}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            transition={springBouncy}
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-2xl font-bold text-sm shadow-[0_4px_14px_0_hsl(var(--primary)_/_0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:bg-[hsl(var(--primary)_/_0.9)] transition-all"
                        >
                            <Play className="w-4 h-4 fill-current" /> Start Focus
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={() => onNavigate('timer')}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            transition={springBouncy}
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[hsl(var(--secondary)_/_0.8)] backdrop-blur-sm text-[hsl(var(--foreground))] border border-[hsl(var(--border)_/_0.8)] rounded-2xl font-bold text-sm hover:bg-[hsl(var(--secondary))] transition-all shadow-sm"
                        >
                            Open Timer <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    )}
                </motion.div>

                {/* Stats Cards grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: isDeadpool ? 'TIME WASTED' : 'Focus Today', value: formatDuration(todayMinutes), icon: Clock, accent: 'text-sky-500 dark:text-sky-400', accentBg: 'bg-gradient-to-br from-sky-400/20 to-sky-600/5', shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(14,165,233,0.3)]', glow: 'from-sky-500/0 via-sky-500/10 to-transparent' },
                        { label: isDeadpool ? 'ROUNDS' : 'Sessions', value: todaySessionCount.toString(), icon: Zap, accent: 'text-amber-500 dark:text-amber-400', accentBg: 'bg-gradient-to-br from-amber-400/20 to-amber-600/5', shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.3)]', glow: 'from-amber-500/0 via-amber-500/10 to-transparent' },
                        { label: isDeadpool ? 'COMBO' : 'Streak', value: `${streak}d`, icon: Flame, accent: 'text-orange-500 dark:text-orange-400', accentBg: 'bg-gradient-to-br from-orange-400/20 to-orange-600/5', shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(249,115,22,0.3)]', glow: 'from-orange-500/0 via-orange-500/10 to-transparent' },
                        { label: isDeadpool ? 'TACOS' : 'Done Today', value: completedToday.toString(), icon: CheckCircle2, accent: 'text-emerald-500 dark:text-emerald-400', accentBg: 'bg-gradient-to-br from-emerald-400/20 to-emerald-600/5', shadow: 'hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.3)]', glow: 'from-emerald-500/0 via-emerald-500/10 to-transparent' },
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            variants={staggerItem}
                            whileHover={{ y: -4, scale: 1.02 }}
                            transition={springBouncy}
                            className={cn(
                                cardBaseClasses,
                                "p-5 flex flex-col justify-between gap-5 group cursor-default",
                                stat.shadow
                            )}
                        >
                            {/* Animated bottom glow on hover */}
                            <div className={cn(
                                "absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10",
                                stat.glow
                            )} />

                            <div className={cn(
                                "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border border-[hsl(var(--background)_/_0.2)]",
                                stat.accentBg
                            )}>
                                <stat.icon className={cn("w-[22px] h-[22px] drop-shadow-sm", stat.accent)} />
                            </div>
                            <div>
                                <p className={cn(
                                    "text-3xl text-[hsl(var(--foreground))] leading-none tracking-tight",
                                    isRetro ? "font-mono" : "font-extrabold"
                                )}>
                                    {stat.value}
                                </p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 font-bold uppercase tracking-wider">
                                    {stat.label}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Pet Companion Widget */}
                <motion.div variants={staggerItem} className="flex h-full">
                    <div className="w-full h-full">
                        <PetCompanion />
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row: Task + Weekly + Upcoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Active Task */}
                <motion.div
                    variants={staggerItem}
                    className={cn(cardBaseClasses, "p-6 flex flex-col")}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)_/_0.2)] to-[hsl(var(--primary)_/_0.05)] border border-[hsl(var(--primary)_/_0.2)] flex items-center justify-center shadow-sm">
                                <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
                            </div>
                            <h3 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">
                                {isRetro ? 'ACTIVE QUEST' : 'Current Task'}
                            </h3>
                        </div>
                        {activeTask && (
                            <span className={cn(
                                "text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider shadow-sm",
                                activeTask.priority === 'high' ? "border-red-500/30 text-red-500 dark:text-red-400 bg-red-500/10" :
                                    activeTask.priority === 'medium' ? "border-amber-500/30 text-amber-500 dark:text-amber-400 bg-amber-500/10" :
                                        "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            )}>
                                {activeTask.priority}
                            </span>
                        )}
                    </div>

                    {activeTask ? (
                        <div className="flex-1 flex flex-col justify-between gap-5 bg-[hsl(var(--secondary)_/_0.3)] rounded-2xl p-4 border border-[hsl(var(--border)_/_0.4)]">
                            <h4 className="text-base font-bold text-[hsl(var(--foreground))] line-clamp-2 leading-snug">{activeTask.title}</h4>
                            <div className="space-y-2.5">
                                <div className="flex justify-between text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    <span>Progress</span>
                                    <span className="font-bold text-[hsl(var(--foreground))] tabular-nums">{Math.round((activeTask.completedPomodoros / Math.max(1, activeTask.estimatedPomodoros)) * 100)}%</span>
                                </div>
                                <div className="h-2.5 bg-[hsl(var(--secondary)_/_0.8)] overflow-hidden rounded-full shadow-inner border border-[hsl(var(--border)_/_0.5)]">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.7)] rounded-full relative"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (activeTask.completedPomodoros / Math.max(1, activeTask.estimatedPomodoros)) * 100)}%` }}
                                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: 'translateX(-100%)' }} />
                                    </motion.div>
                                </div>
                                <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] text-center">
                                    {activeTask.completedPomodoros} of {activeTask.estimatedPomodoros} sessions completed
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 opacity-60 bg-[hsl(var(--secondary)_/_0.2)] rounded-2xl border border-[hsl(var(--border)_/_0.4)] border-dashed">
                            <Target className="w-8 h-8 mb-3 text-[hsl(var(--muted-foreground))]" />
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No task selected</p>
                            <button onClick={() => onNavigate('tasks')} className="text-xs font-bold text-[hsl(var(--primary))] mt-2 hover:underline">Pick one from queue →</button>
                        </div>
                    )}
                </motion.div>

                {/* Weekly Activity Chart */}
                <motion.div
                    variants={staggerItem}
                    className={cn(cardBaseClasses, "p-6 flex flex-col")}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)_/_0.2)] to-[hsl(var(--primary)_/_0.05)] border border-[hsl(var(--primary)_/_0.2)] flex items-center justify-center shadow-sm">
                                <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
                            </div>
                            <h3 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">This Week</h3>
                        </div>
                        <button
                            onClick={() => onNavigate('analytics')}
                            className="text-xs text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)_/_0.1)] px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1"
                        >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Bar chart */}
                    <div className="flex-1 flex items-end gap-2 pt-2 relative">
                        {/* Background lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 z-0">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="border-b border-[hsl(var(--border)_/_0.4)] border-dashed w-full" />
                            ))}
                        </div>

                        {last7.map((mins, i) => {
                            const h = max7 > 0 ? (mins / max7) * 100 : 0
                            const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
                            const dayIndex = (() => {
                                const d = new Date()
                                d.setDate(d.getDate() - (6 - i))
                                return (d.getDay() + 6) % 7
                            })()
                            const isToday = i === 6
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group z-10 relative">
                                    <div className="w-full relative" style={{ height: '100px' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(h, 4)}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                            className={cn(
                                                "absolute bottom-0 left-0 w-full rounded-t-md transition-all duration-300",
                                                isToday
                                                    ? "bg-[hsl(var(--primary))] shadow-[0_0_10px_hsl(var(--primary)_/_0.4)]"
                                                    : "bg-[hsl(var(--primary)_/_0.25)] hover:bg-[hsl(var(--primary)_/_0.45)]"
                                            )}
                                        >
                                            {/* Tooltip on hover */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] font-bold px-2 py-1 rounded shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-20">
                                                {mins}m
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        isToday ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
                                    )}>
                                        {dayNames[dayIndex]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[hsl(var(--border)_/_0.6)]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                            Total Focus
                        </span>
                        <span className={cn(
                            "text-base text-[hsl(var(--foreground))] tracking-tight",
                            isRetro ? "font-mono glow-text text-[hsl(var(--primary))]" : "font-extrabold"
                        )}>
                            {formatDuration(last7.reduce((a, b) => a + b, 0))}
                        </span>
                    </div>
                </motion.div>

                {/* Upcoming Tasks */}
                <motion.div
                    variants={staggerItem}
                    className={cn(cardBaseClasses, "p-6 flex flex-col")}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)_/_0.2)] to-[hsl(var(--primary)_/_0.05)] border border-[hsl(var(--primary)_/_0.2)] flex items-center justify-center shadow-sm">
                                <Clock className="w-4 h-4 text-[hsl(var(--primary))]" />
                            </div>
                            <h3 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">
                                {isRetro ? 'MISSION QUEUE' : 'Up Next'}
                            </h3>
                        </div>
                        <button
                            onClick={() => onNavigate('tasks')}
                            className="text-xs text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)_/_0.1)] px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1"
                        >
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        {activeTasks.slice(0, 5).map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                                className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[hsl(var(--secondary)_/_0.2)] hover:bg-[hsl(var(--secondary)_/_0.6)] border border-transparent hover:border-[hsl(var(--border)_/_0.8)] transition-all group"
                            >
                                <div className={cn(
                                    "w-2.5 h-2.5 rounded-full shrink-0 shadow-sm",
                                    task.priority === 'high' ? 'bg-red-500 shadow-red-500/30' :
                                        task.priority === 'medium' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'
                                )} />
                                <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate flex-1 group-hover:text-[hsl(var(--primary))] transition-colors">
                                    {task.title}
                                </span>
                                <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors bg-[hsl(var(--background)_/_0.5)] px-2 py-0.5 rounded-md tabular-nums border border-[hsl(var(--border)_/_0.5)]">
                                    {task.completedPomodoros}/{task.estimatedPomodoros}
                                </span>
                            </motion.div>
                        ))}
                        {activeTasks.length === 0 && (
                            <div className="flex-1 flex items-center justify-center bg-[hsl(var(--secondary)_/_0.2)] rounded-xl border border-[hsl(var(--border)_/_0.4)] border-dashed">
                                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] opacity-60">No pending tasks</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </motion.div>
    )
}
