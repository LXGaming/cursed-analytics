import { MySqlStorage } from "./mysql_storage";
import { Query } from "../query";
import { Project } from "../../entity/project";
import { ProjectDownload } from "../../entity/project_download";
import { ProjectPoint } from "../../entity/project_point";

export class MySqlQuery implements Query {

  storage: MySqlStorage;

  constructor(storage: MySqlStorage) {
    this.storage = storage;
  }

  async createTablesAsync(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.storage.pool.query(""
        + "CREATE TABLE IF NOT EXISTS `Projects` ("
        + "`Id` BIGINT NOT NULL,"
        + "`Name` VARCHAR(255) NOT NULL,"
        + "`Slug` VARCHAR(255) NULL,"
        + "PRIMARY KEY (`Id`),"
        + "UNIQUE (`Slug`))", error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.storage.pool.query(""
        + "CREATE TABLE IF NOT EXISTS `ProjectDownloads` ("
        + "`Id` BIGINT NOT NULL AUTO_INCREMENT,"
        + "`ProjectId` BIGINT NOT NULL,"
        + "`Timestamp` DATETIME NOT NULL,"
        + "`Value` BIGINT NOT NULL,"
        + "PRIMARY KEY (`Id`),"
        + "UNIQUE (`ProjectId`, `Timestamp`),"
        + "FOREIGN KEY (`ProjectId`) REFERENCES `Projects` (`Id`))", error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.storage.pool.query(""
        + "CREATE TABLE IF NOT EXISTS `ProjectPoints` ("
        + "`Id` BIGINT NOT NULL AUTO_INCREMENT,"
        + "`ProjectId` BIGINT NOT NULL,"
        + "`Timestamp` DATETIME NOT NULL,"
        + "`Value` DECIMAL(12,2) NOT NULL,"
        + "PRIMARY KEY (`Id`),"
        + "UNIQUE (`ProjectId`, `Timestamp`),"
        + "FOREIGN KEY (`ProjectId`) REFERENCES `Projects` (`Id`))", error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  createProjectAsync(id: number, name: string, slug: string | undefined): Promise<Project> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "INSERT INTO `Projects` (`Id`, `Name`, `Slug`) "
        + "VALUES (?, ?, ?)", [id, name, slug], error => {
        if (error) {
          reject(error);
        } else {
          resolve(new Project(id, name, slug));
        }
      });
    });
  }

  createProjectDownloadAsync(projectId: number, timestamp: Date, value: number): Promise<ProjectDownload> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "INSERT INTO `ProjectDownloads` (`ProjectId`, `Timestamp`, `Value`) "
        + "VALUES (?, ?, ?)", [projectId, timestamp, value], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(new ProjectDownload(results.insertId, projectId, timestamp, value));
        }
      });
    });
  }

  createProjectPointAsync(projectId: number, timestamp: Date, value: number): Promise<ProjectPoint> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "INSERT INTO `ProjectPoints` (`ProjectId`, `Timestamp`, `Value`) "
        + "VALUES (?, ?, ?)", [projectId, timestamp, value], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(new ProjectPoint(results.insertId, projectId, timestamp, value));
        }
      });
    });
  }

  getProjectAsync(id: number): Promise<Project | undefined> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "SELECT `Name`, `Slug` "
        + "FROM `Projects` "
        + "WHERE `Id` = ? "
        + "LIMIT 0, 1", [id], (error, results) => {
        if (error) {
          reject(error);
          return;
        }

        if (results.length !== 1) {
          resolve(null);
          return;
        }

        const result = results[0];
        resolve(new Project(id, result.Name, result.Slug));
      });
    });
  }

  getProjectFromSlugAsync(slug: string): Promise<Project | undefined> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "SELECT `Id`, `Name` "
        + "FROM `Projects` "
        + "WHERE `Slug` = ? "
        + "LIMIT 0, 1", [slug], (error, results) => {
        if (error) {
          reject(error);
          return;
        }

        if (results.length !== 1) {
          resolve(null);
          return;
        }

        const result = results[0];
        resolve(new Project(result.Id, result.Name, slug));
      });
    });
  }

  getProjectDownloadAsync(projectId: number, timestamp: Date): Promise<ProjectDownload | undefined> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "SELECT `Id`, `Value` "
        + "FROM `ProjectDownloads` "
        + "WHERE `ProjectId` = ? AND `Timestamp` = ? "
        + "LIMIT 0, 1", [projectId, timestamp], (error, results) => {
        if (error) {
          reject(error);
          return;
        }

        if (results.length !== 1) {
          resolve(null);
          return;
        }

        const result = results[0];
        resolve(new ProjectDownload(result.Id, projectId, timestamp, result.Value));
      });
    });
  }

  getProjectPointAsync(projectId: number, timestamp: Date): Promise<ProjectDownload | undefined> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "SELECT `Id`, `Value` "
        + "FROM `ProjectPoints` "
        + "WHERE `ProjectId` = ? AND `Timestamp` = ? "
        + "LIMIT 0, 1", [projectId, timestamp], (error, results) => {
        if (error) {
          reject(error);
          return;
        }

        if (results.length !== 1) {
          resolve(null);
          return;
        }

        const result = results[0];
        resolve(new ProjectPoint(result.Id, projectId, timestamp, result.Value));
      });
    });
  }

  updateProjectAsync(project: Project): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.storage.pool.query(""
        + "UPDATE `Projects` "
        + "SET `Name` = ?, `Slug` = ? "
        + "WHERE `Id` = ?", [project.name, project.slug, project.id], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows !== 0);
        }
      });
    });
  }

  async migrateAsync(version: number, callback: (message?: string) => void): Promise<number> {
    if (version === 0) {
      callback("Performing migration (v1)...");
      const exists = await new Promise<boolean>((resolve, reject) => {
        this.storage.pool.query(""
          + "SELECT COUNT(*) AS 'Count' "
          + "FROM `information_schema`.`tables` "
          + "WHERE `table_schema` = ? AND `table_name` = ? ", [this.storage.pool.config.connectionConfig.database, "stats"], (error, results) => {
          if (error) {
            reject(error);
            return;
          }

          if (results.length !== 1) {
            resolve(false);
            return;
          }

          const result = results[0];
          resolve(result.Count === 1);
        });
      });

      if (exists === false) {
        callback("Nothing to migrate, skipping...");
        return;
      }

      callback("Migrating 'stats' table...");

      let offset = 0;
      while (true) {
        const results = await new Promise<any>((resolve, reject) => {
          this.storage.pool.query(""
            + "SELECT CONVERT_TZ(`statDate`, '+00:00', @@session.time_zone) AS 'statDate', `projectId`, `projectName`, `projectPoints`, `projectTotalDownloads` "
            + "FROM `stats` "
            + "LIMIT ?, 1000", [offset], (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        });

        if (results.length === 0) {
          break;
        }

        offset += results.length;
        for (const result of results) {
          if (!await this.getProjectAsync(result.projectId)) {
            await this.createProjectAsync(result.projectId, result.projectName, null);
          }

          if (result.projectTotalDownloads !== 0) {
            await this.createProjectDownloadAsync(result.projectId, result.statDate, result.projectTotalDownloads);
          }

          if (result.projectPoints !== 0) {
            await this.createProjectPointAsync(result.projectId, result.statDate, result.projectPoints);
          }
        }

        callback(`Migrated ${offset} stats`);
      }

      callback("Finished migration");
      version = 1;
    }

    if (version === 1) {
      callback("Performing migration (v2)...");

      await new Promise<void>((resolve, reject) => {
        this.storage.pool.query(""
          + "ALTER TABLE `ProjectPoints` "
          + "CHANGE `Value` `Value` DECIMAL(12,2) NOT NULL", error => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      callback("Finished migration");
      version = 2;
    }

    return version;
  }
}