import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';

const quotes = {
    running: [
        "Target locked. Let's fry some procrastination nodes!",
        "Uploading focus protocols...",
        "Ready to slice through the workload.",
        "Executing deep_work.exe..."
    ],
    completed: [
        "Quantum productivity achieved 🔥",
        "Data packets secured. Good job.",
        "Systems overclocked. What's next?",
        "Mission accomplished, boss."
    ],
    'low-power': [
        "Energy... critical... Need focus session...",
        "Circuits dusty... please initiate task...",
        "Battery at 1%... Focus required..."
    ],
    idleNudges: [
        "My circuits are getting dusty over here...",
        "Awaiting command input, boss.",
        "Ready to jack in when you are.",
        "System optimal. Awaiting focus sequence."
    ],
    chat: [
        "Did you know taking breaks prevents neural burnout?",
        "Fun fact: I run on pure productivity.",
        "Your streak multiplier is looking good!",
        "Don't forget to hydrate your physical vessel.",
        "I'm scanning for distractions... looks clear!",
        "Every focused minute adds a byte to my memory banks."
    ]
};

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const NovaDialogue: React.FC = () => {
    const { timer, pet } = useAppStore();
    const [currentQuote, setCurrentQuote] = useState<string | null>(null);

    // Effect for handling state transitions
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (pet.animState === 'low-power') {
            setCurrentQuote(getRandom(quotes['low-power']));
        } else if (timer.status === 'running' && (pet.animState === 'focusing' || pet.animState === 'happy')) {
            setCurrentQuote(getRandom(quotes.running));
            timeout = setTimeout(() => setCurrentQuote(null), 5000);
        } else if (pet.animState === 'happy' || timer.status === 'completed') {
            setCurrentQuote(getRandom(quotes.completed));
            timeout = setTimeout(() => setCurrentQuote(null), 5000);
        } else if (pet.animState === 'sleeping') {
            // Let her sleep
            setCurrentQuote(null);
        } else if (timer.status === 'idle') {
            setCurrentQuote(null);
        }

        return () => clearTimeout(timeout);
    }, [timer.status, pet.animState]);

    // Effect for idle nudges
    useEffect(() => {
        if (timer.status === 'idle' && pet.animState !== 'low-power') {
            const interval = setInterval(() => {
                if (Math.random() > 0.5 && !document.hidden) {
                    setCurrentQuote(getRandom(quotes.idleNudges));
                    setTimeout(() => setCurrentQuote(null), 6000);
                }
            }, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [timer.status, pet.animState]);

    // Handle manual chat interaction
    useEffect(() => {
        const handleForceChat = () => {
            setCurrentQuote(getRandom(quotes.chat));
            setTimeout(() => setCurrentQuote(null), 5000);
        };
        window.addEventListener('nova-chat', handleForceChat);
        return () => window.removeEventListener('nova-chat', handleForceChat);
    }, []);

    return (
        <AnimatePresence>
            {currentQuote && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 min-w-[160px] max-w-[220px] z-30 pointer-events-none"
                >
                    <div className="relative bg-background/80 backdrop-blur-xl border border-primary/30 p-3 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.2)] text-center text-xs font-medium text-foreground tracking-wide leading-relaxed glass-panel">
                        {currentQuote}
                        {/* Little speech bubble tail */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background/80 backdrop-blur-xl border-r border-b border-primary/30 transform rotate-45" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
