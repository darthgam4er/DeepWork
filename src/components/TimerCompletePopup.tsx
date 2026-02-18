import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

const DEADPOOL_WORK_LINES = [
    "Boom! You just crushed it harder than me in a red suit on a Tuesday.",
    "Maximum effort complete! Now go eat a chimichanga. You earned it.",
    "Look at you being all productive. It's almost disgusting. I'm proud.",
    "That focus session? *Chef's kiss* Better than my healing factor.",
    "You just out-Deadpooled Deadpool. And that's saying something.",
    "Holy $#!%, you actually did it! Time to celebrate... responsibly. JK.",
    "Francis would be jealous of that focus. Actually, his name is Ajax.",
    "Productivity level: MAXIMUM EFFORT. Now take a break before you break.",
]

const DEADPOOL_BREAK_LINES = [
    "Break's over, sunshine! Back to work before I break the fourth wall again.",
    "Get up! Those tasks aren't gonna murder themselves. Wait, wrong metaphor.",
    "Nap time is OVER. Let's go make some questionable decisions... productively!",
    "Rise and grind, baby! And no, I don't mean the coffee. Actually, yes. Coffee.",
    "Hey! HEY! Your break ended. Don't make me come in there.",
    "Time's up, buttercup! Let's get back to being disgustingly productive.",
]

function pickRandom(lines: string[]) {
    return lines[Math.floor(Math.random() * lines.length)]
}

export function TimerCompletePopup() {
    const popup = useAppStore((s) => s.completionPopup)
    const dismiss = useAppStore((s) => s.dismissCompletionPopup)
    const settings = useAppStore((s) => s.settings)
    const themes = useAppStore((s) => s.themes)

    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isDeadpool = activeTheme?.style === 'deadpool'
    const isWork = popup?.mode === 'work'
    const minutes = popup ? Math.round(popup.duration / 60) : 0

    // Pick content based on theme
    const emoji = isDeadpool
        ? (isWork ? '⚔️' : '💀')
        : (isWork ? '🎉' : '💪')

    const title = isDeadpool
        ? (isWork ? 'Maximum Effort Complete!' : 'Break\'s Over, Bub!')
        : (isWork ? 'Focus Complete!' : 'Break Over!')

    const message = isDeadpool
        ? (isWork ? pickRandom(DEADPOOL_WORK_LINES) : pickRandom(DEADPOOL_BREAK_LINES))
        : (isWork
            ? `Great work! You completed ${minutes} minutes of deep focus. Time for a well-deserved break.`
            : 'Your break is over — ready to dive back in and keep the momentum going?')

    const buttonText = isDeadpool
        ? (isWork ? 'Chimichanga Break 🌯' : 'Maximum Effort! 💪')
        : (isWork ? 'Start Break' : 'Let\'s Go!')

    return (
        <AnimatePresence>
            {popup?.visible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 backdrop-blur-sm ${isDeadpool ? 'bg-black/60' : 'bg-black/40'}`}
                        onClick={dismiss}
                    />

                    {/* Popup card */}
                    <motion.div
                        className={`relative w-[400px] rounded-2xl border p-8 shadow-2xl text-center ${
                            isDeadpool
                                ? 'bg-[#1a1a1a] border-red-600/50'
                                : 'bg-[hsl(var(--card))] border-[hsl(var(--border))]'
                        }`}
                        initial={isDeadpool
                            ? { scale: 0.3, opacity: 0, rotate: -10 }
                            : { scale: 0.8, opacity: 0, y: 20 }}
                        animate={isDeadpool
                            ? { scale: 1, opacity: 1, rotate: 0 }
                            : { scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        transition={isDeadpool
                            ? { type: 'spring', damping: 12, stiffness: 200 }
                            : { type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        {/* Deadpool red accent line */}
                        {isDeadpool && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700 rounded-t-2xl" />
                        )}

                        {/* Emoji */}
                        <motion.div
                            className="text-5xl mb-4"
                            animate={isDeadpool ? { rotate: [0, -10, 10, -5, 5, 0] } : {}}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            {emoji}
                        </motion.div>

                        {/* Title */}
                        <h2 className={`text-2xl font-bold mb-2 ${
                            isDeadpool ? 'text-red-500' : 'text-[hsl(var(--foreground))]'
                        }`}>
                            {title}
                        </h2>

                        {/* Message */}
                        <p className={`text-sm mb-6 leading-relaxed ${
                            isDeadpool
                                ? 'text-gray-300 italic'
                                : 'text-[hsl(var(--muted-foreground))]'
                        }`}>
                            {isDeadpool && <span className="text-red-400 not-italic">"</span>}
                            {message}
                            {isDeadpool && <span className="text-red-400 not-italic">"</span>}
                        </p>

                        {/* Dismiss button */}
                        <button
                            onClick={dismiss}
                            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                                isDeadpool
                                    ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/25'
                                    : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
                            }`}
                        >
                            {buttonText}
                        </button>

                        {/* Deadpool signature */}
                        {isDeadpool && (
                            <p className="text-[10px] text-gray-600 mt-4">
                                — Your friendly neighborhood merc with a mouth
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
