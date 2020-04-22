const {BrowserWindow} = require("electron");

function getWindow() {
  if (BrowserWindow.getAllWindows().length !== 0) {
    return BrowserWindow.getAllWindows()[0];
  }

  return null;
}

function loadFile(filePath, callback) {
  const window = getWindow();
  if (window == null) {
    return;
  }

  window.loadFile(filePath).then(success => {
    console.debug(`Successfully loaded ${filePath}`);
    if (callback != null) {
      callback();
    }
  }, failure => {
    console.error(`Encountered an error while loading ${filePath}`);
    console.error(failure.stack);
  });
}

module.exports = {
  getWindow,
  loadFile
};