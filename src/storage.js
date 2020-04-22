const alert = require("./window/alert");
const config = require("./config");
const {app, ipcMain} = require("electron");
const mysql = require("mysql");
const path = require("path");
const toolbox = require("./util/toolbox");

let connection;

function connect(host, port, database, username, password) {
  if (connection != null) {
    return Promise.resolve({message: "Failed to connect: Storage is already connected"});
  }

  connection = mysql.createConnection({
    host: host,
    port: port,
    database: database,
    user: username,
    password: password
  });

  return new Promise((resolve, reject) => {
    connection.connect({}, (error) => {
      if (error) {
        connection = null;
        reject(error);
        return;
      }

      createTables((error) => {
        if (error) {
          connection = null;
          reject(error);
          return;
        }

        resolve({message: "Successfully connected"});
      });
    });
  });
}

function createTables(callback) {
  connection.query(""
    + "CREATE TABLE IF NOT EXISTS `stats` ("
    + "`statDate` DATE NOT NULL,"
    + "`projectId` INT(11) NOT NULL,"
    + "`projectName` VARCHAR(255) NULL DEFAULT NULL,"
    + "`projectPoints` DOUBLE NULL DEFAULT NULL,"
    + "`projectTotalDownloads` INT(11) NULL DEFAULT NULL,"
    + "`projectDailyDownloads` INT(11) NULL DEFAULT NULL,"
    + "`projectDailyUniqueDownloads` INT(11) NULL DEFAULT NULL,"
    + "`projectDailyTwitchDownloads` INT(11) NULL DEFAULT NULL,"
    + "`projectDailyCurseForgeDownloads` INT(11) NULL DEFAULT NULL,"
    + "PRIMARY KEY (`statDate`, `projectId`))", (error) => callback(error));
}

ipcMain.on("storage:connect", (event, args) => {
  if (args == null) {
    return;
  }

  const host = args.host;
  const port = parseInt(args.port);
  const database = args.database;
  const username = args.username;
  const password = args.password;

  if (!host || !database || !username) {
    alert.error("Invalid arguments");
    return;
  }

  if (isNaN(port)) {
    alert.error(`Failed to parse ${args.port} as a number`);
    return;
  }

  if (port < 1 || port > 65535) {
    alert.error("Invalid port");
    return;
  }

  if (connection != null) {
    alert.debug({message: "Failed to connect: Storage is already connected"});
    return;
  }

  connect(host, port, database, username, password).then(success => {
    config.set({
      storage: {
        valid: true,
        host: host,
        port: port,
        database: database,
        username: username,
        password: password
      }
    });

    alert.info(success.message);
    toolbox.loadFile(path.join(app.getAppPath(), "public", "webview.html"));
  }, failure => {
    alert.error(failure.name + ": " + failure.message);
  });
});

module.exports = {
  connect,
  getConnection: () => connection
};