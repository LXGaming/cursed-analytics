import { WebPreferences } from "electron";
import * as path from "path";
import * as url from "url";
import { Toolbox } from "../util/toolbox";

export class WindowListener {

  public static onWillAttachWebview(event: Event, webPreferences: WebPreferences, params: Record<string, string>): void {
    const preload = path.join(Toolbox.getPublicPath(), "js", "webview-preload.js");

    // Prevent webview from loading unauthorized preload scripts
    if (preload !== url.fileURLToPath(params.preload)) {
      event.preventDefault();
      return;
    }

    // Prevent webview from loading unauthorized src
    if (!Toolbox.isDevelopmentEnvironment() && params.src !== "https://authors.curseforge.com/") {
      event.preventDefault();
    }
  }
}