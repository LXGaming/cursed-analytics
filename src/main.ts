import {name, version} from "../package.json";
import {app, ipcMain} from "electron";
import * as ElectronStore from "electron-store";
import {Config} from "./configuration/config";
import {Configuration} from "./configuration/configuration";
import {Level} from "./entity/level";
import {AppListener} from "./listener/app_listener";
import {IpcListener} from "./listener/ipc_listener";
import {DataManager} from "./manager/data_manager";
import {Storage} from "./storage/storage";
import {MySqlStorage} from "./storage/mysql/mysql_storage";
import {Toolbox} from "./util/toolbox";
import {Window} from "./util/window";

export class CursedAnalytics {

  public static readonly Id: string = name;
  public static readonly Name: string = "Cursed Analytics";
  public static readonly Version: string = version;
  public static readonly Authors: string = "LX_Gaming";
  public static readonly Website: string = "https://lxgaming.github.io/";
  public static readonly UserAgent: string = `${CursedAnalytics.Name}/${CursedAnalytics.Version} (+${CursedAnalytics.Website})`;

  private static instance: CursedAnalytics;
  private readonly configuration: Configuration;
  private accessibleFiles: Set<string>;
  private storage: Storage;

  public constructor() {
    CursedAnalytics.instance = this;
    this.configuration = new Configuration();

    app.on("activate", () => AppListener.onActivate());
    app.on("quit", async () => await AppListener.onQuitAsync());
    app.on("ready", async () => await AppListener.onReadyAsync());
    app.on("session-created", session => AppListener.onSessionCreated(session));
    app.on("window-all-closed", () => AppListener.onWindowAllClosed());
    ipcMain.handle("configuration.config", (event, args) => IpcListener.onConfigurationConfig(event, args));
    ipcMain.handle("storage.connect", async (event, args) => await IpcListener.onStorageConnectAsync(event, args));
    ipcMain.on("project.create", async (event, args) => await IpcListener.onProjectCreateAsync(event, args));
    ipcMain.on("project.list", async (event, args) => await IpcListener.onProjectListAsync(event, args));
    ipcMain.on("project.transaction", async (event, args) => await IpcListener.onProjectTransactionAsync(event, args));
    ipcMain.on("window.show", (event, args) => IpcListener.onWindowShow(event, args));
  }

  public async loadAsync(): Promise<void> {
    this.accessibleFiles = await Toolbox.getAccessibleFiles();
    DataManager.prepare();

    console.info("%s v%s has started (%s)", CursedAnalytics.Name, CursedAnalytics.Version, Toolbox.getEnvironment());

    this.connectStorage().then(value => {
      if (value === true) {
        Window.loadFileAsync("webview").then(window => {});
      } else {
        Window.loadFileAsync("setup").then(window => window.show());
      }
    }, reason => {
      Window.loadFileAsync("setup").then(window => {
        Window.notify(Level.Error, `${reason.name}: ${reason.message}`);
        window.show();
      });
    });
  }

  public async shutdownAsync(): Promise<void> {
    DataManager.shutdown();

    try {
      await this.storage?.closeAsync();
    } catch (error) {
      console.error("Encountered an error while closing %s: %s", this.storage.constructor.name, error);
    }

    console.info("%s v%s has stopped", CursedAnalytics.Name, CursedAnalytics.Version);
  }

  public async connectStorage(): Promise<boolean> {
    const storage = this.getConfig().get("storage");
    if (storage.valid === false || !storage.engine) {
      return false;
    }

    if (this.storage) {
      throw new Error("Storage is already connected");
    }

    if (storage.engine === "mysql") {
      this.storage = new MySqlStorage();
    } else {
      throw new Error("Invalid storage engine configured");
    }

    try {
      console.debug("Connecting to %s...", this.storage.constructor.name);
      await this.storage.connectAsync();
      await this.storage.getQuery().createTablesAsync();

      const version = storage.version;
      if (storage.version === 0) {
        await this.storage.getQuery().migrateAsync(message => Window.notify(Level.Debug, message));
        storage.version = 1;
      }

      if (storage.version !== version) {
        console.debug("Storage v%s -> v%s", version, storage.version);
        CursedAnalytics.getInstance().getConfig().set("storage", storage);
      }

      console.info("Connected to %s", this.storage.constructor.name);
      return true;
    } catch (error) {
      console.error("Encountered an error while connecting to %s: %s", this.storage.constructor.name, error);
      this.storage = null;
      throw error;
    }
  }

  public static getInstance(): CursedAnalytics {
    return CursedAnalytics.instance;
  }

  public getConfiguration(): Configuration {
    return this.configuration;
  }

  public getConfig(): ElectronStore<Config> {
    return this.getConfiguration().getConfig();
  }

  public getAccessibleFiles(): Set<string> {
    return this.accessibleFiles;
  }

  public getStorage(): Storage {
    return this.storage;
  }
}

new CursedAnalytics();