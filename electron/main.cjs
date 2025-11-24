const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const oscClient = require('./oscClient.cjs');

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Отключаем throttling для фоновых окон
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Инициализируем OSC клиент
  const configPath = isDev 
    ? path.join(__dirname, '../config.json')
    : path.join(path.dirname(app.getPath('exe')), 'config.json');
  
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
