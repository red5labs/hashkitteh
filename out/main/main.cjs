"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const os = require("os");
let mainWindow = null;
let hashcatProcess = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // Disable sandbox to avoid CSP issues in dev
      webSecurity: true
    },
    backgroundColor: "#111827",
    titleBarStyle: "default"
  });
  const isDev = process.env.NODE_ENV === "development" || !electron.app.isPackaged;
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    console.log("Loading dev server:", devUrl);
    setTimeout(() => {
      mainWindow.loadURL(devUrl).catch((err) => {
        console.error("Failed to load URL:", err);
        setTimeout(() => {
          mainWindow.loadURL(devUrl).catch((retryErr) => {
            console.error("Retry also failed:", retryErr);
          });
        }, 1e3);
      });
    }, 500);
    mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
      console.error("Failed to load:", errorCode, errorDescription, validatedURL);
    });
  } else {
    const prodPath = path.join(__dirname, "../../dist/index.html");
    console.log("Loading production file:", prodPath);
    mainWindow.loadFile(prodPath);
  }
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (hashcatProcess) {
    hashcatProcess.kill();
    hashcatProcess = null;
  }
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("hashcat:check-binary", async (_, path2) => {
  return fs.existsSync(path2);
});
electron.ipcMain.handle("hashcat:start", async (_, args, hashcatPath) => {
  if (hashcatProcess) {
    return { success: false, error: "Hashcat process already running" };
  }
  return new Promise((resolve) => {
    try {
      console.log("Spawning hashcat:", hashcatPath, "with args:", args);
      const path2 = require("path");
      const hashcatDir = path2.dirname(hashcatPath);
      const hashcatExe = path2.basename(hashcatPath);
      console.log("Hashcat directory:", hashcatDir);
      console.log("Hashcat executable:", hashcatExe);
      hashcatProcess = child_process.spawn(hashcatExe, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        cwd: hashcatDir,
        // Set working directory to hashcat's directory
        env: { ...process.env }
        // Pass through environment variables
      });
      hashcatProcess.on("error", (error) => {
        console.error("Hashcat process spawn error:", error);
        mainWindow?.webContents.send("hashcat:error", `Failed to start hashcat: ${error.message}

Possible causes:
- Hashcat binary not found
- Missing dependencies (OpenCL runtime)
- Invalid hashcat installation`);
        hashcatProcess = null;
        resolve({ success: false, error: `Failed to start: ${error.message}` });
      });
      let stderrBuffer = "";
      hashcatProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        console.log("Hashcat stdout:", output);
        mainWindow?.webContents.send("hashcat:output", output);
      });
      hashcatProcess.stderr?.on("data", (data) => {
        const error = data.toString();
        stderrBuffer += error;
        console.log("Hashcat stderr:", error);
        mainWindow?.webContents.send("hashcat:error", error);
      });
      hashcatProcess.on("exit", (code, signal) => {
        console.log("Hashcat process exited:", { code, signal });
        if (code !== 0 && code !== null) {
          const signedCode = code > 2147483647 ? code - 4294967296 : code;
          console.error("Hashcat exited with error code:", signedCode);
          console.error("Stderr output:", stderrBuffer);
          if (stderrBuffer.includes("OpenCL") && !args.includes("--force")) {
            mainWindow?.webContents.send(
              "hashcat:error",
              'Hashcat failed: OpenCL error. Try enabling "Force CPU-Only Mode" in Attack Config.'
            );
          } else if (stderrBuffer) {
            mainWindow?.webContents.send(
              "hashcat:error",
              `Hashcat failed with exit code ${signedCode}. Check console output for details.`
            );
          }
        }
        mainWindow?.webContents.send("hashcat:exit", code);
        hashcatProcess = null;
      });
      resolve({ success: true });
    } catch (error) {
      console.error("Failed to spawn hashcat:", error);
      resolve({ success: false, error: String(error) });
    }
  });
});
electron.ipcMain.handle("hashcat:stop", async () => {
  if (hashcatProcess) {
    hashcatProcess.kill("SIGTERM");
    hashcatProcess = null;
    return { success: true };
  }
  return { success: false, error: "No process running" };
});
electron.ipcMain.handle("hashcat:pause", async () => {
  if (hashcatProcess) {
    hashcatProcess.kill("SIGSTOP");
    return { success: true };
  }
  return { success: false, error: "No process running" };
});
electron.ipcMain.handle("hashcat:resume", async () => {
  if (hashcatProcess) {
    hashcatProcess.kill("SIGCONT");
    return { success: true };
  }
  return { success: false, error: "No process running" };
});
electron.ipcMain.handle("dialog:open-file", async (_, options) => {
  if (!mainWindow) return { canceled: true };
  const result = await electron.dialog.showOpenDialog(mainWindow, options);
  return result;
});
electron.ipcMain.handle("dialog:save-file", async (_, options) => {
  if (!mainWindow) return { canceled: true };
  const result = await electron.dialog.showSaveDialog(mainWindow, options);
  return result;
});
electron.ipcMain.handle("fs:read-file", async (_, filePath) => {
  const fs2 = await import("fs/promises");
  try {
    const content = await fs2.readFile(filePath, "utf-8");
    return { success: true, content };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
electron.ipcMain.handle("fs:write-file", async (_, filePath, content) => {
  const fs2 = await import("fs/promises");
  try {
    await fs2.writeFile(filePath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
electron.ipcMain.handle("fs:create-temp-file", async (_, content, extension = "txt") => {
  const fs2 = await import("fs/promises");
  await import("path");
  try {
    const tempPath = path.join(os.tmpdir(), `hashcat-${Date.now()}.${extension}`);
    await fs2.writeFile(tempPath, content, "utf-8");
    return { success: true, path: tempPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
electron.ipcMain.handle("hashcat:read-potfile", async (_, hashcatPath) => {
  try {
    const path$1 = require("path");
    const hashcatDir = path$1.dirname(hashcatPath);
    const potfilePath = path.join(hashcatDir, "hashcat.potfile");
    console.log("Reading potfile from:", potfilePath);
    if (fs.existsSync(potfilePath)) {
      const content = fs.readFileSync(potfilePath, "utf-8");
      console.log("Potfile content length:", content.length);
      return { success: true, content };
    } else {
      console.log("Potfile not found at:", potfilePath);
      return { success: false, error: "Potfile not found" };
    }
  } catch (error) {
    console.error("Error reading potfile:", error);
    return { success: false, error: String(error) };
  }
});
electron.ipcMain.handle("hashcat:clear-potfile", async (_, hashcatPath) => {
  try {
    const path$1 = require("path");
    const hashcatDir = path$1.dirname(hashcatPath);
    const potfilePath = path.join(hashcatDir, "hashcat.potfile");
    console.log("Clearing potfile at:", potfilePath);
    if (fs.existsSync(potfilePath)) {
      fs.writeFileSync(potfilePath, "", "utf-8");
      console.log("Potfile cleared successfully");
      return { success: true };
    } else {
      console.log("Potfile not found, nothing to clear");
      return { success: true, message: "Potfile does not exist" };
    }
  } catch (error) {
    console.error("Error clearing potfile:", error);
    return { success: false, error: String(error) };
  }
});
