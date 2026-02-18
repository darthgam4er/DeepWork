import { useEffect, useState, useRef } from 'react'
import type { MiniTimerState } from '@/types'

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const modeLabels: Record<string, string> = {
    work: 'Focus',
    shortBreak: 'Break',
    longBreak: 'Long Break',
}

export function MiniTimer() {
    const [state, setState] = useState<MiniTimerState>({
        remaining: 0,
        totalDuration: 1,
        status: 'idle',
        mode: 'work',
    })
    const dragging = useRef(false)

    useEffect(() => {
        const cleanup = window.electronAPI?.onTimerState((s) => setState(s))
        return () => cleanup?.()
    }, [])

    const send = (action: string) => window.electronAPI?.sendTimerControl(action)

    const progress = state.totalDuration > 0 ? 1 - state.remaining / state.totalDuration : 0
    const circumference = 2 * Math.PI * 22
    const dashOffset = circumference * (1 - progress)

    const modeColor = state.mode === 'work' ? '#3b82f6' : state.mode === 'shortBreak' ? '#22c55e' : '#a855f7'

    // Enable click-through on transparent areas, disable on the widget itself
    const handleMouseEnter = () => {
        window.electronAPI?.setIgnoreMouseEvents(false)
    }
    const handleMouseLeave = () => {
        if (!dragging.current) {
            window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
        }
    }

    // Start with click-through enabled so transparent areas pass clicks
    useEffect(() => {
        window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
    }, [])

    // IPC-based dragging using absolute screen position
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return
        dragging.current = true
        window.electronAPI?.startDrag(e.screenX, e.screenY)
    }

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!dragging.current) return
            window.electronAPI?.dragMove(e.screenX, e.screenY)
        }
        const handleUp = () => {
            if (dragging.current) {
                dragging.current = false
                window.electronAPI?.dragEnd()
            }
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
        }
    }, [])

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                width: 300,
                height: 120,
                borderRadius: 20,
                background: 'rgba(15, 15, 25, 0.85)',
                backdropFilter: 'blur(24px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '0 20px',
                cursor: 'grab',
                userSelect: 'none',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                color: '#f0f0f0',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Progress Ring */}
            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle
                        cx="28" cy="28" r="22"
                        fill="none"
                        stroke={modeColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {state.status === 'running' && (
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: modeColor,
                            boxShadow: `0 0 8px ${modeColor}`,
                            animation: 'mini-pulse 2s ease-in-out infinite',
                        }} />
                    )}
                    {state.status !== 'running' && (
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                        }} />
                    )}
                </div>
            </div>

            {/* Time & Mode */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
                    lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                }}>
                    {formatTime(state.remaining)}
                </div>
                <div style={{
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: modeColor, marginTop: 4, fontWeight: 600,
                }}>
                    {modeLabels[state.mode] || 'Focus'}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {/* Play/Pause */}
                <button
                    onClick={() => {
                        if (state.status === 'idle') send('start')
                        else if (state.status === 'running') send('pause')
                        else send('resume')
                    }}
                    style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: `${modeColor}22`, border: `1px solid ${modeColor}44`,
                        color: modeColor, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${modeColor}44` }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${modeColor}22` }}
                    title={state.status === 'running' ? 'Pause' : 'Start'}
                >
                    {state.status === 'running' ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <rect x="1" y="1" width="3.5" height="10" rx="1" />
                            <rect x="7.5" y="1" width="3.5" height="10" rx="1" />
                        </svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
                        </svg>
                    )}
                </button>

                {/* Skip */}
                <button
                    onClick={() => send('skip')}
                    style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    title="Skip"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M1 1.5L7 6L1 10.5V1.5Z" />
                        <rect x="8.5" y="1.5" width="2.5" height="9" rx="0.5" />
                    </svg>
                </button>

                {/* Close mini */}
                <button
                    onClick={() => window.electronAPI?.closeMini()}
                    style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    title="Close"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1 1L9 9M9 1L1 9" />
                    </svg>
                </button>
            </div>

            {/* Pulse animation keyframes */}
            <style>{`
                @keyframes mini-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.3); }
                }
            `}</style>
        </div>
    )
}
