/* ─── Type Definitions for DeepWork ─── */

export interface Settings {
    workDuration: number        // minutes
    shortBreakDuration: number  // minutes
    longBreakDuration: number   // minutes
    sessionsBeforeLongBreak: number
    notificationsEnabled: boolean
    soundEnabled: boolean
    selectedThemeId: string
    autoStartBreaks: boolean
    autoStartWork: boolean
    debugSpeed: boolean
}

export interface Task {
    id: string
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    tags: string[]
    estimatedPomodoros: number
    completedPomodoros: number
    status: 'todo' | 'in-progress' | 'done'
    createdAt: string   // ISO date
    completedAt?: string
}

export interface Session {
    id: string
    taskId?: string
    type: 'work' | 'shortBreak' | 'longBreak'
    duration: number    // seconds planned
    elapsed: number     // seconds actually focused
    startedAt: string   // ISO date
    endedAt?: string
    completed: boolean
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'
export type TimerMode = 'work' | 'shortBreak' | 'longBreak'

export interface TimerState {
    status: TimerStatus
    mode: TimerMode
    remaining: number          // seconds remaining
    totalDuration: number      // seconds
    sessionCount: number       // completed work sessions in current cycle
    lastTick?: number          // timestamp of last tick for drift compensation
}

export interface ThemeColors {
    background: string
    foreground: string
    card: string
    cardForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
}

export interface AppTheme {
    id: string
    name: string
    colors: ThemeColors
    font: string
    radius: string
    timerStyle: 'circle' | 'minimal' | 'digital'
    style: 'modern' | 'retro' | 'deadpool' | 'liquid-glass'
    customBackground?: string  // CSS gradient or image URL
    isBuiltIn: boolean
}

export interface CosmeticItem {
    id: string
    name: string
    type: 'visor' | 'skin' | 'background' | 'head'
    price: number
    description: string
}

export interface Mission {
    id: string
    type: 'focus_time' | 'task_completion' | 'interact'
    target: number
    progress: number
    reward: number
    completed: boolean
    title: string
    description: string
}

export interface PetState {
    name: string
    level: number
    xp: number
    totalXp: number // Next level requirement
    animState: 'idle' | 'sleeping' | 'focusing' | 'happy' | 'sad' | 'low-power' | 'celebration'
    lastCompletedSessionAt?: string
    credits: number
    ownedItems: string[]
    equippedItems: Record<string, string> // e.g. { visor: 'visor_cyber', skin: 'skin_neon' }
}

export interface AppData {
    settings: Settings
    tasks: Task[]
    sessions: Session[]
    themes: AppTheme[]
    timer: TimerState
    activeTaskId: string | null
    schedule: ScheduleEntry[]
    pet: PetState // Virtual companion
    dailyMissions: Mission[]
    lastMissionReset: string
}

export interface ScheduleEntry {
    day: string // 'Mon', 'Tue', etc.
    slotId: string // '08:30-10:30', etc.
    subject: string
    room?: string
}

/* ─── Electron API Bridge ─── */
export interface ElectronAPI {
    minimize: () => void
    maximize: () => void
    close: () => void
    focusWindow: () => void
    onToggleTimer: (callback: () => void) => () => void
    saveData: (data: any) => Promise<boolean>
    loadData: () => Promise<any>
    // Mini mode
    openMini: () => void
    closeMini: () => void
    sendTimerState: (state: MiniTimerState) => void
    onTimerState: (callback: (state: MiniTimerState) => void) => () => void
    sendTimerControl: (action: string) => void
    onTimerControl: (callback: (action: string) => void) => () => void
    setIgnoreMouseEvents: (ignore: boolean, opts?: { forward: boolean }) => void
    startDrag: (screenX: number, screenY: number) => void
    dragMove: (screenX: number, screenY: number) => void
    dragEnd: () => void
}

export interface MiniTimerState {
    remaining: number
    totalDuration: number
    status: TimerStatus
    mode: TimerMode
    lastTick?: number
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI
    }
}
