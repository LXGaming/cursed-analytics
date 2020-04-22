const {ipcMain} = require("electron");
const Store = require("electron-store");

const store = new Store({
  schema: {
    storage: {
      type: "object",
      default: {},
      properties: {
        valid: { type: "boolean", default: false },
        host: { type: "string", default: "" },
        port: { type: "number", maximum: 65535, minimum: 0, default: 0 },
        database: { type: "string", default: "" },
        username: { type: "string", default: "" },
        password: { type: "string", default: "" }
      }
    }
  }
});

ipcMain.on("config:storage", (event) => {
  const storage = store.get("storage");
  event.returnValue = {
    host: storage.host,
    port: storage.port,
    database: storage.database,
    username: storage.username,
    password: storage.password
  };
});

module.exports = store;