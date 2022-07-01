import * as ElectronStore from "electron-store";
import { Config } from "./config";

export class Configuration {

  private readonly config: ElectronStore<Config>;

  public constructor() {
    this.config = new ElectronStore<Config>({
      schema: {
        general: {
          type: "object",
          properties: {
          },
          default: {}
        },
        storage: {
          type: "object",
          properties: {
            valid: { type: "boolean", default: false },
            version: { type: "number", default: 0 },
            engine: { type: "string", default: "" },
            address: { type: "string", default: "" },
            database: { type: "string", default: "" },
            username: { type: "string", default: "" },
            password: { type: "string", default: "" }
          },
          default: {}
        }
      }
    });
  }

  public getConfig(): ElectronStore<Config> {
    return this.config;
  }
}