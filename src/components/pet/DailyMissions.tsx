import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Plus, Clock, ListChecks, MessageCircle, Swords } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Mission } from '@/types'

const MISSION_ICONS: Record<Mission['type'], { icon: React.ReactNode; color: string }> = {
    'focus_time': { icon: <Clock className="w-4 h-4" />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    'task_completion': { icon: <ListChecks className="w-4 h-4" />, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    'interact': { icon: <MessageCircle className="w-4 h-4" />, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
}

interface DailyMissionsProps {
    className?: string
}

export const DailyMissions: React.FC<DailyMissionsProps> = ({ className = '' }) => {
    const dailyMissions = useAppStore(s => s.dailyMissions)
    const claimReward = useAppStore(s => s.claimMissionReward)

    if (dailyMissions.length === 0) return null

    const completedCount = dailyMissions.filter(m => m.completed).length

    return (
        <div className={`card-panel p-4 flex flex-col gap-3 ${className}`}>
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Swords className="w-4 h-4 text-primary" />
                    Daily Missions
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {completedCount}/{dailyMissions.length}
                </span>
            </div>

            <div className="flex flex-col gap-2">
                <AnimatePresence>
                    {dailyMissions.map((mission, idx) => {
                        const progressPercent = Math.min(100, Math.round((mission.progress / mission.target) * 100))
                        const isClaimable = mission.progress >= mission.target && !mission.completed
                        const missionStyle = MISSION_ICONS[mission.type] || MISSION_ICONS['focus_time']

                        return (
                            <motion.div
                                key={mission.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.08 }}
                                className={`relative p-3 rounded-xl border overflow-hidden transition-all duration-300 ${mission.completed
                                        ? 'border-primary/20 bg-primary/5 opacity-70'
                                        : isClaimable
                                            ? 'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10'
                                            : 'border-border/40 bg-card/40'
                                    }`}
                            >
                                {/* Background Progress Fill */}
                                {!mission.completed && (
                                    <motion.div
                                        className="absolute left-0 top-0 bottom-0 bg-primary/8 pointer-events-none"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-3">
                                    {/* Mission Type Icon */}
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${missionStyle.color}`}>
                                        {mission.completed ? <CheckCircle2 className="w-4 h-4 text-primary" /> : missionStyle.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className={`text-xs font-bold block truncate ${mission.completed ? 'text-primary line-through' : 'text-foreground'}`}>
                                            {mission.title}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                            {mission.description}
                                        </p>
                                    </div>

                                    {/* Action Area */}
                                    <div className="flex flex-col items-end flex-shrink-0 gap-1">
                                        {mission.completed ? (
                                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Done
                                            </span>
                                        ) : isClaimable ? (
                                            <motion.button
                                                onClick={() => claimReward(mission.id)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-3 py-1 rounded-full text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                                            >
                                                Claim {mission.reward} ✦
                                            </motion.button>
                                        ) : (
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-foreground font-mono">
                                                    {Math.floor(mission.progress)}/{mission.target}
                                                </div>
                                                <div className="text-[9px] text-muted-foreground flex items-center justify-end gap-0.5">
                                                    <Plus className="w-2.5 h-2.5 text-amber-500" /> {mission.reward} ✦
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
