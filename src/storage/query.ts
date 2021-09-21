import {Project} from "../entity/project";
import {ProjectDownload} from "../entity/project_download";
import {ProjectPoint} from "../entity/project_point";

export interface Query {

  createTablesAsync(): Promise<void>;

  createProjectAsync(id: number, name: string, slug: string | undefined): Promise<Project>;

  createProjectDownloadAsync(projectId: number, timestamp: Date, value: number): Promise<ProjectDownload>;

  createProjectPointAsync(projectId: number, timestamp: Date, value: number): Promise<ProjectPoint>;

  getProjectAsync(id: number): Promise<Project | undefined>;

  getProjectFromSlugAsync(slug: string): Promise<Project | undefined>;

  getProjectDownloadAsync(projectId: number, timestamp: Date): Promise<ProjectDownload | undefined>;

  getProjectPointAsync(projectId: number, timestamp: Date): Promise<ProjectPoint | undefined>;

  updateProjectAsync(project: Project): Promise<boolean>;

  migrateAsync(version: number, callback: (message?: string) => void): Promise<number>;
}