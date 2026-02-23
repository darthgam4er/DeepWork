import { useMemo, useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { formatDuration, cn } from '@/lib/utils'
import {
    BarChart3, Clock, Target, Flame, TrendingUp, TrendingDown,
    Calendar, Database, Trash2, Zap, CheckCircle2, Timer, Award, Sparkles
} from 'lucide-react'
import { staggerContainer, staggerItem, springBouncy, buttonPress } from '@/lib/animations'

// ─── Animated Counter ───
function AnimatedNum({ value }: { value: number }) {
    const [display, setDisplay] = useState(0)
    const prevRef = useRef(0)
    useEffect(() => {
        const start = prevRef.current
        const diff = value - start
        if (diff === 0) { setDisplay(value); return }
        const startTime = performance.now()
        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / 800, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(start + diff * eased))
            if (progress < 1) requestAnimationFrame(animate)
            else prevRef.current = value
        }
        requestAnimationFrame(animate)
    }, [value])
    return <span className="tabular-nums font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{display}</span>
}

function AnimatedValue({ value }: { value: string }) {
    const parts = value.split(/(\d+)/).filter(Boolean);
    return (
        <span className="flex items-baseline overflow-hidden text-ellipsis whitespace-nowrap">
            {parts.map((p, i) => {
                if (/^\d+$/.test(p)) {
                    return <AnimatedNum key={i} value={parseInt(p)} />
                }
                return <span key={i} className="text-lg md:text-xl font-bold text-muted-foreground/60 tracking-tight ml-[1px] mr-[3px] last:mr-0">{p.trim()}</span>
            })}
        </span>
    )
}

// ─── Trend Badge ───
function TrendBadge({ value, label }: { value: number; label: string }) {
    if (value === 0) return null
    const isUp = value > 0
    return (
        <div className={cn(
            "inline-flex items-center gap-1 font-bold px-2 py-1 rounded-full border shadow-sm backdrop-blur-md transition-colors",
            isUp
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10'
                : 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/10'
        )}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5 drop-shadow-sm" /> : <TrendingDown className="w-3.5 h-3.5 drop-shadow-sm" />}
            <span className="text-xs">{Math.abs(value)}%</span>
            <span className="text-[10px] opacity-70 font-medium">{label}</span>
        </div>
    )
}

// ─── SVG Area Chart ───
function AreaChart({ data }: { data: { label: string; value: number }[] }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                })
            }
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const { width, height } = dimensions

    if (!width || !height) return <div ref={containerRef} className="w-full h-full" />

    const maxVal = Math.max(...data.map(d => d.value), 1)
    const padding = { top: 12, bottom: 24, left: 16, right: 16 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartW,
        y: padding.top + chartH - (d.value / maxVal) * chartH,
        ...d,
    }))

    const linePath = points.reduce((path, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`
        const prev = points[i - 1]
        const cpx = (prev.x + p.x) / 2
        return `${path} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
    }, '')

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <svg width={width} height={height} className="overflow-visible">
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.01" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.5, 1].map(frac => (
                    <line
                        key={frac}
                        x1={padding.left - 10} y1={padding.top + chartH * (1 - frac)}
                        x2={width - padding.right + 10} y2={padding.top + chartH * (1 - frac)}
                        stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"
                    />
                ))}

                {/* Vertical Grid lines */}
                {points.filter((_, i) => i % 3 === 0).map((p, i) => (
                    <line
                        key={`v-${i}`}
                        x1={p.x} y1={padding.top}
                        x2={p.x} y2={padding.top + chartH}
                        stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2 4" opacity="0.2"
                    />
                ))}

                <motion.path
                    d={areaPath}
                    fill="url(#areaGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                />

                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Highlight highest point */}
                {points.filter(p => p.value === maxVal).slice(0, 1).map((p, i) => (
                    <g key={`max-${i}`}>
                        <circle cx={p.x} cy={p.y} r="8" fill="hsl(var(--primary))" opacity="0.2" className="animate-ping shadow-xl" />
                        <circle cx={p.x} cy={p.y} r="4" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2.5" />
                    </g>
                ))}

                {/* Day labels */}
                {points.filter((_, i) => i % 2 === 0).map((p, i) => (
                    <text
                        key={i}
                        x={p.x} y={height - 2}
                        textAnchor="middle"
                        fill="hsl(var(--muted-foreground))"
                        fontSize="10"
                        fontWeight="600"
                        className="tracking-wider"
                    >
                        {p.label}
                    </text>
                ))}
            </svg>
        </div>
    )
}

// ─── Radial Progress Ring ───
function RadialProgress({ value, max, label, sublabel }: {
    value: number; max: number; label: string; sublabel: string
}) {
    const pct = Math.min(value / Math.max(max, 1), 1)
    const r = 60
    const circumference = 2 * Math.PI * r
    const strokeDashoffset = circumference * (1 - pct)

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-40 h-40 drop-shadow-xl">
                <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90 filter drop-shadow-md">
                    <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" opacity="0.2" />
                    {/* Glow layer */}
                    <motion.circle
                        cx="70" cy="70" r={r} fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        opacity="0.3"
                        filter="blur(4px)"
                    />
                    {/* Real stroke */}
                    <motion.circle
                        cx="70" cy="70" r={r} fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {Math.round(pct * 100)}<span className="text-xl ml-0.5">%</span>
                    </span>
                    <span className="text-xs font-medium text-muted-foreground mt-1 tracking-wide">{sublabel}</span>
                </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mt-4 tracking-tight px-3 py-1 rounded-full bg-secondary/30 border border-border/30 backdrop-blur-sm">
                {label}
            </p>
        </div>
    )
}

// ─── Horizontal Bar ───
function HorizontalBar({ label, value, maxValue, color, delay = 0, index }: {
    label: string; value: number; maxValue: number; color: string; delay?: number; index: number
}) {
    return (
        <div className="flex items-center gap-4 min-w-0 group/bar">
            <div className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center bg-secondary/50 text-xs font-bold text-muted-foreground border border-border/50 group-hover/bar:bg-primary/10 group-hover/bar:text-primary group-hover/bar:border-primary/20 transition-colors">
                {index + 1}
            </div>
            <span className="text-sm text-foreground w-32 shrink-0 truncate font-semibold group-hover/bar:text-primary transition-colors">{label}</span>
            <div className="flex-1 h-3.5 bg-secondary/40 rounded-full overflow-hidden min-w-0 shadow-inner border border-black/5 dark:border-white/5 relative">
                <motion.div
                    className="h-full rounded-full absolute left-0 top-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / Math.max(maxValue, 1)) * 100}%` }}
                    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
            <span className="text-xs text-muted-foreground w-12 shrink-0 text-right font-bold tracking-tight tabular-nums group-hover/bar:text-foreground transition-colors">
                {formatDuration(value)}
            </span>
        </div>
    )
}

// ═══════════════════════════════════════
// ─── Main Analytics Component ───
// ═══════════════════════════════════════
export function Analytics() {
    const sessions = useAppStore((s) => s.sessions)
    const tasks = useAppStore((s) => s.tasks)
    const settings = useAppStore((s) => s.settings)
    const loadMockData = useAppStore((s) => s.loadMockData)
    const clearMockData = useAppStore((s) => s.clearMockData)

    const hasMockData = sessions.some(s => s.id.startsWith('mock-'))
    const workSessions = sessions.filter((s) => s.type === 'work' && s.completed)

    // ─── Core stats ───
    const totalMinutes = Math.round(workSessions.reduce((a, s) => a + s.elapsed, 0) / 60)
    const totalSessions = workSessions.length
    const totalTasksDone = tasks.filter((t) => t.status === 'done').length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? Math.round((totalTasksDone / totalTasks) * 100) : 0
    const avgSessionMin = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

    // ─── Streak ───
    const streak = useMemo(() => {
        let count = 0
        const d = new Date()
        for (let i = 0; i < 365; i++) {
            const dateStr = d.toISOString().split('T')[0]
            const has = workSessions.some((s) => s.startedAt.startsWith(dateStr))
            if (has) { count++; d.setDate(d.getDate() - 1) }
            else if (i === 0) { d.setDate(d.getDate() - 1) }
            else break
        }
        return count
    }, [workSessions])

    // ─── Today's focus ───
    const todayStr = new Date().toISOString().split('T')[0]
    const todayMinutes = Math.round(
        workSessions.filter(s => s.startedAt.startsWith(todayStr)).reduce((a, s) => a + s.elapsed, 0) / 60
    )
    const dailyGoal = settings.workDuration * settings.sessionsBeforeLongBreak * 2 // ~8 pomos worth

    // ─── Active days & daily average ───
    const { activeDays, dailyAvg } = useMemo(() => {
        const daySet = new Set(workSessions.map(s => s.startedAt.split('T')[0]))
        const count = daySet.size
        return { activeDays: count, dailyAvg: count > 0 ? Math.round(totalMinutes / count) : 0 }
    }, [workSessions, totalMinutes])

    // ─── Week-over-week ───
    const weekChange = useMemo(() => {
        const now = new Date()
        const thisWeekStart = new Date(now)
        thisWeekStart.setDate(now.getDate() - now.getDay())
        thisWeekStart.setHours(0, 0, 0, 0)
        const lastWeekStart = new Date(thisWeekStart)
        lastWeekStart.setDate(lastWeekStart.getDate() - 7)

        const thisWeek = workSessions
            .filter(s => new Date(s.startedAt) >= thisWeekStart)
            .reduce((a, s) => a + s.elapsed, 0) / 60
        const lastWeek = workSessions
            .filter(s => { const d = new Date(s.startedAt); return d >= lastWeekStart && d < thisWeekStart })
            .reduce((a, s) => a + s.elapsed, 0) / 60

        if (lastWeek === 0) return thisWeek > 0 ? 100 : 0
        return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    }, [workSessions])

    // ─── Current week Mon–Sun bar chart ───
    const last7Days = useMemo(() => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        // Monday = 1, so offset to get this week's Monday
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const monday = new Date(now)
        monday.setDate(now.getDate() + mondayOffset)
        monday.setHours(0, 0, 0, 0)

        const days: { label: string; minutes: number; sessions: number }[] = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            const dateStr = d.toISOString().split('T')[0]
            const dayName = d.toLocaleDateString('en', { weekday: 'short' })
            const daySessions = workSessions.filter((s) => s.startedAt.startsWith(dateStr))
            days.push({
                label: dayName,
                minutes: Math.round(daySessions.reduce((a, s) => a + s.elapsed, 0) / 60),
                sessions: daySessions.length,
            })
        }
        return days
    }, [workSessions])

    const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 1)

    // ─── Last 14 days trend ───
    const last14Days = useMemo(() => {
        const days: { label: string; value: number }[] = []
        for (let i = 13; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            const dayLabel = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
            const dayMin = Math.round(
                workSessions.filter(s => s.startedAt.startsWith(dateStr)).reduce((a, s) => a + s.elapsed, 0) / 60
            )
            days.push({ label: dayLabel, value: dayMin })
        }
        return days
    }, [workSessions])

    // ─── Peak hour ───
    const { hourlyData, peakHour, maxHourlyMinutes } = useMemo(() => {
        const hours = Array(24).fill(0) as number[]
        workSessions.forEach((s) => {
            const h = new Date(s.startedAt).getHours()
            hours[h] += s.elapsed / 60
        })
        const maxMin = Math.max(...hours, 1)
        const peak = hours.indexOf(Math.max(...hours))
        return { hourlyData: hours, peakHour: peak, maxHourlyMinutes: maxMin }
    }, [workSessions])

    // ─── Task focus breakdown ───
    const taskBreakdown = useMemo(() => {
        const map = new Map<string, { title: string; minutes: number }>()
        workSessions.forEach(s => {
            if (!s.taskId) return
            const task = tasks.find(t => t.id === s.taskId)
            if (!task) return
            const existing = map.get(s.taskId) || { title: task.title, minutes: 0 }
            existing.minutes += Math.round(s.elapsed / 60)
            map.set(s.taskId, existing)
        })
        return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes).slice(0, 5)
    }, [workSessions, tasks])

    const taskBreakdownMax = taskBreakdown.length > 0 ? taskBreakdown[0].minutes : 1

    // ─── Session distribution by hour (for sparkline-style) ───
    const sessionsByHour = useMemo(() => {
        const buckets = [
            { label: 'Morning', range: [6, 12], count: 0 },
            { label: 'Afternoon', range: [12, 17], count: 0 },
            { label: 'Evening', range: [17, 22], count: 0 },
            { label: 'Night', range: [22, 6], count: 0 },
        ]
        workSessions.forEach(s => {
            const h = new Date(s.startedAt).getHours()
            if (h >= 6 && h < 12) buckets[0].count++
            else if (h >= 12 && h < 17) buckets[1].count++
            else if (h >= 17 && h < 22) buckets[2].count++
            else buckets[3].count++
        })
        return buckets
    }, [workSessions])

    const maxBucket = Math.max(...sessionsByHour.map(b => b.count), 1)

    const taskBarColors = [
        'hsl(var(--primary))',
        'hsl(var(--primary) / 0.85)',
        'hsl(var(--primary) / 0.70)',
        'hsl(var(--primary) / 0.55)',
        'hsl(var(--primary) / 0.40)',
    ]

    // ═══════════════════════════════════════
    // ─── Render ───
    // ═══════════════════════════════════════
    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-32">
            {/* ─── Header ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative"
            >
                <div className="absolute -left-12 -top-12 w-32 h-32 bg-primary/20 rounded-full blur-[40px] opacity-60 pointer-events-none" />

                <div className="space-y-2 relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
                        Analytics
                    </h1>
                    <p className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2 ml-1">
                        <Sparkles className="w-4 h-4 text-primary/70" />
                        Explore your productivity milestones & trends
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    {hasMockData ? (
                        <motion.button
                            onClick={clearMockData}
                            className="glass-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/10 transition-all cursor-pointer"
                            variants={buttonPress} whileHover="hover" whileTap="tap"
                        >
                            <Trash2 className="w-4 h-4" /> Clear Mock Data
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={loadMockData}
                            className="glass-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer"
                            variants={buttonPress} whileHover="hover" whileTap="tap"
                        >
                            <Database className="w-4 h-4" /> Load Mock Data
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* ═══ Row 1: Stat Cards ═══ */}
            <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {[
                    { label: 'Total Focus', value: formatDuration(totalMinutes), icon: Clock, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10', glow: 'bg-blue-500', trend: weekChange, trendLabel: 'vs last wk' },
                    { label: 'Sessions', value: totalSessions.toString(), icon: Target, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', glow: 'bg-emerald-500', sub: `${avgSessionMin}m avg` },
                    { label: 'Day Streak', value: streak.toString(), icon: Flame, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', glow: 'bg-orange-500', sub: `${activeDays} active days` },
                    { label: 'Completion', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10', glow: 'bg-purple-500', sub: `${totalTasksDone}/${totalTasks} tasks` },
                ].map(({ label, value, icon: Icon, color, bg, glow, trend, trendLabel, sub }) => (
                    <motion.div
                        key={label}
                        variants={staggerItem}
                        whileHover={{ y: -4, scale: 1.02 }}
                        transition={springBouncy}
                        className="card-panel group relative overflow-hidden p-5 md:p-6 transition-all duration-500 hover:shadow-xl hover:shadow-black/5 cursor-default flex flex-col min-h-[140px]"
                    >
                        {/* Glow Effect */}
                        <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[50px] opacity-20 transition-all duration-700 group-hover:scale-150 group-hover:opacity-40 pointer-events-none ${glow}`} />
                        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 transition-all duration-700 group-hover:scale-150 group-hover:opacity-30 pointer-events-none ${glow}`} />

                        <div className="relative z-10 flex flex-col h-full gap-5">
                            <div className="flex items-start justify-between">
                                <motion.div
                                    className={cn(`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-sm border backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3`, bg, color, `border-${glow.split('-')[1]}-500/20`)}
                                >
                                    <Icon className="w-5 h-5 md:w-6 md:h-6 drop-shadow-sm" />
                                </motion.div>
                                {trend !== undefined && <TrendBadge value={trend} label={trendLabel || ''} />}
                            </div>

                            <div className="flex flex-col gap-0.5 mt-auto">
                                <p className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm flex items-center">
                                    <AnimatedValue value={value} />
                                </p>
                                <div className="flex items-end justify-between mt-1">
                                    <p className="text-xs md:text-sm font-semibold text-muted-foreground">{label}</p>
                                    {sub && <p className="text-[10px] md:text-xs font-bold text-muted-foreground/60">{sub}</p>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ═══ Row 2: Weekly Bar Chart + Today Ring ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Weekly Bar Chart — 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 card-panel group relative overflow-hidden p-6 md:p-8 transition-all duration-500 hover:shadow-xl cursor-default"
                >
                    <div className="absolute -left-20 top-20 w-40 h-40 rounded-full bg-primary/10 blur-[50px] opacity-50 transition-all duration-700 group-hover:opacity-80 group-hover:scale-125 pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-sm backdrop-blur-sm">
                                <BarChart3 className="w-5 h-5 drop-shadow-sm" />
                            </div>
                            <div>
                                <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">Weekly Focus History</h2>
                                <p className="text-[10px] md:text-xs text-muted-foreground font-medium mt-0.5">Your daily productivity timeline</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-secondary/60 border border-border/50 text-secondary-foreground shadow-sm backdrop-blur-md">
                            Avg {formatDuration(Math.round(last7Days.reduce((a, d) => a + d.minutes, 0) / 7))}/day
                        </span>
                    </div>

                    {/* Y-axis labels + bars */}
                    <div className="flex gap-4 relative z-10">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between text-[10px] md:text-xs text-muted-foreground font-bold tracking-tight w-10 text-right shrink-0" style={{ height: 220 }}>
                            <span className="opacity-80">{formatDuration(maxMinutes)}</span>
                            <span className="opacity-80">{formatDuration(Math.round(maxMinutes / 2))}</span>
                            <span className="opacity-80">0m</span>
                        </div>
                        {/* Bars */}
                        <div className="flex-1 flex items-end gap-3 md:gap-4 relative min-w-0">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: 220 }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="border-b border-border/40 border-dashed" />
                                ))}
                            </div>
                            {last7Days.map((day, i) => {
                                const todayIndex = (new Date().getDay() + 6) % 7 // Mon=0 ... Sun=6
                                const isToday = i === todayIndex
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 relative z-10 min-w-0 group/bar">
                                        <div className="w-full relative flex justify-center" style={{ height: 220 }}>
                                            <motion.div
                                                className={cn(
                                                    "absolute bottom-0 w-full max-w-[48px] rounded-t-xl cursor-default border-t border-white/20 dark:border-white/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)]",
                                                    isToday ? "bg-primary shadow-[0_0_20px_rgba(var(--primary),0.4)]" : "bg-primary/40 group-hover/bar:bg-primary/60"
                                                )}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max((day.minutes / maxMinutes) * 100, day.minutes > 0 ? 3 : 0)}%` }}
                                                transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                {/* Tooltip */}
                                                <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-card border border-border/50 rounded-xl px-3 py-1.5 text-xs whitespace-nowrap shadow-xl backdrop-blur-xl pointer-events-none transition-all duration-300 transform scale-90 group-hover/bar:scale-100 z-30 flex items-center gap-2">
                                                    <span className="font-bold text-foreground text-sm">{day.minutes}m</span>
                                                    <div className="w-1 h-1 rounded-full bg-primary/50" />
                                                    <span className="text-muted-foreground font-medium">{day.sessions} items</span>
                                                </div>
                                            </motion.div>
                                        </div>
                                        <span className={cn(
                                            "text-xs shrink-0 tracking-tight transition-colors",
                                            isToday ? 'text-primary font-bold' : 'text-muted-foreground font-semibold group-hover/bar:text-foreground'
                                        )}>
                                            {day.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Today's Focus Ring — 1 col */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                    className="card-panel p-6 md:p-8 flex flex-col relative overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-default"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/10 blur-[50px] opacity-40 transition-all duration-700 group-hover:scale-125 group-hover:opacity-70 pointer-events-none" />
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 group-hover:scale-110 transition-transform duration-500 shadow-sm backdrop-blur-sm">
                            <Zap className="w-5 h-5 drop-shadow-sm" />
                        </div>
                        <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">Today's Focus</h2>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative z-10">
                        <RadialProgress
                            value={todayMinutes}
                            max={dailyGoal}
                            label={`Goal: ${formatDuration(dailyGoal)}`}
                            sublabel={formatDuration(todayMinutes)}
                        />
                    </div>
                </motion.div>
            </div>

            {/* ═══ Row 3: 14-Day Trend + Peak Hours ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* 14-Day Trend — 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 card-panel p-6 md:p-8 group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-default"
                >
                    <div className="absolute right-0 bottom-0 w-64 h-64 rounded-full bg-primary/5 blur-[60px] opacity-50 transition-all duration-700 group-hover:opacity-80 pointer-events-none" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-sm backdrop-blur-sm">
                                <TrendingUp className="w-5 h-5 drop-shadow-sm" />
                            </div>
                            <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">14-Day Trend</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-bold text-muted-foreground mr-1">
                                {dailyAvg}m daily avg
                            </span>
                        </div>
                    </div>
                    <div className="h-56 relative z-10">
                        <AreaChart data={last14Days} />
                    </div>
                </motion.div>

                {/* Peak Hours — 1 col */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="card-panel p-6 md:p-8 group relative overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col cursor-default"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/10 blur-[40px] opacity-40 transition-all duration-700 group-hover:scale-150 pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 group-hover:scale-110 transition-transform duration-500 shadow-sm backdrop-blur-sm">
                            <Timer className="w-5 h-5 drop-shadow-sm" />
                        </div>
                        <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">Peak Hours</h2>
                    </div>

                    <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] relative z-10">
                        <div className="p-2.5 rounded-xl bg-background border border-border shadow-sm">
                            <Award className="w-6 h-6 text-primary drop-shadow-sm" />
                        </div>
                        <div>
                            <p className="text-base md:text-lg font-black tracking-tight text-foreground">
                                {peakHour}:00 – {peakHour + 1}:00
                            </p>
                            <p className="text-xs font-medium text-primary mt-0.5">Most productive hour</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-center">
                        {sessionsByHour.map((bucket, i) => (
                            <div key={bucket.label} className="space-y-2 group/bucket">
                                <div className="flex items-center justify-between text-xs tracking-tight">
                                    <span className="text-muted-foreground font-semibold group-hover/bucket:text-foreground transition-colors">{bucket.label}</span>
                                    <span className="font-bold text-foreground bg-secondary/80 px-2.5 py-0.5 rounded-md drop-shadow-sm border border-border/50">{bucket.count} <span className="text-[9px] font-medium opacity-60 ml-0.5">sessions</span></span>
                                </div>
                                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5 relative">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary absolute left-0 top-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(bucket.count / maxBucket) * 100}%` }}
                                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ opacity: 0.4 + (bucket.count / maxBucket) * 0.6 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ═══ Row 4: Task Breakdown + Heatmap ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Task Breakdown — 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="lg:col-span-2 card-panel p-6 md:p-8 group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-default"
                >
                    <div className="absolute left-0 bottom-0 w-48 h-48 rounded-full bg-blue-500/10 blur-[50px] opacity-40 transition-all duration-700 group-hover:scale-125 pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform duration-500 shadow-sm backdrop-blur-sm">
                                <Target className="w-5 h-5 drop-shadow-sm" />
                            </div>
                            <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">Focus by Task</h2>
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-secondary/80 text-muted-foreground border border-border/50 shadow-sm backdrop-blur-sm">Top 5 tasks</span>
                    </div>
                    {taskBreakdown.length > 0 ? (
                        <div className="space-y-4 relative z-10">
                            {taskBreakdown.map((task, i) => (
                                <HorizontalBar
                                    key={i}
                                    index={i}
                                    label={task.title}
                                    value={task.minutes}
                                    maxValue={taskBreakdownMax}
                                    color={taskBarColors[i] || taskBarColors[4]}
                                    delay={0.6 + i * 0.08}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8 text-sm font-medium text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border/50 backdrop-blur-sm">
                            No task data yet — link sessions to tasks to see your focus breakdown
                        </div>
                    )}
                </motion.div>

                {/* Hourly Heatmap — 1 col */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="card-panel p-6 md:p-8 group relative overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col cursor-default"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/5 blur-[40px] opacity-50 transition-all duration-1000 group-hover:opacity-80 pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 group-hover:scale-110 transition-transform duration-500 shadow-sm backdrop-blur-sm">
                            <Calendar className="w-5 h-5 drop-shadow-sm" />
                        </div>
                        <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">Hour Map</h2>
                    </div>

                    <div className="grid grid-cols-6 gap-2 md:gap-2.5 relative z-10 flex-1 content-center">
                        {hourlyData.map((minutes, hour) => (
                            <motion.div
                                key={hour}
                                className="aspect-square rounded-xl cursor-default relative group/cell shadow-sm border border-black/5 dark:border-white/5"
                                title={`${hour}:00 – ${Math.round(minutes)}min`}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.65 + hour * 0.02, ...springBouncy }}
                                whileHover={{ scale: 1.15, zIndex: 10, borderRadius: '8px' }}
                                style={{
                                    background: minutes > 0
                                        ? `hsl(var(--primary) / ${0.15 + (minutes / maxHourlyMinutes) * 0.85})`
                                        : 'hsl(var(--muted) / 0.15)',
                                    boxShadow: minutes > 0 ? `0 4px 12px -4px hsl(var(--primary) / ${0.3 + (minutes / maxHourlyMinutes) * 0.3})` : 'none'
                                }}
                            >
                                <div className="opacity-0 group-hover/cell:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-card border border-border/50 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl backdrop-blur-md pointer-events-none transition-all duration-300 transform scale-90 group-hover/cell:scale-100 z-30 flex items-center gap-1.5">
                                    <span className="font-bold text-foreground">{hour}h</span>
                                    <div className="w-1 h-1 rounded-full bg-primary/50" />
                                    <span className="text-muted-foreground font-semibold">{Math.round(minutes)}m</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50 text-[10px] md:text-xs font-bold text-muted-foreground relative z-10">
                        <span className="opacity-60">0h</span>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30">
                            <span className="mr-1 opacity-70">Less</span>
                            {[0.15, 0.3, 0.5, 0.7, 1].map(opacity => (
                                <div
                                    key={opacity}
                                    className="w-3 h-3 rounded-md shadow-sm border border-black/5 dark:border-white/5"
                                    style={{ background: `hsl(var(--primary) / ${opacity})` }}
                                />
                            ))}
                            <span className="ml-1 opacity-70">More</span>
                        </div>
                        <span className="opacity-60">23h</span>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
