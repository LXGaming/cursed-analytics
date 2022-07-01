import * as mysql from "mysql";
import { Pool } from "mysql";
import { MySqlQuery } from "./mysql_query";
import { Query } from "../query";
import { Storage } from "../storage";
import { CursedAnalytics } from "../../main";
import { Toolbox } from "../../util/toolbox";

export class MySqlStorage implements Storage {

  readonly query: Query;
  pool: Pool;

  public constructor() {
    this.query = new MySqlQuery(this);
  }

  connectAsync(): Promise<void> {
    if (this.pool != null) {
      return Promise.reject(new Error("Storage is already connected"));
    }

    const storage = CursedAnalytics.getInstance().getConfig().get("storage");
    const [host, port] = Toolbox.splitAddress(storage.address, 3306);
    if (!host || !port || port <= 0 || port > 65535) {
      return Promise.reject(new Error("Failed to split address"));
    }

    this.pool = mysql.createPool({
      host: host,
      port: port,
      database: storage.database,
      user: storage.username,
      password: storage.password,
      connectionLimit: 1
    });

    return Promise.resolve();
  }

  closeAsync(): Promise<void> {
    if (this.pool == null) {
      return Promise.reject(new Error("Storage is already closed"));
    }

    return new Promise((resolve, reject) => {
      this.pool.end(error => {
        this.pool = null;

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  getQuery(): Query {
    return this.query;
  }
}