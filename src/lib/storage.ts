/* ─── Local Storage Layer ─── */
import { AppData, Settings, Task, Session, AppTheme } from '@/types'
import { builtInThemes, defaultSettings } from '@/lib/themes'

const STORAGE_KEY = 'deepwork_data'

function getDefaultData(): AppData {
    return {
        settings: { ...defaultSettings },
        tasks: [],
        sessions: [],
        themes: [...builtInThemes],
        timer: {
            status: 'idle',
            mode: 'work',
            remaining: defaultSettings.workDuration * 60,
            totalDuration: defaultSettings.workDuration * 60,
            sessionCount: 0,
        },
        activeTaskId: null,
        schedule: [],
    }
}

export function loadData(): AppData {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return getDefaultData()
        const parsed = JSON.parse(raw) as Partial<AppData>
        return {
            settings: { ...defaultSettings, ...parsed.settings },
            tasks: parsed.tasks ?? [],
            sessions: parsed.sessions ?? [],
            themes: mergeThemes(parsed.themes ?? []),
            timer: parsed.timer ?? getDefaultData().timer,
            activeTaskId: parsed.activeTaskId ?? null,
            schedule: parsed.schedule ?? getDefaultData().schedule,
        }
    } catch {
        return getDefaultData()
    }
}

function mergeThemes(savedThemes: AppTheme[]): AppTheme[] {
    const customThemes = savedThemes.filter(t => !t.isBuiltIn)
    return [...builtInThemes, ...customThemes]
}

export function saveData(data: AppData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
        console.error('Failed to save data:', e)
    }
}

export function exportData(): string {
    return localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(getDefaultData())
}

export function importData(json: string): AppData {
    const data = JSON.parse(json) as AppData
    saveData(data)
    return data
}

export async function loadDataAsync(): Promise<AppData> {
    try {
        if (window.electronAPI) {
            const raw = await window.electronAPI.loadData()
            if (!raw) return getDefaultData()
            // Support both direct object (electron-store) and JSON string
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
            return {
                settings: { ...defaultSettings, ...parsed.settings },
                tasks: parsed.tasks ?? [],
                sessions: parsed.sessions ?? [],
                themes: mergeThemes(parsed.themes ?? []),
                timer: parsed.timer ?? getDefaultData().timer,
                activeTaskId: parsed.activeTaskId ?? null,
                schedule: parsed.schedule ?? [],
            }
        }
        return loadData()
    } catch (e) {
        console.error('Failed to load data async:', e)
        return getDefaultData()
    }
}

export async function saveDataAsync(data: AppData): Promise<void> {
    try {
        if (window.electronAPI) {
            await window.electronAPI.saveData(data)
        } else {
            saveData(data)
        }
    } catch (e) {
        console.error('Failed to save data async:', e)
    }
}
