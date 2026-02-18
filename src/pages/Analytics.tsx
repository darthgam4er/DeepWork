import { useMemo, useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { formatDuration } from '@/lib/utils'
import {
    BarChart3, Clock, Target, Flame, TrendingUp, TrendingDown,
    Calendar, Database, Trash2, Zap, CheckCircle2, Timer, Award
} from 'lucide-react'
import { staggerContainer, staggerItem, springBouncy, buttonPress } from '@/lib/animations'

// ─── Animated Counter ───
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
    const numericPart = parseInt(value) || 0
    const [display, setDisplay] = useState(0)
    const prevRef = useRef(0)
    useEffect(() => {
        const start = prevRef.current
        const diff = numericPart - start
        if (diff === 0) { setDisplay(numericPart); return }
        const startTime = performance.now()
        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / 800, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(start + diff * eased))
            if (progress < 1) requestAnimationFrame(animate)
            else prevRef.current = numericPart
        }
        requestAnimationFrame(animate)
    }, [numericPart])
    const rest = value.replace(/^\d+/, '')
    return <>{display}{rest}{suffix}</>
}

// ─── Trend Badge ───
function TrendBadge({ value, label }: { value: number; label: string }) {
    if (value === 0) return null
    const isUp = value > 0
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
            {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {Math.abs(value)}% {label}
        </span>
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

    // Only render chart content if we have dimensions
    if (!width || !height) return <div ref={containerRef} className="w-full h-full" />

    const maxVal = Math.max(...data.map(d => d.value), 1)
    const padding = { top: 12, bottom: 24, left: 8, right: 8 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartW,
        y: padding.top + chartH - (d.value / maxVal) * chartH,
        ...d,
    }))

    // Smooth curve using cubic bezier
    const linePath = points.reduce((path, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`
        const prev = points[i - 1]
        const cpx = (prev.x + p.x) / 2
        return `${path} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
    }, '')

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

    return (
        <div ref={containerRef} className="w-full h-full">
            <svg width={width} height={height} className="overflow-hidden">
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {/* Grid lines - use percentage for width to always span full */}
                {[0.25, 0.5, 0.75].map(frac => (
                    <line
                        key={frac}
                        x1={padding.left} y1={padding.top + chartH * (1 - frac)}
                        x2={width - padding.right} y2={padding.top + chartH * (1 - frac)}
                        stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}

                {/* Area fill */}
                <motion.path
                    d={areaPath}
                    fill="url(#areaGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                />

                {/* Line - explicit stroke width stays constant because coordinate system is 1:1 */}
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Dots - only show start, middle, end to avoid clutter if needed, or all */}
                {points.map((p, i) => (
                    <motion.circle
                        key={i}
                        cx={p.x} cy={p.y} r="3"
                        fill="hsl(var(--background))"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                    />
                ))}

                {/* Day labels - simplified to fit better */}
                {points.filter((_, i) => i % 2 === 0).map((p, i) => (
                    <text
                        key={i}
                        x={p.x} y={height - 5}
                        textAnchor="middle"
                        fill="hsl(var(--muted-foreground))"
                        fontSize="10"
                        fontWeight="500"
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
    const r = 54
    const circumference = 2 * Math.PI * r
    const strokeDashoffset = circumference * (1 - pct)

    return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
                    <motion.circle
                        cx="60" cy="60" r={r} fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[hsl(var(--foreground))]">
                        {Math.round(pct * 100)}%
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{sublabel}</span>
                </div>
            </div>
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
        </div>
    )
}

// ─── Horizontal Bar ───
function HorizontalBar({ label, value, maxValue, color, delay = 0 }: {
    label: string; value: number; maxValue: number; color: string; delay?: number
}) {
    return (
        <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-[hsl(var(--foreground))] w-24 shrink-0 truncate font-medium">{label}</span>
            <div className="flex-1 h-3 bg-[hsl(var(--muted)_/_0.3)] rounded-full overflow-hidden min-w-0">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / Math.max(maxValue, 1)) * 100}%` }}
                    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-10 shrink-0 text-right font-mono">
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
        'hsl(var(--primary) / 0.75)',
        'hsl(var(--primary) / 0.55)',
        'hsl(var(--primary) / 0.4)',
        'hsl(var(--primary) / 0.25)',
    ]

    // ═══════════════════════════════════════
    // ─── Render ───
    // ═══════════════════════════════════════
    return (
        <div className="max-w-5xl mx-auto space-y-5 pb-6">
            {/* ─── Header ─── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Analytics</h1>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Your productivity insights</p>
                </div>
                <div className="flex items-center gap-2">
                    {hasMockData ? (
                        <motion.button
                            onClick={clearMockData}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            variants={buttonPress} whileHover="hover" whileTap="tap"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear Mock Data
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={loadMockData}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)_/_0.2)] hover:bg-[hsl(var(--primary)_/_0.2)] transition-colors"
                            variants={buttonPress} whileHover="hover" whileTap="tap"
                        >
                            <Database className="w-3.5 h-3.5" /> Load Mock Data
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* ═══ Row 1: Stat Cards ═══ */}
            <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {[
                    { label: 'Total Focus', value: formatDuration(totalMinutes), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: weekChange, trendLabel: 'vs last wk' },
                    { label: 'Sessions', value: totalSessions.toString(), icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', sub: `${avgSessionMin}m avg` },
                    { label: 'Day Streak', value: streak.toString(), icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', sub: `${activeDays} active days` },
                    { label: 'Completion', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-500/10', sub: `${totalTasksDone}/${totalTasks} tasks` },
                ].map(({ label, value, icon: Icon, color, bg, trend, trendLabel, sub }) => (
                    <motion.div
                        key={label}
                        variants={staggerItem}
                        whileHover={{ y: -3 }}
                        transition={springBouncy}
                        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 cursor-default group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <motion.div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={springBouncy}
                            >
                                <Icon className={`w-4.5 h-4.5 ${color}`} />
                            </motion.div>
                            {trend !== undefined && <TrendBadge value={trend} label={trendLabel || ''} />}
                        </div>
                        <p className="text-2xl font-bold text-[hsl(var(--foreground))] leading-none">
                            <AnimatedCounter value={value} />
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
                            {sub && <p className="text-[10px] text-[hsl(var(--muted-foreground)_/_0.7)]">{sub}</p>}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ═══ Row 2: Weekly Bar Chart + Today Ring ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Weekly Bar Chart — 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[hsl(var(--primary))]" />
                            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Weekly Focus</h2>
                        </div>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                            avg {formatDuration(Math.round(last7Days.reduce((a, d) => a + d.minutes, 0) / 7))}/day
                        </span>
                    </div>
                    {/* Y-axis labels + bars */}
                    <div className="flex gap-2">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between text-[9px] text-[hsl(var(--muted-foreground))] font-mono w-8 text-right shrink-0" style={{ height: 160 }}>
                            <span>{formatDuration(maxMinutes)}</span>
                            <span>{formatDuration(Math.round(maxMinutes / 2))}</span>
                            <span>0m</span>
                        </div>
                        {/* Bars */}
                        <div className="flex-1 flex items-end gap-2 relative min-w-0">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: 160 }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="border-b border-[hsl(var(--border)_/_0.4)] border-dashed" />
                                ))}
                            </div>
                            {last7Days.map((day, i) => {
                                const todayIndex = (new Date().getDay() + 6) % 7 // Mon=0 ... Sun=6
                                const isToday = i === todayIndex
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 relative z-10 min-w-0">
                                        <div className="w-full relative" style={{ height: 160 }}>
                                            <motion.div
                                                className="absolute bottom-0 w-full rounded-t-lg group cursor-default"
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max((day.minutes / maxMinutes) * 100, day.minutes > 0 ? 3 : 0)}%` }}
                                                transition={{ duration: 0.7, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                                whileHover={{ scale: 1.08 }}
                                                style={{
                                                    background: isToday
                                                        ? 'hsl(var(--primary))'
                                                        : 'hsl(var(--primary) / 0.5)',
                                                }}
                                            >
                                                {/* Tooltip */}
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-2 py-1 text-[9px] whitespace-nowrap shadow-lg pointer-events-none transition-opacity z-20">
                                                    <span className="font-semibold text-[hsl(var(--foreground))]">{day.minutes}m</span>
                                                    <span className="text-[hsl(var(--muted-foreground))]"> · {day.sessions} sessions</span>
                                                </div>
                                            </motion.div>
                                        </div>
                                        <span className={`text-[10px] shrink-0 ${isToday ? 'text-[hsl(var(--primary))] font-bold' : 'text-[hsl(var(--muted-foreground))]'}`}>
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
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Today's Focus</h2>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* 14-Day Trend — 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
                            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">14-Day Trend</h2>
                        </div>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                            {dailyAvg}m daily avg
                        </span>
                    </div>
                    <div className="h-44">
                        <AreaChart data={last14Days} />
                    </div>
                </motion.div>

                {/* Peak Hours — 1 col */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Timer className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Peak Hours</h2>
                    </div>
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[hsl(var(--primary)_/_0.08)]">
                        <Award className="w-5 h-5 text-[hsl(var(--primary))]" />
                        <div>
                            <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                                {peakHour}:00 – {peakHour + 1}:00
                            </p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Most productive hour</p>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        {sessionsByHour.map((bucket, i) => (
                            <div key={bucket.label} className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[hsl(var(--muted-foreground))]">{bucket.label}</span>
                                    <span className="font-mono text-[hsl(var(--foreground))]">{bucket.count}</span>
                                </div>
                                <div className="h-1.5 bg-[hsl(var(--muted)_/_0.3)] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-[hsl(var(--primary))]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(bucket.count / maxBucket) * 100}%` }}
                                        transition={{ duration: 0.7, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ opacity: 0.4 + (bucket.count / maxBucket) * 0.6 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ═══ Row 4: Task Breakdown + Heatmap ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Task Breakdown — 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="lg:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
                            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Focus by Task</h2>
                        </div>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Top 5 tasks</span>
                    </div>
                    {taskBreakdown.length > 0 ? (
                        <div className="space-y-3">
                            {taskBreakdown.map((task, i) => (
                                <HorizontalBar
                                    key={i}
                                    label={task.title}
                                    value={task.minutes}
                                    maxValue={taskBreakdownMax}
                                    color={taskBarColors[i] || taskBarColors[4]}
                                    delay={0.6 + i * 0.08}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-20 text-xs text-[hsl(var(--muted-foreground))]">
                            No task data yet — link sessions to tasks
                        </div>
                    )}
                </motion.div>

                {/* Hourly Heatmap — 1 col */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Hour Map</h2>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                        {hourlyData.map((minutes, hour) => (
                            <motion.div
                                key={hour}
                                className="aspect-square rounded-md cursor-default relative group"
                                title={`${hour}:00 – ${Math.round(minutes)}min`}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.65 + hour * 0.02, ...springBouncy }}
                                whileHover={{ scale: 1.25, zIndex: 10 }}
                                style={{
                                    background: minutes > 0
                                        ? `hsl(var(--primary) / ${0.12 + (minutes / maxHourlyMinutes) * 0.88})`
                                        : 'hsl(var(--muted) / 0.25)',
                                }}
                            >
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md px-1.5 py-0.5 text-[8px] whitespace-nowrap shadow-lg pointer-events-none transition-opacity z-20 font-mono">
                                    {hour}h · {Math.round(minutes)}m
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[9px] text-[hsl(var(--muted-foreground))]">
                        <span>0h</span>
                        <div className="flex items-center gap-1">
                            <span>Less</span>
                            {[0.1, 0.3, 0.5, 0.7, 1].map(opacity => (
                                <div
                                    key={opacity}
                                    className="w-2.5 h-2.5 rounded-sm"
                                    style={{ background: `hsl(var(--primary) / ${opacity})` }}
                                />
                            ))}
                            <span>More</span>
                        </div>
                        <span>23h</span>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
