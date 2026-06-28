import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

const isDev = !app.isPackaged

function watchWindowShortcuts(window: BrowserWindow): void {
  const { webContents } = window
  webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (isDev && input.code === 'F12') {
      if (webContents.isDevToolsOpened()) {
        webContents.closeDevTools()
      } else {
        webContents.openDevTools({ mode: 'undocked' })
      }
    }
    if (!isDev && input.code === 'KeyR' && (input.control || input.meta)) {
      event.preventDefault()
    }
  })
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 600,
    minWidth: 960,
    minHeight: 600,
    resizable: false,
    center: true,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    title: 'LMTS - Municipality of Santa Legislative Management & Tracking System',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'undocked' })
    }
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.webContents
      .executeJavaScript("localStorage.removeItem('lmts-auth')")
      .catch(() => {})
      .finally(() => mainWindow.destroy())
  })

  ipcMain.on('set-zoom-factor', (_e, factor: number) => {
    mainWindow.webContents.setZoomFactor(Math.max(0.5, Math.min(2, factor)))
  })

  ipcMain.on('window-maximize', () => {
    mainWindow.setResizable(true)
    mainWindow.setMinimumSize(1100, 650)
    mainWindow.maximize()
  })

  ipcMain.on('window-restore-login', () => {
    mainWindow.unmaximize()
    mainWindow.setResizable(false)
    mainWindow.setMinimumSize(960, 600)
    mainWindow.setSize(960, 600)
    mainWindow.center()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater]', err.message)
  })

  // Check for updates 5 seconds after launch (only in packaged app)
  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000)
  }
}

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall()
})

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.santa.lmts')
  }

  app.on('browser-window-created', (_, window) => {
    watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  const win = createWindow()
  setupAutoUpdater(win)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
