import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, nativeImage } from 'electron'
import path from 'path'
import Store from 'electron-store'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null = null
let miniWin: BrowserWindow | null = null
let tray: Tray | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#0a0a0f',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false,
        },
        icon: path.join(process.env.VITE_PUBLIC!, 'icon.png'),
    })

    // Window control IPC handlers
    ipcMain.on('window:minimize', () => win?.minimize())
    ipcMain.on('window:maximize', () => {
        if (win?.isMaximized()) {
            win.unmaximize()
        } else {
            win?.maximize()
        }
    })
    ipcMain.on('window:close', () => win?.hide()) // hide to tray
    ipcMain.on('window:focus', () => {
        // Don't bring main window to front if mini mode is active
        if (miniWin && !miniWin.isDestroyed()) return

        if (win && !win.isDestroyed()) {
            if (win.isMinimized()) win.restore()
            win.show()
            win.setAlwaysOnTop(true)
            win.focus()
            win.setAlwaysOnTop(false)
        }
    })

    // Data Persistence IPC
    const store = new Store()

    ipcMain.handle('data:save', async (_event, data) => {
        store.set('deepwork_data', data)
        return true
    })

    ipcMain.handle('data:load', async () => {
        return store.get('deepwork_data')
    })

    // Mini mode IPC
    ipcMain.on('mini:open', () => {
        if (miniWin && !miniWin.isDestroyed()) {
            miniWin.focus()
            return
        }
        miniWin = new BrowserWindow({
            width: 280,
            height: 80,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            skipTaskbar: true,
            backgroundColor: '#00000000',
            hasShadow: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        })
        if (VITE_DEV_SERVER_URL) {
            miniWin.loadURL(`${VITE_DEV_SERVER_URL}mini.html`)
        } else {
            miniWin.loadFile(path.join(process.env.DIST!, 'mini.html'))
        }
        // Hide main window when mini opens
        win?.hide()
        miniWin.on('closed', () => {
            miniWin = null
            // Show main window when mini closes
            if (win && !win.isDestroyed()) {
                win.show()
                win.focus()
            }
        })
    })

    ipcMain.on('mini:close', () => {
        if (miniWin && !miniWin.isDestroyed()) {
            miniWin.close()
            miniWin = null
        }
        // Show main window when mini is closed via IPC
        if (win && !win.isDestroyed()) {
            win.show()
            win.focus()
        }
    })

    // Allow mini window to toggle click-through on transparent areas
    ipcMain.on('window:set-ignore-mouse', (_event, ignore: boolean, opts?: { forward: boolean }) => {
        const sender = BrowserWindow.fromWebContents(_event.sender)
        if (sender && !sender.isDestroyed()) {
            sender.setIgnoreMouseEvents(ignore, opts)
        }
    })

    // Mini window drag support — absolute positioning for smooth movement
    let miniDragStartPos: { x: number; y: number } | null = null

    ipcMain.on('mini:start-drag', (_event, screenX: number, screenY: number) => {
        if (miniWin && !miniWin.isDestroyed()) {
            const [wx, wy] = miniWin.getPosition()
            miniDragStartPos = { x: wx - screenX, y: wy - screenY }
        }
    })

    ipcMain.on('mini:drag-move', (_event, screenX: number, screenY: number) => {
        if (miniWin && !miniWin.isDestroyed() && miniDragStartPos) {
            miniWin.setPosition(miniDragStartPos.x + screenX, miniDragStartPos.y + screenY)
        }
    })

    ipcMain.on('mini:drag-end', () => {
        miniDragStartPos = null
    })

    // Forward timer state from main window to mini window
    ipcMain.on('mini:timer-state', (_event, state) => {
        if (miniWin && !miniWin.isDestroyed()) {
            miniWin.webContents.send('mini:timer-state', state)
        }
    })

    // Forward timer controls from mini window to main window
    ipcMain.on('mini:timer-control', (_event, action) => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('mini:timer-control', action)
        }
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST!, 'index.html'))
    }
}

function createTray() {
    const icon = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    )
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show DeepWork', click: () => win?.show() },
        { label: 'Quit', click: () => { app.quit() } },
    ])
    tray.setToolTip('DeepWork')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => win?.show())
}

app.on('ready', () => {
    createWindow()
    createTray()

    // Global shortcuts
    globalShortcut.register('CommandOrControl+Shift+P', () => {
        win?.webContents.send('shortcut:toggle-timer')
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
