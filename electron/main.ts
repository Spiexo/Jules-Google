import { app, BrowserWindow, ipcMain, safeStorage, shell, Notification } from "electron";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";

// ── API key storage ───────────────────────────────────────────────────────────

// Lazy-init: app.getPath requires app.ready, IPC handlers are always called after
let _keyFile: string | undefined;
const keyFile = (): string => (_keyFile ??= path.join(app.getPath("userData"), "apikey.enc"));

let _encAvail: boolean | undefined;
const encAvail = (): boolean => (_encAvail ??= safeStorage.isEncryptionAvailable());

// In-memory cache — invalidated on save/clear
let cachedKey: string | null = null;

function persistApiKey(key: string) {
  const data = encAvail() ? safeStorage.encryptString(key) : Buffer.from(key, "utf8");
  fs.writeFileSync(keyFile(), data);
}

function readApiKey(): string {
  if (cachedKey !== null) return cachedKey;
  const fp = keyFile();
  if (!fs.existsSync(fp)) return (cachedKey = "");
  const data = fs.readFileSync(fp);
  cachedKey = encAvail() ? safeStorage.decryptString(data) : data.toString("utf8");
  return cachedKey;
}

function getApiKey(): string {
  const key = readApiKey();
  if (key) return key;
  throw new Error(
    "Aucune clé API configurée. Allez dans ⚙ Paramètres et ajoutez votre clé API Jules."
  );
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    backgroundColor: "#1a1a1a",
    show: false,
  });

  const startUrl = !app.isPackaged
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);
  mainWindow.once("ready-to-show", () => mainWindow.show());

}

// ── Jules API helpers ─────────────────────────────────────────────────────────

function julesHeaders() {
  return {
    "x-goog-api-key": getApiKey(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function julesRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    // Merge caller headers first so julesHeaders always wins
    headers: { ...(options.headers as Record<string, string>), ...julesHeaders() },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as any)?.error?.message || `Erreur API ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle("ping", () => "pong");

ipcMain.handle("auth:save-key", (_event, key: string) => {
  const trimmed = key.trim();
  persistApiKey(trimmed);
  cachedKey = trimmed;
});

ipcMain.handle("auth:has-key", () => readApiKey().length > 0);

ipcMain.handle("auth:clear-key", () => {
  try { fs.unlinkSync(keyFile()); } catch (e: any) { if (e.code !== "ENOENT") throw e; }
  cachedKey = "";
});

// Errors from julesRequest (proper Error objects) propagate through IPC automatically
ipcMain.handle("jules:get-sources", () =>
  julesRequest(`${JULES_API_BASE}/sources`)
);

ipcMain.handle("jules:create-session", (_event, opts: {
  sourceName: string;
  description: string;
  startingBranch?: string;
  automationMode?: string;
  requirePlanApproval?: boolean;
  title?: string;
}) => {
  const body: Record<string, unknown> = {
    prompt: opts.description,
    sourceContext: {
      source: opts.sourceName,
      githubRepoContext: { startingBranch: opts.startingBranch ?? "main" },
    },
  };
  if (opts.title)                          body.title              = opts.title;
  if (opts.automationMode)                 body.automationMode     = opts.automationMode;
  if (opts.requirePlanApproval !== undefined) body.requirePlanApproval = opts.requirePlanApproval;
  return julesRequest(`${JULES_API_BASE}/sessions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
});

ipcMain.handle("jules:get-session", (_event, sessionName: string) =>
  julesRequest(`${JULES_API_BASE}/${sessionName}`)
);

ipcMain.handle("jules:list-sessions", () =>
  julesRequest(`${JULES_API_BASE}/sessions`)
);

ipcMain.handle("shell:open-external", (_event, url: string) =>
  shell.openExternal(url)
);

ipcMain.handle("app:notify", (_event, title: string, body: string) => {
  if (Notification.isSupported()) new Notification({ title, body }).show();
});

ipcMain.handle("jules:list-activities", (_event, sessionName: string) =>
  julesRequest(`${JULES_API_BASE}/${sessionName}/activities`)
);

ipcMain.handle("jules:send-message", (_event, sessionName: string, prompt: string) =>
  julesRequest(`${JULES_API_BASE}/${sessionName}:sendMessage`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  })
);

ipcMain.handle("jules:approve-plan", (_event, sessionName: string) =>
  julesRequest(`${JULES_API_BASE}/${sessionName}:approvePlan`, {
    method: "POST",
    body: JSON.stringify({}),
  })
);

// ── Persistance locale ────────────────────────────────────────────────────────

const sessionsFile = () => path.join(app.getPath("userData"), "sessions.json");
const logFile      = () => path.join(app.getPath("userData"), "session-log.json");

ipcMain.handle("store:read-sessions", () => {
  try { return JSON.parse(fs.readFileSync(sessionsFile(), "utf8")); }
  catch { return []; }
});

ipcMain.handle("store:write-sessions", (_event, sessions: unknown[]) => {
  fs.writeFileSync(sessionsFile(), JSON.stringify(sessions, null, 2), "utf8");
});

ipcMain.handle("store:read-logs", () => {
  try { return JSON.parse(fs.readFileSync(logFile(), "utf8")); }
  catch { return []; }
});

ipcMain.handle("store:append-log", (_event, entry: unknown) => {
  let logs: unknown[] = [];
  try { logs = JSON.parse(fs.readFileSync(logFile(), "utf8")); } catch {}
  logs.push(entry);
  if (logs.length > 2000) logs = logs.slice(-2000);
  fs.writeFileSync(logFile(), JSON.stringify(logs, null, 2), "utf8");
});

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
