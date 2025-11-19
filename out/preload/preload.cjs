"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  hashcat: {
    checkBinary: (path) => electron.ipcRenderer.invoke("hashcat:check-binary", path),
    start: (args, hashcatPath) => electron.ipcRenderer.invoke("hashcat:start", args, hashcatPath),
    stop: () => electron.ipcRenderer.invoke("hashcat:stop"),
    pause: () => electron.ipcRenderer.invoke("hashcat:pause"),
    resume: () => electron.ipcRenderer.invoke("hashcat:resume"),
    readPotfile: (hashcatPath) => electron.ipcRenderer.invoke("hashcat:read-potfile", hashcatPath),
    clearPotfile: (hashcatPath) => electron.ipcRenderer.invoke("hashcat:clear-potfile", hashcatPath),
    onOutput: (callback) => {
      electron.ipcRenderer.on("hashcat:output", (_event, data) => callback(data));
    },
    onError: (callback) => {
      electron.ipcRenderer.on("hashcat:error", (_event, data) => callback(data));
    },
    onExit: (callback) => {
      electron.ipcRenderer.on("hashcat:exit", (_event, code) => callback(code));
    },
    removeAllListeners: (channel) => {
      electron.ipcRenderer.removeAllListeners(channel);
    }
  },
  dialog: {
    openFile: (options) => electron.ipcRenderer.invoke("dialog:open-file", options),
    openDirectory: (options) => electron.ipcRenderer.invoke("dialog:open-file", { ...options, properties: ["openDirectory"] }),
    saveFile: (options) => electron.ipcRenderer.invoke("dialog:save-file", options)
  },
  fs: {
    readFile: (filePath) => electron.ipcRenderer.invoke("fs:read-file", filePath),
    writeFile: (filePath, content) => electron.ipcRenderer.invoke("fs:write-file", filePath, content),
    createTempFile: (content, extension) => electron.ipcRenderer.invoke("fs:create-temp-file", content, extension)
  }
});
