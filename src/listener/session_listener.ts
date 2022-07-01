import { Toolbox } from "../util/toolbox";
import { URL } from "url";
import { CursedAnalytics } from "../main";
import { fileURLToPath } from "url";

export class SessionListener {

  private static blocking: boolean;
  private static error: boolean;

  public static onBeforeRequest(details: Electron.OnBeforeRequestListenerDetails, callback: (response: Electron.Response) => void): void {
    const url = new URL(details.url);

    // Allow DevTools
    if (url.protocol === "data:" || url.protocol === "devtools:") {
      callback({});
      return;
    }

    // Only allow accessible files
    if (url.protocol === "file:") {
      if (CursedAnalytics.getInstance().getAccessibleFiles().has(fileURLToPath(url))) {
        this.allow(url, callback);
      } else {
        this.block(url, callback);
      }

      return;
    }

    // Only allow https and websockets
    if (url.protocol !== "https:" && url.protocol !== "wss:") {
      this.block(url, callback);
      return;
    }

    // Redirect from CurseForge home page to projects page (Approved projects only)
    if (this.isCurseForge(url) && (url.pathname === "/" || url.pathname === "/dashboard")) {
      this.allow(url, callback, "https://authors.curseforge.com/dashboard/projects?filter-project-status=4");
      return;
    }

    if (this.error) {
      this.allow(url, callback);
      return;
    }

    if (details.resourceType === "mainFrame") {
      if (this.isCurseForge(url)) {
        this.blocking = true;
        this.allow(url, callback);
        return;
      }

      if (this.isTwitch(url)) {
        this.blocking = false;
        this.allow(url, callback);
        return;
      }

      this.blocking = true;
    }

    if (this.blocking) {
      this.block(url, callback);
    } else {
      this.allow(url, callback);
    }
  }

  public static onHeadersReceived(details: Electron.OnHeadersReceivedListenerDetails, callback: (headersReceivedResponse: Electron.HeadersReceivedResponse) => void): void {
    if (details.resourceType === "mainFrame") {
      const url = new URL(details.url);
      this.error = details.statusCode === 403 && this.isCurseForge(url);
    }

    callback(details);
  }

  private static allow(url: URL, callback: (response: Electron.Response) => void, redirectUrl: string = null): void {
    if (redirectUrl) {
      console.debug("[REDIRECT] %s -> %s", Toolbox.sanitizeUrl(url), Toolbox.sanitizeUrl(redirectUrl));
    } else {
      console.debug("[ALLOW] %s", Toolbox.sanitizeUrl(url));
    }

    callback({ cancel: false, redirectURL: redirectUrl });
  }

  private static block(url: URL, callback: (response: Electron.Response) => void): void {
    console.debug("[BLOCK] %s", Toolbox.sanitizeUrl(url));
    callback({ cancel: true });
  }

  private static isCurseForge(url: URL): boolean {
    return url.host === "dev.bukkit.org"
      || url.host === "authors.curseforge.com"
      || url.host === "www.curseforge.com";
  }

  private static isTwitch(url: URL): boolean {
    return (url.host === "id.twitch.tv" && url.pathname === "/oauth2/authorize")
      || (url.host === "www.twitch.tv" && url.pathname === "/login");
  }
}