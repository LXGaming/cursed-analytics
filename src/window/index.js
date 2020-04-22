const alert = require("./alert");
const config = require("../config");
const {app, ipcMain, BrowserWindow} = require("electron");
const path = require("path");
const session = require("./session");
const storage = require("../storage");
const toolbox = require("../util/toolbox");
const url = require("url");

function createWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(app.getAppPath(), "public", "js", "preload.js"),
      webviewTag: true
    }
  });

  window.setMenuBarVisibility(false);
  window.webContents.on("will-attach-webview", (event, webPreferences, params) => onWillAttachWebview(event, webPreferences, params));

  const storageCategory = config.get("storage");
  if (storageCategory.valid === true) {
    storage.connect(
      storageCategory.host,
      storageCategory.port,
      storageCategory.database,
      storageCategory.username,
      storageCategory.password
    ).then(success => {
      toolbox.loadFile(path.join(app.getAppPath(), "public", "webview.html"));
    }, failure => {
      config.set("storage.valid", false);
      toolbox.loadFile(path.join(app.getAppPath(), "public", "setup.html"), () => {
        alert.error(failure.name + ": " + failure.message);
        window.show();
      });
    });
  } else {
    toolbox.loadFile(path.join(app.getAppPath(), "public", "setup.html"), () => window.show());
  }
}

function onWillAttachWebview(event, webPreferences, params) {
  const preload = url.pathToFileURL(path.join(app.getAppPath(), "public", "js", "webview-preload.js")).toString();
  if ((webPreferences.preload != null && webPreferences.preload !== preload) || (webPreferences.preloadURL != null && webPreferences.preloadURL !== preload)) {
    event.preventDefault();
    return;
  }

  if ((params.preload != null && params.preload !== preload) || (params.preloadURL != null && params.preloadURL !== preload)) {
    event.preventDefault();
    return;
  }

  webPreferences.nodeIntegration = false;
  webPreferences.nodeIntegrationInSubFrames = false;
  webPreferences.enableRemoteModule = false;
  webPreferences.plugins = false;
  webPreferences.disablePopups = true;
  webPreferences.webSecurity = true;
  webPreferences.contextIsolation = true;

  params.nodeIntegration = false;
  params.nodeIntegrationInSubFrames = false;
  params.enableremotemodule = false;
  params.plugins = false;
  params.disablewebsecurity = false;
  params.allowpopups = false;

  if (process.env.NODE_ENV !== "development" && params.src !== "https://authors.curseforge.com/") {
    event.preventDefault();
  }
}

function onSettings(event, args) {
  const window = toolbox.getWindow();
  if (window == null || window.isVisible()) {
    return;
  }

  if (args.visibility === true) {
    window.show();
  }
}

ipcMain.on("window:settings", (event, args) => onSettings(event, args));

module.exports = {
  createWindow
};