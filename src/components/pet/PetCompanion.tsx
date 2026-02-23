import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CyberFoxSVG } from './CyberFoxSVG';
import { NovaDialogue } from './NovaDialogue';
import { NovaShop } from './NovaShop';
import { DailyMissions } from './DailyMissions';
import { PetDebugPanel } from './PetDebugPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Sparkles, ArrowUp } from 'lucide-react';

export const PetCompanion: React.FC = () => {
    const { pet, addPetXp, setPetAnimState } = useAppStore();
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [levelUpToast, setLevelUpToast] = useState<number | null>(null);
    const prevLevelRef = useRef(pet.level);

    // Detect level-up
    useEffect(() => {
        if (pet.level > prevLevelRef.current) {
            setLevelUpToast(pet.level);
            setTimeout(() => setLevelUpToast(null), 3000);
        }
        prevLevelRef.current = pet.level;
    }, [pet.level]);

    // Calculate XP percentage for progress bar
    const xpPercentage = Math.min(100, Math.max(0, (pet.xp / pet.totalXp) * 100));

    // Optional interaction: Petting the fox gives a tiny bit of XP and makes it happy
    const handleInteract = () => {
        if (pet.animState !== 'sleeping') {
            setPetAnimState('happy');
            addPetXp(1); // Micro-interaction reward
            window.dispatchEvent(new Event('nova-chat')); // Trigger chat dialogue

            // Return to previous state after a moment
            setTimeout(() => {
                const currentStatus = useAppStore.getState().timer.status;
                if (currentStatus === 'running') {
                    setPetAnimState('focusing');
                } else {
                    setPetAnimState('idle');
                }
            }, 2000);
        }
    };

    return (
        <div className="relative flex flex-col items-center p-6 glass-panel rounded-3xl group transition-all duration-300 hover:shadow-glow-primary/20 hover:border-primary/30">
            {/* Ambient background glow behind the pet */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl opacity-50 pointer-events-none" />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl transition-opacity duration-500 ${pet.animState === 'focusing' ? 'opacity-100' : 'opacity-40'}`} />

            {/* Level-Up Toast */}
            <AnimatePresence>
                {levelUpToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/30 flex items-center gap-2"
                    >
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-sm font-bold whitespace-nowrap">Level {levelUpToast}!</span>
                        <Sparkles className="w-4 h-4" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header info */}
            <div className="w-full flex justify-between items-start mb-2 z-10">
                <div>
                    <h3 className="text-lg font-bold text-foreground drop-shadow-sm">{pet.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cyber Fox</p>
                </div>
                <motion.div
                    key={pet.level}
                    initial={{ scale: 1.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="bg-primary/20 border border-primary/30 text-primary px-3 py-1 rounded-full text-sm font-bold shadow-glow-primary/20"
                >
                    Lvl {pet.level}
                </motion.div>
            </div>

            {/* Pet SVG Container */}
            <div className="relative z-10 flex flex-col items-center">
                <NovaDialogue />
                <div
                    className="w-40 h-40 relative cursor-pointer drop-shadow-[0_15px_25px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 active:scale-95"
                    onClick={handleInteract}
                    title="Click to interact!"
                >
                    <CyberFoxSVG animState={pet.animState} level={pet.level} equippedItems={pet.equippedItems} />
                </div>
            </div>

            {/* XP Bar */}
            <div className="w-full mt-4 space-y-2 z-10">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>XP</span>
                    <span>{pet.xp} / {pet.totalXp}</span>
                </div>
                <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary via-blue-500 to-cyan-400 rounded-full shadow-glow-primary/50 relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        {/* Shimmer effect on XP bar */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </motion.div>
                </div>
                {/* Status indicator text */}
                <p className="text-center text-xs text-muted-foreground/80 lowercase italic">
                    {pet.animState === 'focusing' && "in deep focus..."}
                    {pet.animState === 'sleeping' && "recharging..."}
                    {pet.animState === 'idle' && "ready to work"}
                    {pet.animState === 'happy' && "feeling great!"}
                    {pet.animState === 'sad' && "missed a session"}
                    {pet.animState === 'low-power' && "low power mode"}
                    {pet.animState === 'celebration' && "🎉 leveled up!!!"}
                </p>
            </div>

            {/* Shop & Credits Footer */}
            <div className="w-full flex justify-between items-center mt-4 border-t border-border/10 pt-4 z-10">
                <motion.button
                    onClick={() => setIsShopOpen(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs font-bold bg-primary/20 hover:bg-primary/30 text-primary px-4 py-1.5 rounded-full transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Store className="w-3.5 h-3.5" />
                    Store
                </motion.button>
                <div className="font-mono text-sm font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg shadow-sm border border-amber-500/20 flex items-center gap-1">
                    {pet.credits} <span className="text-amber-400">✦</span>
                </div>
            </div>

            <div className="w-full mt-4 z-10">
                <DailyMissions />
            </div>

            <PetDebugPanel />

            <NovaShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        </div>
    );
};
