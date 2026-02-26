import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAppStore } from './useAppStore'

describe('useAppStore Timer Logic', () => {
    beforeEach(() => {
        localStorage.clear()

        useAppStore.setState({
            timer: {
                status: 'idle',
                mode: 'work',
                remaining: 25 * 60,
                totalDuration: 25 * 60,
                sessionCount: 0,
            },
            settings: {
                workDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                sessionsBeforeLongBreak: 4,
                notificationsEnabled: false,
                soundEnabled: false,
                selectedThemeId: 'dark-ember',
                autoStartBreaks: false,
                autoStartWork: false,
                debugSpeed: false,
            },
            tasks: [],
            sessions: [],
            themes: [],
            activeTaskId: null,
        })

        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
        localStorage.clear()
    })

    it('starts the timer', () => {
        const store = useAppStore.getState()
        store.startTimer()
        expect(useAppStore.getState().timer.status).toBe('running')
    })

    it('pauses and resumes the timer', () => {
        const store = useAppStore.getState()
        store.startTimer()
        store.pauseTimer()
        expect(useAppStore.getState().timer.status).toBe('paused')
        store.resumeTimer()
        expect(useAppStore.getState().timer.status).toBe('running')
    })

    it('ticks down correctly', () => {
        const store = useAppStore.getState()
        store.startTimer()
        vi.advanceTimersByTime(1000)
        store.tick()
        expect(useAppStore.getState().timer.remaining).toBe(25 * 60 - 1)
    })

    it('completes a work session and switches to short break', () => {
        const store = useAppStore.getState()
        store.startTimer()

        useAppStore.setState(state => ({
            timer: { ...state.timer, remaining: 0, status: 'completed' }
        }))

        store.completeTimer()

        const state = useAppStore.getState()
        expect(state.timer.mode).toBe('shortBreak')
        expect(state.timer.remaining).toBe(5 * 60)
        expect(state.sessions.length).toBe(1)
        expect(state.sessions[0].type).toBe('work')
    })

    it('completes 4 sessions and switches to long break', () => {
        const store = useAppStore.getState()

        useAppStore.setState(state => ({ timer: { ...state.timer, mode: 'work', sessionCount: 0 } }))
        store.completeTimer()

        useAppStore.setState(state => ({ timer: { ...state.timer, mode: 'work', sessionCount: 1 } }))
        store.completeTimer()

        useAppStore.setState(state => ({ timer: { ...state.timer, mode: 'work', sessionCount: 2 } }))
        store.completeTimer()

        useAppStore.setState(state => ({ timer: { ...state.timer, mode: 'work', sessionCount: 3 } }))
        store.completeTimer()

        const state = useAppStore.getState()
        expect(state.timer.mode).toBe('longBreak')
        expect(state.timer.remaining).toBe(15 * 60)
    })

    it('does not increment session count when skipping a work session', () => {
        const store = useAppStore.getState()

        useAppStore.setState((state) => ({
            timer: { ...state.timer, mode: 'work', sessionCount: 2, status: 'running' },
        }))

        store.skipToNext()

        const state = useAppStore.getState()
        expect(state.timer.mode).toBe('shortBreak')
        expect(state.timer.sessionCount).toBe(2)
    })

    it('persists timer updates to localStorage', () => {
        // Move time forward significantly to ensure we bypass the persistence throttle
        // which might have been triggered by previous tests (since _lastTickPersist is module-scoped)
        vi.setSystemTime(Date.now() + 10000)

        const store = useAppStore.getState()

        store.startTimer()
        vi.advanceTimersByTime(1000)
        store.tick()

        const raw = localStorage.getItem('deepwork_data')
        expect(raw).not.toBeNull()

        const parsed = JSON.parse(raw!)
        expect(parsed.timer.status).toBe('running')
        expect(parsed.timer.remaining).toBe(25 * 60 - 1)
    })
})
