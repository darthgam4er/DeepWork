import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { formatTime, formatDuration, cn } from '@/lib/utils'
import { Flame, Target, Clock, CheckCircle2, Play, ChevronRight, Radio, ArrowRight, Zap, TrendingUp } from 'lucide-react'
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

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="h-full w-full max-w-6xl mx-auto space-y-6"
        >
            {/* Greeting Row */}
            <motion.div variants={staggerItem} className="flex items-end justify-between">
                <div>
                    {isRetro ? (
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] flex items-center gap-2 mb-1">
                                <Radio className="w-3 h-3 animate-pulse" /> Signal Acquired
                            </span>
                            <h1 className="text-2xl glow-text tracking-wider">COMMAND CENTER</h1>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                                {getGreeting()} 👋
                            </h1>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                {isDeadpool ? "Let's break some records, bub." : "Here's your focus overview for today."}
                            </p>
                        </div>
                    )}
                </div>
                <div className="hidden md:block text-[11px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary)_/_0.5)] px-3 py-1 rounded-full border border-[hsl(var(--border))]">
                    {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
            </motion.div>

            {/* Top Row: Timer + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
                {/* Timer Card — compact square */}
                <motion.div
                    variants={staggerItem}
                    className={cn(
                        "border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col items-center justify-center gap-4 w-full lg:w-[220px]",
                        isRetro ? "pipboy-border" : "rounded-2xl"
                    )}
                >
                    <div className="relative w-[160px] h-[160px] flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" className="opacity-15" />
                            <circle
                                cx="80" cy="80" r={ringRadius}
                                fill="none" stroke="hsl(var(--primary))" strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-linear"
                            />
                        </svg>
                        <div className="text-center z-10">
                            <p className={cn(
                                "text-3xl text-[hsl(var(--foreground))] tabular-nums leading-none",
                                isRetro ? "font-mono glow-text" : "font-bold tracking-tight"
                            )}>
                                {formatTime(timer.remaining)}
                            </p>
                            <p className="text-[9px] uppercase tracking-[0.15em] text-[hsl(var(--primary))] mt-1.5 font-semibold">
                                {modeLabel}
                            </p>
                        </div>
                    </div>

                    {/* Cycle dots */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                            <div key={i} className={cn(
                                'w-1.5 h-1.5 rounded-full transition-colors',
                                i < sessionInCycle
                                    ? 'bg-[hsl(var(--primary))] shadow-[0_0_4px_hsl(var(--primary)_/_0.5)]'
                                    : 'bg-[hsl(var(--muted)_/_0.4)]'
                            )} />
                        ))}
                    </div>

                    {timer.status === 'idle' ? (
                        <motion.button
                            onClick={() => startTimer('work')}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            transition={springBouncy}
                            className="flex items-center justify-center gap-1.5 w-full py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl font-semibold text-xs"
                        >
                            <Play className="w-3.5 h-3.5" /> Start Focus
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={() => onNavigate('timer')}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            transition={springBouncy}
                            className="flex items-center justify-center gap-1.5 w-full py-2 bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] rounded-xl font-medium text-xs"
                        >
                            Open Timer <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                    )}
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: isDeadpool ? 'TIME WASTED' : 'Focus Today', value: formatDuration(todayMinutes), icon: Clock, accent: 'text-sky-400', accentBg: 'bg-sky-500/10', border: 'border-sky-500/20' },
                        { label: isDeadpool ? 'ROUNDS' : 'Sessions', value: todaySessionCount.toString(), icon: Zap, accent: 'text-amber-400', accentBg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                        { label: isDeadpool ? 'COMBO' : 'Streak', value: `${streak}d`, icon: Flame, accent: 'text-orange-400', accentBg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                        { label: isDeadpool ? 'TACOS' : 'Done Today', value: completedToday.toString(), icon: CheckCircle2, accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            variants={staggerItem}
                            className={cn(
                                "border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col justify-between gap-4 group hover:border-[hsl(var(--primary)_/_0.2)] transition-colors",
                                isRetro ? "pipboy-border" : "rounded-2xl"
                            )}
                        >
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.accentBg)}>
                                <stat.icon className={cn("w-[18px] h-[18px]", stat.accent)} />
                            </div>
                            <div>
                                <p className={cn(
                                    "text-2xl text-[hsl(var(--foreground))] leading-none",
                                    isRetro ? "font-mono" : "font-bold"
                                )}>
                                    {stat.value}
                                </p>
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 font-medium">
                                    {stat.label}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom Row: Task + Weekly + Upcoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Active Task */}
                <motion.div
                    variants={staggerItem}
                    className={cn(
                        "border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col",
                        isRetro ? "pipboy-border" : "rounded-2xl"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
                                <Target className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                            </div>
                            <h3 className="text-xs font-semibold text-[hsl(var(--foreground))]">
                                {isRetro ? 'ACTIVE QUEST' : 'Current Task'}
                            </h3>
                        </div>
                        {activeTask && (
                            <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase",
                                activeTask.priority === 'high' ? "border-red-500/30 text-red-400 bg-red-500/10" :
                                    activeTask.priority === 'medium' ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                                        "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            )}>
                                {activeTask.priority}
                            </span>
                        )}
                    </div>

                    {activeTask ? (
                        <div className="flex-1 flex flex-col justify-between gap-4">
                            <h4 className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-2 leading-snug">{activeTask.title}</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
                                    <span>Progress</span>
                                    <span className="font-mono font-semibold">{Math.round((activeTask.completedPomodoros / Math.max(1, activeTask.estimatedPomodoros)) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-[hsl(var(--secondary))] overflow-hidden rounded-full">
                                    <motion.div
                                        className="h-full bg-[hsl(var(--primary))] rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (activeTask.completedPomodoros / Math.max(1, activeTask.estimatedPomodoros)) * 100)}%` }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </div>
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center">
                                    {activeTask.completedPomodoros} of {activeTask.estimatedPomodoros} sessions
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-4 opacity-50">
                            <Target className="w-6 h-6 mb-2 text-[hsl(var(--muted-foreground))]" />
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">No task selected</p>
                            <button onClick={() => onNavigate('tasks')} className="text-[10px] text-[hsl(var(--primary))] mt-1 hover:underline">Pick one →</button>
                        </div>
                    )}
                </motion.div>

                {/* Weekly Activity Mini Chart */}
                <motion.div
                    variants={staggerItem}
                    className={cn(
                        "border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col",
                        isRetro ? "pipboy-border" : "rounded-2xl"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
                                <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                            </div>
                            <h3 className="text-xs font-semibold text-[hsl(var(--foreground))]">This Week</h3>
                        </div>
                        <button
                            onClick={() => onNavigate('analytics')}
                            className="text-[10px] text-[hsl(var(--primary))] hover:underline font-medium flex items-center gap-0.5"
                        >
                            Details <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Bar chart */}
                    <div className="flex-1 flex items-end gap-1.5 pt-2">
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
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                    <div className="w-full relative" style={{ height: '80px' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(h, 4)}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                            className={cn(
                                                "absolute bottom-0 left-0 right-0 rounded-md transition-colors",
                                                isToday
                                                    ? "bg-[hsl(var(--primary))]"
                                                    : "bg-[hsl(var(--primary)_/_0.2)] hover:bg-[hsl(var(--primary)_/_0.35)]"
                                            )}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-medium",
                                        isToday ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
                                    )}>
                                        {dayNames[dayIndex]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[hsl(var(--border)_/_0.5)]">
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Total this week</span>
                        <span className={cn(
                            "text-sm text-[hsl(var(--foreground))]",
                            isRetro ? "font-mono" : "font-bold"
                        )}>
                            {formatDuration(last7.reduce((a, b) => a + b, 0))}
                        </span>
                    </div>
                </motion.div>

                {/* Upcoming Tasks */}
                <motion.div
                    variants={staggerItem}
                    className={cn(
                        "border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col",
                        isRetro ? "pipboy-border" : "rounded-2xl"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-[hsl(var(--foreground))]">
                            {isRetro ? 'MISSION QUEUE' : 'Up Next'}
                        </h3>
                        <button
                            onClick={() => onNavigate('tasks')}
                            className="text-[10px] text-[hsl(var(--primary))] hover:underline font-medium flex items-center gap-0.5"
                        >
                            All Tasks <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                        {activeTasks.slice(0, 5).map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.04 }}
                                className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-[hsl(var(--secondary)_/_0.5)] transition-colors group"
                            >
                                <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    task.priority === 'high' ? 'bg-red-400' :
                                        task.priority === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400'
                                )} />
                                <span className="text-xs text-[hsl(var(--foreground))] truncate flex-1 group-hover:text-[hsl(var(--primary))] transition-colors">
                                    {task.title}
                                </span>
                                <span className="text-[9px] text-[hsl(var(--muted-foreground))] tabular-nums shrink-0 font-mono">
                                    {task.completedPomodoros}/{task.estimatedPomodoros}
                                </span>
                            </motion.div>
                        ))}
                        {activeTasks.length === 0 && (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-xs text-[hsl(var(--muted-foreground))] opacity-50">No pending tasks</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
