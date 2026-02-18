/**
 * Premium notification sounds using Web Audio API.
 * No external audio files needed — generates crystal-clear tones programmatically.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
}

/** Warm up the audio context — call on any user gesture so sounds work later without interaction */
export function warmupAudio() {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
}

function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
    delay = 0,
    fadeOut = true
) {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay)
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay)
    if (fadeOut) {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
    }
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration)
}

/** Warm ascending chime — played when a focus session completes */
export function playWorkComplete() {
    playTone(523.25, 0.15, 'sine', 0.25, 0)      // C5
    playTone(659.25, 0.15, 'sine', 0.25, 0.12)    // E5
    playTone(783.99, 0.15, 'sine', 0.3, 0.24)     // G5
    playTone(1046.50, 0.4, 'sine', 0.3, 0.36)     // C6 (held)
    // Soft shimmer undertone
    playTone(1046.50, 0.5, 'triangle', 0.08, 0.36)
}

/** Gentle descending tone — played when a break ends */
export function playBreakComplete() {
    playTone(783.99, 0.12, 'sine', 0.2, 0)        // G5
    playTone(659.25, 0.12, 'sine', 0.2, 0.1)      // E5
    playTone(523.25, 0.3, 'sine', 0.25, 0.2)      // C5
    playTone(523.25, 0.4, 'triangle', 0.06, 0.2)
}

/** Deadpool work complete — chaotic heroic fanfare with attitude */
export function playDeadpoolWorkComplete() {
    // Aggressive power chord hit
    playTone(146.83, 0.2, 'sawtooth', 0.25, 0)     // D3 power
    playTone(220, 0.2, 'sawtooth', 0.2, 0)          // A3
    playTone(293.66, 0.15, 'square', 0.15, 0)       // D4
    // Quick silence then chaotic ascending riff
    playTone(329.63, 0.08, 'sawtooth', 0.2, 0.25)   // E4
    playTone(440, 0.08, 'sawtooth', 0.2, 0.33)      // A4
    playTone(587.33, 0.08, 'sawtooth', 0.22, 0.41)  // D5
    playTone(880, 0.08, 'sawtooth', 0.22, 0.49)     // A5
    // Final epic sustained note
    playTone(1174.66, 0.5, 'sawtooth', 0.18, 0.57)  // D6
    playTone(1174.66, 0.6, 'square', 0.08, 0.57)    // Undertone
    // Cymbal-like noise burst
    playTone(4000, 0.3, 'sawtooth', 0.04, 0.55)
    playTone(6000, 0.2, 'square', 0.03, 0.55)
}

/** Deadpool break over — snarky alarm */
export function playDeadpoolBreakComplete() {
    // Annoying alarm-style buzzes
    playTone(440, 0.1, 'square', 0.2, 0)
    playTone(440, 0.1, 'square', 0.2, 0.15)
    playTone(440, 0.1, 'square', 0.2, 0.30)
    // Rising "get up" tone
    playTone(523.25, 0.08, 'sawtooth', 0.18, 0.45)
    playTone(659.25, 0.08, 'sawtooth', 0.18, 0.53)
    playTone(880, 0.15, 'sawtooth', 0.22, 0.61)
    playTone(880, 0.2, 'square', 0.08, 0.61)
}

/** Subtle click — for button presses */
export function playClick() {
    playTone(800, 0.05, 'sine', 0.1, 0)
    playTone(1200, 0.03, 'sine', 0.06, 0.02)
}

/** Soft start chime — when timer starts */
export function playTimerStart() {
    playTone(440, 0.08, 'sine', 0.15, 0)          // A4
    playTone(554.37, 0.08, 'sine', 0.15, 0.06)    // C#5
    playTone(659.25, 0.15, 'sine', 0.2, 0.12)     // E5
}

/** Pause blip */
export function playTimerPause() {
    playTone(659.25, 0.08, 'sine', 0.12, 0)       // E5
    playTone(523.25, 0.12, 'sine', 0.12, 0.06)    // C5
}

/** Skip swoosh */
export function playTimerSkip() {
    playTone(440, 0.06, 'sine', 0.1, 0)
    playTone(587.33, 0.06, 'sine', 0.1, 0.04)
    playTone(880, 0.1, 'sine', 0.12, 0.08)
}
