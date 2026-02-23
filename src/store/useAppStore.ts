/* ─── Main Application Store (Zustand) ─── */
import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { Settings, Task, Session, AppTheme, TimerState, TimerMode, ScheduleEntry, PetState, Mission, CosmeticItem } from '@/types'
import { loadDataAsync, saveDataAsync } from '@/lib/storage'
import { defaultSettings, builtInThemes } from '@/lib/themes'
import { playThemeWorkComplete, playThemeBreakComplete, playTimerStart, playTimerPause, playTimerSkip, warmupAudio } from '@/lib/sounds'

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

    // ─── Pet Configuration ───
    pet: PetState
    addPetXp: (amount: number) => void
    setPetAnimState: (state: PetState['animState']) => void

    // ─── Daily Missions ───
    dailyMissions: Mission[]
    lastMissionReset: string
    checkDailyMissions: () => void
    updateMissionProgress: (type: Mission['type'], amount: number) => void
    claimMissionReward: (missionId: string) => void

    // ─── Shop & Credits ───
    addCredits: (amount: number) => void
    buyItem: (item: CosmeticItem) => void
    equipItem: (item: CosmeticItem) => void
    unequipItem: (slot: string) => void

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

const generateDailyMissions = (): Mission[] => {
    return [
        { id: uuid(), type: 'focus_time', target: 60, progress: 0, reward: 50, completed: false, title: "Deep Focus", description: "Focus for 60 minutes" },
        { id: uuid(), type: 'task_completion', target: 3, progress: 0, reward: 50, completed: false, title: "Task Master", description: "Complete 3 tasks" },
        { id: uuid(), type: 'interact', target: 5, progress: 0, reward: 25, completed: false, title: "Social Fox", description: "Interact with Nova 5 times" },
    ]
}

// Throttle tracking for tick persistence (avoids IPC flooding)
let _lastTickPersist = 0

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
        lastTick: undefined,
    },
    activeTaskId: null,
    completionPopup: null,
    pet: {
        name: 'Nova',
        level: 1,
        xp: 0,
        totalXp: 100,
        animState: 'idle',
        lastCompletedSessionAt: new Date().toISOString(),
        credits: 0,
        ownedItems: [],
        equippedItems: {}
    },
    dailyMissions: [],
    lastMissionReset: new Date().toISOString(),

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
                    lastTick: undefined,
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
        get().addPetXp(50) // Bonus XP for task completion
        get().updateMissionProgress('task_completion', 1)
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
                lastTick: Date.now(),
            },
            pet: { ...get().pet, animState: 'focusing' } // Pet enters focus mode
        })
        get()._persist()
    },

    pauseTimer: () => {
        if (get().settings.soundEnabled) playTimerPause()
        set((s) => ({
            timer: { ...s.timer, status: 'paused', lastTick: undefined },
            pet: { ...s.pet, animState: 'sleeping' } // Pet sleeps when paused
        }))
        get()._persist()
    },

    resumeTimer: () => {
        if (get().settings.soundEnabled) playTimerStart()
        set((s) => ({
            timer: { ...s.timer, status: 'running', lastTick: Date.now() },
            pet: { ...s.pet, animState: 'focusing' } // Pet back to focusing
        }))
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
                lastTick: undefined,
            },
        })
        get()._persist()
    },

    tick: () => {
        set((s) => {
            if (s.timer.status !== 'running') return s
            const now = Date.now()
            // If we don't have a lastTick for some reason, assume exactly 1 sec has passed
            const deltaMs = s.timer.lastTick ? now - s.timer.lastTick : 1000
            const deltaSecs = deltaMs / 1000

            const remaining = Math.max(0, s.timer.remaining - deltaSecs)

            if (remaining <= 0) {
                return { timer: { ...s.timer, remaining: 0, status: 'completed', lastTick: undefined } }
            }
            return { timer: { ...s.timer, remaining, lastTick: now } }
        })
        // Throttle persistence — only save every 5s during ticks to avoid IPC flooding
        const now = Date.now()
        if (now - _lastTickPersist > 5000) {
            _lastTickPersist = now
            get()._persist()
        }
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

        // Increment task pomodoro and evaluate rewards if this was a work session
        if (timer.mode === 'work') {
            if (activeTaskId) incrementTaskPomodoro(activeTaskId)

            const focusMins = Math.floor(timer.totalDuration / 60)
            get().addPetXp(25) // XP for completing a work session
            get().addCredits(focusMins) // 1 credit per minute
            get().updateMissionProgress('focus_time', focusMins)

            set((s) => ({ pet: { ...s.pet, animState: 'happy', lastCompletedSessionAt: new Date().toISOString() } })) // Pet celebrates!
        } else {
            set((s) => ({ pet: { ...s.pet, animState: 'idle', lastCompletedSessionAt: new Date().toISOString() } })) // Pet rests after break
        }

        // Premium sound + notification
        if (settings.soundEnabled) {
            const activeTheme = get().themes.find(t => t.id === settings.selectedThemeId)
            const themeStyle = activeTheme?.style
            if (timer.mode === 'work') {
                playThemeWorkComplete(themeStyle)
            } else {
                playThemeBreakComplete(themeStyle)
            }
        }

        // Show in-app completion popup and bring window to front (respects mini mode)
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
                lastTick: autoStart ? Date.now() : undefined,
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
                lastTick: autoStart ? Date.now() : undefined,
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
                lastTick: undefined,
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

    // ─── Pet Configuration ───
    addPetXp: (amount) => set((s) => {
        let { level, xp, totalXp } = s.pet
        xp += amount
        // Level up logic (e.g. 100 for lvl 2, 150 for lvl 3, etc.)
        while (xp >= totalXp) {
            xp -= totalXp
            level += 1
            totalXp = Math.floor(totalXp * 1.5) // Scaling difficulty
        }
        return { pet: { ...s.pet, level, xp, totalXp } }
    }),

    setPetAnimState: (state) => set((s) => ({ pet: { ...s.pet, animState: state } })),

    // ─── Daily Missions ───
    checkDailyMissions: () => {
        const { lastMissionReset, dailyMissions } = get()
        const now = new Date()
        const lastReset = new Date(lastMissionReset)

        // Reset if date changes or empty
        if (
            now.getDate() !== lastReset.getDate() ||
            now.getMonth() !== lastReset.getMonth() ||
            now.getFullYear() !== lastReset.getFullYear() ||
            dailyMissions.length === 0
        ) {
            set({ dailyMissions: generateDailyMissions(), lastMissionReset: now.toISOString() })
            get()._persist()
        }
    },

    updateMissionProgress: (type, amount) => {
        set((s) => ({
            dailyMissions: s.dailyMissions.map((m) => {
                if (m.type === type && !m.completed) {
                    const newProgress = Math.min(m.target, m.progress + amount)
                    return { ...m, progress: newProgress }
                }
                return m
            })
        }))
        get()._persist()
    },

    claimMissionReward: (missionId) => {
        set((s) => {
            const mission = s.dailyMissions.find(m => m.id === missionId)
            if (mission && mission.progress >= mission.target && !mission.completed) {
                return {
                    dailyMissions: s.dailyMissions.map(m => m.id === missionId ? { ...m, completed: true } : m),
                    pet: { ...s.pet, credits: s.pet.credits + mission.reward, animState: 'celebration' }
                }
            }
            return s
        })
        get()._persist()
    },

    // ─── Credits & Shop ───
    addCredits: (amount) => {
        set((s) => ({ pet: { ...s.pet, credits: s.pet.credits + amount } }))
        get()._persist()
    },

    buyItem: (item) => {
        set((s) => {
            if (s.pet.credits >= item.price && !s.pet.ownedItems.includes(item.id)) {
                return {
                    pet: {
                        ...s.pet,
                        credits: s.pet.credits - item.price,
                        ownedItems: [...s.pet.ownedItems, item.id],
                        animState: 'happy'
                    }
                }
            }
            return s
        })
        get()._persist()
    },

    equipItem: (item) => {
        set((s) => {
            if (s.pet.ownedItems.includes(item.id)) {
                return {
                    pet: {
                        ...s.pet,
                        equippedItems: { ...s.pet.equippedItems, [item.type]: item.id }
                    }
                }
            }
            return s
        })
        get()._persist()
    },

    unequipItem: (slot) => {
        set((s) => {
            const newEquipped = { ...s.pet.equippedItems }
            delete newEquipped[slot]
            return {
                pet: { ...s.pet, equippedItems: newEquipped }
            }
        })
        get()._persist()
    },

    // ─── Completion Popup ───
    dismissCompletionPopup: () => set({ completionPopup: null }),

    // ─── Persistence ───
    _persist: () => {
        const { settings, tasks, sessions, themes, timer, activeTaskId, schedule, pet, dailyMissions, lastMissionReset } = get()
        saveDataAsync({ settings, tasks, sessions, themes, timer, activeTaskId, schedule, pet, dailyMissions, lastMissionReset })
    },

    _hydrate: async () => {
        const data = await loadDataAsync()
        const restoredActiveTaskId = data.activeTaskId && data.tasks.some((task) => task.id === data.activeTaskId)
            ? data.activeTaskId
            : null

        // Calculate initial pet state, check for low power (>24h since last session)
        let initialPetState: PetState = data.pet || {
            name: 'Nova', level: 1, xp: 0, totalXp: 100, animState: 'idle',
            lastCompletedSessionAt: new Date().toISOString(),
            credits: 0, ownedItems: [], equippedItems: {}
        }

        if (initialPetState.lastCompletedSessionAt) {
            const lastSessionTime = new Date(initialPetState.lastCompletedSessionAt).getTime()
            if (Date.now() - lastSessionTime > 24 * 60 * 60 * 1000) {
                initialPetState.animState = 'low-power'
            } else if (initialPetState.animState === 'low-power' || initialPetState.animState === 'happy' || initialPetState.animState === 'sad' || initialPetState.animState === 'celebration') {
                // Reset temporary/punitive states if within 24hr and hydrating
                initialPetState.animState = 'idle'
            }
        } else {
            initialPetState.lastCompletedSessionAt = new Date().toISOString()
        }

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
            pet: initialPetState,
            dailyMissions: data.dailyMissions || [],
            lastMissionReset: data.lastMissionReset || new Date().toISOString(),
            timer: data.timer.status === 'running'
                ? { ...data.timer, status: 'paused', lastTick: undefined } // Auto-pause if it was running
                : { ...data.timer, lastTick: undefined },
        })

        // Verify daily missions on load
        setTimeout(() => get().checkDailyMissions(), 0)
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
