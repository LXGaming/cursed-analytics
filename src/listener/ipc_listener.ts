import { app } from "electron";
import { CursedAnalytics } from "../main";
import { Level } from "../entity/level";
import { DataManager } from "../manager/data_manager";
import { Toolbox } from "../util/toolbox";
import { Window } from "../util/window";

export class IpcListener {

  private static readonly Projects: Map<string, string> = new Map<string, string>();
  private static readonly ProjectUrls: Array<string> = [];
  private static connectionState: boolean = false;
  private static offset: number = 0;
  private static quantity: number = 10;

  public static onConfigurationConfig(event: Electron.IpcMainInvokeEvent, args: any): any {
    const storage = CursedAnalytics.getInstance().getConfig().get("storage");
    return {
      storage: {
        engine: storage.engine,
        address: storage.address,
        database: storage.database,
        username: storage.username,
        password: storage.password
      }
    };
  }

  public static async onStorageConnectAsync(event: Electron.IpcMainInvokeEvent, args: any): Promise<void> {
    if (!args) {
      return;
    }

    const engine = args.engine;
    const address = args.address;
    const database = args.database;
    const username = args.username;
    const password = args.password;
    if (!engine || !address || !database || !username) {
      Window.notify(Level.Error, "Invalid arguments");
      return;
    }

    const [host, port] = Toolbox.splitAddress(address);
    if (!host || !port || port <= 0 || port > 65535) {
      Window.notify(Level.Error, "Failed to split address");
      return;
    }

    if (CursedAnalytics.getInstance().getStorage()) {
      Window.notify(Level.Warning, "Storage is already connected");
      return;
    }

    if (this.connectionState === true) {
      Window.notify(Level.Warning, "Connection in progress");
      return;
    }

    this.connectionState = true;

    const storage = CursedAnalytics.getInstance().getConfig().get("storage");
    storage.valid = true;
    storage.engine = engine;
    storage.address = address;
    storage.database = database;
    storage.username = username;
    storage.password = password;
    CursedAnalytics.getInstance().getConfig().set("storage", storage);

    return CursedAnalytics.getInstance().connectStorage().then(value => {
      Window.notify(Level.Information, "Success");
      Window.loadFileAsync("webview").then(window => {
        if (!Toolbox.isDevelopmentEnvironment()) {
          window.hide();
        }
      });
    }, reason => {
      storage.valid = false;
      CursedAnalytics.getInstance().getConfig().set("storage", storage);
      Window.notify(Level.Error, `${reason.name}: ${reason.message}`);
    }).finally(() => {
      this.connectionState = false;
    });
  }

  public static async onProjectCreateAsync(event: Electron.IpcMainEvent, args: any): Promise<void> {
    if (!args) {
      return;
    }

    const id = args.id;
    const name = args.name;
    const slug = args.slug;
    if (!id || !name || !slug) {
      return;
    }

    const existingProject = await DataManager.getProjectAsync(id);
    if (existingProject) {
      if (existingProject.slug) {
        const projectUrl = this.Projects.get(existingProject.slug);
        if (projectUrl && !this.ProjectUrls.includes(projectUrl)) {
          this.ProjectUrls.push(projectUrl);
        }
      }

      console.debug("Updating project %s (%s) -> %s (%s)", existingProject.name, existingProject.slug, name, slug);

      existingProject.name = name;
      existingProject.slug = slug;

      await DataManager.updateProjectAsync(existingProject);
    } else {
      console.debug("Creating project %s (%s)", name, slug);
      await DataManager.createProjectAsync(id, name, slug);
    }

    this.changePage(event);
  }

  public static async onProjectListAsync(event: Electron.IpcMainEvent, args: any): Promise<void> {
    if (!args) {
      return;
    }

    const urls = args.urls;
    if (!urls || urls.length === 0) {
      return;
    }

    const window = Window.getWindow();
    if (!window) {
      return;
    }

    this.Projects.clear();
    this.ProjectUrls.length = 0;
    for (const url of urls) {
      const index = url.lastIndexOf("/");
      if (index <= 0 || index > url.length) {
        console.warn("Invalid Url: %s", url);
        continue;
      }

      const slug = url.substring(index + 1);
      if (this.Projects.has(slug)) {
        console.warn("Duplicate Slug: %s", url);
        continue;
      }

      this.Projects.set(slug, url);

      const project = await DataManager.getProjectFromSlugAsync(slug);
      if (!project) {
        this.ProjectUrls.push(url);
      }
    }

    this.changePage(event);
  }

  public static async onProjectTransactionAsync(event: Electron.IpcMainEvent, args: any): Promise<void> {
    if (!args) {
      return;
    }

    const quantity = args.quantity;
    const transactions = args.transactions;
    if (!quantity || !transactions || quantity === 0 || transactions.length === 0) {
      app.quit();
      return;
    }

    this.offset += quantity;
    for (const transaction of transactions) {
      const timestamp = transaction.timestamp;
      const value = transaction.value;
      const slug = transaction.slug;
      if (!timestamp || !value || !slug) {
        continue;
      }

      const project = await DataManager.getProjectFromSlugAsync(slug);
      if (!project) {
        console.warn("Missing project: %s", slug);
        continue;
      }

      if (await CursedAnalytics.getInstance().getStorage().getQuery().getProjectPointAsync(project.id, timestamp)) {
        app.quit();
        return;
      }

      await CursedAnalytics.getInstance().getStorage().getQuery().createProjectPointAsync(project.id, timestamp, value);
    }

    this.quantity = 100;
    this.changePage(event);
  }

  public static onWindowShow(event: Electron.IpcMainEvent, args: any): void {
    Window.show();
  }

  private static changePage(event: Electron.IpcMainEvent): void {
    let url;
    if (this.ProjectUrls.length === 0) {
      url = `https://authors.curseforge.com/store/transactions-ajax/${this.offset}-${this.quantity}-2`;
    } else {
      url = this.ProjectUrls.pop();
    }

    console.debug("Loading page: %s", url);
    event.sender.send("webview.url", { url: url });
  }
}