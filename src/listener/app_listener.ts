import { app } from "electron";
import { SessionListener } from "./session_listener";
import { CursedAnalytics } from "../main";
import { Window } from "../util/window";

export class AppListener {

  public static onActivate(): void {
    Window.getOrCreateWindow();
  }

  public static onQuitAsync(): Promise<void> {
    return CursedAnalytics.getInstance().shutdownAsync();
  }

  public static onReadyAsync(): Promise<void> {
    return CursedAnalytics.getInstance().loadAsync();
  }

  public static onSessionCreated(session: Electron.Session): void {
    session.webRequest.onBeforeRequest((details, callback) => SessionListener.onBeforeRequest(details, callback));
    session.webRequest.onHeadersReceived((details, callback) => SessionListener.onHeadersReceived(details, callback));
  }

  public static onWindowAllClosed(): void {
    if (process.platform === "darwin") {
      return;
    }

    app.quit();
  }
}