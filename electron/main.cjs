const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const oscClient = require('./oscClient.cjs');

// Проверяем dev режим более надёжно
const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false, // Не показываем сразу, покажем когда загрузится
    fullscreen: !isDev, // В dev режиме обычное окно, в prod - fullscreen
    frame: false,
    kiosk: !isDev, // Kiosk режим только в production
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Показываем окно когда контент готов
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!isDev) {
      mainWindow.setFullScreen(true);
      mainWindow.setKiosk(true);
    }
    console.log('[Electron] Window shown');
  });

  // Отключаем throttling для фоновых окон
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // В production файлы находятся в app.asar рядом с electron
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log('[Electron] Loading index.html from:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('[Electron] Failed to load index.html:', err);
    });
  }

  // Логируем ошибки загрузки
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron] Failed to load:', errorCode, errorDescription);
  });
}

app.whenReady().then(() => {
  // Инициализируем OSC клиент
  const configPath = isDev 
    ? path.join(__dirname, '../config.json')
    : path.join(path.dirname(app.getPath('exe')), 'config.json');
  
  console.log('[Electron] Config path:', configPath);
  console.log('[Electron] exe path:', app.getPath('exe'));
  
  oscClient.init(configPath);
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  oscClient.close();
  if (process.platform !== 'darwin') app.quit();
});

// IPC обработчик для отправки OSC команд
ipcMain.on('screen-changed', (event, screenName) => {
  console.log(`[IPC] Screen changed to: ${screenName}`);
  oscClient.sendScreenChange(screenName);
});
