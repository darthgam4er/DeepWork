import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { exportData, importData } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { Download, Upload, RotateCcw, Bell, Volume2, Zap, Monitor, Laptop, Play } from 'lucide-react'
import { staggerContainer, staggerItem, springBouncy, buttonPress } from '@/lib/animations'
import { playThemeWorkComplete, playThemeBreakComplete, playTimerStart, playTimerSkip } from '@/lib/sounds'

export function SettingsPage() {
    const settings = useAppStore((s) => s.settings)
    const updateSettings = useAppStore((s) => s.updateSettings)
    const _hydrate = useAppStore((s) => s._hydrate)

    const themes = useAppStore((s) => s.themes)
    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isDeadpool = activeTheme?.style === 'deadpool'

    const handleExport = () => {
        const data = exportData()
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = isDeadpool ? `deadpool-plans-${new Date().toISOString().split('T')[0]}.json` : `deepwork-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => {
                try {
                    importData(ev.target?.result as string)
                    _hydrate()
                } catch { /* ignore */ }
            }
            reader.readAsText(file)
        }
        input.click()
    }

    const handleReset = () => {
        if (confirm('This will clear all your data. Are you sure?')) {
            localStorage.removeItem('deepwork_data')
            _hydrate()
        }
    }

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                'w-12 h-7 rounded-full transition-colors duration-300 relative shadow-inner',
                checked ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--secondary))]'
            )}
        >
            <motion.div
                className="w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm"
                initial={false}
                animate={{ x: checked ? 22 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </button>
    )

    const NumberInput = ({ value, onChange, min, max, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; suffix: string }) => {
        const [localValue, setLocalValue] = React.useState(value)

        // Sync local state if external value changes (e.g. reset)
        React.useEffect(() => {
            setLocalValue(value)
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(parseInt(e.target.value))
        }

        const handleCommit = () => {
            if (localValue !== value) {
                onChange(localValue)
            }
        }

        return (
            <div className="flex items-center gap-4 bg-[hsl(var(--secondary)_/_0.5)] p-2 pr-4 rounded-xl border border-[hsl(var(--border))]">
                <input
                    type="range"
                    value={localValue}
                    onChange={handleChange}
                    onMouseUp={handleCommit}
                    onTouchEnd={handleCommit}
                    min={min}
                    max={max}
                    className="flex-1 accent-[hsl(var(--primary))] h-2 rounded-lg"
                />
                <span className="text-sm font-mono font-semibold text-[hsl(var(--foreground))] min-w-[3rem] text-right">
                    {localValue}{suffix}
                </span>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className={cn(
                    "text-3xl font-bold text-[hsl(var(--foreground))]",
                    isDeadpool && "uppercase tracking-tighter text-[hsl(var(--primary))]"
                )} style={isDeadpool ? { fontFamily: 'Bangers' } : {}}>
                    {isDeadpool ? 'CLASSIFIED CONFIG' : 'Settings'}
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                    {isDeadpool ? 'Don\'t touch my stuff... okay, maybe a little.' : 'Customize your DeepWork experience'}
                </p>
            </motion.div>

            <motion.div
                className="grid gap-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {/* Timer Settings */}
                <motion.section variants={staggerItem} className="glass-panel rounded-3xl p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[hsl(var(--primary))]" />
                        {isDeadpool ? 'EXPLOSIVE TIMERS' : 'Timer Configuration'}
                    </h2>

                    <div className="grid gap-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-2">Work Duration</label>
                                <NumberInput value={settings.workDuration} onChange={(v) => updateSettings({ workDuration: v })} min={1} max={90} suffix="m" />
                            </div>
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-2">Long Break Interval</label>
                                <NumberInput value={settings.sessionsBeforeLongBreak} onChange={(v) => updateSettings({ sessionsBeforeLongBreak: v })} min={2} max={8} suffix="s" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-2">Short Break</label>
                                <NumberInput value={settings.shortBreakDuration} onChange={(v) => updateSettings({ shortBreakDuration: v })} min={1} max={15} suffix="m" />
                            </div>
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-2">Long Break</label>
                                <NumberInput value={settings.longBreakDuration} onChange={(v) => updateSettings({ longBreakDuration: v })} min={5} max={30} suffix="m" />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[hsl(var(--border))]" />

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-sm font-medium text-[hsl(var(--foreground))]">Auto-start Breaks</span>
                                <span className="block text-xs text-[hsl(var(--muted-foreground))]">Automatically start break timer when work ends</span>
                            </div>
                            <Toggle checked={settings.autoStartBreaks} onChange={(v) => updateSettings({ autoStartBreaks: v })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-sm font-medium text-[hsl(var(--foreground))]">Auto-start Work</span>
                                <span className="block text-xs text-[hsl(var(--muted-foreground))]">Automatically start work timer when break ends</span>
                            </div>
                            <Toggle checked={settings.autoStartWork} onChange={(v) => updateSettings({ autoStartWork: v })} />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border)_/_0.5)]">
                            <div>
                                <span className="block text-sm font-medium text-[hsl(var(--foreground))]">Debug Speed (10x)</span>
                                <span className="block text-xs text-[hsl(var(--muted-foreground))]">Speed up timer for testing purposes</span>
                            </div>
                            <Toggle checked={settings.debugSpeed} onChange={(v) => updateSettings({ debugSpeed: v })} />
                        </div>
                    </div>
                </motion.section>

                {/* Notifications & Sound */}
                <motion.section variants={staggerItem} className="glass-panel rounded-3xl p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[hsl(var(--primary))]" />
                        Notifications & Sound
                    </h2>

                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[hsl(var(--secondary)_/_0.3)] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                                    <Monitor className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-[hsl(var(--foreground))]">Desktop Notifications</span>
                                    <span className="block text-xs text-[hsl(var(--muted-foreground))]">Get notified when timer completes</span>
                                </div>
                            </div>
                            <Toggle checked={settings.notificationsEnabled} onChange={(v) => updateSettings({ notificationsEnabled: v })} />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[hsl(var(--secondary)_/_0.3)] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                                    <Volume2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-[hsl(var(--foreground))]">Sound Effects</span>
                                    <span className="block text-xs text-[hsl(var(--muted-foreground))]">Play sounds for timer events</span>
                                </div>
                            </div>
                            <Toggle checked={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
                        </div>

                        {/* Sound test buttons */}
                        {settings.soundEnabled && (
                            <div className="ml-11 flex flex-wrap gap-2">
                                {[
                                    { label: 'Start', fn: playTimerStart },
                                    { label: 'Work Done', fn: () => playThemeWorkComplete(activeTheme?.style) },
                                    { label: 'Break Done', fn: () => playThemeBreakComplete(activeTheme?.style) },
                                    { label: 'Skip', fn: playTimerSkip },
                                ].map(({ label, fn }) => (
                                    <button
                                        key={label}
                                        onClick={fn}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                            bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]
                                            hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)_/_0.8)]
                                            transition-colors active:scale-95"
                                    >
                                        <Play className="w-3 h-3" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Data Management */}
                <motion.section variants={staggerItem} className="glass-panel rounded-3xl p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                        <Laptop className="w-5 h-5 text-[hsl(var(--primary))]" />
                        Data & Storage
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <motion.button onClick={handleExport} {...buttonPress} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[hsl(var(--secondary)_/_0.5)] border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors group">
                            <Download className="w-6 h-6 text-[hsl(var(--primary))] mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Export Data</span>
                        </motion.button>
                        <motion.button onClick={handleImport} {...buttonPress} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[hsl(var(--secondary)_/_0.5)] border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors group">
                            <Upload className="w-6 h-6 text-[hsl(var(--primary))] mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Import Data</span>
                        </motion.button>
                    </div>

                    <div className="pt-2">
                        <motion.button
                            onClick={handleReset}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.97, rotate: [0, -1, 1, -1, 0] }}
                            transition={springBouncy}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all font-medium text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset All Data to Defaults
                        </motion.button>
                    </div>
                </motion.section>

                {/* Shortcuts */}
                <div className="text-center pb-4">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Pro Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-mono mx-1">Ctrl+Shift+P</kbd> to toggle the timer instantly
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
