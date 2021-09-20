import {BrowserWindow} from "electron";
import * as path from "path";
import {Toolbox} from "./toolbox";
import {Level} from "../entity/level";
import {WindowListener} from "../listener/window_listener";

export class Window {

  public static notify(level: Level, message: string): void {
    const window = this.getWindow();
    if (!window) {
      return;
    }

    window.webContents.send("window.notify", {level: level, message: message});
  }

  public static loadFileAsync(name): Promise<BrowserWindow> {
    console.debug("Attempting to load %s", name);
    const window = this.getOrCreateWindow();
    if (!window) {
      return Promise.reject(new Error("BrowserWindow is unavailable"));
    }

    const filePath = path.join(Toolbox.getPublicPath(), `${name}.html`);
    return window.loadFile(filePath).then(() => {
      console.debug("Successfully loaded %s", filePath);
      return window;
    }, reason => {
      console.error("Encountered an error while loading %s: %s", filePath, reason);
      return null;
    });
  }

  public static getOrCreateWindow(): BrowserWindow {
    const window = this.getWindow();
    if (window) {
      return window;
    }

    return this.createWindow();
  }

  public static getWindow(): BrowserWindow {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      return focusedWindow;
    }

    const windows = BrowserWindow.getAllWindows();
    if (windows.length !== 0) {
      return windows[0];
    }

    return null;
  }

  private static createWindow(): BrowserWindow {
    const window = new BrowserWindow({
      width: 800,
      height: 720,
      show: Toolbox.isDevelopmentEnvironment(),
      webPreferences: {
        contextIsolation: true,
        nativeWindowOpen: true,
        preload: path.join(Toolbox.getPublicPath(), "js", "preload.js"),
        webviewTag: true
      }
    });

    window.setMenuBarVisibility(false);
    window.webContents.on("will-attach-webview", (event, webPreferences, params) => WindowListener.onWillAttachWebview(event, webPreferences, params));
    return window;
  }
}