/* ─── Utility Helpers ─── */

export function formatTime(seconds: number): string {
    const rounded = Math.ceil(seconds)
    const mins = Math.floor(rounded / 60)
    const secs = rounded % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getToday(): string {
    return new Date().toISOString().split('T')[0]
}

export function getWeekStart(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    return new Date(now.setDate(diff))
}

export function isSameDay(d1: string, d2: string): boolean {
    return d1.split('T')[0] === d2.split('T')[0]
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ')
}

export function priorityColor(priority: 'low' | 'medium' | 'high'): string {
    switch (priority) {
        case 'high': return 'text-red-400'
        case 'medium': return 'text-yellow-400'
        case 'low': return 'text-emerald-400'
    }
}

export function priorityBg(priority: 'low' | 'medium' | 'high'): string {
    switch (priority) {
        case 'high': return 'bg-red-500/10 border-red-500/20'
        case 'medium': return 'bg-yellow-500/10 border-yellow-500/20'
        case 'low': return 'bg-emerald-500/10 border-emerald-500/20'
    }
}
