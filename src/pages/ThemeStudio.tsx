import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { AppTheme, ThemeColors } from '@/types'
import { cn } from '@/lib/utils'
import { Check, Plus, Trash2, Download, Upload, Palette, Monitor, Laptop, Smartphone, Save, X, RefreshCcw, LayoutTemplate } from 'lucide-react'
import { staggerContainer, staggerItem, scaleIn, backdropVariants, springBouncy, buttonPress } from '@/lib/animations'

// ─── Constants & Utilities ───

const defaultCustomColors: ThemeColors = {
    background: '240 10% 4%',
    foreground: '0 0% 95%',
    card: '240 6% 8%',
    cardForeground: '0 0% 95%',
    primary: '16 90% 55%',
    primaryForeground: '0 0% 100%',
    secondary: '240 5% 14%',
    secondaryForeground: '0 0% 90%',
    muted: '240 5% 14%',
    mutedForeground: '240 5% 55%',
    accent: '16 60% 20%',
    accentForeground: '16 90% 70%',
    destructive: '0 62% 50%',
    destructiveForeground: '0 0% 100%',
    border: '240 5% 16%',
    input: '240 5% 16%',
    ring: '16 90% 55%',
}

const colorGroups = {
    base: {
        label: 'Base Colors',
        keys: ['background', 'foreground', 'card', 'cardForeground'] as (keyof ThemeColors)[],
    },
    brand: {
        label: 'Brand & Accents',
        keys: ['primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground'] as (keyof ThemeColors)[],
    },
    ui: {
        label: 'UI Elements',
        keys: ['border', 'input', 'ring', 'muted', 'mutedForeground'] as (keyof ThemeColors)[],
    },
    status: {
        label: 'Status',
        keys: ['destructive', 'destructiveForeground'] as (keyof ThemeColors)[],
    },
}

const colorLabels: Record<keyof ThemeColors, string> = {
    background: 'Background',
    foreground: 'Text',
    card: 'Card',
    cardForeground: 'Card Text',
    primary: 'Primary',
    primaryForeground: 'Primary Text',
    secondary: 'Secondary',
    secondaryForeground: 'Secondary Text',
    muted: 'Muted',
    mutedForeground: 'Muted Text',
    accent: 'Accent',
    accentForeground: 'Accent Text',
    destructive: 'Danger',
    destructiveForeground: 'Danger Text',
    border: 'Border',
    input: 'Input',
    ring: 'Focus Ring',
}

function hslStringToHex(hsl: string): string {
    const parts = hsl.split(' ').map(parseFloat)
    if (parts.length < 3) return '#888888'
    const h = parts[0], s = parts[1] / 100, l = parts[2] / 100
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

function hexToHslString(hex: string): string {
    let r = parseInt(hex.slice(1, 3), 16) / 255
    let g = parseInt(hex.slice(3, 5), 16) / 255
    let b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
            case g: h = ((b - r) / d + 2); break
            case b: h = ((r - g) / d + 4); break
        }
        h /= 6
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

// ─── Sub-Components ───

const ThemeCard = ({ theme, isActive, onClick, onEdit, onExport, onDelete }: any) => (
    <motion.div
        className={cn(
            'group relative overflow-hidden rounded-2xl border cursor-pointer',
            isActive
                ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)_/_0.2)] shadow-xl'
                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.5)] hover:shadow-lg'
        )}
        onClick={onClick}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springBouncy}
    >
        {/* Preview Background */}
        <div className="h-24 w-full relative overflow-hidden" style={{ background: `hsl(${theme.colors.background})` }}>
            {/* Abstract Shapes for Preview */}
            <div className="absolute top-4 left-4 w-16 h-16 rounded-xl shadow-sm" style={{ background: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})`, borderWidth: 1 }} />
            <div className="absolute top-8 right-8 w-10 h-10 rounded-full shadow-sm" style={{ background: `hsl(${theme.colors.primary})` }} />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-4 rounded-t-lg opacity-50" style={{ background: `hsl(${theme.colors.secondary})` }} />
        </div>

        {/* Info Content */}
        <div className="p-4 bg-[hsl(var(--card))] relative">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] truncate pr-2">{theme.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                        {theme.isBuiltIn ? <LayoutTemplate className="w-3 h-3" /> : <Palette className="w-3 h-3" />}
                        {theme.isBuiltIn ? 'System' : 'Custom'}
                    </p>
                </div>
                {isActive && (
                    <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shadow-lg">
                        <Check className="w-3.5 h-3.5 text-[hsl(var(--primary-foreground))]" />
                    </div>
                )}
            </div>

            {/* Actions (Only for custom themes or active state) */}
            <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {!theme.isBuiltIn && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(theme) }} className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors" title="Edit Theme" aria-label="Edit Theme">
                            <Palette className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(theme.id) }} className="p-2 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors" title="Delete Theme" aria-label="Delete Theme">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
                <button onClick={(e) => { e.stopPropagation(); onExport(theme) }} className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors ml-auto" title="Export Theme" aria-label="Export Theme">
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>
    </motion.div>
)

const LivePreview= ({ colors, radius, font }: { colors: ThemeColors, radius: string, font: string }) => {
    // Helper to generate style object scope
    const s = (colorKey: keyof ThemeColors) => `hsl(${colors[colorKey]})`

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden border shadow-2xl relative"
            style={{
                fontFamily: font,
                background: s('background'),
                borderColor: s('border')
            }}>
            {/* Fake App Window */}
            <div className="flex h-full">
                {/* Fake Sidebar */}
                <div className="w-16 flex flex-col items-center py-4 border-r"
                    style={{
                        background: s('card'),
                        borderColor: s('border')
                    }}>
                    <div className="w-8 h-8 rounded-xl mb-6 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]" style={{
                        background: `linear-gradient(135deg, ${s('primary')}, ${s('accent')})`
                    }} />
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-lg mb-3 opacity-60" style={{ background: s('secondary') }} />
                    ))}
                </div>

                {/* Fake Main Content */}
                <div className="flex-1 p-6 flex flex-col gap-6">
                    {/* Fake Header */}
                    <div className="flex justify-between items-center">
                        <div className="w-32 h-6 rounded-md opacity-20" style={{ background: s('foreground') }} />
                        <div className="w-8 h-8 rounded-full border" style={{ borderColor: s('border') }} />
                    </div>

                    {/* Fake Timer Card */}
                    <div className="flex-1 rounded-2xl border relative flex items-center justify-center p-8"
                        style={{
                            background: s('card'),
                            borderColor: s('border'),
                            borderRadius: radius
                        }}>
                        <div className="w-48 h-48 rounded-full border-4 flex items-center justify-center relative"
                            style={{ borderColor: s('secondary') }}>
                            <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin-slow"
                                style={{ borderColor: s('primary') }} />
                            <div className="text-3xl font-bold" style={{ color: s('foreground') }}>25:00</div>
                        </div>
                    </div>

                    {/* Fake Buttons */}
                    <div className="flex justify-center gap-4">
                        <div className="px-6 py-2 rounded-xl font-medium shadow-md"
                            style={{
                                background: s('primary'),
                                color: s('primaryForeground'),
                                borderRadius: radius
                            }}>
                            Start Focus
                        </div>
                        <div className="px-6 py-2 rounded-xl font-medium border"
                            style={{
                                background: s('secondary'),
                                color: s('foreground'),
                                borderColor: s('border'),
                                borderRadius: radius
                            }}>
                            Reset
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Label */}
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur text-white text-[10px] rounded uppercase tracking-wider font-bold pointer-events-none">
                Live Preview
            </div>
        </div>
    )
}

// ─── Main Component ───

export function ThemeStudio() {
    const themes = useAppStore((s) => s.themes)
    const settings = useAppStore((s) => s.settings)
    const updateSettings = useAppStore((s) => s.updateSettings)
    const addTheme = useAppStore((s) => s.addTheme)
    const updateTheme = useAppStore((s) => s.updateTheme)
    const deleteTheme = useAppStore((s) => s.deleteTheme)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editColors, setEditColors] = useState<ThemeColors>({ ...defaultCustomColors })
    const [editName, setEditName] = useState('')
    const [editFont, setEditFont] = useState('Space Grotesk')
    const [editRadius, setEditRadius] = useState('0.75rem')
    const [activeTab, setActiveTab] = useState<'base' | 'brand' | 'ui'>('base')

    const startCreating = () => {
        setEditingId('new')
        setEditName('New Theme')
        setEditColors({ ...defaultCustomColors })
        setEditFont('Space Grotesk')
        setEditRadius('0.75rem')
    }

    const startEditing = (theme: AppTheme) => {
        setEditingId(theme.id)
        setEditName(theme.name)
        setEditColors({ ...theme.colors })
        setEditFont(theme.font)
        setEditRadius(theme.radius)
    }

    const saveTheme = () => {
        if (editingId === 'new') {
            addTheme({ name: editName, colors: editColors, font: editFont, radius: editRadius, timerStyle: 'circle', style: 'modern' })
        } else if (editingId) {
            updateTheme(editingId, { name: editName, colors: editColors, font: editFont, radius: editRadius })
        }
        setEditingId(null)
    }

    const handleExportTheme = (theme: AppTheme) => {
        const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleImportTheme = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => {
                try {
                    const theme = JSON.parse(ev.target?.result as string) as AppTheme
                    addTheme({
                        name: theme.name,
                        colors: theme.colors,
                        font: theme.font,
                        radius: theme.radius,
                        timerStyle: theme.timerStyle,
                        style: theme.style || 'modern'
                    })
                } catch { /* ignore invalid */ }
            }
            reader.readAsText(file)
        }
        input.click()
    }

    // Render Editor Mode
    if (editingId) {
        return (
            <AnimatePresence>
                <motion.div
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                >
                    <motion.div
                        variants={scaleIn}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-6xl h-full max-h-[90vh] bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-3xl shadow-2xl flex overflow-hidden"
                    >

                    {/* Left: Controls */}
                    <div className="w-[400px] flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card)_/_0.5)]">
                        {/* Editor Header */}
                        <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold font-display">Theme Editor</h1>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">Design your perfect workspace</p>
                            </div>
                            <button onClick={() => setEditingId(null)} className="p-2 hover:bg-[hsl(var(--secondary))] rounded-full transition-colors" title="Close" aria-label="Close Editor">
                                <X className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                            </button>
                        </div>

                        {/* Editor Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Meta */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">Theme Name</label>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                        placeholder="My Awesome Theme"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">Typography</label>
                                        <select value={editFont} onChange={(e) => setEditFont(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none">
                                            <option>Space Grotesk</option>
                                            <option>JetBrains Mono</option>
                                            <option>Share Tech Mono</option>
                                            <option>Bangers</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">Roundness</label>
                                        <select value={editRadius} onChange={(e) => setEditRadius(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none">
                                            <option value="0rem">Sharp</option>
                                            <option value="0.5rem">Small</option>
                                            <option value="0.75rem">Medium</option>
                                            <option value="1rem">Large</option>
                                            <option value="1.5rem">Full</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="space-y-4">
                                <label className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">Color Palette</label>

                                {/* Tabs */}
                                <div className="flex p-1 bg-[hsl(var(--secondary))] rounded-xl mb-4 relative">
                                    {(['base', 'brand', 'ui'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all relative z-10',
                                                activeTab === tab
                                                    ? 'text-[hsl(var(--foreground))]'
                                                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                            )}
                                        >
                                            {activeTab === tab && (
                                                <motion.div
                                                    layoutId="theme-tab-indicator"
                                                    className="absolute inset-0 bg-[hsl(var(--background))] rounded-lg shadow-sm"
                                                    transition={springBouncy}
                                                />
                                            )}
                                            <span className="relative z-10">{colorGroups[tab].label}</span>
                                        </button>
                                    ))}
                                </div>

                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-3"
                                >
                                    {colorGroups[activeTab].keys.map((key) => (
                                        <div key={key} className="flex items-center gap-3">
                                            <div className="relative group">
                                                <input
                                                    type="color"
                                                    value={hslStringToHex(editColors[key])}
                                                    onChange={(e) => setEditColors({ ...editColors, [key]: hexToHslString(e.target.value) })}
                                                    className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                                                    aria-label={colorLabels[key]}
                                                />
                                                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 pointer-events-none" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[hsl(var(--foreground))]">{colorLabels[key]}</p>
                                                <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase opacity-70">
                                                    {hslStringToHex(editColors[key])}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>

                        {/* Editor Footer */}
                        <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                            <motion.button
                                onClick={saveTheme}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)_/_0.2)]"
                                variants={buttonPress}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <Save className="w-4 h-4" /> Save Theme
                            </motion.button>
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="flex-1 bg-[hsl(var(--secondary)_/_0.3)] p-12 flex items-center justify-center relative bg-grid-pattern">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 pointer-events-none" />
                        <div className="w-full h-full max-w-[800px] max-h-[600px] shadow-2xl rounded-2xl transform transition-transform duration-500 hover:scale-[1.01]">
                            <LivePreview colors={editColors} radius={editRadius} font={editFont} />
                        </div>
                    </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        )
    }

    // Render Grid View
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div>
                    <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
                        <motion.span whileHover={{ rotate: 20, scale: 1.15 }} transition={springBouncy}>
                            <Palette className="w-8 h-8 text-[hsl(var(--primary))]" />
                        </motion.span>
                        Theme Studio
                    </h1>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 max-w-md">
                        Personalize your DeepWork experience. Choose from our curated collection or craft your own unique visual style.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        onClick={handleImportTheme}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-sm font-medium hover:bg-[hsl(var(--accent))] transition-all group"
                        variants={buttonPress}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> Import
                    </motion.button>
                    <motion.button
                        onClick={startCreating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)_/_0.25)] transition-all group"
                        variants={buttonPress}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Create New
                    </motion.button>
                </div>
            </motion.div>

            {/* Gallery */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {themes.map((theme, idx) => (
                    <motion.div key={theme.id} variants={staggerItem}>
                        <ThemeCard
                            theme={theme}
                            isActive={settings.selectedThemeId === theme.id}
                            onClick={() => updateSettings({ selectedThemeId: theme.id })}
                            onEdit={startEditing}
                            onExport={handleExportTheme}
                            onDelete={deleteTheme}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    )
}
