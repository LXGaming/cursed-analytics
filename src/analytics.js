const csv = require("csv-parse");
const fs = require("fs");
const {app, ipcMain} = require("electron");
const electronDl = require("electron-dl");
const path = require("path");
const storage = require("./storage");
const toolbox = require("./util/toolbox");

async function onAnalytics(event, args) {
  const window = toolbox.getWindow();
  if (window == null) {
    return;
  }

  if (window.isVisible()) {
    window.hide();
  }

  const directory = path.join(app.getPath("temp"), "cursed-analytics");
  for (let index = 0; index < args.length; index++) {
    const projectId = args[index];
    console.log(`Processing ${projectId}...`);
    await download(window, `https://authors.curseforge.com/dashboard/project/${projectId}/exportcsv`, directory).then(success => {
      console.log(`Successfully processed ${projectId}`);
    }, failure => {
      console.error(`Encountered an error while processing ${projectId}`);
      console.error(failure.stack);
    });
  }

  storage.getConnection().end({}, () => {
    console.log("Closing...");
    window.close();
  });
}

function download(window, url, directory) {
  return new Promise((resolve, reject) => {
    electronDl.download(window, url, {
      saveAs: false,
      directory: directory,
    }).then(success => {
      const path = success.savePath;
      console.debug(`Successfully downloaded ${path}`);
      processFile(path, () => {
        deleteFile(path, () => {
          resolve();
        });
      });
    }, failure => {
      console.error(`Encountered an error while downloading ${url}`);
      console.error(failure.stack);
      reject(failure);
    })
  });
}

function deleteFile(path, callback) {
  fs.unlink(path, (error) => {
    if (error) {
      console.error(`Encountered an error while deleting ${path}`);
      console.error(error.stack);
      callback();
      return;
    }

    console.log(`Successfully deleted ${path}`);
    callback();
  });
}

function processFile(path, callback) {
  const promises = [];
  fs.createReadStream(path)
    .pipe(csv({columns: true}))
    .on("data", (row) => {
      promises.push(processRow(row));
    })
    .on("end", () => {
      Promise.all(promises).then(success => {
        console.log(`Successfully read ${path}`);

        let rows = 0;
        success.map(result => {
          if (result) {
            rows++;
          }
        });

        console.log(`Added ${rows} rows`);
        callback();
      }, failure => {
        console.error(`Encountered an error while reading ${path}`);
        console.error(failure.stack);
        callback();
      });
    })
    .on("error", (error) => {
      console.error(`Encountered an error while reading ${path}`);
      console.error(error.stack);
      callback();
    });
}

function processRow(row) {
  return new Promise((resolve, reject) => {
    storage.getConnection().query("SELECT `statDate`, `projectId` FROM `stats` WHERE `statDate` = ? AND `projectId` = ?", [row["Date"], row["Project ID"]], (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      if (results.length !== 0) {
        resolve(false);
        return;
      }

      storage.getConnection().query("INSERT INTO `stats` VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        row["Date"],
        row["Project ID"],
        row["Name"],
        row["Points"],
        row["Historical Download"],
        row["Daily Download"],
        row["Daily Unique Download"],
        row["Daily Twitch App Download"],
        row["Daily Curse Forge Download"]
      ], (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(true);
      });
    });
  });
}

ipcMain.on("analytics", (event, args) => onAnalytics(event, args));