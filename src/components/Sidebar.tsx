import {
    LayoutDashboard, Timer, ListTodo, BarChart3, Palette, Settings, Radio, Calendar
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { springBouncy, staggerContainer, staggerItem } from '@/lib/animations'

type Page = 'dashboard' | 'timer' | 'tasks' | 'analytics' | 'themes' | 'settings' | 'schedule'

const navItems: { id: Page; label: string; icon: LucideIcon }[] = [
    { id: 'dashboard', label: 'STAT', icon: LayoutDashboard },
    { id: 'timer', label: 'V.A.T.S.', icon: Timer },
    { id: 'schedule', label: 'LOGS', icon: Calendar },
    { id: 'tasks', label: 'QUESTS', icon: ListTodo },
    { id: 'analytics', label: 'DATA', icon: BarChart3 },
    { id: 'themes', label: 'DISPLAY', icon: Palette },
    { id: 'settings', label: 'CONFIG', icon: Settings },
]

interface SidebarProps {
    currentPage: Page
    onNavigate: (page: Page) => void
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
    const timer = useAppStore((s) => s.timer)
    const settings = useAppStore((s) => s.settings)
    const themes = useAppStore((s) => s.themes)
    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isRetro = activeTheme?.style === 'retro'
    const isDeadpool = activeTheme?.style === 'deadpool'
    const isLiquidGlass = activeTheme?.style === 'liquid-glass'

    const sessionCount = timer.sessionCount
    const sessionsBeforeLong = settings.sessionsBeforeLongBreak

    const cycleDone = sessionCount % sessionsBeforeLong
    const cyclePercent = Math.round((cycleDone / sessionsBeforeLong) * 100)

    const getLabel = (id: Page, defaultLabel: string) => {
        if (!isRetro) {
            const map: Record<string, string> = {
                dashboard: 'Dashboard',
                timer: 'Timer',
                schedule: 'Schedule',
                tasks: 'Tasks',
                analytics: 'Analytics',
                themes: 'Themes',
                settings: 'Settings'
            }
            if (isDeadpool) {
                const deadpoolMap: Record<string, string> = {
                    dashboard: 'HIDEOUT',
                    timer: 'KA-BOOM',
                    schedule: 'PLANS',
                    tasks: 'MISSIONS',
                    analytics: 'STATS',
                    themes: 'SUITS',
                    settings: 'VOICES'
                }
                return deadpoolMap[id] || defaultLabel
            }
            if (isLiquidGlass) {
                const glassMap: Record<string, string> = {
                    dashboard: 'Overview',
                    timer: 'Focus',
                    schedule: 'Planner',
                    tasks: 'Flow',
                    analytics: 'Insights',
                    themes: 'Appearance',
                    settings: 'Preferences'
                }
                return glassMap[id] || defaultLabel
            }
            return map[id] || defaultLabel
        }
        return defaultLabel
    }

    return (
        <aside className="w-[220px] shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col">
            {/* Branding */}
            <div className="p-4 border-b border-[hsl(var(--border))]">
                <motion.div
                    className="flex items-center gap-2 mb-1"
                    whileHover={{ x: 2 }}
                    transition={springBouncy}
                >
                    <motion.div
                        whileHover={{ rotate: 180, scale: 1.2 }}
                        transition={springBouncy}
                    >
                        <Radio className="w-4 h-4 text-[hsl(var(--primary))]" />
                    </motion.div>
                    <span className={cn(
                        "text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]",
                        isRetro ? "tracking-[0.2em]" : ""
                    )}>
                        {isRetro ? "VAULT-TEC INDUSTRIES" : isDeadpool ? "X-FORCE INT." : isLiquidGlass ? "DeepWork" : "DeepWork"}
                    </span>
                </motion.div>
                <p className={cn(
                    "font-bold text-[hsl(var(--foreground))]",
                    isRetro ? "text-sm glow-text tracking-wider" : isDeadpool ? "text-sm font-bangers tracking-wide" : "text-xs opacity-80"
                )}>
                    {isRetro ? "PIP-BOY 3000" : isDeadpool ? "MERC-OS v69.0" : isLiquidGlass ? "Glass Edition" : "Productivity Suite"}
                </p>
            </div>

            {/* Navigation Tabs */}
            <motion.nav
                className={cn("flex flex-col py-2 flex-1", !isRetro && "gap-1 px-2")}
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = currentPage === id
                    const displayLabel = getLabel(id, label)

                    return (
                        <motion.button
                            key={id}
                            variants={staggerItem}
                            onClick={() => onNavigate(id)}
                            whileHover={{ x: isRetro ? 0 : 3 }}
                            whileTap={{ scale: 0.97 }}
                            transition={springBouncy}
                            className={cn(
                                'w-full flex items-center gap-3 text-left transition-colors relative',
                                isRetro ? (
                                    isActive
                                        ? 'px-3 py-2.5 bg-[hsl(var(--primary)_/_0.12)] border-l-2 border-l-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                                        : 'px-3 py-2.5 border-l-2 border-l-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                                ) : (
                                    isActive
                                        ? 'px-3 py-2 rounded-lg text-[hsl(var(--primary-foreground))]'
                                        : 'px-3 py-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                                )
                            )}
                        >
                            {/* Animated active background pill */}
                            {isActive && !isRetro && (
                                <motion.div
                                    layoutId="sidebar-active-pill"
                                    className="absolute inset-0 rounded-lg bg-[hsl(var(--primary))] shadow-md"
                                    transition={springBouncy}
                                />
                            )}

                            {isRetro && (
                                <span className={cn('text-xs relative z-10', isActive ? 'text-[hsl(var(--primary))]' : '')}>
                                    {isActive ? '>' : ' '}
                                </span>
                            )}
                            <Icon className={cn(
                                'w-4 h-4 relative z-10',
                                isRetro && isActive ? 'text-[hsl(var(--primary))]' : ''
                            )} />
                            <span className={cn(
                                'relative z-10',
                                isRetro ? 'text-xs uppercase tracking-[0.15em]' : 'text-sm font-medium',
                                isRetro && isActive ? 'glow-text' : ''
                            )}>
                                {displayLabel}
                            </span>
                        </motion.button>
                    )
                })}
            </motion.nav>

            {/* Cycle Progress — Terminal Readout */}
            <div className="p-3 border-t border-[hsl(var(--border))]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">
                        CYCLE
                    </span>
                    <span className="text-xs text-[hsl(var(--foreground))]">
                        {cycleDone}/{sessionsBeforeLong}
                    </span>
                </div>

                <div className="h-1.5 bg-[hsl(var(--muted))] overflow-hidden rounded-full">
                    <motion.div
                        className="h-full bg-[hsl(var(--primary))]"
                        initial={{ width: 0 }}
                        animate={{ width: `${cyclePercent}%` }}
                        transition={springBouncy}
                    />
                </div>

                <div className="grid grid-cols-4 gap-1 mt-2">
                    {Array.from({ length: sessionsBeforeLong }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={i < cycleDone ? { scale: 0 } : {}}
                            animate={i < cycleDone ? { scale: 1 } : {}}
                            transition={{ ...springBouncy, delay: i * 0.05 }}
                            className={cn(
                                'h-1.5 rounded-sm',
                                i < cycleDone
                                    ? 'bg-[hsl(var(--primary))] shadow-[0_0_4px_hsl(var(--primary)_/_0.4)]'
                                    : 'bg-[hsl(var(--muted))]'
                            )}
                        />
                    ))}
                </div>
            </div>
        </aside>
    )
}
