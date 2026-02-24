import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { cn, priorityColor, priorityBg } from '@/lib/utils'
import { Plus, Trash2, CheckCircle2, Edit3, X, Circle, Sparkles, Filter as FilterIcon, Clock } from 'lucide-react'
import { Task } from '@/types'
import { staggerContainer, staggerItem, scaleIn, backdropVariants, springBouncy, buttonPress } from '@/lib/animations'
import { Confetti } from '@/components/Confetti'

type Filter = 'all' | 'todo' | 'in-progress' | 'done'

export function Tasks() {
    const tasks = useAppStore((s) => s.tasks)
    const addTask = useAppStore((s) => s.addTask)
    const updateTask = useAppStore((s) => s.updateTask)
    const deleteTask = useAppStore((s) => s.deleteTask)
    const completeTask = useAppStore((s) => s.completeTask)

    // Theme State
    const settings = useAppStore((s) => s.settings)
    const themes = useAppStore((s) => s.themes)
    const activeTheme = themes.find(t => t.id === settings.selectedThemeId)
    const isRetro = activeTheme?.style === 'retro'
    const isDeadpool = activeTheme?.style === 'deadpool'

    const [filter, setFilter] = useState<Filter>('all')
    const [showModal, setShowModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [showConfetti, setShowConfetti] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
    const [tags, setTags] = useState('')
    const [estimatedPomodoros, setEstimatedPomodoros] = useState(4)

    const filteredTasks = tasks.filter((t) => {
        if (filter === 'all') return true
        return t.status === filter
    })

    const openAddModal = () => {
        setEditingTask(null)
        setTitle('')
        setDescription('')
        setPriority('medium')
        setTags('')
        setEstimatedPomodoros(4)
        setShowModal(true)
    }

    const openEditModal = (task: Task) => {
        setEditingTask(task)
        setTitle(task.title)
        setDescription(task.description)
        setPriority(task.priority)
        setTags(task.tags.join(', '))
        setEstimatedPomodoros(task.estimatedPomodoros)
        setShowModal(true)
    }

    const handleSubmit = () => {
        if (!title.trim()) return
        const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean)

        if (editingTask) {
            updateTask(editingTask.id, {
                title, description, priority, tags: tagArray, estimatedPomodoros,
            })
        } else {
            addTask({ title, description, priority, tags: tagArray, estimatedPomodoros })
        }
        setShowModal(false)
    }

    const counts = {
        all: tasks.length,
        todo: tasks.filter((t) => t.status === 'todo').length,
        'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
        done: tasks.filter((t) => t.status === 'done').length,
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Header */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div>
                    <h1 className={cn(
                        "text-3xl font-semibold text-[hsl(var(--foreground))]",
                        isDeadpool && "uppercase tracking-tighter text-[hsl(var(--primary))]"
                    )} style={isDeadpool ? { fontFamily: 'Bangers' } : {}}>
                        {isDeadpool ? 'HIT LIST' : 'Tasks'}
                    </h1>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                        {tasks.length} {isDeadpool ? 'targets' : 'total tasks'} • {counts.done} {isDeadpool ? 'eliminated' : 'completed'}
                    </p>
                </div>
                <motion.button
                    onClick={openAddModal}
                    {...buttonPress}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold text-sm hover:opacity-90 transition-all glow-primary shadow-lg",
                        isDeadpool && "uppercase tracking-wide font-bold"
                    )}
                >
                    <Plus className="w-4 h-4" />
                    {isDeadpool ? 'NEW TARGET' : 'New Task'}
                </motion.button>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center gap-2 p-1.5 bg-[hsl(var(--card)_/_0.6)] backdrop-blur-md rounded-2xl border border-[hsl(var(--border))] w-fit"
            >
                <div className="px-3 py-1.5 text-[hsl(var(--muted-foreground))]">
                    <FilterIcon className="w-4 h-4" />
                </div>
                {(['all', 'todo', 'in-progress', 'done'] as Filter[]).map((f) => (
                    <motion.button
                        key={f}
                        onClick={() => setFilter(f)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        transition={springBouncy}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-medium transition-colors capitalize relative',
                            filter === f
                                ? 'text-[hsl(var(--primary-foreground))]'
                                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                        )}
                    >
                        {filter === f && (
                            <motion.div
                                layoutId="task-filter-pill"
                                className="absolute inset-0 rounded-xl bg-[hsl(var(--primary))] shadow-md"
                                transition={springBouncy}
                            />
                        )}
                        <span className="relative z-10">
                            {f === 'all' ? (isDeadpool ? 'ALL TARGETS' : 'All') : f === 'todo' ? (isDeadpool ? 'OPEN' : 'To Do') : f === 'in-progress' ? (isDeadpool ? 'HUNTING' : 'In Progress') : (isDeadpool ? 'KILLED' : 'Done')}
                            <span className={cn("ml-2 opacity-60", filter === f ? "text-white" : "")}>
                                {counts[f]}
                            </span>
                        </span>
                    </motion.button>
                ))}
            </motion.div>

            {/* Task List */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)_/_0.3)]"
                    >
                        <motion.div
                            className="w-16 h-16 rounded-2xl bg-[hsl(var(--secondary))] flex items-center justify-center mb-4"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Sparkles className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                        </motion.div>
                        <p className="text-[hsl(var(--foreground))] font-medium">{isDeadpool ? 'NO TARGETS FOUND' : 'No tasks found'}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{isDeadpool ? 'Stop eating chimichangas and get to work!' : 'Get started by creating a new task!'}</p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 gap-4"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    variants={staggerItem}
                                    layout
                                    exit={{ opacity: 0, x: -100, scale: 0.9, transition: { duration: 0.3 } }}
                                    whileHover={{ y: -2 }}
                                    transition={springBouncy}
                                    className={cn(
                                        'group relative rounded-2xl p-5 transition-colors',
                                        task.status === 'done'
                                            ? 'bg-[hsl(var(--card)_/_0.4)] border border-[hsl(var(--border))] opacity-60'
                                            : 'glass-panel hover:border-[hsl(var(--primary)_/_0.4)] hover:shadow-lg hover:shadow-[hsl(var(--primary)_/_0.05)]'
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Status Toggle */}
                                        <motion.button
                                            onClick={() => {
                                                if (task.status === 'done') {
                                                    updateTask(task.id, { status: 'todo' })
                                                } else {
                                                    completeTask(task.id)
                                                    setShowConfetti(true)
                                                }
                                            }}
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.8 }}
                                            transition={springBouncy}
                                            className="mt-1 shrink-0"
                                            aria-label={task.status === 'done' ? "Mark as todo" : "Mark as done"}
                                            title={task.status === 'done' ? "Mark as todo" : "Mark as done"}
                                        >
                                            {task.status === 'done' ? (
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border-2 border-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] transition-colors" />
                                            )}
                                        </motion.button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className={cn(
                                                        'text-base font-medium truncate pr-4',
                                                        task.status === 'done' ? 'line-through text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--foreground))]'
                                                    )}>
                                                        {task.title}
                                                    </h3>
                                                    {task.description && (
                                                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">{task.description}</p>
                                                    )}
                                                </div>

                                                {/* Quick Actions (Hover) */}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                                    <motion.button
                                                        onClick={() => openEditModal(task)}
                                                        whileHover={{ scale: 1.15 }}
                                                        whileTap={{ scale: 0.85 }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                                        aria-label="Edit task"
                                                        title="Edit task"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        onClick={() => deleteTask(task.id)}
                                                        whileHover={{ scale: 1.15 }}
                                                        whileTap={{ scale: 0.85, rotate: 10 }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400"
                                                        aria-label="Delete task"
                                                        title="Delete task"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-4">
                                                <motion.span
                                                    className={cn(
                                                        'text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wide',
                                                        priorityBg(task.priority),
                                                        priorityColor(task.priority),
                                                        'border-opacity-20'
                                                    )}
                                                    animate={task.priority === 'high' ? { scale: [1, 1.05, 1] } : {}}
                                                    transition={task.priority === 'high' ? { duration: 2, repeat: Infinity } : {}}
                                                >
                                                    {task.priority}
                                                </motion.span>

                                                {task.tags.map((tag) => (
                                                    <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                                                        #{tag}
                                                    </span>
                                                ))}

                                                <div className="ml-auto flex items-center gap-3">
                                                    <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                                                        <Clock className="w-3 h-3 inline mr-1" />{task.completedPomodoros}/{task.estimatedPomodoros}
                                                    </span>
                                                    <div className="w-24 h-1.5 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-[hsl(var(--primary))]"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (task.completedPomodoros / Math.max(1, task.estimatedPomodoros)) * 100)}%` }}
                                                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            variants={scaleIn}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-2xl glass-panel relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-[hsl(var(--primary))]" />

                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                                    {editingTask ? 'Edit Task' : 'New Task'}
                                </h2>
                                <motion.button
                                    onClick={() => setShowModal(false)}
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={springBouncy}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[hsl(var(--secondary))] transition-colors"
                                    aria-label="Close modal"
                                    title="Close"
                                >
                                    <X className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                                </motion.button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 block">Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="What are you working on?"
                                        autoFocus
                                        className="w-full rounded-xl bg-[hsl(var(--secondary)_/_0.5)] border border-[hsl(var(--border))] px-4 py-3 text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 block">Priority</label>
                                        <div className="flex p-1 bg-[hsl(var(--secondary)_/_0.5)] rounded-xl border border-[hsl(var(--border))] relative">
                                            {(['low', 'medium', 'high'] as const).map((p) => (
                                                <motion.button
                                                    key={p}
                                                    onClick={() => setPriority(p)}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={cn(
                                                        'flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors relative',
                                                        priority === p
                                                            ? 'text-[hsl(var(--foreground))]'
                                                            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                                    )}
                                                >
                                                    {priority === p && (
                                                        <motion.div
                                                            layoutId="priority-pill"
                                                            className="absolute inset-0 rounded-lg bg-[hsl(var(--card))] shadow-sm"
                                                            transition={springBouncy}
                                                        />
                                                    )}
                                                    <span className="relative z-10">{p}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 block">Est. Pomodoros</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                value={estimatedPomodoros}
                                                onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value))}
                                                min={1}
                                                max={12}
                                                className="flex-1 accent-[hsl(var(--primary))]"
                                            />
                                            <span className="w-8 text-center font-mono font-bold text-[hsl(var(--foreground))]">{estimatedPomodoros}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 block">Description & Tags</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add details..."
                                        rows={2}
                                        className="w-full rounded-xl bg-[hsl(var(--secondary)_/_0.5)] border border-[hsl(var(--border))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none mb-3"
                                    />
                                    <input
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="Tags (e.g. Design, Study)"
                                        className="w-full rounded-xl bg-[hsl(var(--secondary)_/_0.5)] border border-[hsl(var(--border))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <motion.button
                                    onClick={() => setShowModal(false)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-1 py-3.5 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors border border-[hsl(var(--border))]"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={handleSubmit}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex-1 py-3.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-bold hover:opacity-90 transition-all glow-primary shadow-lg"
                                >
                                    {editingTask ? 'Save Changes' : 'Create Task'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}


