/* ─── Main Application Store (Zustand) ─── */
import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { Settings, Task, Session, AppTheme, TimerState, TimerMode, ScheduleEntry } from '@/types'
import { loadDataAsync, saveDataAsync } from '@/lib/storage'
import { defaultSettings, builtInThemes } from '@/lib/themes'
import { playWorkComplete, playBreakComplete, playTimerStart, playTimerPause, playTimerSkip, playDeadpoolWorkComplete, playDeadpoolBreakComplete, warmupAudio } from '@/lib/sounds'

interface AppStore {
    // ─── Settings ───
    settings: Settings
    updateSettings: (partial: Partial<Settings>) => void

    // ─── Tasks ───
    tasks: Task[]
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros' | 'status'>) => void
    updateTask: (id: string, partial: Partial<Task>) => void
    deleteTask: (id: string) => void
    completeTask: (id: string) => void
    incrementTaskPomodoro: (id: string) => void

    // ─── Sessions ───
    sessions: Session[]
    addSession: (session: Omit<Session, 'id'>) => void

    // ─── Themes ───
    themes: AppTheme[]
    addTheme: (theme: Omit<AppTheme, 'id' | 'isBuiltIn'>) => void
    updateTheme: (id: string, partial: Partial<AppTheme>) => void
    deleteTheme: (id: string) => void

    // ─── Timer ───
    timer: TimerState
    activeTaskId: string | null
    setActiveTask: (id: string | null) => void
    startTimer: (mode?: TimerMode) => void
    pauseTimer: () => void
    resumeTimer: () => void
    resetTimer: () => void
    tick: () => void
    completeTimer: () => void
    skipToNext: () => void
    setMode: (mode: TimerMode) => void

    // ─── Completion Popup ───
    completionPopup: { visible: boolean; mode: TimerMode; duration: number } | null
    dismissCompletionPopup: () => void

    // ─── Schedule ───
    schedule: ScheduleEntry[]
    updateScheduleEntry: (entry: ScheduleEntry) => void

    // ─── Persistence ───
    _persist: () => void
    _hydrate: () => void

    // ─── Mock Data ───
    loadMockData: () => void
    clearMockData: () => void
}

function getDuration(mode: TimerMode, settings: Settings): number {
    switch (mode) {
        case 'work': return settings.workDuration * 60
        case 'shortBreak': return settings.shortBreakDuration * 60
        case 'longBreak': return settings.longBreakDuration * 60
    }
}

export const useAppStore = create<AppStore>((set, get) => ({
    // ─── Initial State ───
    settings: { ...defaultSettings },
    tasks: [],
    sessions: [],
    themes: [...builtInThemes],
    schedule: [],
    timer: {
        status: 'idle',
        mode: 'work',
        remaining: defaultSettings.workDuration * 60,
        totalDuration: defaultSettings.workDuration * 60,
        sessionCount: 0,
    },
    activeTaskId: null,
    completionPopup: null,

    // ─── Settings ───
    updateSettings: (partial) => {
        set((s) => {
            const newSettings = { ...s.settings, ...partial }
            // If timer is idle, update the remaining time to reflect new duration
            const timer = s.timer.status === 'idle'
                ? {
                    ...s.timer,
                    remaining: getDuration(s.timer.mode, newSettings),
                    totalDuration: getDuration(s.timer.mode, newSettings),
                }
                : s.timer
            return { settings: newSettings, timer }
        })
        get()._persist()
    },

    // ─── Tasks ───
    addTask: (taskData) => {
        const task: Task = {
            id: uuid(),
            ...taskData,
            completedPomodoros: 0,
            status: 'todo',
            createdAt: new Date().toISOString(),
        }
        set((s) => ({ tasks: [task, ...s.tasks] }))
        get()._persist()
    },

    updateTask: (id, partial) => {
        set((s) => ({
            tasks: s.tasks.map((t) => t.id === id ? { ...t, ...partial } : t),
        }))
        get()._persist()
    },

    deleteTask: (id) => {
        set((s) => ({
            tasks: s.tasks.filter((t) => t.id !== id),
            activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
        }))
        get()._persist()
    },

    completeTask: (id) => {
        set((s) => ({
            tasks: s.tasks.map((t) =>
                t.id === id ? { ...t, status: 'done' as const, completedAt: new Date().toISOString() } : t
            ),
            activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
        }))
        get()._persist()
    },

    incrementTaskPomodoro: (id) => {
        set((s) => ({
            tasks: s.tasks.map((t) =>
                t.id === id ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
            ),
        }))
        get()._persist()
    },

    // ─── Sessions ───
    addSession: (sessionData) => {
        const session: Session = { id: uuid(), ...sessionData }
        set((s) => ({ sessions: [...s.sessions, session] }))
        get()._persist()
    },

    // ─── Themes ───
    addTheme: (themeData) => {
        const theme: AppTheme = { id: uuid(), ...themeData, isBuiltIn: false }
        set((s) => ({ themes: [...s.themes, theme] }))
        get()._persist()
    },

    updateTheme: (id, partial) => {
        set((s) => ({
            themes: s.themes.map((t) => t.id === id ? { ...t, ...partial } : t),
        }))
        get()._persist()
    },

    deleteTheme: (id) => {
        set((s) => ({
            themes: s.themes.filter((t) => t.id !== id),
            settings: s.settings.selectedThemeId === id
                ? { ...s.settings, selectedThemeId: 'dark-ember' }
                : s.settings,
        }))
        get()._persist()
    },

    // ─── Timer ───
    setActiveTask: (id) => {
        set({ activeTaskId: id })
        get()._persist()
    },

    startTimer: (mode) => {
        const { settings, timer, tasks, activeTaskId, updateTask } = get()
        const m = mode ?? timer.mode
        const duration = getDuration(m, settings)

        warmupAudio()
        if (settings.soundEnabled) playTimerStart()

        // Auto-set status to in-progress
        if (m === 'work' && activeTaskId) {
            const task = tasks.find(t => t.id === activeTaskId)
            if (task && task.status === 'todo') {
                updateTask(activeTaskId, { status: 'in-progress' })
            }
        }

        set({
            timer: {
                status: 'running',
                mode: m,
                remaining: duration,
                totalDuration: duration,
                sessionCount: timer.sessionCount,
            },
        })
        get()._persist()
    },

    pauseTimer: () => {
        if (get().settings.soundEnabled) playTimerPause()
        set((s) => ({ timer: { ...s.timer, status: 'paused' } }))
        get()._persist()
    },

    resumeTimer: () => {
        if (get().settings.soundEnabled) playTimerStart()
        set((s) => ({ timer: { ...s.timer, status: 'running' } }))
        get()._persist()
    },

    resetTimer: () => {
        const { settings, timer } = get()
        const duration = getDuration(timer.mode, settings)
        set({
            timer: {
                status: 'idle',
                mode: timer.mode,
                remaining: duration,
                totalDuration: duration,
                sessionCount: timer.sessionCount,
            },
        })
        get()._persist()
    },

    tick: () => {
        set((s) => {
            if (s.timer.status !== 'running') return s
            const remaining = s.timer.remaining - 1

            if (remaining <= 0) {
                return { timer: { ...s.timer, remaining: 0, status: 'completed' } }
            }
            return { timer: { ...s.timer, remaining } }
        })
        get()._persist()
    },

    completeTimer: () => {
        const { timer, settings, activeTaskId, addSession, incrementTaskPomodoro } = get()

        // Log the session
        addSession({
            taskId: activeTaskId ?? undefined,
            type: timer.mode,
            duration: timer.totalDuration,
            elapsed: timer.totalDuration,
            startedAt: new Date(Date.now() - timer.totalDuration * 1000).toISOString(),
            endedAt: new Date().toISOString(),
            completed: true,
        })

        // Increment task pomodoro if this was a work session
        if (timer.mode === 'work' && activeTaskId) {
            incrementTaskPomodoro(activeTaskId)
        }

        // Premium sound + notification
        if (settings.soundEnabled) {
            const activeTheme = get().themes.find(t => t.id === settings.selectedThemeId)
            const isDeadpool = activeTheme?.style === 'deadpool'
            if (timer.mode === 'work') {
                isDeadpool ? playDeadpoolWorkComplete() : playWorkComplete()
            } else {
                isDeadpool ? playDeadpoolBreakComplete() : playBreakComplete()
            }
        }

        // Show in-app completion popup and bring window to front
        if (settings.notificationsEnabled) {
            set({ completionPopup: { visible: true, mode: timer.mode, duration: timer.totalDuration } })
            window.electronAPI?.focusWindow()
        }

        // Determine next mode
        let nextMode: TimerMode
        let nextCount = timer.sessionCount

        if (timer.mode === 'work') {
            nextCount += 1
            nextMode = nextCount % settings.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak'
        } else {
            nextMode = 'work'
        }

        const nextDuration = getDuration(nextMode, settings)
        const autoStart = timer.mode === 'work' ? settings.autoStartBreaks : settings.autoStartWork

        set({
            timer: {
                status: autoStart ? 'running' : 'idle',
                mode: nextMode,
                remaining: nextDuration,
                totalDuration: nextDuration,
                sessionCount: nextCount,
            },
        })
        get()._persist()
    },

    skipToNext: () => {
        const { timer, settings } = get()
        if (settings.soundEnabled) playTimerSkip()
        let nextMode: TimerMode
        const nextCount = timer.sessionCount

        if (timer.mode === 'work') {
            nextMode = 'shortBreak'
        } else {
            nextMode = 'work'
        }

        const nextDuration = getDuration(nextMode, settings)
        const autoStart = timer.mode === 'work' ? settings.autoStartBreaks : settings.autoStartWork

        set({
            timer: {
                status: autoStart ? 'running' : 'idle',
                mode: nextMode,
                remaining: nextDuration,
                totalDuration: nextDuration,
                sessionCount: nextCount,
            },
        })
        get()._persist()
    },

    setMode: (mode) => {
        const { settings, timer } = get()
        const duration = getDuration(mode, settings)
        set({
            timer: {
                status: 'idle',
                mode: mode,
                remaining: duration,
                totalDuration: duration,
                sessionCount: timer.sessionCount,
            },
        })
        get()._persist()
    },

    // ─── Schedule ───
    updateScheduleEntry: (entry) => set((s) => {
        const existingIndex = s.schedule.findIndex(e => e.day === entry.day && e.slotId === entry.slotId)
        const newSchedule = [...s.schedule]

        if (existingIndex >= 0) {
            if (!entry.subject.trim()) {
                // Remove if empty
                newSchedule.splice(existingIndex, 1)
            } else {
                // Update
                newSchedule[existingIndex] = entry
            }
        } else if (entry.subject.trim()) {
            // Add new
            newSchedule.push(entry)
        }

        return { schedule: newSchedule }
    }),

    // ─── Completion Popup ───
    dismissCompletionPopup: () => set({ completionPopup: null }),

    // ─── Persistence ───
    _persist: () => {
        const { settings, tasks, sessions, themes, timer, activeTaskId, schedule } = get()
        saveDataAsync({ settings, tasks, sessions, themes, timer, activeTaskId, schedule })
    },

    _hydrate: async () => {
        const data = await loadDataAsync()
        const restoredActiveTaskId = data.activeTaskId && data.tasks.some((task) => task.id === data.activeTaskId)
            ? data.activeTaskId
            : null

        set({
            settings: data.settings,
            tasks: data.tasks,
            sessions: data.sessions,
            themes: [
                ...builtInThemes,
                ...(data.themes || []).filter(t => !t.isBuiltIn)
            ],
            activeTaskId: restoredActiveTaskId,
            schedule: data.schedule || [], // Default schedule state for existing users
            timer: data.timer.status === 'running'
                ? { ...data.timer, status: 'paused' } // Auto-pause if it was running
                : data.timer,
        })
    },

    // ─── Mock Data ───
    loadMockData: () => {
        const now = new Date()
        const mockTasks: Task[] = [
            { id: 'mock-t1', title: 'Build landing page', description: 'Design and code the hero section', priority: 'high', tags: ['frontend'], estimatedPomodoros: 6, completedPomodoros: 6, status: 'done', createdAt: new Date(now.getTime() - 12 * 86400000).toISOString(), completedAt: new Date(now.getTime() - 10 * 86400000).toISOString() },
            { id: 'mock-t2', title: 'Write API docs', description: 'Document REST endpoints', priority: 'medium', tags: ['docs'], estimatedPomodoros: 4, completedPomodoros: 4, status: 'done', createdAt: new Date(now.getTime() - 8 * 86400000).toISOString(), completedAt: new Date(now.getTime() - 6 * 86400000).toISOString() },
            { id: 'mock-t3', title: 'Fix auth bug', description: 'Token refresh failing on mobile', priority: 'high', tags: ['backend', 'bug'], estimatedPomodoros: 3, completedPomodoros: 3, status: 'done', createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(), completedAt: new Date(now.getTime() - 4 * 86400000).toISOString() },
            { id: 'mock-t4', title: 'Database optimization', description: 'Add indexes to slow queries', priority: 'medium', tags: ['backend'], estimatedPomodoros: 5, completedPomodoros: 3, status: 'in-progress', createdAt: new Date(now.getTime() - 3 * 86400000).toISOString() },
            { id: 'mock-t5', title: 'Unit tests for utils', description: 'Cover edge cases', priority: 'low', tags: ['testing'], estimatedPomodoros: 4, completedPomodoros: 0, status: 'todo', createdAt: new Date(now.getTime() - 2 * 86400000).toISOString() },
            { id: 'mock-t6', title: 'Design system update', description: 'New color tokens and spacing', priority: 'high', tags: ['design'], estimatedPomodoros: 5, completedPomodoros: 5, status: 'done', createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(), completedAt: new Date(now.getTime() - 5 * 86400000).toISOString() },
            { id: 'mock-t7', title: 'Setup CI/CD pipeline', description: 'GitHub Actions workflow', priority: 'medium', tags: ['devops'], estimatedPomodoros: 3, completedPomodoros: 3, status: 'done', createdAt: new Date(now.getTime() - 4 * 86400000).toISOString(), completedAt: new Date(now.getTime() - 3 * 86400000).toISOString() },
        ]

        const mockSessions: Session[] = []
        let sessionId = 0

        // Generate sessions over the last 14 days with realistic patterns
        for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
            const day = new Date(now.getTime() - daysAgo * 86400000)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const sessionsToday = isWeekend ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 5) + 3

            for (let s = 0; s < sessionsToday; s++) {
                const hour = 8 + Math.floor(Math.random() * 12) // 8am-8pm
                const minute = Math.floor(Math.random() * 60)
                const startTime = new Date(day)
                startTime.setHours(hour, minute, 0, 0)
                const duration = 25 * 60 // 25 min pomodoro
                const endTime = new Date(startTime.getTime() + duration * 1000)

                mockSessions.push({
                    id: `mock-s${sessionId++}`,
                    taskId: mockTasks[Math.floor(Math.random() * mockTasks.length)].id,
                    type: 'work',
                    duration,
                    elapsed: duration,
                    startedAt: startTime.toISOString(),
                    endedAt: endTime.toISOString(),
                    completed: true,
                })

                // Add a short break after each work session
                if (s < sessionsToday - 1) {
                    const breakStart = new Date(endTime.getTime() + 60000)
                    mockSessions.push({
                        id: `mock-s${sessionId++}`,
                        type: 'shortBreak',
                        duration: 5 * 60,
                        elapsed: 5 * 60,
                        startedAt: breakStart.toISOString(),
                        endedAt: new Date(breakStart.getTime() + 5 * 60 * 1000).toISOString(),
                        completed: true,
                    })
                }
            }
        }

        set((s) => ({
            sessions: [...s.sessions, ...mockSessions],
            tasks: [...s.tasks, ...mockTasks],
        }))
        get()._persist()
    },

    clearMockData: () => {
        set((s) => ({
            sessions: s.sessions.filter(s => !s.id.startsWith('mock-')),
            tasks: s.tasks.filter(t => !t.id.startsWith('mock-')),
        }))
        get()._persist()
    },
}))
