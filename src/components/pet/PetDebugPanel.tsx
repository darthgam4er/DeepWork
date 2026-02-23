import React, { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Bug, ChevronDown, ChevronUp, Coins, Sparkles, Zap, RotateCcw, Trophy, Heart } from 'lucide-react'
import { PetState } from '@/types'

const ANIM_STATES: PetState['animState'][] = [
    'idle', 'sleeping', 'focusing', 'happy', 'sad', 'low-power', 'celebration'
]

export const PetDebugPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)
    const pet = useAppStore(s => s.pet)
    const addPetXp = useAppStore(s => s.addPetXp)
    const addCredits = useAppStore(s => s.addCredits)
    const setPetAnimState = useAppStore(s => s.setPetAnimState)
    const dailyMissions = useAppStore(s => s.dailyMissions)
    const updateMissionProgress = useAppStore(s => s.updateMissionProgress)
    const claimMissionReward = useAppStore(s => s.claimMissionReward)
    const _persist = useAppStore(s => s._persist)

    const handleAddCredits = (amount: number) => {
        addCredits(amount)
    }

    const handleAddXp = (amount: number) => {
        addPetXp(amount)
        _persist()
    }

    const handleMaxLevel = () => {
        // Add a lot of XP to trigger many level-ups
        for (let i = 0; i < 20; i++) {
            addPetXp(500)
        }
        _persist()
    }

    const handleCompleteMissions = () => {
        dailyMissions.forEach(m => {
            if (!m.completed) {
                updateMissionProgress(m.type, m.target)
            }
        })
    }

    const handleClaimAll = () => {
        dailyMissions.forEach(m => {
            if (m.progress >= m.target && !m.completed) {
                claimMissionReward(m.id)
            }
        })
    }

    const handleResetPet = () => {
        useAppStore.setState({
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
            }
        })
        _persist()
    }

    return (
        <div className="w-full mt-3 z-10">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground py-1 transition-colors"
            >
                <Bug className="w-3 h-3" />
                Debug Tools
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isOpen && (
                <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/30 space-y-3 text-xs">
                    {/* Current State Info */}
                    <div className="p-2 bg-background/50 rounded-lg font-mono text-[10px] text-muted-foreground space-y-0.5">
                        <p>Level: <span className="text-foreground font-bold">{pet.level}</span></p>
                        <p>XP: <span className="text-foreground font-bold">{pet.xp}/{pet.totalXp}</span></p>
                        <p>Credits: <span className="text-amber-500 font-bold">{pet.credits} ✦</span></p>
                        <p>State: <span className="text-primary font-bold">{pet.animState}</span></p>
                        <p>Owned: <span className="text-foreground font-bold">{pet.ownedItems.length} items</span></p>
                        <p>Equipped: <span className="text-foreground font-bold">{Object.keys(pet.equippedItems).length} slots</span></p>
                    </div>

                    {/* Credits */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                            <Coins className="w-3 h-3" /> Credits
                        </p>
                        <div className="flex gap-1">
                            {[50, 200, 500, 1000].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => handleAddCredits(amt)}
                                    className="flex-1 py-1 px-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md font-bold text-[10px] transition-colors"
                                >
                                    +{amt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* XP */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> XP
                        </p>
                        <div className="flex gap-1">
                            {[10, 50, 100, 500].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => handleAddXp(amt)}
                                    className="flex-1 py-1 px-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-md font-bold text-[10px] transition-colors"
                                >
                                    +{amt}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleMaxLevel}
                            className="w-full mt-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-md font-bold text-[10px] transition-colors flex items-center justify-center gap-1"
                        >
                            <Zap className="w-3 h-3" /> Power Level Up (×20)
                        </button>
                    </div>

                    {/* Animation States */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                            <Heart className="w-3 h-3" /> Animation State
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {ANIM_STATES.map(state => (
                                <button
                                    key={state}
                                    onClick={() => setPetAnimState(state)}
                                    className={`py-1 px-2 rounded-md font-bold text-[10px] transition-colors ${pet.animState === state
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                                        }`}
                                >
                                    {state}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mission Actions */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Missions
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={handleCompleteMissions}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-md font-bold text-[10px] transition-colors"
                            >
                                Complete All
                            </button>
                            <button
                                onClick={handleClaimAll}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-md font-bold text-[10px] transition-colors"
                            >
                                Claim All
                            </button>
                        </div>
                    </div>

                    {/* Reset */}
                    <button
                        onClick={handleResetPet}
                        className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md font-bold text-[10px] transition-colors flex items-center justify-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3" /> Reset Pet to Default
                    </button>
                </div>
            )}
        </div>
    )
}
