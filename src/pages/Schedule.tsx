import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { Calendar, Clock, BookOpen, MapPin } from 'lucide-react'
import { springBouncy } from '@/lib/animations'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = [
    { id: 'slot-1', time: '08:30 - 10:30' },
    { id: 'slot-2', time: '10:30 - 12:30' },
    { id: 'slot-3', time: '13:30 - 16:30' },
    { id: 'slot-4', time: '16:30 - 18:30' },
]

export function Schedule() {
    const schedule = useAppStore((s) => s.schedule)
    const updateScheduleEntry = useAppStore((s) => s.updateScheduleEntry)
    const settings = useAppStore((s) => s.settings)

    const themes = useAppStore((s) => s.themes)
    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isRetro = activeTheme?.style === 'retro'

    const getEntry = (day: string, slotId: string) => {
        return schedule.find(e => e.day === day && e.slotId === slotId)
    }

    const handleChange = (day: string, slotId: string, value: string) => {
        updateScheduleEntry({
            day,
            slotId,
            subject: value
        })
    }

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "flex items-center justify-between pb-4 border-b border-[hsl(var(--border))]",
                    isRetro ? "border-dashed" : ""
                )}
            >
                <div>
                    <h1 className={cn(
                        "text-2xl font-bold text-[hsl(var(--foreground))]",
                        isRetro ? "tracking-widest uppercase glow-text" : ""
                    )}>
                        {isRetro ? "CLASS_SCHEDULE_V1.0" : "Class Schedule"}
                    </h1>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                        Manage your weekly classes and subjects
                    </p>
                </div>
                <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={springBouncy}
                    className={cn(
                        "p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]",
                        isRetro ? "pipboy-border" : "shadow-sm"
                    )}
                >
                    <Calendar className="w-5 h-5 text-[hsl(var(--primary))]" />
                </motion.div>
            </motion.header>

            {/* Schedule Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex-1 overflow-auto bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-sm relative"
            >
                <div className="min-w-[800px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--card))] z-10">
                        <div className="p-4 font-bold text-center border-r border-[hsl(var(--border))] bg-[hsl(var(--muted)_/_0.5)]">
                            DAY
                        </div>
                        {SLOTS.map(slot => (
                            <div key={slot.id} className="p-4 flex flex-col items-center justify-center border-r border-[hsl(var(--border))] last:border-r-0 bg-[hsl(var(--muted)_/_0.3)]">
                                <span className={cn(
                                    "text-sm font-bold text-[hsl(var(--foreground))]",
                                    isRetro ? "tracking-wider" : ""
                                )}>
                                    {slot.time}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Days Rows */}
                    {DAYS.map((day, dayIndex) => (
                        <motion.div
                            key={day}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + dayIndex * 0.05, duration: 0.3 }}
                            className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--muted)_/_0.2)] transition-colors group"
                        >
                            <div className="p-4 flex items-center justify-center font-bold border-r border-[hsl(var(--border))] bg-[hsl(var(--muted)_/_0.1)] group-hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors">
                                {day.toUpperCase()}
                            </div>

                            {SLOTS.map(slot => {
                                const entry = getEntry(day, slot.id)
                                return (
                                    <div key={slot.id} className="p-2 border-r border-[hsl(var(--border))] last:border-r-0 relative">
                                        <div className="relative h-full">
                                            <input
                                                type="text"
                                                value={entry?.subject || ''}
                                                onChange={(e) => handleChange(day, slot.id, e.target.value)}
                                                placeholder="..."
                                                className={cn(
                                                    "w-full h-full min-h-[60px] bg-transparent text-center resize-none outline-none text-sm placeholder:text-[hsl(var(--muted-foreground)_/_0.3)] focus:bg-[hsl(var(--background)_/_0.5)] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:shadow-[0_0_12px_hsl(var(--primary)_/_0.15)] rounded-md transition-all",
                                                    entry?.subject ? "font-medium text-[hsl(var(--foreground))]" : ""
                                                )}
                                            />
                                            {entry?.subject && isRetro && (
                                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[hsl(var(--primary))]" />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
