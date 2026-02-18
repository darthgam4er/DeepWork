import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    focusWindow: () => ipcRenderer.send('window:focus'),
    onToggleTimer: (callback: () => void) => {
        const subscription = (_: any, ...args: any[]) => callback()
        ipcRenderer.on('shortcut:toggle-timer', subscription)
        return () => ipcRenderer.removeListener('shortcut:toggle-timer', subscription)
    },
    saveData: (data: any) => ipcRenderer.invoke('data:save', data),
    loadData: () => ipcRenderer.invoke('data:load'),
    // Mini mode APIs
    openMini: () => ipcRenderer.send('mini:open'),
    closeMini: () => ipcRenderer.send('mini:close'),
    sendTimerState: (state: any) => ipcRenderer.send('mini:timer-state', state),
    onTimerState: (callback: (state: any) => void) => {
        const handler = (_: any, state: any) => callback(state)
        ipcRenderer.on('mini:timer-state', handler)
        return () => ipcRenderer.removeListener('mini:timer-state', handler)
    },
    sendTimerControl: (action: string) => ipcRenderer.send('mini:timer-control', action),
    onTimerControl: (callback: (action: string) => void) => {
        const handler = (_: any, action: string) => callback(action)
        ipcRenderer.on('mini:timer-control', handler)
        return () => ipcRenderer.removeListener('mini:timer-control', handler)
    },
    setIgnoreMouseEvents: (ignore: boolean, opts?: { forward: boolean }) => ipcRenderer.send('window:set-ignore-mouse', ignore, opts),
    startDrag: (screenX: number, screenY: number) => ipcRenderer.send('mini:start-drag', screenX, screenY),
    dragMove: (screenX: number, screenY: number) => ipcRenderer.send('mini:drag-move', screenX, screenY),
    dragEnd: () => ipcRenderer.send('mini:drag-end'),
})
