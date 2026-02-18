import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { TitleBar } from '@/components/TitleBar'
import { Sidebar } from '@/components/Sidebar'
import { PageTransition } from '@/components/PageTransition'
import { Dashboard } from '@/pages/Dashboard'
import { Timer } from '@/pages/Timer'
import { Tasks } from '@/pages/Tasks'
import { Analytics } from '@/pages/Analytics'
import { ThemeStudio } from '@/pages/ThemeStudio'
import { SettingsPage } from '@/pages/Settings'
import { Schedule } from '@/pages/Schedule'
import { ThemeProvider } from '@/components/ThemeProvider'
import { TimerCompletePopup } from '@/components/TimerCompletePopup'

type Page = 'dashboard' | 'timer' | 'tasks' | 'analytics' | 'themes' | 'settings' | 'schedule'

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard')
    const _hydrate = useAppStore((s) => s._hydrate)
    const settings = useAppStore((s) => s.settings)
    const timer = useAppStore((s) => s.timer)
    const tick = useAppStore((s) => s.tick)
    const completeTimer = useAppStore((s) => s.completeTimer)
    const startTimer = useAppStore((s) => s.startTimer)
    const pauseTimer = useAppStore((s) => s.pauseTimer)
    const resumeTimer = useAppStore((s) => s.resumeTimer)
    const skipToNext = useAppStore((s) => s.skipToNext)
    // Global Timer Interval
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (timer.status === 'running') {
            const tickRate = settings.debugSpeed ? 100 : 1000
            interval = setInterval(() => tick(), tickRate)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [timer.status])

    // Handle completion
    useEffect(() => {
        if (timer.status === 'completed') {
            completeTimer()
        }
    }, [timer.status])

    // Sync timer state to mini window
    useEffect(() => {
        window.electronAPI?.sendTimerState({
            remaining: timer.remaining,
            totalDuration: timer.totalDuration,
            status: timer.status,
            mode: timer.mode,
        })
    }, [timer.remaining, timer.status, timer.mode, timer.totalDuration])

    // Listen for timer controls from mini window
    useEffect(() => {
        const cleanup = window.electronAPI?.onTimerControl((action: string) => {
            const { status } = useAppStore.getState().timer
            if (action === 'start') startTimer()
            else if (action === 'pause') pauseTimer()
            else if (action === 'resume') resumeTimer()
            else if (action === 'skip') skipToNext()
        })
        return () => cleanup?.()
    }, [])

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />
            case 'timer': return <Timer />
            case 'tasks': return <Tasks />
            case 'analytics': return <Analytics />
            case 'themes': return <ThemeStudio />
            case 'settings': return <SettingsPage />
            case 'schedule': return <Schedule />
        }
    }

    return (
        <ThemeProvider>
            <div className="flex flex-col h-screen overflow-hidden">
                <TitleBar />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
                    <main className="flex-1 overflow-y-auto p-5 md:p-7 relative">
                        <AnimatePresence mode="wait">
                            <PageTransition pageKey={currentPage}>
                                {renderPage()}
                            </PageTransition>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
            <TimerCompletePopup />
        </ThemeProvider>
    )
}
