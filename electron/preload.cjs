const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Отправить уведомление о смене экрана
   * @param {string} screenName - 'start' или 'menu'
   */
  sendScreenChange: (screenName) => {
    ipcRenderer.send('screen-changed', screenName);
  }
});
