import { app } from "electron";
import { readdir } from "fs/promises";
import * as path from "path";
import { URL } from "url";

export class Toolbox {

  private static readonly AccessiblePaths = [
    Toolbox.getPublicPath(),
    path.join(Toolbox.getNodeModulesPath(), "bootstrap", "dist"),
    path.join(Toolbox.getNodeModulesPath(), "jquery", "dist")
  ];

  public static isDevelopmentEnvironment(): boolean {
    return this.getEnvironment() === "development";
  }

  public static getEnvironment(): string {
    return process.env.NODE_ENV || "production";
  }

  public static async getAccessibleFiles(): Promise<Set<string>> {
    const files = new Set<string>();
    for (const path of this.AccessiblePaths) {
      for await (const file of this.getFilesAsync(path)) {
        files.add(file);
      }
    }

    return files;
  }

  public static getNodeModulesPath(): string {
    return path.join(app.getAppPath(), "node_modules");
  }

  public static getPublicPath(): string {
    return path.join(app.getAppPath(), "public");
  }

  public static sanitizeUrl(url: string | URL): string {
    return url.toString().split("?")[0];
  }

  public static splitAddress(address: string, defaultPort: number = NaN): [string, number] {
    const split = address.split(":");
    const host = split[0];
    const port = split.length > 1 ? parseInt(split[1]) : defaultPort;
    return [host, port];
  }

  private static async* getFilesAsync(directory: string): AsyncIterableIterator<string> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.resolve(directory, entry.name);
      if (entry.isDirectory()) {
        yield* this.getFilesAsync(entryPath);
      } else {
        yield entryPath;
      }
    }
  }
}