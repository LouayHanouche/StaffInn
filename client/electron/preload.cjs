const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('staffinnDesktop', {
  isDesktop: true,
});
