import { useEffect, useState, useRef } from 'react'
import type { MiniTimerState } from '@/types'

function formatTime(seconds: number): string {
    const rounded = Math.ceil(seconds)
    const mins = Math.floor(rounded / 60)
    const secs = rounded % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const modeConfig: Record<string, { label: string; color: string; glow: string; bg: string }> = {
    work: { label: 'FOCUS', color: '#6366f1', glow: 'rgba(99,102,241,0.4)', bg: 'rgba(99,102,241,0.08)' },
    shortBreak: { label: 'BREAK', color: '#22c55e', glow: 'rgba(34,197,94,0.4)', bg: 'rgba(34,197,94,0.08)' },
    longBreak: { label: 'REST', color: '#a855f7', glow: 'rgba(168,85,247,0.4)', bg: 'rgba(168,85,247,0.08)' },
}

export function MiniTimer() {
    const [state, setState] = useState<MiniTimerState>({
        remaining: 0,
        totalDuration: 1,
        status: 'idle',
        mode: 'work',
    })
    const [hovered, setHovered] = useState(false)
    const dragging = useRef(false)

    useEffect(() => {
        const cleanup = window.electronAPI?.onTimerState((s) => setState(s))
        return () => cleanup?.()
    }, [])

    const send = (action: string) => window.electronAPI?.sendTimerControl(action)

    const progress = state.totalDuration > 0 ? 1 - state.remaining / state.totalDuration : 0
    const cfg = modeConfig[state.mode] || modeConfig.work
    const isRunning = state.status === 'running'
    const isIdle = state.status === 'idle'

    // Progress bar width
    const progressPercent = `${Math.round(progress * 100)}%`

    // Click-through for transparent areas
    const handleMouseEnter = () => {
        window.electronAPI?.setIgnoreMouseEvents(false)
        setHovered(true)
    }
    const handleMouseLeave = () => {
        setHovered(false)
        if (!dragging.current) {
            window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
        }
    }

    useEffect(() => {
        window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
    }, [])

    // IPC-based dragging
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
                width: 280,
                height: 80,
                borderRadius: 16,
                background: 'rgba(12, 12, 20, 0.92)',
                backdropFilter: 'blur(30px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(30px) saturate(1.6)',
                border: `1px solid ${hovered ? `${cfg.color}44` : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isRunning
                    ? `0 4px 24px rgba(0,0,0,0.5), 0 0 40px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`
                    : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '0 16px',
                cursor: 'grab',
                userSelect: 'none' as const,
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                color: '#f0f0f0',
                overflow: 'hidden',
                position: 'relative' as const,
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
        >
            {/* Animated progress bar at the bottom */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                width: progressPercent,
                background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}99)`,
                borderRadius: '0 2px 0 0',
                transition: 'width 0.8s ease',
                boxShadow: `0 0 8px ${cfg.glow}`,
            }} />

            {/* Mode indicator dot */}
            <div style={{
                position: 'absolute',
                top: 8,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
            }}>
                <div style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: cfg.color,
                    boxShadow: isRunning ? `0 0 6px ${cfg.glow}` : 'none',
                    animation: isRunning ? 'mini-pulse 2s ease-in-out infinite' : 'none',
                }} />
                <span style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: cfg.color,
                    opacity: 0.9,
                }}>
                    {cfg.label}
                </span>
            </div>

            {/* Timer display */}
            <div style={{ flex: 1, paddingTop: 8 }}>
                <div style={{
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#ffffff',
                    textShadow: isRunning ? `0 0 20px ${cfg.glow}` : 'none',
                }}>
                    {formatTime(state.remaining)}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 5, flexShrink: 0, paddingTop: 6 }}>
                {/* Play/Pause */}
                <button
                    onClick={() => {
                        if (isIdle) send('start')
                        else if (isRunning) send('pause')
                        else send('resume')
                    }}
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: `${cfg.color}25`,
                        border: `1px solid ${cfg.color}55`,
                        color: cfg.color,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = `${cfg.color}30`
                        e.currentTarget.style.transform = 'scale(1.08)'
                        e.currentTarget.style.boxShadow = `0 0 12px ${cfg.glow}`
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = `${cfg.color}15`
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                    title={isRunning ? 'Pause' : 'Start'}
                >
                    {isRunning ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <rect x="1.5" y="1" width="3" height="10" rx="1" />
                            <rect x="7.5" y="1" width="3" height="10" rx="1" />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M3 1.5L12 7L3 12.5V1.5Z" />
                        </svg>
                    )}
                </button>

                {/* Skip */}
                <button
                    onClick={() => send('skip')}
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = '#fff'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.transform = 'scale(1.08)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.transform = 'scale(1)'
                    }}
                    title="Skip"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M1 1.5L7 6L1 10.5V1.5Z" />
                        <rect x="8.5" y="1.5" width="2.5" height="9" rx="0.5" />
                    </svg>
                </button>

                {/* Close */}
                <button
                    onClick={() => window.electronAPI?.closeMini()}
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444'
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
                        e.currentTarget.style.transform = 'scale(1.08)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.25)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.transform = 'scale(1)'
                    }}
                    title="Close"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
                    </svg>
                </button>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes mini-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.5); }
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                button { outline: none; }
                button:active { transform: scale(0.92) !important; }
            `}</style>
        </div>
    )
}
