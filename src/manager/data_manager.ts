import NodeCache = require("node-cache");
import { CursedAnalytics } from "../main";
import { Project } from "../entity/project";

export class DataManager {

  private static projectCache: NodeCache;

  public static prepare(): void {
    this.projectCache = new NodeCache({
      checkperiod: 0,
      useClones: false
    });
  }

  public static shutdown(): void {
    if (this.projectCache) {
      this.projectCache.flushAll();
      this.projectCache.close();
      this.projectCache = null;
    }
  }

  public static createProjectAsync(id: number, name: string, slug: string | undefined): Promise<Project> {
    return CursedAnalytics.getInstance().getStorage().getQuery().createProjectAsync(id, name, slug).then(project => {
      if (!this.projectCache.set(project.id, project)) {
        console.warn("Failed to cache project %s", id);
      }

      return project;
    });
  }

  public static getProjectAsync(id: number): Promise<Project | undefined> {
    const cachedProject = this.projectCache.get<Project>(id);
    if (cachedProject) {
      return Promise.resolve(cachedProject);
    }

    return CursedAnalytics.getInstance().getStorage().getQuery().getProjectAsync(id).then(project => {
      if (!project) {
        return null;
      }

      if (!this.projectCache.set(id, project)) {
        console.warn("Failed to cache project %s", id);
      }

      return project;
    }, reason => {
      console.error("Encountered an error while getting project %s: %s", id, reason);
      return null;
    });
  }

  public static getProjectFromSlugAsync(slug: string): Promise<Project | undefined> {
    for (const key of this.projectCache.keys()) {
      const cachedProject = this.projectCache.get<Project>(key);
      if (!cachedProject || cachedProject.slug !== slug) {
        continue;
      }

      return Promise.resolve(cachedProject);
    }

    return CursedAnalytics.getInstance().getStorage().getQuery().getProjectFromSlugAsync(slug).then(project => {
      if (!project) {
        return null;
      }

      if (!this.projectCache.set(project.id, project)) {
        console.warn("Failed to cache project %s", slug);
      }

      return project;
    }, reason => {
      console.error("Encountered an error while getting project %s: %s", slug, reason);
      return null;
    });
  }

  public static updateProjectAsync(project: Project): Promise<boolean> {
    return CursedAnalytics.getInstance().getStorage().getQuery().updateProjectAsync(project).then(value => {
      return value;
    }, reason => {
      console.error("Encountered an error while updating project %s: %s", project.id, reason);
      return false;
    });
  }
}