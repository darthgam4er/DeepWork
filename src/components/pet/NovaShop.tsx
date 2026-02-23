import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, ShoppingCart, Check, X, Tag, Sparkles, Crown, Palette, MonitorSmartphone } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CosmeticItem } from '@/types'

const SHOP_ITEMS: CosmeticItem[] = [
    { id: 'visor_neon_pink', name: 'Neon Pink Visor', type: 'visor', price: 150, description: 'A sleek pink neon scanner visor.' },
    { id: 'visor_gold', name: 'Golden Shades', type: 'visor', price: 500, description: 'Premium 24k gold cyber-shades.' },
    { id: 'skin_holographic', name: 'Hologram Skin', type: 'skin', price: 1000, description: 'Translucent blue holographic projection.' },
    { id: 'head_halo', name: 'Cyber Halo', type: 'head', price: 300, description: 'A hovering neon data ring.' },
    { id: 'bg_matrix', name: 'Matrix Grid', type: 'background', price: 250, description: 'Digital raining code backdrop.' }
]

const ITEM_ICONS: Record<string, string> = {
    'visor_neon_pink': '🩷',
    'visor_gold': '🥇',
    'skin_holographic': '🌀',
    'head_halo': '👼',
    'bg_matrix': '💻',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'visor': <Sparkles className="w-3 h-3" />,
    'head': <Crown className="w-3 h-3" />,
    'skin': <Palette className="w-3 h-3" />,
    'background': <MonitorSmartphone className="w-3 h-3" />,
}

const RARITY_COLORS: Record<number, { border: string; badge: string; label: string }> = {
    150: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-500', label: 'Common' },
    250: { border: 'border-blue-500/30', badge: 'bg-blue-500/10 text-blue-500', label: 'Uncommon' },
    300: { border: 'border-purple-500/30', badge: 'bg-purple-500/10 text-purple-500', label: 'Rare' },
    500: { border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-500', label: 'Epic' },
    1000: { border: 'border-red-500/30', badge: 'bg-red-500/10 text-red-500', label: 'Legendary' },
}

function getRarity(price: number) {
    if (price >= 1000) return RARITY_COLORS[1000]
    if (price >= 500) return RARITY_COLORS[500]
    if (price >= 300) return RARITY_COLORS[300]
    if (price >= 250) return RARITY_COLORS[250]
    return RARITY_COLORS[150]
}

interface NovaShopProps {
    isOpen: boolean
    onClose: () => void
}

export const NovaShop: React.FC<NovaShopProps> = ({ isOpen, onClose }) => {
    const pet = useAppStore(s => s.pet)
    const buyItem = useAppStore(s => s.buyItem)
    const equipItem = useAppStore(s => s.equipItem)
    const unequipItem = useAppStore(s => s.unequipItem)

    const [activeTab, setActiveTab] = useState<CosmeticItem['type'] | 'all'>('all')
    const [justBought, setJustBought] = useState<string | null>(null)

    const filteredItems = activeTab === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.type === activeTab)

    const handleBuy = (item: CosmeticItem) => {
        buyItem(item)
        setJustBought(item.id)
        setTimeout(() => setJustBought(null), 1500)
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 30, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-background rounded-2xl shadow-2xl border border-border/50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                <Store className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Cyber Store</h2>
                                <p className="text-xs text-muted-foreground">Upgrade Nova's aesthetics</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                                <span className="text-sm font-bold text-amber-500">{pet.credits}</span>
                                <span className="text-amber-400">✦</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-5 pt-4 pb-2 gap-2 overflow-x-auto no-scrollbar">
                        {(['all', 'visor', 'head', 'skin', 'background'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${activeTab === tab
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {tab !== 'all' && TYPE_ICONS[tab]}
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Item Grid */}
                    <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredItems.map((item, idx) => {
                            const isOwned = pet.ownedItems.includes(item.id)
                            const isEquipped = pet.equippedItems[item.type] === item.id
                            const canAfford = pet.credits >= item.price
                            const rarity = getRarity(item.price)
                            const wasBought = justBought === item.id

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 ${isEquipped
                                            ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                                            : `${rarity.border} bg-card/60 hover:bg-card/80 hover:shadow-md`
                                        }`}
                                >
                                    {/* Equipped Badge */}
                                    {isEquipped && (
                                        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider shadow-md">
                                            Equipped
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3">
                                        {/* Item Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isOwned ? 'bg-primary/10' : 'bg-muted/50'
                                            } shrink-0 border border-border/30`}>
                                            {ITEM_ICONS[item.id] || '🎁'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-foreground text-sm truncate">{item.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${rarity.badge}`}>
                                                    {rarity.label}
                                                </span>
                                                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
                                                    {TYPE_ICONS[item.type]} {item.type}
                                                </span>
                                            </div>
                                        </div>

                                        {!isOwned && (
                                            <div className="flex items-center gap-1 text-xs font-bold font-mono text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 shrink-0">
                                                <Tag className="w-3 h-3" />
                                                {item.price} ✦
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>

                                    <div className="pt-2 border-t border-border/30">
                                        {wasBought ? (
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className="w-full py-2 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-500 text-center flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-4 h-4" /> Purchased!
                                            </motion.div>
                                        ) : !isOwned ? (
                                            <button
                                                onClick={() => handleBuy(item)}
                                                disabled={!canAfford}
                                                className={`w-full py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${canAfford
                                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md active:scale-[0.98]'
                                                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                                    }`}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                {canAfford ? 'Purchase' : 'Not enough Credits'}
                                            </button>
                                        ) : isEquipped ? (
                                            <button
                                                onClick={() => unequipItem(item.type)}
                                                className="w-full py-2 rounded-lg text-sm font-bold bg-muted hover:bg-red-500/10 hover:text-red-500 text-foreground transition-all active:scale-[0.98]"
                                            >
                                                Unequip
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => equipItem(item)}
                                                className="w-full py-2 rounded-lg text-sm font-bold bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                            >
                                                <Check className="w-4 h-4" /> Equip
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-muted/20 text-xs text-muted-foreground">
                        <span>Owned: <span className="text-foreground font-bold">{pet.ownedItems.length}/{SHOP_ITEMS.length}</span></span>
                        <span>Equipped: <span className="text-foreground font-bold">{Object.keys(pet.equippedItems).length} slots</span></span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}
