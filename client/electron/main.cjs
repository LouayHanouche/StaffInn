const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    title: 'StaffInn',
    icon: path.join(__dirname, '..', 'public', 'logo.svg'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  window.loadURL('http://localhost:5173');
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
